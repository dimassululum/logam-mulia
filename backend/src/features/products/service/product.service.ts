import { randomUUID } from 'crypto';
import { prisma } from '../../../core/config/database';
import { NotFoundError, ConflictError } from '../../../core/utils/errors';
import { persistDataUrlToUpload } from '../../../core/utils/public-url';
import type { CreateProductInput, DisplayReviewInput, UpdateProductInput } from '../schema/product.schema';

interface QueryOptions {
  categoryId?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

interface DisplayReviewRecord {
  id: string;
  reviewerName: string;
  imageUrl: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductDisplayMeta {
  displayRating: number;
  reviewCount: number;
  soldCount: number;
  displayReviews: DisplayReviewRecord[];
}

type ProductDisplayMetaMap = Record<string, ProductDisplayMeta>;
type ProductDisplaySummaryMap = Record<string, Omit<ProductDisplayMeta, 'displayReviews'>>;

const PRODUCT_DISPLAY_META_KEY = 'product_display_reviews';
const PRODUCT_DISPLAY_SUMMARY_KEY = 'product_display_review_summaries';

function defaultProductMeta(): ProductDisplayMeta {
  return {
    displayRating: 5,
    reviewCount: 0,
    soldCount: 0,
    displayReviews: [],
  };
}

async function readProductDisplayMeta(): Promise<ProductDisplayMetaMap> {
  const setting = await prisma.setting.findUnique({ where: { key: PRODUCT_DISPLAY_META_KEY } });
  if (!setting) return {};

  try {
    const parsed = JSON.parse(setting.value) as ProductDisplayMetaMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeProductDisplayMeta(meta: ProductDisplayMetaMap) {
  const summary = buildProductDisplaySummary(meta);

  await prisma.$transaction([
    prisma.setting.upsert({
      where: { key: PRODUCT_DISPLAY_META_KEY },
      update: { value: JSON.stringify(meta) },
      create: { key: PRODUCT_DISPLAY_META_KEY, value: JSON.stringify(meta) },
    }),
    prisma.setting.upsert({
      where: { key: PRODUCT_DISPLAY_SUMMARY_KEY },
      update: { value: JSON.stringify(summary) },
      create: { key: PRODUCT_DISPLAY_SUMMARY_KEY, value: JSON.stringify(summary) },
    }),
  ]);
}

function buildProductDisplaySummary(meta: ProductDisplayMetaMap): ProductDisplaySummaryMap {
  return Object.fromEntries(
    Object.entries(meta).map(([productId, value]) => [
      productId,
      {
        displayRating: value.displayRating ?? 5,
        reviewCount: value.reviewCount ?? (value.displayReviews || []).length,
        soldCount: value.soldCount ?? 0,
      },
    ]),
  );
}

async function readProductDisplaySummary(): Promise<ProductDisplaySummaryMap> {
  const setting = await prisma.setting.findUnique({ where: { key: PRODUCT_DISPLAY_SUMMARY_KEY } });
  if (!setting) return {};

  try {
    const parsed = JSON.parse(setting.value) as ProductDisplaySummaryMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function attachProductMeta<T extends { id: string }>(
  product: T,
  meta: Record<string, Partial<ProductDisplayMeta>>,
  options: { includeDisplayReviews?: boolean } = {},
) {
  const productMeta = meta[product.id] || defaultProductMeta();
  const displayReviews = productMeta.displayReviews || [];

  return {
    ...product,
    displayRating: productMeta.displayRating ?? 5,
    soldCount: productMeta.soldCount ?? 0,
    reviewCount: productMeta.reviewCount ?? displayReviews.length,
    displayReviews: options.includeDisplayReviews === false ? [] : displayReviews,
  };
}

function splitProductPayload<T extends Record<string, any>>(data: T) {
  const { displayRating, reviewCount, soldCount, ...productData } = data;
  return {
    productData,
    displayRating: displayRating === undefined ? undefined : Number(displayRating),
    reviewCount: reviewCount === undefined ? undefined : Number(reviewCount),
    soldCount: soldCount === undefined ? undefined : Number(soldCount),
  };
}

export async function getAllProducts(options: QueryOptions) {
  const { page = 1, limit = 20, categoryId, search, isActive } = options;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (categoryId) where.categoryId = categoryId;
  if (isActive !== undefined) where.isActive = isActive;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        categoryId: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        weightGram: true,
        kadar: true,
        stock: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { id: true, name: true, slug: true } },
        images: {
          select: { id: true, imageUrl: true, isPrimary: true, sortOrder: true },
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const meta = await readProductDisplaySummary();

  return { total, products: products.map((product) => attachProductMeta(product, meta, { includeDisplayReviews: false })) };
}

export async function getProductBySlug(slugOrId: string) {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  const whereClause = isUUID ? { id: slugOrId } : { slug: slugOrId };

  const product = await prisma.product.findUnique({
    where: whereClause,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: 'asc' } },
      promos: { where: { isActive: true } },
      reviews: { where: { isHidden: false }, orderBy: { createdAt: 'desc' }, take: 5, include: { user: { select: { name: true } } } }
    },
  });

  if (!product) {
    throw new NotFoundError('Produk');
  }

  const meta = await readProductDisplayMeta();

  return attachProductMeta(product, meta);
}

export async function createProduct(data: CreateProductInput) {
  const { productData, displayRating, reviewCount, soldCount } = splitProductPayload(data as any);
  const existing = await prisma.product.findUnique({ where: { slug: productData.slug } });
  if (existing) {
    throw new ConflictError('Produk dengan slug tersebut sudah ada');
  }

  const product = await prisma.product.create({ data: productData as CreateProductInput });

  if (displayRating !== undefined || reviewCount !== undefined || soldCount !== undefined) {
    const meta = await readProductDisplayMeta();
    meta[product.id] = {
      ...defaultProductMeta(),
      displayRating: displayRating ?? 5,
      reviewCount: reviewCount ?? 0,
      soldCount: soldCount ?? 0,
    };
    await writeProductDisplayMeta(meta);
  }

  return attachProductMeta(product, await readProductDisplaySummary(), { includeDisplayReviews: false });
}

export async function updateProduct(id: string, data: UpdateProductInput) {
  const { productData, displayRating, reviewCount, soldCount } = splitProductPayload(data as any);
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Produk');
  }

  if (productData.slug && productData.slug !== existing.slug) {
    const slugExists = await prisma.product.findUnique({ where: { slug: productData.slug } });
    if (slugExists) {
      throw new ConflictError('Produk dengan slug tersebut sudah ada');
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data: productData as UpdateProductInput,
  });

  if (displayRating !== undefined || reviewCount !== undefined || soldCount !== undefined) {
    const meta = await readProductDisplayMeta();
    const current = meta[id] || defaultProductMeta();
    meta[id] = {
      ...current,
      displayRating: displayRating ?? current.displayRating,
      reviewCount: reviewCount ?? current.reviewCount ?? (current.displayReviews || []).length,
      soldCount: soldCount ?? current.soldCount,
    };
    await writeProductDisplayMeta(meta);
  }

  return attachProductMeta(product, await readProductDisplaySummary(), { includeDisplayReviews: false });
}

export async function deleteProduct(id: string) {
  const existing = await prisma.product.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          orderItems: true,
          reviews: true,
        },
      },
    },
  });
  if (!existing) {
    throw new NotFoundError('Produk');
  }

  if (existing._count.orderItems > 0 || existing._count.reviews > 0) {
    throw new ConflictError('Produk tidak bisa dihapus permanen karena sudah digunakan pada pesanan atau ulasan');
  }

  const meta = await readProductDisplayMeta();
  if (meta[id]) {
    delete meta[id];
    await writeProductDisplayMeta(meta);
  }

  return prisma.product.delete({
    where: { id },
  });
}

// Images logic
export async function addProductImage(productId: string, imageUrl: string, isPrimary: boolean = false) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError('Produk');

  const imagesCount = await prisma.productImage.count({ where: { productId } });

  if (isPrimary || imagesCount === 0) {
    // If setting as primary, unset others
    await prisma.productImage.updateMany({
      where: { productId },
      data: { isPrimary: false },
    });
  }

  return prisma.productImage.create({
    data: {
      productId,
      imageUrl,
      isPrimary: isPrimary || imagesCount === 0,
      sortOrder: imagesCount,
    },
  });
}

export async function removeProductImage(imageId: string) {
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image) throw new NotFoundError('Foto produk');

  await prisma.productImage.delete({ where: { id: imageId } });

  // If it was primary, set another one as primary
  if (image.isPrimary) {
    const nextImage = await prisma.productImage.findFirst({
      where: { productId: image.productId },
      orderBy: { sortOrder: 'asc' },
    });
    if (nextImage) {
      await prisma.productImage.update({
        where: { id: nextImage.id },
        data: { isPrimary: true },
      });
    }
  }
}

export async function createDisplayReview(productId: string, data: DisplayReviewInput) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError('Produk');

  const meta = await readProductDisplayMeta();
  const current = meta[productId] || defaultProductMeta();
  const now = new Date().toISOString();
  const review = {
    id: randomUUID(),
    reviewerName: data.reviewerName,
    imageUrl: data.imageUrl ? await persistDataUrlToUpload(data.imageUrl, 'review') : '',
    description: data.description,
    createdAt: now,
    updatedAt: now,
  };

  meta[productId] = {
    ...current,
    reviewCount: Math.max(current.reviewCount ?? 0, ((current.displayReviews || []).length + 1)),
    displayReviews: [review, ...(current.displayReviews || [])],
  };
  await writeProductDisplayMeta(meta);

  return review;
}

export async function updateDisplayReview(reviewId: string, data: DisplayReviewInput) {
  const meta = await readProductDisplayMeta();
  let updatedReview: DisplayReviewRecord | null = null;

  for (const productId of Object.keys(meta)) {
    const current = meta[productId] || defaultProductMeta();
    const reviews = current.displayReviews || [];
    const nextReviews: DisplayReviewRecord[] = [];

    for (const review of reviews) {
      if (review.id !== reviewId) {
        nextReviews.push(review);
        continue;
      }

      updatedReview = {
        ...review,
        reviewerName: data.reviewerName,
        imageUrl: data.imageUrl ? await persistDataUrlToUpload(data.imageUrl, 'review') : '',
        description: data.description,
        updatedAt: new Date().toISOString(),
      };
      nextReviews.push(updatedReview);
    }

    meta[productId] = { ...current, displayReviews: nextReviews };
  }

  if (!updatedReview) throw new NotFoundError('Ulasan');
  await writeProductDisplayMeta(meta);

  return updatedReview;
}

export async function deleteDisplayReview(reviewId: string) {
  const meta = await readProductDisplayMeta();
  let found = false;

  for (const productId of Object.keys(meta)) {
    const current = meta[productId] || defaultProductMeta();
    const reviews = current.displayReviews || [];
    const nextReviews = reviews.filter((review) => review.id !== reviewId);
    if (nextReviews.length !== reviews.length) found = true;
    meta[productId] = { ...current, displayReviews: nextReviews };
  }

  if (!found) throw new NotFoundError('Ulasan');
  await writeProductDisplayMeta(meta);
}

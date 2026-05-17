import { randomUUID } from 'crypto';
import { prisma } from '../../../core/config/database';
import { NotFoundError, ConflictError } from '../../../core/utils/errors';
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
  soldCount: number;
  displayReviews: DisplayReviewRecord[];
}

type ProductDisplayMetaMap = Record<string, ProductDisplayMeta>;

const PRODUCT_DISPLAY_META_KEY = 'product_display_reviews';

function defaultProductMeta(): ProductDisplayMeta {
  return {
    displayRating: 5,
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
  await prisma.setting.upsert({
    where: { key: PRODUCT_DISPLAY_META_KEY },
    update: { value: JSON.stringify(meta) },
    create: { key: PRODUCT_DISPLAY_META_KEY, value: JSON.stringify(meta) },
  });
}

function attachProductMeta<T extends { id: string }>(product: T, meta: ProductDisplayMetaMap) {
  const productMeta = meta[product.id] || defaultProductMeta();
  const displayReviews = productMeta.displayReviews || [];

  return {
    ...product,
    displayRating: productMeta.displayRating ?? 5,
    soldCount: productMeta.soldCount ?? 0,
    reviewCount: displayReviews.length,
    displayReviews,
  };
}

function splitProductPayload<T extends Record<string, any>>(data: T) {
  const { displayRating, reviewCount, soldCount, ...productData } = data;
  return {
    productData,
    displayRating: displayRating === undefined ? undefined : Number(displayRating),
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
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        promos: { where: { isActive: true } }
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const meta = await readProductDisplayMeta();

  return { total, products: products.map((product) => attachProductMeta(product, meta)) };
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
  const { productData, displayRating, soldCount } = splitProductPayload(data as any);
  const existing = await prisma.product.findUnique({ where: { slug: productData.slug } });
  if (existing) {
    throw new ConflictError('Produk dengan slug tersebut sudah ada');
  }

  const product = await prisma.product.create({ data: productData as CreateProductInput });

  if (displayRating !== undefined || soldCount !== undefined) {
    const meta = await readProductDisplayMeta();
    meta[product.id] = {
      ...defaultProductMeta(),
      displayRating: displayRating ?? 5,
      soldCount: soldCount ?? 0,
    };
    await writeProductDisplayMeta(meta);
  }

  return attachProductMeta(product, await readProductDisplayMeta());
}

export async function updateProduct(id: string, data: UpdateProductInput) {
  const { productData, displayRating, soldCount } = splitProductPayload(data as any);
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

  if (displayRating !== undefined || soldCount !== undefined) {
    const meta = await readProductDisplayMeta();
    const current = meta[id] || defaultProductMeta();
    meta[id] = {
      ...current,
      displayRating: displayRating ?? current.displayRating,
      soldCount: soldCount ?? current.soldCount,
    };
    await writeProductDisplayMeta(meta);
  }

  return attachProductMeta(product, await readProductDisplayMeta());
}

export async function deleteProduct(id: string) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Produk');
  }

  // Soft delete
  return prisma.product.update({
    where: { id },
    data: { isActive: false },
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
    imageUrl: data.imageUrl || '',
    description: data.description,
    createdAt: now,
    updatedAt: now,
  };

  meta[productId] = {
    ...current,
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
    const nextReviews = reviews.map((review) => {
      if (review.id !== reviewId) return review;
      updatedReview = {
        ...review,
        reviewerName: data.reviewerName,
        imageUrl: data.imageUrl || '',
        description: data.description,
        updatedAt: new Date().toISOString(),
      };
      return updatedReview;
    });

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

import { prisma } from '../../../core/config/database';
import { NotFoundError, ConflictError } from '../../../core/utils/errors';
import type { CreateProductInput, UpdateProductInput } from '../schema/product.schema';

interface QueryOptions {
  categoryId?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
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

  return { total, products };
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

  return product;
}

export async function createProduct(data: CreateProductInput) {
  const existing = await prisma.product.findUnique({ where: { slug: data.slug } });
  if (existing) {
    throw new ConflictError('Produk dengan slug tersebut sudah ada');
  }

  return prisma.product.create({ data });
}

export async function updateProduct(id: string, data: UpdateProductInput) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Produk');
  }

  if (data.slug && data.slug !== existing.slug) {
    const slugExists = await prisma.product.findUnique({ where: { slug: data.slug } });
    if (slugExists) {
      throw new ConflictError('Produk dengan slug tersebut sudah ada');
    }
  }

  return prisma.product.update({
    where: { id },
    data,
  });
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

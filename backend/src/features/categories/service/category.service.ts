import { prisma } from '../../../core/config/database';
import { NotFoundError, ConflictError } from '../../../core/utils/errors';
import type { CreateCategoryInput, UpdateCategoryInput } from '../schema/category.schema';

export async function getAllCategories() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { products: true }
      }
    }
  });
}

export async function getCategoryBySlug(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (!category) {
    throw new NotFoundError('Kategori');
  }

  return category;
}

export async function createCategory(data: CreateCategoryInput) {
  const existing = await prisma.category.findUnique({ where: { slug: data.slug } });
  if (existing) {
    throw new ConflictError('Kategori dengan slug tersebut sudah ada');
  }

  return prisma.category.create({ data });
}

export async function updateCategory(id: string, data: UpdateCategoryInput) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Kategori');
  }

  if (data.slug && data.slug !== existing.slug) {
    const slugExists = await prisma.category.findUnique({ where: { slug: data.slug } });
    if (slugExists) {
      throw new ConflictError('Kategori dengan slug tersebut sudah ada');
    }
  }

  return prisma.category.update({
    where: { id },
    data,
  });
}

export async function deleteCategory(id: string) {
  const existing = await prisma.category.findUnique({ 
    where: { id },
    include: { _count: { select: { products: true } } }
  });
  
  if (!existing) {
    throw new NotFoundError('Kategori');
  }

  if (existing._count.products > 0) {
    throw new ConflictError('Kategori tidak bisa dihapus karena masih memiliki produk');
  }

  await prisma.category.delete({ where: { id } });
}

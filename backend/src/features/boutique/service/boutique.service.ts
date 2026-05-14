import { prisma } from '../../../core/config/database';
import { NotFoundError, ConflictError } from '../../../core/utils/errors';
import type { CreateBoutiqueProductInput, UpdateBoutiqueProductInput } from '../schema/boutique.schema';

export async function getAllBoutiqueProducts(isActive?: boolean) {
  const where: any = {};
  if (isActive !== undefined) where.isActive = isActive;
  return prisma.boutiqueProduct.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function getBoutiqueProductBySlug(slug: string) {
  const product = await prisma.boutiqueProduct.findUnique({ where: { slug } });
  if (!product) throw new NotFoundError('Produk butik');
  return product;
}

export async function createBoutiqueProduct(data: CreateBoutiqueProductInput) {
  const existing = await prisma.boutiqueProduct.findUnique({ where: { slug: data.slug } });
  if (existing) throw new ConflictError('Produk butik dengan slug tersebut sudah ada');
  return prisma.boutiqueProduct.create({ data });
}

export async function updateBoutiqueProduct(id: string, data: UpdateBoutiqueProductInput) {
  const existing = await prisma.boutiqueProduct.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Produk butik');
  if (data.slug && data.slug !== existing.slug) {
    const slugExists = await prisma.boutiqueProduct.findUnique({ where: { slug: data.slug } });
    if (slugExists) throw new ConflictError('Slug sudah digunakan');
  }
  return prisma.boutiqueProduct.update({ where: { id }, data });
}

export async function deleteBoutiqueProduct(id: string) {
  const existing = await prisma.boutiqueProduct.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Produk butik');
  return prisma.boutiqueProduct.delete({ where: { id } });
}

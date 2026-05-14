import { Prisma } from '@prisma/client';
import { prisma } from '../../../core/config/database';
import { ConflictError, NotFoundError } from '../../../core/utils/errors';
import type { CreateBoutiqueInput, UpdateBoutiqueInput } from '../schema/boutique.schema';

interface QueryOptions {
  isActive?: boolean;
  search?: string;
}

export async function getAllBoutiques(options: QueryOptions = {}) {
  const where: Prisma.BoutiqueWhereInput = {};

  if (options.isActive !== undefined) {
    where.isActive = options.isActive;
  }

  if (options.search) {
    const keyword = options.search.trim();
    where.OR = [
      { name: { contains: keyword, mode: 'insensitive' } },
      { city: { contains: keyword, mode: 'insensitive' } },
      { address: { contains: keyword, mode: 'insensitive' } },
      { contactPhone: { contains: keyword, mode: 'insensitive' } },
    ];
  }

  return prisma.boutique.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { city: 'asc' }, { name: 'asc' }],
  });
}

export async function getBoutiqueBySlug(slugOrId: string) {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  const boutique = await prisma.boutique.findUnique({
    where: isUUID ? { id: slugOrId } : { slug: slugOrId },
  });

  if (!boutique) {
    throw new NotFoundError('Butik');
  }

  return boutique;
}

export async function createBoutique(data: CreateBoutiqueInput) {
  const existing = await prisma.boutique.findUnique({ where: { slug: data.slug } });
  if (existing) {
    throw new ConflictError('Butik dengan slug tersebut sudah ada');
  }

  return prisma.boutique.create({ data });
}

export async function updateBoutique(id: string, data: UpdateBoutiqueInput) {
  const existing = await prisma.boutique.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Butik');
  }

  if (data.slug && data.slug !== existing.slug) {
    const slugExists = await prisma.boutique.findUnique({ where: { slug: data.slug } });
    if (slugExists) {
      throw new ConflictError('Butik dengan slug tersebut sudah ada');
    }
  }

  return prisma.boutique.update({
    where: { id },
    data,
  });
}

export async function deleteBoutique(id: string) {
  const existing = await prisma.boutique.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Butik');
  }

  await prisma.boutique.delete({ where: { id } });
}

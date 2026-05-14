import { prisma } from '../../../core/config/database';
import { NotFoundError, ConflictError } from '../../../core/utils/errors';
import type { CreateArticleInput, UpdateArticleInput } from '../schema/article.schema';

interface QueryOptions {
  page?: number;
  limit?: number;
  isPublished?: boolean;
  search?: string;
}

export async function getAllArticles(options: QueryOptions = {}) {
  const { page = 1, limit = 10, isPublished, search } = options;
  const skip = (page - 1) * limit;
  const where: any = {};
  if (isPublished !== undefined) where.isPublished = isPublished;
  if (search) where.OR = [
    { title: { contains: search, mode: 'insensitive' } },
    { excerpt: { contains: search, mode: 'insensitive' } },
  ];

  const [total, articles] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      skip,
      take: limit,
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return { total, articles };
}

export async function getArticleBySlug(slugOrId: string) {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  const article = await prisma.article.findUnique({
    where: isUUID ? { id: slugOrId } : { slug: slugOrId },
    include: { author: { select: { id: true, name: true } } },
  });
  if (!article) throw new NotFoundError('Artikel');
  return article;
}

export async function createArticle(authorId: string, data: CreateArticleInput) {
  const existing = await prisma.article.findUnique({ where: { slug: data.slug } });
  if (existing) throw new ConflictError('Artikel dengan slug tersebut sudah ada');
  return prisma.article.create({
    data: { ...data, authorId, publishedAt: data.isPublished ? new Date() : null },
    include: { author: { select: { id: true, name: true } } },
  });
}

export async function updateArticle(id: string, data: UpdateArticleInput) {
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Artikel');
  if (data.slug && data.slug !== existing.slug) {
    const slugExists = await prisma.article.findUnique({ where: { slug: data.slug } });
    if (slugExists) throw new ConflictError('Slug sudah digunakan');
  }
  const publishedAt = data.isPublished && !existing.isPublished ? new Date() : existing.publishedAt;
  return prisma.article.update({
    where: { id },
    data: { ...data, publishedAt },
    include: { author: { select: { id: true, name: true } } },
  });
}

export async function deleteArticle(id: string) {
  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Artikel');
  return prisma.article.delete({ where: { id } });
}

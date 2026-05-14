import { z } from 'zod';

export const createArticleSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter').max(300),
  slug: z.string().min(3).max(300),
  excerpt: z.string().optional(),
  content: z.string().min(10, 'Konten minimal 10 karakter'),
  coverUrl: z.string().url().optional().or(z.literal('')),
  isPublished: z.boolean().default(false),
  publishedAt: z.string().datetime().optional(),
});

export const updateArticleSchema = createArticleSchema.partial();

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;

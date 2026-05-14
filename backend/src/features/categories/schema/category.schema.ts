import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Nama kategori minimal 2 karakter').max(100),
  slug: z.string().min(2, 'Slug minimal 2 karakter').max(100),
  description: z.string().optional(),
  imageUrl: z.string().url('Format URL gambar tidak valid').optional().or(z.literal('')),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

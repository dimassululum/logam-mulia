import { z } from 'zod';

export const createBoutiqueProductSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(200),
  slug: z.string().min(2).max(200),
  description: z.string().optional(),
  price: z.number().positive('Harga harus positif'),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updateBoutiqueProductSchema = createBoutiqueProductSchema.partial();

export type CreateBoutiqueProductInput = z.infer<typeof createBoutiqueProductSchema>;
export type UpdateBoutiqueProductInput = z.infer<typeof updateBoutiqueProductSchema>;

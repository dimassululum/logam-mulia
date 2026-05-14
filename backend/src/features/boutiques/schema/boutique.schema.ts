import { z } from 'zod';

export const createBoutiqueSchema = z.object({
  name: z.string().min(2, 'Nama butik minimal 2 karakter').max(200),
  slug: z.string().min(2, 'Slug minimal 2 karakter').max(200),
  city: z.string().min(2, 'Kota minimal 2 karakter').max(120),
  address: z.string().min(5, 'Alamat minimal 5 karakter'),
  contactPhone: z.string().min(5, 'Kontak minimal 5 karakter').max(50),
  googleMapsUrl: z.string().url('Link Google Maps tidak valid'),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updateBoutiqueSchema = createBoutiqueSchema.partial();

export type CreateBoutiqueInput = z.infer<typeof createBoutiqueSchema>;
export type UpdateBoutiqueInput = z.infer<typeof updateBoutiqueSchema>;

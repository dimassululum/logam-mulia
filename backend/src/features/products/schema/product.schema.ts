import { z } from 'zod';

export const createProductSchema = z.object({
  categoryId: z.string().uuid('Kategori ID tidak valid'),
  name: z.string().min(2, 'Nama produk minimal 2 karakter').max(200),
  slug: z.string().min(2, 'Slug minimal 2 karakter').max(200),
  description: z.string().optional(),
  price: z.number().positive('Harga harus bernilai positif'),
  weightGram: z.number().positive('Berat harus bernilai positif'),
  kadar: z.string().min(1, 'Kadar wajib diisi'),
  stock: z.number().int().nonnegative('Stok tidak boleh negatif').default(0),
  isActive: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

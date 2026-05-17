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
  displayRating: z.number().min(0, 'Rating minimal 0').max(5, 'Rating maksimal 5').default(5),
  reviewCount: z.number().int().nonnegative('Jumlah ulasan tidak boleh negatif').default(0),
  soldCount: z.number().int().nonnegative('Jumlah terjual tidak boleh negatif').default(0),
  isActive: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export const displayReviewSchema = z.object({
  reviewerName: z.string().min(2, 'Nama minimal 2 karakter').max(120),
  imageUrl: z.string().optional().nullable(),
  description: z.string().min(3, 'Deskripsi minimal 3 karakter').max(1000),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type DisplayReviewInput = z.infer<typeof displayReviewSchema>;

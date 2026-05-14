import { DiscountType } from '@prisma/client';
import { z } from 'zod';

const dateField = z.preprocess((value) => {
  if (value === undefined || value === '') return undefined;
  if (value === null) return null;
  return new Date(String(value));
}, z.date().nullable().optional());

const voucherBaseSchema = z.object({
  code: z.string().min(2, 'Kode voucher minimal 2 karakter').max(50),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.number().positive('Nilai diskon harus lebih dari 0'),
  minPurchase: z.number().nonnegative('Minimum pembelian tidak boleh negatif').default(0),
  maxDiscount: z.number().positive('Maksimum diskon harus lebih dari 0').nullable().optional(),
  usageLimit: z.number().int().positive('Limit penggunaan harus lebih dari 0').nullable().optional(),
  perUserLimit: z.number().int().positive('Limit per user harus lebih dari 0').default(1),
  isActive: z.boolean().default(true),
  startsAt: dateField,
  expiresAt: dateField,
  productIds: z.array(z.string().uuid('Produk tidak valid')).default([]),
});

export const createVoucherSchema = voucherBaseSchema.refine((data) => {
  if (!data.startsAt || !data.expiresAt) return true;
  return data.expiresAt > data.startsAt;
}, {
  path: ['expiresAt'],
  message: 'Tanggal berakhir harus setelah tanggal mulai',
});

export const updateVoucherSchema = voucherBaseSchema.partial().refine((data) => {
  if (!data.startsAt || !data.expiresAt) return true;
  return data.expiresAt > data.startsAt;
}, {
  path: ['expiresAt'],
  message: 'Tanggal berakhir harus setelah tanggal mulai',
});

export const validateVoucherSchema = z.object({
  code: z.string().min(1, 'Kode voucher wajib diisi').max(50),
  subtotal: z.number().nonnegative('Subtotal tidak boleh negatif'),
});

export type CreateVoucherInput = z.infer<typeof createVoucherSchema>;
export type UpdateVoucherInput = z.infer<typeof updateVoucherSchema>;
export type ValidateVoucherInput = z.infer<typeof validateVoucherSchema>;

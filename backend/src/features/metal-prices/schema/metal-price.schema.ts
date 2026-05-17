import { MetalType } from '@prisma/client';
import { z } from 'zod';

const priceField = z.number().positive('Harga harus lebih dari 0');

export const updateMetalPricesSchema = z.object({
  goldPrice: priceField.optional(),
  silverPrice: priceField.optional(),
}).refine((data) => data.goldPrice !== undefined || data.silverPrice !== undefined, {
  message: 'Minimal satu harga harus diisi',
});

export const createMetalPriceSchema = z.object({
  metal: z.nativeEnum(MetalType),
  price: priceField,
});

export type UpdateMetalPricesInput = z.infer<typeof updateMetalPricesSchema>;
export type CreateMetalPriceInput = z.infer<typeof createMetalPriceSchema>;

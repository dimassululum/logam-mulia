import { z } from 'zod';

export const checkoutCustomerQuerySchema = z.object({
  email: z.string().email('Format email tidak valid'),
});

export const checkoutCustomerBodySchema = z.object({
  email: z.string().email('Format email tidak valid'),
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  phone: z.string().optional(),
  addressId: z.string().uuid().optional(),
  addressFullName: z.string().optional(),
  addressPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  village: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
});

export const shippingRatesSchema = z.object({
  destinationCity: z.string().min(1, 'Kota tujuan wajib diisi'),
  weightGram: z.coerce.number().int().positive('Berat pengiriman wajib diisi'),
});

export type CheckoutCustomerQuery = z.infer<typeof checkoutCustomerQuerySchema>;
export type CheckoutCustomerBody = z.infer<typeof checkoutCustomerBodySchema>;
export type ShippingRatesInput = z.infer<typeof shippingRatesSchema>;

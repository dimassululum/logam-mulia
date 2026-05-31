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
  rajaOngkirDestinationId: z.coerce.number().int().positive('Destination ID lokasi tidak valid').optional(),
});

export const shippingRatesSchema = z.object({
  destinationCity: z.string().min(1, 'Kota tujuan wajib diisi'),
  destinationId: z.coerce.number().int().positive('Destination ID lokasi tidak valid').optional(),
  destinationDistrict: z.string().optional(),
  destinationVillage: z.string().optional(),
  destinationPostalCode: z.string().optional(),
  weightGram: z.coerce.number().int().positive('Berat pengiriman wajib diisi'),
});

export const destinationSearchSchema = z.object({
  search: z.string().min(2, 'Kata kunci minimal 2 karakter'),
});

export const cityByProvinceSchema = z.object({
  provinceId: z.coerce.number().int().positive('Province ID tidak valid'),
});

export const districtByCitySchema = z.object({
  cityId: z.coerce.number().int().positive('City ID tidak valid'),
});

export const subdistrictByDistrictSchema = z.object({
  districtId: z.coerce.number().int().positive('District ID tidak valid'),
});

export type CheckoutCustomerQuery = z.infer<typeof checkoutCustomerQuerySchema>;
export type CheckoutCustomerBody = z.infer<typeof checkoutCustomerBodySchema>;
export type ShippingRatesInput = z.infer<typeof shippingRatesSchema>;
export type DestinationSearchInput = z.infer<typeof destinationSearchSchema>;
export type CityByProvinceInput = z.infer<typeof cityByProvinceSchema>;
export type DistrictByCityInput = z.infer<typeof districtByCitySchema>;
export type SubdistrictByDistrictInput = z.infer<typeof subdistrictByDistrictSchema>;

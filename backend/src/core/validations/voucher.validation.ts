import { z } from 'zod';

// Voucher validation schemas
export const createVoucherSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(20, 'Code must be less than 20 characters'),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().positive('Discount value must be positive'),
  minPurchase: z.number().min(0, 'Minimum purchase must be non-negative').default(0),
  maxDiscount: z.number().positive('Maximum discount must be positive').optional(),
  usageLimit: z.number().int().positive('Usage limit must be positive').optional(),
  perUserLimit: z.number().int().min(1, 'Per user limit must be at least 1').default(1),
  isActive: z.boolean().default(true),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const updateVoucherSchema = createVoucherSchema.partial();

export const voucherQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  search: z.string().optional(),
  isActive: z.string().transform(Boolean).optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  sortBy: z.enum(['createdAt', 'code', 'discountValue', 'usageCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const validateVoucherSchema = z.object({
  code: z.string().min(1, 'Voucher code is required'),
  totalAmount: z.number().positive('Total amount must be positive'),
});

// Promo validation schemas
export const createPromoSchema = z.object({
  name: z.string().min(1, 'Promo name is required').max(100, 'Promo name must be less than 100 characters'),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().positive('Discount value must be positive'),
  productIds: z.array(z.string().uuid()).optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  isActive: z.boolean().default(true),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const updatePromoSchema = createPromoSchema.partial();

export const promoQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  search: z.string().optional(),
  isActive: z.string().transform(Boolean).optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  sortBy: z.enum(['createdAt', 'name', 'discountValue']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Review validation schemas
export const createReviewSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().min(1, 'Review comment is required').max(1000, 'Comment must be less than 1000 characters'),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5').optional(),
  comment: z.string().min(1, 'Review comment is required').max(1000, 'Comment must be less than 1000 characters').optional(),
  isApproved: z.boolean().optional(),
});

export const reviewQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  productId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  isApproved: z.string().transform(Boolean).optional(),
  sortBy: z.enum(['createdAt', 'rating']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateVoucherInput = z.infer<typeof createVoucherSchema>;
export type UpdateVoucherInput = z.infer<typeof updateVoucherSchema>;
export type VoucherQueryInput = z.infer<typeof voucherQuerySchema>;
export type ValidateVoucherInput = z.infer<typeof validateVoucherSchema>;
export type CreatePromoInput = z.infer<typeof createPromoSchema>;
export type UpdatePromoInput = z.infer<typeof updatePromoSchema>;
export type PromoQueryInput = z.infer<typeof promoQuerySchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ReviewQueryInput = z.infer<typeof reviewQuerySchema>;

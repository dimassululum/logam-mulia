import { z } from 'zod';

// Dashboard query validation
export const dashboardQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Settings validation
export const updateSettingsSchema = z.object({
  settings: z.record(z.string(), z.string()),
});

export const settingSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string().min(1, 'Value is required'),
});

// Banner validation
export const createBannerSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  subtitle: z.string().max(200, 'Subtitle must be less than 200 characters').optional(),
  imageUrl: z.string().url('Invalid image URL'),
  linkUrl: z.string().url('Invalid link URL').optional(),
  isActive: z.boolean().default(true),
  position: z.enum(['home', 'category', 'product']).default('home'),
  sortOrder: z.number().int().min(0, 'Sort order must be non-negative').default(0),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const updateBannerSchema = createBannerSchema.partial();

export const bannerQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  position: z.enum(['home', 'category', 'product']).optional(),
  isActive: z.string().transform(Boolean).optional(),
  sortBy: z.enum(['createdAt', 'sortOrder', 'title']).default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Content validation
export const createContentSchema = z.object({
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug must be less than 100 characters'),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500, 'Excerpt must be less than 500 characters').optional(),
  type: z.enum(['page', 'post', 'announcement']).default('page'),
  status: z.enum(['published', 'draft', 'archived']).default('published'),
  imageUrl: z.string().url('Invalid image URL').optional(),
  seoTitle: z.string().max(60, 'SEO title must be less than 60 characters').optional(),
  seoDesc: z.string().max(160, 'SEO description must be less than 160 characters').optional(),
});

export const updateContentSchema = createContentSchema.partial();

export const contentQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  type: z.enum(['page', 'post', 'announcement']).optional(),
  status: z.enum(['published', 'draft', 'archived']).optional(),
  search: z.string().optional(),
  authorId: z.string().uuid().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Admin user management
export const adminUserQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  search: z.string().optional(),
  role: z.enum(['CUSTOMER', 'ADMIN', 'SUPER_ADMIN']).optional(),
  isActive: z.string().transform(Boolean).optional(),
  isKycVerified: z.string().transform(Boolean).optional(),
  sortBy: z.enum(['createdAt', 'name', 'email']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
  role: z.enum(['CUSTOMER', 'ADMIN', 'SUPER_ADMIN']).optional(),
});

// Admin order management
export const adminOrderQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  status: z.enum(['PENDING', 'Confirmed', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  search: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'totalAmount', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const bulkOrderUpdateSchema = z.object({
  orderIds: z.array(z.string().uuid()).min(1, 'At least one order ID is required'),
  updateData: z.object({
    status: z.enum(['PENDING', 'Confirmed', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
    trackingNumber: z.string().optional(),
    notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  }),
});

export type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type SettingInput = z.infer<typeof settingSchema>;
export type CreateBannerInput = z.infer<typeof createBannerSchema>;
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;
export type BannerQueryInput = z.infer<typeof bannerQuerySchema>;
export type CreateContentInput = z.infer<typeof createContentSchema>;
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
export type ContentQueryInput = z.infer<typeof contentQuerySchema>;
export type AdminUserQueryInput = z.infer<typeof adminUserQuerySchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type AdminOrderQueryInput = z.infer<typeof adminOrderQuerySchema>;
export type BulkOrderUpdateInput = z.infer<typeof bulkOrderUpdateSchema>;

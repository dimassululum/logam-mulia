import { z } from 'zod';

// Product validation schemas
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Product name must be less than 255 characters'),
  description: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().positive('Price must be positive').min(0.01, 'Price must be at least 0.01'),
  weight: z.number().positive('Weight must be positive').optional(),
  stock: z.number().int().nonnegative('Stock must be non-negative').default(0),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  isActive: z.boolean().default(true),
  specifications: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  search: z.string().optional(),
  category: z.string().uuid().optional(),
  minPrice: z.string().transform(Number).optional(),
  maxPrice: z.string().transform(Number).optional(),
  inStock: z.string().transform(Boolean).optional(),
  isActive: z.string().transform(Boolean).optional(),
  sortBy: z.enum(['name', 'price', 'createdAt', 'stock']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Category validation schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name must be less than 100 characters'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  parentId: z.string().uuid().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const categoryQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('50'),
  search: z.string().optional(),
  isActive: z.string().transform(Boolean).optional(),
  parentId: z.string().uuid().optional(),
});

// Product image validation
export const productImageSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  imageUrl: z.string().url('Invalid image URL'),
  altText: z.string().optional(),
  isPrimary: z.boolean().default(false),
});

// Bulk operations
export const bulkUpdateProductsSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1, 'At least one product ID is required'),
  updates: z.object({
    isActive: z.boolean().optional(),
    categoryId: z.string().uuid().optional(),
    stock: z.number().int().nonnegative().optional(),
    price: z.number().positive().optional(),
  }),
});

export const bulkDeleteProductsSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1, 'At least one product ID is required'),
});

// Product review validation (for future use)
export const createReviewSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().min(1, 'Review comment is required').max(1000, 'Comment must be less than 1000 characters'),
});

// Product variant validation (for future use)
export const createProductVariantSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  name: z.string().min(1, 'Variant name is required'),
  sku: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  stock: z.number().int().nonnegative('Stock must be non-negative').default(0),
  attributes: z.record(z.string()).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryQueryInput = z.infer<typeof categoryQuerySchema>;
export type ProductImageInput = z.infer<typeof productImageSchema>;
export type BulkUpdateProductsInput = z.infer<typeof bulkUpdateProductsSchema>;
export type BulkDeleteProductsInput = z.infer<typeof bulkDeleteProductsSchema>;

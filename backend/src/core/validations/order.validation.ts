import { z } from 'zod';

// Cart item validation
export const cartItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

// Order creation validation
export const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  })).min(1, 'At least one item is required'),
  
  shippingAddress: z.object({
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    province: z.string().min(1, 'Province is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    recipientName: z.string().min(1, 'Recipient name is required'),
    recipientPhone: z.string().min(1, 'Recipient phone is required'),
  }),
  
  shippingCourier: z.enum(['JNE', 'Paxel', 'SELFPICKUP']).default('JNE'),
  shippingCost: z.number().min(0, 'Shipping cost must be non-negative').default(0),
  voucherId: z.string().uuid().optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

// Order update validation
export const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'CONFirmed', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  trackingNumber: z.string().optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

// Order query validation
export const orderQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  status: z.enum(['PENDING', 'Confirmed', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'totalAmount', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Payment validation
export const paymentRequestSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  paymentMethod: z.enum(['bank_transfer', 'credit_card', 'gopay', 'shopeepay', 'qris']),
});

// Address validation
export const createAddressSchema = z.object({
  label: z.string().min(1, 'Label is required').max(50, 'Label must be less than 50 characters'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  province: z.string().min(1, 'Province is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  recipientName: z.string().min(1, 'Recipient name is required'),
  recipientPhone: z.string().min(1, 'Recipient phone is required'),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();

// Shipping cost calculation
export const shippingCostSchema = z.object({
  origin: z.string().min(1, 'Origin city is required'),
  destination: z.string().min(1, 'Destination city is required'),
  weight: z.number().min(1, 'Weight is required'),
  courier: z.enum(['jne', 'pos', 'tiki']).default('jne'),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
export type PaymentRequestInput = z.infer<typeof paymentRequestSchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type ShippingCostInput = z.infer<typeof shippingCostSchema>;

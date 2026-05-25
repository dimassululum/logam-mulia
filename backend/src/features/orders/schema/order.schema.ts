import { OrderStatus } from '@prisma/client';
import { z } from 'zod';

const orderItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string().min(1),
  productImage: z.string().nullable().optional(),
  priceAtPurchase: z.number().nonnegative(),
  quantity: z.number().int().positive(),
});

export const createOrderSchema = z.object({
  email: z.string().email(),
  customerName: z.string().min(2),
  customerPhone: z.string().optional(),
  paymentMethod: z.string().min(1).default('QRIS Manual'),
  deliveryType: z.enum(['ekspedisi', 'butik']),
  shippingCourier: z.string().nullable().optional(),
  shippingService: z.string().nullable().optional(),
  shippingCost: z.number().nonnegative().default(0),
  shippingAddress: z.string().min(1),
  shippingCity: z.string().nullable().optional(),
  shippingProvince: z.string().nullable().optional(),
  shippingDistrict: z.string().nullable().optional(),
  shippingVillage: z.string().nullable().optional(),
  shippingPostalCode: z.string().nullable().optional(),
  boutiqueName: z.string().nullable().optional(),
  boutiqueAddress: z.string().nullable().optional(),
  voucherId: z.string().uuid().nullable().optional(),
  discountAmount: z.number().nonnegative().default(0),
  items: z.array(orderItemSchema).min(1),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  trackingNumber: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

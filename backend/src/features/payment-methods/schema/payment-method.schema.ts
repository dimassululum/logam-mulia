import { z } from 'zod';

export const updatePaymentMethodSchema = z.object({
  isActive: z.boolean().optional(),
  config: z.record(z.unknown()).optional(),
});

export const updatePaymentGatewayModeSchema = z.object({
  mode: z.enum(['manual', 'midtrans']),
});

export type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodSchema>;
export type UpdatePaymentGatewayModeInput = z.infer<typeof updatePaymentGatewayModeSchema>;

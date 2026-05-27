import { z } from 'zod';

export const updatePaymentMethodSchema = z.object({
  isActive: z.boolean().optional(),
  config: z.record(z.unknown()).optional(),
});

export type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodSchema>;

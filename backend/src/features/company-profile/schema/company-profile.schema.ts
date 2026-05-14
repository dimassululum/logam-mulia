import { z } from 'zod';

export const upsertCompanyProfileSchema = z.object({
  key: z.string().min(1, 'Key wajib diisi'),
  value: z.string().min(1, 'Value wajib diisi'),
  type: z.enum(['text', 'image', 'list']).default('text'),
});

export const bulkUpsertSchema = z.object({
  items: z.array(upsertCompanyProfileSchema).min(1),
});

export type UpsertCompanyProfileInput = z.infer<typeof upsertCompanyProfileSchema>;

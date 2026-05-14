import { prisma } from '../../../core/config/database';
import type { UpsertCompanyProfileInput } from '../schema/company-profile.schema';

export async function getAllCompanyProfile() {
  const items = await prisma.companyProfile.findMany({ orderBy: { key: 'asc' } });
  // Return as a map for convenience
  return items.reduce((acc, item) => {
    acc[item.key] = { value: item.value, type: item.type };
    return acc;
  }, {} as Record<string, { value: string; type: string }>);
}

export async function upsertCompanyProfile(data: UpsertCompanyProfileInput) {
  return prisma.companyProfile.upsert({
    where: { key: data.key },
    update: { value: data.value, type: data.type },
    create: { key: data.key, value: data.value, type: data.type },
  });
}

export async function bulkUpsertCompanyProfile(items: UpsertCompanyProfileInput[]) {
  return Promise.all(items.map(item => upsertCompanyProfile(item)));
}

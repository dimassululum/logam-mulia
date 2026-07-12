import { prisma } from '../../../core/config/database';
import { persistDataUrlToUpload } from '../../../core/utils/public-url';
import type { UpsertCompanyProfileInput } from '../schema/company-profile.schema';

export async function getAllCompanyProfile() {
  const items = await prisma.companyProfile.findMany({ orderBy: { key: 'asc' } });
  // Return as a map for convenience
  return items.reduce((acc, item) => {
    acc[item.key] = { value: item.value, type: item.type };
    return acc;
  }, {} as Record<string, { value: string; type: string }>);
}

async function persistDataUrlsInJson(value: unknown, prefix: string): Promise<unknown> {
  if (typeof value === 'string') {
    return persistDataUrlToUpload(value, prefix);
  }

  if (Array.isArray(value)) {
    return Promise.all(value.map((item, index) => persistDataUrlsInJson(item, `${prefix}-${index}`)));
  }

  if (value && typeof value === 'object') {
    const entries = await Promise.all(
      Object.entries(value).map(async ([key, item]) => [key, await persistDataUrlsInJson(item, `${prefix}-${key}`)]),
    );
    return Object.fromEntries(entries);
  }

  return value;
}

async function normalizeProfileValue(data: UpsertCompanyProfileInput) {
  if (!data.value.includes('data:image')) return data.value;

  if (data.type === 'image') {
    return persistDataUrlToUpload(data.value, data.key);
  }

  try {
    const parsed = JSON.parse(data.value);
    const normalized = await persistDataUrlsInJson(parsed, data.key);
    return JSON.stringify(normalized);
  } catch {
    return persistDataUrlToUpload(data.value, data.key);
  }
}

export async function upsertCompanyProfile(data: UpsertCompanyProfileInput) {
  const value = await normalizeProfileValue(data);

  return prisma.companyProfile.upsert({
    where: { key: data.key },
    update: { value, type: data.type },
    create: { key: data.key, value, type: data.type },
  });
}

export async function bulkUpsertCompanyProfile(items: UpsertCompanyProfileInput[]) {
  return Promise.all(items.map(item => upsertCompanyProfile(item)));
}

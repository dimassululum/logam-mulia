import { apiClient } from '@/core/lib/api-client'

export interface CompanyProfileItem {
  value: string
  type: 'text' | 'image' | 'list'
}

export type CompanyProfileMap = Record<string, CompanyProfileItem>

export async function fetchCompanyProfile(): Promise<CompanyProfileMap> {
  const { data } = await apiClient.get('/company-profile')
  return data.data ?? {}
}

export async function saveCompanyProfileItems(
  items: Array<{ key: string; value: string; type?: CompanyProfileItem['type'] }>,
) {
  await apiClient.post('/company-profile/bulk', {
    items: items.map((item) => ({
      key: item.key,
      value: item.value,
      type: item.type ?? 'text',
    })),
  })
}

export function readProfileText(profile: CompanyProfileMap, key: string, fallback: string) {
  return profile[key]?.value || fallback
}

export function readProfileJson<T>(profile: CompanyProfileMap, key: string, fallback: T): T {
  const value = profile[key]?.value
  if (!value) return fallback

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

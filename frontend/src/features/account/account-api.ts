import { apiClient } from '@/core/lib/api-client'

export interface AccountAddress {
  id: string
  label: string
  fullName?: string | null
  phone?: string | null
  address: string
  city: string
  district?: string | null
  village?: string | null
  province: string
  postalCode: string
  isDefault: boolean
}

export interface AccountProfile {
  id: string
  name: string
  email: string
  phone?: string | null
  role: string
  isKycVerified: boolean
  ktpUrl?: string | null
  createdAt?: string
  addresses: AccountAddress[]
}

export async function fetchAccountProfile() {
  const { data } = await apiClient.get('/auth/me')
  return data.data as AccountProfile
}

export async function updateAccountProfile(input: { name: string; phone?: string }) {
  const { data } = await apiClient.patch('/auth/me', input)
  return data.data as AccountProfile
}

import { resolvePublicApiBaseUrl } from '@/core/lib/public-url'

export const CHECKOUT_GUEST_STORAGE_KEY = 'skripsi-finance.checkout.guest'

export interface GuestCheckoutAddress {
  id?: string
  fullName: string
  phone: string
  address: string
  city: string
  district?: string
  village?: string
  province: string
  postalCode: string
  rajaOngkirDestinationId?: number
}

export interface GuestCheckoutProfile {
  email: string
  ordererName?: string
  phone?: string
  found: boolean
  hasOrders?: boolean
  address?: GuestCheckoutAddress
  addresses?: GuestCheckoutAddress[]
  hasKtp: boolean
  ktpUrl?: string | null
}

const API_URL = resolvePublicApiBaseUrl()

export async function lookupGuestProfile(email: string): Promise<GuestCheckoutProfile> {
  const normalizedEmail = email.trim().toLowerCase()

  try {
    const response = await fetch(`${API_URL}/checkout/customer?email=${encodeURIComponent(normalizedEmail)}`, {
      cache: 'no-store',
    })
    const json = await response.json()
    if (response.ok && json.data) return json.data as GuestCheckoutProfile
  } catch (error) {
    console.error('Error looking up checkout profile', error)
  }

  return { email: normalizedEmail, found: false, hasKtp: false, hasOrders: false, addresses: [] }
}

export async function saveCheckoutCustomerProfile(profile: {
  email: string
  name: string
  phone?: string
  address?: GuestCheckoutAddress | null
  ktpFile?: File | null
}) {
  const formData = new FormData()
  formData.append('email', profile.email)
  formData.append('name', profile.name)
  if (profile.phone) formData.append('phone', profile.phone)
  if (profile.ktpFile) formData.append('ktp', profile.ktpFile)

  const address = profile.address
  if (address) {
    if (address.id) formData.append('addressId', address.id)
    formData.append('addressFullName', address.fullName)
    formData.append('addressPhone', address.phone)
    formData.append('address', address.address)
    formData.append('city', address.city)
    formData.append('district', address.district || '')
    formData.append('village', address.village || '')
    formData.append('province', address.province)
    formData.append('postalCode', address.postalCode)
    if (address.rajaOngkirDestinationId) {
      formData.append('rajaOngkirDestinationId', String(address.rajaOngkirDestinationId))
    }
  }

  const response = await fetch(`${API_URL}/checkout/customer`, {
    method: 'POST',
    body: formData,
  })
  const json = await response.json()
  if (!response.ok) throw new Error(json.message || 'Gagal menyimpan data checkout')
  return json.data as GuestCheckoutProfile
}

export function saveGuestCheckoutProfile(profile: GuestCheckoutProfile) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(CHECKOUT_GUEST_STORAGE_KEY, JSON.stringify(profile))
}

export function readGuestCheckoutProfile(): GuestCheckoutProfile | null {
  if (typeof window === 'undefined') return null

  const rawProfile = window.sessionStorage.getItem(CHECKOUT_GUEST_STORAGE_KEY)
  if (!rawProfile) return null

  try {
    return JSON.parse(rawProfile) as GuestCheckoutProfile
  } catch {
    return null
  }
}

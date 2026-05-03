export const CHECKOUT_GUEST_STORAGE_KEY = 'skripsi-finance.checkout.guest'

export interface GuestCheckoutAddress {
  fullName: string
  phone: string
  address: string
  city: string
  province: string
  postalCode: string
}

export interface GuestCheckoutProfile {
  email: string
  ordererName?: string
  found: boolean
  address?: GuestCheckoutAddress
  addresses?: GuestCheckoutAddress[]
  hasKtp: boolean
}

const KNOWN_GUEST_PROFILES: GuestCheckoutProfile[] = [
  {
    email: 'budi@example.com',
    ordererName: 'Budi Santoso',
    found: true,
    hasKtp: true,
    addresses: [
      {
        fullName: 'Budi Santoso',
        phone: '081234567890',
        address: 'Jl. Sudirman No. 123, Komplek Elit Kav. 45',
        city: 'Jakarta Selatan',
        province: 'DKI Jakarta',
        postalCode: '12345',
      },
    ],
  },
]

export function lookupGuestProfile(email: string): GuestCheckoutProfile {
  const normalizedEmail = email.trim().toLowerCase()
  const existingProfile = KNOWN_GUEST_PROFILES.find((profile) => profile.email === normalizedEmail)

  return existingProfile ?? {
    email: normalizedEmail,
    found: false,
    hasKtp: false,
  }
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

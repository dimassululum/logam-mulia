import type { CurrentUser, UserRole } from '@/core/types'

export const MOCK_AUTH_COOKIES = {
  role:  'lm-role',
  name:  'lm-name',
  email: 'lm-email',
} as const

export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export function isUserRole(value: string | null | undefined): value is UserRole {
  return value === 'customer' || value === 'admin' || value === 'super_admin'
}

export function isAdminRole(role: UserRole | null | undefined): role is CurrentUser['role'] {
  return role === 'admin' || role === 'super_admin'
}

export function deriveRoleFromEmail(email: string): UserRole {
  const normalized = email.trim().toLowerCase()

  if (normalized.includes('superadmin')) return 'super_admin'
  if (normalized.includes('admin')) return 'admin'

  return 'customer'
}

export function createMockCurrentUser(email: string): CurrentUser | null {
  const normalizedEmail = email.trim().toLowerCase()
  const role = deriveRoleFromEmail(normalizedEmail)

  if (!isAdminRole(role)) return null

  const localPart = normalizedEmail.split('@')[0] || 'admin'
  const displayName = localPart
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')

  return {
    id: `mock-${role}-${localPart}`,
    name: displayName || 'Admin Logam Mulia',
    email: normalizedEmail,
    role,
  }
}

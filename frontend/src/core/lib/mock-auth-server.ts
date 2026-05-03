import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { CurrentUser } from '@/core/types'
import { isAdminRole, isUserRole, MOCK_AUTH_COOKIES } from '@/core/lib/mock-auth'

export function getCurrentUser(): CurrentUser | null {
  const cookieStore = cookies()
  const role = cookieStore.get(MOCK_AUTH_COOKIES.role)?.value

  if (!isUserRole(role) || !isAdminRole(role)) {
    return null
  }

  return {
    id: `mock-${role}`,
    name: cookieStore.get(MOCK_AUTH_COOKIES.name)?.value || 'Admin Logam Mulia',
    email: cookieStore.get(MOCK_AUTH_COOKIES.email)?.value || 'admin@logammulia.test',
    role,
  }
}

export function requireAdminUser(): CurrentUser {
  const currentUser = getCurrentUser()

  if (!currentUser) {
    redirect('/login')
  }

  return currentUser
}

'use client'

import { AUTH_COOKIE_MAX_AGE_SECONDS, MOCK_AUTH_COOKIES } from '@/core/lib/mock-auth'

type AuthUser = {
  name: string
  email: string
  role: string
}

type AuthTokens = {
  accessToken: string
  refreshToken: string
}

export function persistAuthSession(user: AuthUser, tokens: AuthTokens) {
  localStorage.setItem('access_token', tokens.accessToken)
  localStorage.setItem('refresh_token', tokens.refreshToken)
  localStorage.setItem('user_name', user.name)
  localStorage.setItem('user_email', user.email)

  document.cookie = `${MOCK_AUTH_COOKIES.role}=${user.role.toLowerCase()}; path=/; max-age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`
  document.cookie = `${MOCK_AUTH_COOKIES.name}=${encodeURIComponent(user.name)}; path=/; max-age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`
  document.cookie = `${MOCK_AUTH_COOKIES.email}=${encodeURIComponent(user.email)}; path=/; max-age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`

  window.dispatchEvent(new Event('lm-auth-updated'))
}

export function resolvePostAuthPath(fallback = '/') {
  const redirect = new URLSearchParams(window.location.search).get('redirect')
  if (!redirect) return fallback

  try {
    const target = new URL(redirect, window.location.origin)
    if (target.origin !== window.location.origin) return fallback

    return `${target.pathname}${target.search}${target.hash}` || fallback
  } catch {
    return fallback
  }
}

export function navigateAfterAuth(path: string) {
  window.location.assign(path)
}

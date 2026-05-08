import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import apiClient from '@/core/lib/api-client'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN'
  phone?: string
  isKycVerified: boolean
}

interface AuthTokens {
  accessToken: string
  refreshToken: string
}

interface AuthState {
  user: AuthUser | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await apiClient.post('/auth/login', { email, password })
          const { user, tokens } = data

          // Persist tokens to localStorage (picked up by api-client interceptor)
          if (typeof window !== 'undefined') {
            localStorage.setItem('lm_access_token', tokens.accessToken)
            localStorage.setItem('lm_refresh_token', tokens.refreshToken)
          }

          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (err: unknown) {
          const message =
            (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
            'Login gagal. Periksa email dan password Anda.'
          set({ isLoading: false, error: message, isAuthenticated: false })
          throw err
        }
      },

      logout: async () => {
        try {
          const { tokens } = get()
          if (tokens?.refreshToken) {
            await apiClient.post('/auth/logout', { refreshToken: tokens.refreshToken }).catch(() => {})
          }
        } finally {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('lm_access_token')
            localStorage.removeItem('lm_refresh_token')
          }
          set({ user: null, tokens: null, isAuthenticated: false, error: null })
        }
      },

      fetchMe: async () => {
        try {
          // Re-sync localStorage from persisted Zustand state (handles page refresh)
          const { tokens } = get()
          if (typeof window !== 'undefined' && tokens?.accessToken) {
            if (!localStorage.getItem('lm_access_token')) {
              localStorage.setItem('lm_access_token', tokens.accessToken)
            }
            if (!localStorage.getItem('lm_refresh_token') && tokens.refreshToken) {
              localStorage.setItem('lm_refresh_token', tokens.refreshToken)
            }
          }
          const { data } = await apiClient.get('/auth/me')
          set({ user: data.user, isAuthenticated: true })
        } catch {
          // Token invalid/expired — clear all session data
          if (typeof window !== 'undefined') {
            localStorage.removeItem('lm_access_token')
            localStorage.removeItem('lm_refresh_token')
          }
          set({ user: null, tokens: null, isAuthenticated: false })
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'lm_auth',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectUser = (s: AuthState) => s.user
export const selectIsAdmin = (s: AuthState) =>
  s.user?.role === 'ADMIN' || s.user?.role === 'SUPER_ADMIN'
export const selectIsAuthenticated = (s: AuthState) => s.isAuthenticated

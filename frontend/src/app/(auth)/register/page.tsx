'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import RegisterForm from '@/features/auth/RegisterForm'
import { AUTH_COOKIE_MAX_AGE_SECONDS, MOCK_AUTH_COOKIES } from '@/core/lib/mock-auth'
import { apiClient } from '@/core/lib/api-client'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRegister = async (payload: { name: string; email: string; phone?: string; password: string }) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.post('/auth/register', payload)
      const { user, tokens } = response.data.data

      localStorage.setItem('access_token', tokens.accessToken)
      localStorage.setItem('refresh_token', tokens.refreshToken)
      localStorage.setItem('user_name', user.name)
      localStorage.setItem('user_email', user.email)
      window.dispatchEvent(new Event('lm-auth-updated'))
      document.cookie = `${MOCK_AUTH_COOKIES.role}=${user.role.toLowerCase()}; path=/; max-age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`
      document.cookie = `${MOCK_AUTH_COOKIES.name}=${encodeURIComponent(user.name)}; path=/; max-age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`
      document.cookie = `${MOCK_AUTH_COOKIES.email}=${encodeURIComponent(user.email)}; path=/; max-age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`

      const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/'
      router.push(redirectTo)
      router.refresh()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registrasi gagal. Coba lagi sebentar.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-elevation-low">
            <div className="relative h-11 w-11">
              <Image src="/images/logo-lm.png" alt="Logo Logam Mulia" fill className="object-contain" sizes="44px" />
            </div>
          </div>
          <h1 className="font-heading text-2xl text-[#0F1B2D] font-bold">Buat Akun Baru</h1>
          <p className="text-sm text-[#4e4637] mt-1">Daftar untuk lanjut belanja Logam Mulia</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#d2c5b1] shadow-sm p-8">
          {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}
          <RegisterForm onSubmit={handleRegister} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}

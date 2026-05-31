'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoginForm from '@/features/auth/LoginForm'
import { AUTH_COOKIE_MAX_AGE_SECONDS, MOCK_AUTH_COOKIES } from '@/core/lib/mock-auth'
import { apiClient } from '@/core/lib/api-client'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registerHref, setRegisterHref] = useState('/register')

  useEffect(() => {
    const redirect = new URLSearchParams(window.location.search).get('redirect')
    setRegisterHref(redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : '/register')
  }, [])

  const handleLogin = async ({ email, password }: any) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.post('/auth/login', { email, password })
      const { user, tokens } = response.data.data

      // Store token in localStorage
      localStorage.setItem('access_token', tokens.accessToken)
      localStorage.setItem('refresh_token', tokens.refreshToken)
      localStorage.setItem('user_name', user.name)
      localStorage.setItem('user_email', user.email)
      window.dispatchEvent(new Event('lm-auth-updated'))

      // Store in cookies for compatibility with existing middleware if any
      document.cookie = `${MOCK_AUTH_COOKIES.role}=${user.role.toLowerCase()}; path=/; max-age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`
      document.cookie = `${MOCK_AUTH_COOKIES.name}=${encodeURIComponent(user.name)}; path=/; max-age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`
      document.cookie = `${MOCK_AUTH_COOKIES.email}=${encodeURIComponent(user.email)}; path=/; max-age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`

      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        router.push('/admin')
      } else {
        const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/'
        router.push(redirectTo)
      }
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.message || 'Terjadi kesalahan saat login.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-margin-mobile py-stack-lg">
      <div className="w-full max-w-md">
        <div className="text-center mb-stack-md">
          <div className="mx-auto mb-stack-sm flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-elevation-low">
            <div className="relative h-11 w-11">
              <Image
                src="/images/logo-lm.png"
                alt="Logo Logam Mulia"
                fill
                className="object-contain"
                sizes="44px"
              />
            </div>
          </div>
          <h1 className="text-[24px] font-heading font-bold text-navy-900">Selamat Datang Kembali</h1>
          <p className="text-sm text-navy-600 mt-1">Masuk untuk lanjut belanja Logam Mulia</p>
        </div>

        <div className="card-surface rounded-2xl p-8">
          {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}
          <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
          <p className="mt-5 text-center text-sm text-navy-500">
            Belum punya akun?{' '}
            <Link href={registerHref} className="font-semibold text-gold-600 transition-colors hover:text-gold-500">
              Daftar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

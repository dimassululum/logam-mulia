'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LoginForm from '@/features/auth/LoginForm'
import { createMockCurrentUser, MOCK_AUTH_COOKIES } from '@/core/lib/mock-auth'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async ({ email }: { email: string; password: string }) => {
    setIsLoading(true)

    const currentUser = createMockCurrentUser(email)

    if (currentUser) {
      document.cookie = `${MOCK_AUTH_COOKIES.role}=${currentUser.role}; path=/; max-age=28800; SameSite=Lax`
      document.cookie = `${MOCK_AUTH_COOKIES.name}=${encodeURIComponent(currentUser.name)}; path=/; max-age=28800; SameSite=Lax`
      document.cookie = `${MOCK_AUTH_COOKIES.email}=${encodeURIComponent(currentUser.email)}; path=/; max-age=28800; SameSite=Lax`

      router.push('/admin')
      router.refresh()
      return
    }

    document.cookie = `${MOCK_AUTH_COOKIES.role}=customer; path=/; max-age=28800; SameSite=Lax`
    document.cookie = `${MOCK_AUTH_COOKIES.name}=Customer%20Demo; path=/; max-age=28800; SameSite=Lax`
    document.cookie = `${MOCK_AUTH_COOKIES.email}=${encodeURIComponent(email)}; path=/; max-age=28800; SameSite=Lax`
    router.push('/')
    router.refresh()
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
          <p className="text-sm text-navy-600 mt-1">Masuk ke Web Admin Logam Mulia</p>
          <p className="mt-3 text-xs leading-5 text-navy-500">
            Mode demo aktif. Email yang mengandung kata <span className="font-semibold text-gold-600">admin</span> akan diarahkan ke panel admin.
          </p>
        </div>

        <div className="card-surface rounded-2xl p-8">
          <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}

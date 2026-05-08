'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LoginForm from '@/features/auth/LoginForm'
import { useAuthStore } from '@/core/store/auth.store'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading, error, clearError } = useAuthStore()
  const [localError, setLocalError] = useState<string | null>(null)

  const handleLogin = async ({ email, password }: { email: string; password: string }) => {
    setLocalError(null)
    clearError()

    try {
      await login(email, password)

      const user = useAuthStore.getState().user
      if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
        router.push('/admin')
      } else {
        router.push('/')
      }
      router.refresh()
    } catch {
      setLocalError(error ?? 'Login gagal. Periksa email dan password Anda.')
    }
  }

  const displayError = localError ?? error

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
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          </div>
          <h1 className="text-[24px] font-heading font-bold text-navy-900">Selamat Datang Kembali</h1>
          <p className="text-sm text-navy-600 mt-1">Masuk ke Portal Logam Mulia</p>
        </div>

        <div className="card-surface rounded-2xl p-8">
          {displayError && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {displayError}
            </div>
          )}
          <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
        </div>

        <p className="mt-6 text-center text-xs text-navy-500">
          Belum punya akun?{' '}
          <a href="/register" className="font-semibold text-gold-600 hover:text-gold-500">
            Daftar sekarang
          </a>
        </p>
      </div>
    </div>
  )
}

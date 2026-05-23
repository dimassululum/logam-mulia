'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ForgotPasswordForm from '@/features/auth/ForgotPasswordForm'
import ResetPasswordForm from '@/features/auth/ResetPasswordForm'
import { apiClient } from '@/core/lib/api-client'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordShell />}>
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleForgotPassword = async (payload: { email: string }) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await apiClient.post('/auth/forgot-password', payload)
      setSuccess(response.data?.message || 'Jika email terdaftar, link reset password akan dikirim ke email tersebut.')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengirim link reset password. Coba lagi sebentar.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (payload: { password: string }) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await apiClient.post('/auth/reset-password', { token, password: payload.password })
      setSuccess(response.data?.message || 'Password berhasil direset. Silakan login dengan password baru.')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset password gagal. Coba lagi sebentar.')
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
          <h1 className="text-[24px] font-heading font-bold text-navy-900">
            {token ? 'Buat Password Baru' : 'Reset Password'}
          </h1>
          <p className="mt-1 text-sm text-navy-600">
            {token ? 'Masukkan password baru untuk akun Anda' : 'Masukkan email akun untuk menerima link reset'}
          </p>
        </div>

        <div className="card-surface rounded-2xl p-8">
          {error && <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          {success && (
            <div className="mb-4 rounded-lg border border-green-100 bg-green-50 p-3 text-sm text-green-700">
              {success}{' '}
              <Link href="/login" className="font-semibold text-gold-600 hover:text-gold-500">
                Masuk sekarang
              </Link>
            </div>
          )}
          {token ? (
            <>
              <ResetPasswordForm onSubmit={handleResetPassword} isLoading={isLoading} />
              <p className="mt-5 text-center text-sm text-navy-500">
                Sudah ingat password?{' '}
                <Link href="/login" className="font-semibold text-gold-600 transition-colors hover:text-gold-500">
                  Masuk
                </Link>
              </p>
            </>
          ) : (
            <ForgotPasswordForm onSubmit={handleForgotPassword} isLoading={isLoading} />
          )}
        </div>
      </div>
    </div>
  )
}

function ResetPasswordShell() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-margin-mobile py-stack-lg">
      <div className="w-full max-w-md">
        <div className="card-surface rounded-2xl p-8 text-center text-sm text-navy-600">
          Memuat halaman reset password...
        </div>
      </div>
    </div>
  )
}

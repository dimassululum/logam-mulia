'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import Input from '@/shared/ui/Input'
import Button from '@/shared/ui/Button'
import PasswordVisibilityButton from './PasswordVisibilityButton'

const registerSchema = z.object({
  name:            z.string().min(2, 'Nama minimal 2 karakter'),
  email:           z.string().email('Format email tidak valid'),
  phone:           z.string().regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Format nomor HP tidak valid').optional().or(z.literal('')),
  password:        z.string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Password harus mengandung huruf kapital')
    .regex(/[0-9]/, 'Password harus mengandung angka'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path:    ['confirmPassword'],
})

type RegisterFormValues = z.infer<typeof registerSchema>

interface RegisterFormProps {
  onSubmit?: (data: Omit<RegisterFormValues, 'confirmPassword'>) => Promise<void>
  isLoading?: boolean
}

export default function RegisterForm({ onSubmit, isLoading }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  const handleRegister = async ({ confirmPassword: _, ...data }: RegisterFormValues) => {
    await onSubmit?.({ ...data, phone: data.phone || undefined })
  }

  return (
    <form onSubmit={handleSubmit(handleRegister)} noValidate className="space-y-4" id="register-form">
      <Input
        id="register-name"
        label="Nama Lengkap"
        type="text"
        placeholder="Masukkan nama lengkap"
        required
        error={errors.name?.message}
        leftIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        }
        {...register('name')}
      />

      <Input
        id="register-email"
        label="Email"
        type="email"
        placeholder="nama@email.com"
        required
        error={errors.email?.message}
        leftIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        }
        {...register('email')}
      />

      <Input
        id="register-phone"
        label="Nomor HP"
        type="tel"
        placeholder="081234567890"
        error={errors.phone?.message}
        leftIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.02 3.06a1 1 0 01-.27 1.04l-1.72 1.72a16 16 0 006.24 6.24l1.72-1.72a1 1 0 011.04-.27l3.06 1.02a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z" />
          </svg>
        }
        {...register('phone')}
      />

      <Input
        id="register-password"
        label="Password"
        type={showPassword ? 'text' : 'password'}
        placeholder="Min. 8 karakter, huruf besar, angka"
        required
        error={errors.password?.message}
        leftIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        }
        rightIcon={
          <PasswordVisibilityButton
            isVisible={showPassword}
            onToggle={() => setShowPassword((value) => !value)}
          />
        }
        {...register('password')}
      />

      <Input
        id="register-confirm-password"
        label="Konfirmasi Password"
        type={showConfirmPassword ? 'text' : 'password'}
        placeholder="Ulangi password"
        required
        error={errors.confirmPassword?.message}
        leftIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        }
        rightIcon={
          <PasswordVisibilityButton
            isVisible={showConfirmPassword}
            onToggle={() => setShowConfirmPassword((value) => !value)}
          />
        }
        {...register('confirmPassword')}
      />

      <p className="text-xs text-navy-400">
        Dengan mendaftar, Anda menyetujui{' '}
        <Link href="/terms" className="text-gold-600 hover:underline">Syarat & Ketentuan</Link>
        {' '}dan{' '}
        <Link href="/privacy" className="text-gold-600 hover:underline">Kebijakan Privasi</Link>
        {' '}kami.
      </p>

      <Button type="submit" fullWidth size="lg" isLoading={isLoading} id="register-submit-btn">
        Buat Akun
      </Button>

      <p className="text-center text-sm text-navy-500">
        Sudah punya akun?{' '}
        <Link href="/login" className="text-gold-600 font-semibold hover:text-gold-500 transition-colors">
          Masuk
        </Link>
      </p>
    </form>
  )
}

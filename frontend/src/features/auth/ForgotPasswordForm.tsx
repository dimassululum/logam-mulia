'use client'

import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Input from '@/shared/ui/Input'
import Button from '@/shared/ui/Button'

const forgotPasswordSchema = z.object({
  email: z.string().email('Format email tidak valid'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

interface ForgotPasswordFormProps {
  onSubmit?: (data: ForgotPasswordFormValues) => Promise<void>
  isLoading?: boolean
}

export default function ForgotPasswordForm({ onSubmit, isLoading }: ForgotPasswordFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const handleForgotPassword = async (data: ForgotPasswordFormValues) => {
    await onSubmit?.(data)
  }

  return (
    <form onSubmit={handleSubmit(handleForgotPassword)} noValidate className="space-y-5" id="forgot-password-form">
      <Input
        id="forgot-password-email"
        label="Email"
        type="email"
        placeholder="nama@email.com"
        required
        error={errors.email?.message}
        leftIcon={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        }
        {...register('email')}
      />

      <Button type="submit" fullWidth size="lg" isLoading={isLoading} id="forgot-password-submit-btn">
        Kirim Link Reset
      </Button>

      <p className="text-center text-sm text-navy-500">
        Sudah ingat password?{' '}
        <Link href="/login" className="font-semibold text-gold-600 transition-colors hover:text-gold-500">
          Masuk
        </Link>
      </p>
    </form>
  )
}

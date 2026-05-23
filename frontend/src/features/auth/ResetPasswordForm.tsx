'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Input from '@/shared/ui/Input'
import Button from '@/shared/ui/Button'
import PasswordVisibilityButton from './PasswordVisibilityButton'

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Password harus mengandung huruf kapital')
    .regex(/[0-9]/, 'Password harus mengandung angka'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
})

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

interface ResetPasswordFormProps {
  onSubmit?: (data: Omit<ResetPasswordFormValues, 'confirmPassword'>) => Promise<void>
  isLoading?: boolean
}

export default function ResetPasswordForm({ onSubmit, isLoading }: ResetPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const handleResetPassword = async ({ confirmPassword: _, ...data }: ResetPasswordFormValues) => {
    await onSubmit?.(data)
  }

  return (
    <form onSubmit={handleSubmit(handleResetPassword)} noValidate className="space-y-5" id="reset-password-form">
      <Input
        id="reset-password-new"
        label="Password Baru"
        type={showPassword ? 'text' : 'password'}
        placeholder="Min. 8 karakter, huruf besar, angka"
        required
        error={errors.password?.message}
        leftIcon={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        id="reset-password-confirm"
        label="Konfirmasi Password Baru"
        type={showConfirmPassword ? 'text' : 'password'}
        placeholder="Ulangi password baru"
        required
        error={errors.confirmPassword?.message}
        leftIcon={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      <Button type="submit" fullWidth size="lg" isLoading={isLoading} id="reset-password-submit-btn">
        Reset Password
      </Button>
    </form>
  )
}

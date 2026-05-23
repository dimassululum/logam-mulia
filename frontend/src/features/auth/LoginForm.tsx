'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Input from '@/shared/ui/Input'
import Button from '@/shared/ui/Button'
import PasswordVisibilityButton from './PasswordVisibilityButton'

const loginSchema = z.object({
  email:    z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

type LoginFormValues = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSubmit?: (data: LoginFormValues) => Promise<void>
  isLoading?: boolean
}

export default function LoginForm({ onSubmit, isLoading }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const handleLogin = async (data: LoginFormValues) => {
    await onSubmit?.(data)
  }

  return (
    <form onSubmit={handleSubmit(handleLogin)} noValidate className="space-y-5" id="login-form">
      <Input
        id="login-email"
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
        id="login-password"
        label="Password"
        type={showPassword ? 'text' : 'password'}
        placeholder="Minimal 6 karakter"
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

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" id="remember-me" className="w-4 h-4 accent-gold-500 rounded" />
          <span className="text-sm text-navy-600">Ingat saya</span>
        </label>
        <Link href="/reset-password" className="text-sm text-gold-600 hover:text-gold-500 transition-colors">
          Lupa password?
        </Link>
      </div>

      <Button type="submit" fullWidth size="lg" isLoading={isLoading} id="login-submit-btn">
        Masuk ke Akun
      </Button>
    </form>
  )
}

'use client'

import { Eye, EyeOff } from 'lucide-react'

interface PasswordVisibilityButtonProps {
  isVisible: boolean
  onToggle: () => void
}

export default function PasswordVisibilityButton({ isVisible, onToggle }: PasswordVisibilityButtonProps) {
  const Icon = isVisible ? EyeOff : Eye

  return (
    <button
      type="button"
      aria-label={isVisible ? 'Sembunyikan password' : 'Tampilkan password'}
      title={isVisible ? 'Sembunyikan password' : 'Tampilkan password'}
      onClick={onToggle}
      className="-m-2 flex h-8 w-8 items-center justify-center rounded-md text-navy-500 transition-colors hover:text-gold-600 focus:outline-none focus:ring-2 focus:ring-gold-400"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}

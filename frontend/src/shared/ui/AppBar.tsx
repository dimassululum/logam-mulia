'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/core/lib/utils'

interface AppBarProps {
  title: string
  /** Show back button (default: true) */
  showBack?: boolean
  /** Override back navigation — defaults to router.back() */
  onBack?: () => void
  /** Slot for right-side action(s) */
  rightSlot?: React.ReactNode
  className?: string
}

/**
 * Reusable dark AppBar for flow pages (checkout, payment, etc.).
 * Handles back navigation and title out of the box.
 */
export default function AppBar({
  title,
  showBack = true,
  onBack,
  rightSlot,
  className,
}: AppBarProps) {
  const router = useRouter()
  const handleBack = onBack ?? (() => router.back())

  return (
    <header
      className={cn(
        'flex items-center px-5 py-4 w-full sticky top-0 z-40',
        'bg-navy-900 border-b border-navy-800 shadow-elevation-low',
        className,
      )}
    >
      {/* Back button */}
      {showBack && (
        <button
          onClick={handleBack}
          className="p-1 text-gold-400 hover:text-gold-300 [transition-duration:var(--transition-fast)] transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}

      {/* Title — centered absolutely so it stays centred regardless of side slots */}
      <h1 className="absolute left-1/2 -translate-x-1/2 font-heading text-gold-400 font-bold text-lg tracking-tight pointer-events-none">
        {title}
      </h1>

      {/* Right slot */}
      <div className="ml-auto">{rightSlot}</div>
    </header>
  )
}

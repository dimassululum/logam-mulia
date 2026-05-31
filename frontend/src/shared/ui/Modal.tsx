'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/core/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export default function Modal({ isOpen, onClose, title, children, size = 'md', className }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        className={cn(
          'relative flex max-h-[calc(100svh-1.5rem)] w-full flex-col overflow-hidden bg-white rounded-2xl shadow-elevation-high sm:max-h-[calc(100svh-2rem)]',
          'animate-in',
          sizeMap[size],
          className,
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex flex-shrink-0 items-center justify-between border-b border-navy-100 px-4 py-3 sm:p-6">
            <h2 className="font-heading text-lg font-bold text-navy-900 sm:text-headline-sm">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-navy-400 hover:bg-navy-100 hover:text-navy-700 [transition-duration:var(--transition-fast)] transition-colors"
              aria-label="Tutup modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="min-h-0 overflow-y-auto p-4 sm:p-6">{children}</div>
      </div>
    </div>
  )
}

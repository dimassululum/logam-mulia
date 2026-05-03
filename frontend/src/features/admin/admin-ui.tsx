'use client'

import { Check, ChevronDown, ChevronUp, Eye, Filter, Pencil, Trash2, X } from 'lucide-react'
import { cn } from '@/core/lib/utils'
import { Button, Card } from '@/shared/ui'

export type SortDirection = 'asc' | 'desc'
export type ToastTone = 'success' | 'error'

interface SortableColumnHeaderProps {
  label: string
  active?: boolean
  direction?: SortDirection
  onClick: () => void
  title?: string
}

interface IconActionButtonProps {
  label: string
  tone: 'detail' | 'edit' | 'delete'
  onClick: () => void
}

interface InlineToastProps {
  toast: {
    message: string
    tone: ToastTone
  } | null
}

interface FilterToggleButtonProps {
  active?: boolean
  onClick: () => void
}

interface TableToolbarProps {
  left?: React.ReactNode
  children: React.ReactNode
}

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  onReset?: () => void
  onApply?: () => void
  title?: string
  children: React.ReactNode
}

export function SortableColumnHeader({
  label,
  active,
  direction = 'asc',
  onClick,
  title,
}: SortableColumnHeaderProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 text-left text-xs font-semibold uppercase tracking-[0.16em] transition-colors',
        active ? 'text-navy-900' : 'text-navy-500 hover:text-navy-700',
      )}
    >
      <span>{label}</span>
      {active ? (
        direction === 'asc' ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )
      ) : (
        <ChevronDown className="h-3.5 w-3.5 opacity-50" />
      )}
    </button>
  )
}

export function IconActionButton({ label, tone, onClick }: IconActionButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
        tone === 'detail' && 'border-navy-200 text-navy-700 hover:bg-navy-50',
        tone === 'edit' && 'border-blue-200 text-blue-600 hover:bg-blue-50',
        tone === 'delete' && 'border-red-200 text-red-600 hover:bg-red-50',
      )}
    >
      {tone === 'detail' ? <Eye className="h-4 w-4" /> : tone === 'edit' ? <Pencil className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
    </button>
  )
}

export function FilterToggleButton({ active, onClick }: FilterToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors',
        active
          ? 'border-gold-300 bg-white text-gold-700 hover:bg-gold-50'
          : 'border-navy-200 bg-white text-navy-700 hover:bg-navy-50',
      )}
    >
      <Filter className="h-4 w-4" />
      Filter
      {active ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
    </button>
  )
}

export function TableToolbar({ left, children }: TableToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-h-11 items-center">{left}</div>
      <div className="flex flex-wrap items-center justify-end gap-2">{children}</div>
    </div>
  )
}

export function FilterModal({
  isOpen,
  onClose,
  onReset,
  onApply,
  title = 'Filter',
  children,
}: FilterModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed right-4 top-28 z-40 w-[min(92vw,360px)] sm:right-6">
      <Card padding="md" className="border-navy-100 shadow-elevation-high">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-navy-900">{title}</p>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-navy-500 transition-colors hover:bg-navy-50"
              aria-label="Tutup filter"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {children}
          <div className="flex items-center justify-end gap-2">
            {onReset && (
              <Button variant="ghost" onClick={onReset}>
                Reset
              </Button>
            )}
            <Button onClick={onApply ?? onClose}>Terapkan</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export function InlineToast({ toast }: InlineToastProps) {
  if (!toast) return null

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl border px-4 py-3 text-sm',
        toast.tone === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-red-200 bg-red-50 text-red-700',
      )}
    >
      {toast.tone === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      <span>{toast.message}</span>
    </div>
  )
}

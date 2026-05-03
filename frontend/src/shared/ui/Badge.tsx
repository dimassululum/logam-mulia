import { cn } from '@/core/lib/utils'

type BadgeVariant =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'refund'
  | 'cancelled'
  | 'active'
  | 'inactive'
  | 'expired'
  | 'gold'
  | 'navy'
  | 'neutral'

const variantStyles: Record<BadgeVariant, string> = {
  pending:   'bg-yellow-50 text-yellow-700 border border-yellow-300',
  paid:      'bg-green-50 text-green-700 border border-green-300',
  processing:'bg-blue-50 text-blue-700 border border-blue-300',
  shipped:   'bg-blue-50 text-blue-700 border border-blue-300',
  delivered: 'bg-emerald-50 text-emerald-700 border border-emerald-300',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-300',
  refund:    'bg-red-50 text-red-700 border border-red-300',
  cancelled: 'bg-red-50 text-red-700 border border-red-300',
  active:    'bg-emerald-50 text-emerald-700 border border-emerald-300',
  inactive:  'bg-navy-100 text-navy-700 border border-navy-200',
  expired:   'bg-amber-50 text-amber-700 border border-amber-300',
  gold:      'bg-gold-100 text-gold-700 border border-gold-300',
  navy:      'bg-navy-100 text-navy-700 border border-navy-300',
  neutral:   'bg-navy-100 text-navy-700 border border-navy-200',
}

const variantLabels: Partial<Record<BadgeVariant, string>> = {
  pending:   'Menunggu Pembayaran',
  paid:      'Sudah Dibayar',
  processing:'Diproses',
  shipped:   'Dikirim',
  delivered: 'Diterima',
  completed: 'Selesai',
  refund:    'Refund',
  cancelled: 'Dibatalkan',
  active:    'Aktif',
  inactive:  'Nonaktif',
  expired:   'Kedaluwarsa',
}

interface BadgeProps {
  variant: BadgeVariant
  label?: string
  className?: string
}

export default function Badge({ variant, label, className }: BadgeProps) {
  const displayText = label ?? variantLabels[variant] ?? variant
  return (
    <span
      className={cn(
        'inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full tracking-wide',
        variantStyles[variant],
        className,
      )}
    >
      {displayText}
    </span>
  )
}

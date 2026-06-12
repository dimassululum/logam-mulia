import { cn } from '@/core/lib/utils'

type BadgeVariant =
  | 'unpaid'
  | 'pending'
  | 'paid'
  | 'success'
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
  unpaid:    'bg-slate-100 text-slate-700 border border-slate-300',
  pending:   'bg-yellow-50 text-yellow-700 border border-yellow-300',
  paid:      'bg-green-50 text-green-700 border border-green-300',
  success:   'bg-blue-50 text-blue-700 border border-blue-300',
  processing:'bg-sky-50 text-sky-700 border border-sky-300',
  shipped:   'bg-blue-50 text-blue-700 border border-blue-300',
  delivered: 'bg-blue-50 text-blue-700 border border-blue-300',
  completed: 'bg-blue-50 text-blue-700 border border-blue-300',
  refund:    'bg-rose-50 text-rose-700 border border-rose-300',
  cancelled: 'bg-red-50 text-red-700 border border-red-300',
  active:    'bg-emerald-50 text-emerald-700 border border-emerald-300',
  inactive:  'bg-navy-100 text-navy-700 border border-navy-200',
  expired:   'bg-amber-50 text-amber-700 border border-amber-300',
  gold:      'bg-gold-100 text-gold-700 border border-gold-300',
  navy:      'bg-navy-100 text-navy-700 border border-navy-300',
  neutral:   'bg-navy-100 text-navy-700 border border-navy-200',
}

const variantLabels: Partial<Record<BadgeVariant, string>> = {
  unpaid:    'Belum Bayar',
  pending:   'Menunggu Verifikasi',
  paid:      'Sudah Dibayar',
  success:   'Success',
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

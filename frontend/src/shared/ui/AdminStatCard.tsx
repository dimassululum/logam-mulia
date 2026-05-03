import type { LucideIcon } from 'lucide-react'
import Card from '@/shared/ui/Card'
import { cn } from '@/core/lib/utils'

interface AdminStatCardProps {
  label: string
  value: string
  description?: string
  icon: LucideIcon
  tone?: 'gold' | 'success' | 'warning' | 'info'
  className?: string
}

const toneStyles = {
  gold: 'bg-gold-100 text-gold-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  info: 'bg-blue-50 text-blue-700',
}

export default function AdminStatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = 'gold',
  className,
}: AdminStatCardProps) {
  return (
    <Card padding="sm" className={cn('border-navy-100/80 shadow-elevation-low', className)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-navy-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold leading-tight text-navy-900 sm:text-3xl">{value}</p>
          {description && <p className="mt-1 text-xs text-navy-500">{description}</p>}
        </div>

        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', toneStyles[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
}

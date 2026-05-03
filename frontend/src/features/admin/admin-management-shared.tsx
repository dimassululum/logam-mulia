import { Search } from 'lucide-react'
import { cn } from '@/core/lib/utils'
import { Card, Input } from '@/shared/ui'

interface Option {
  value: string
  label: string
}

interface ManagementSectionProps {
  title: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}

interface FilterInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  label?: string
  showLabel?: boolean
}

interface FilterSelectProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: Option[]
}

export const adminSelectClassName =
  'h-11 w-full rounded-xl border border-navy-200 bg-white px-4 pr-12 text-sm text-navy-700 shadow-sm outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30'

export function ManagementSection({
  title,
  description,
  actions,
  children,
  className,
}: ManagementSectionProps) {
  return (
    <Card padding="none" className={cn('overflow-hidden border-navy-100 shadow-elevation-low', className)}>
      <div className="flex flex-col gap-3 border-b border-navy-100 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
        <div>
          <h2 className="text-lg font-semibold text-navy-900">{title}</h2>
          {description && <p className="mt-1 text-sm text-navy-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="p-4 md:p-5">{children}</div>
    </Card>
  )
}

export function FilterInput({ value, onChange, placeholder, label = 'Cari data', showLabel = false }: FilterInputProps) {
  const inputId = label.toLowerCase().replace(/\s+/g, '-')

  return (
    <Input
      id={inputId}
      label={showLabel ? label : undefined}
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      leftIcon={<Search className="h-4 w-4" />}
    />
  )
}

export function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <label className="flex w-full flex-col gap-1.5 text-sm font-medium text-navy-700">
      {label && <span>{label}</span>}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={adminSelectClassName}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-navy-200 bg-navy-50/70 p-4 text-sm leading-6 text-navy-600">
      {children}
    </div>
  )
}

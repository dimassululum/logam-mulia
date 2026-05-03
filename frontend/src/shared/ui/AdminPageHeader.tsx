import { cn } from '@/core/lib/utils'

interface AdminPageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export default function AdminPageHeader({ title, description, actions, className }: AdminPageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold text-navy-900">{title}</h1>
        {description && (
          <p className="mt-1 text-sm leading-6 text-navy-500">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}

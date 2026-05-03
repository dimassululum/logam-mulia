import { cn } from '@/core/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hoverable?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingMap = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
}

export default function Card({ children, className, hoverable, padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-navy-100 rounded-2xl',
        paddingMap[padding],
        hoverable && 'transition-all [transition-duration:var(--transition-slow)] hover:-translate-y-1 hover:shadow-elevation-mid cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  )
}

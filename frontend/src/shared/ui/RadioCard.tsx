import { cn } from '@/core/lib/utils'

interface RadioCardProps {
  /** Whether this card is currently selected */
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
  /** Forwarded to the root div — useful for grid layout */
  id?: string
}

/**
 * A selectable card that acts like a radio button.
 * Gold border + light gold bg when selected; navy border otherwise.
 * Use inside a group where only one can be selected at a time.
 */
export default function RadioCard({
  selected,
  onClick,
  children,
  className,
  id,
}: RadioCardProps) {
  return (
    <div
      id={id}
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className={cn(
        'border-2 rounded-xl p-4 cursor-pointer flex flex-col relative overflow-hidden',
        '[transition-duration:var(--transition-fast)] transition-colors',
        selected
          ? 'border-gold-500 bg-gold-50/30'
          : 'border-navy-200 hover:border-gold-400 hover:bg-navy-50',
        className,
      )}
    >
      {children}
    </div>
  )
}

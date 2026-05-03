'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/core/lib/utils'

export interface AccordionItem {
  id: string | number
  label: string
  children: React.ReactNode
}

interface AccordionProps {
  items: AccordionItem[]
  /** Allow multiple open at once (default: false — only one open) */
  multiple?: boolean
  /** IDs that are open by default */
  defaultOpen?: Array<string | number>
  className?: string
}

/**
 * Accessible accordion. Single or multi-open mode.
 * Styling follows the Aureum Prestige design system.
 */
export default function Accordion({
  items,
  multiple = false,
  defaultOpen = [],
  className,
}: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string | number>>(
    new Set(defaultOpen),
  )

  const toggle = (id: string | number) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (!multiple) next.clear()
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {items.map((item) => {
        const isOpen = openIds.has(item.id)
        return (
          <div
            key={item.id}
            className="bg-white border border-navy-200 rounded-xl overflow-hidden shadow-elevation-low"
          >
            <button
              onClick={() => toggle(item.id)}
              className={cn(
                'w-full flex items-center justify-between p-4 text-left',
                'hover:bg-navy-50 [transition-duration:var(--transition-fast)] transition-colors',
                isOpen && 'bg-surface',
              )}
              aria-expanded={isOpen}
            >
              <span className="font-bold text-navy-900">{item.label}</span>
              {isOpen ? (
                <ChevronUp className="w-5 h-5 text-gold-500 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-navy-400 flex-shrink-0" />
              )}
            </button>

            {/* Content — CSS height transition */}
            <div
              className={cn(
                'overflow-hidden transition-all [transition-duration:var(--transition-slow)]',
                isOpen ? 'max-h-[500px]' : 'max-h-0',
              )}
            >
              <div className="p-4 text-navy-600 text-sm border-t border-navy-100 bg-white">
                {item.children}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import Button from '@/shared/ui/Button'

interface CopyButtonProps {
  value?: string | number | null
  label?: string
  copiedLabel?: string
  size?: 'sm' | 'md'
}

export default function CopyButton({ value, label = 'Salin', copiedLabel = 'Disalin', size = 'sm' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const text = value === null || value === undefined ? '' : String(value)

  async function handleCopy() {
    if (!text) return

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Button type="button" variant="secondary" size={size} disabled={!text} onClick={handleCopy}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? copiedLabel : label}
    </Button>
  )
}

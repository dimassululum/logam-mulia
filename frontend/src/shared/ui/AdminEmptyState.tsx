import Link from 'next/link'
import { Inbox } from 'lucide-react'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

interface AdminEmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
}

export default function AdminEmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: AdminEmptyStateProps) {
  return (
    <Card padding="lg" className="border-dashed border-navy-200 bg-white/80 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-50 text-navy-500">
          <Inbox className="h-6 w-6" />
        </div>
        <h3 className="mt-5 text-xl font-semibold text-navy-900">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-navy-600">{description}</p>
        {actionHref && actionLabel && (
          <Link href={actionHref} className="mt-5">
            <Button>{actionLabel}</Button>
          </Link>
        )}
      </div>
    </Card>
  )
}

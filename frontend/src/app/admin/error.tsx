'use client'

import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <Card padding="lg" className="border-error/20 bg-error-container/30 shadow-elevation-low">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-error">Dashboard Error</p>
        <h1 className="mt-3 text-headline-sm text-navy-900">Terjadi kesalahan saat memuat panel admin.</h1>
        <p className="mt-3 text-sm leading-6 text-navy-700">
          {error.message || 'Terjadi kesalahan. Silakan coba lagi atau hubungi kami.'}
        </p>
        <div className="mt-5">
          <Button onClick={reset}>Coba Lagi</Button>
        </div>
      </div>
    </Card>
  )
}

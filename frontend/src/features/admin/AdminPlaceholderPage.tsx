import Card from '@/shared/ui/Card'
import AdminPageHeader from '@/shared/ui/AdminPageHeader'
import Button from '@/shared/ui/Button'
import Link from 'next/link'
import { buildPlaceholderChecklist } from '@/features/admin/mock-data'

interface AdminPlaceholderPageProps {
  title: string
  description: string
  checklist: string[]
  primaryHref?: string
  primaryLabel?: string
}

export default function AdminPlaceholderPage({
  title,
  description,
  checklist,
  primaryHref,
  primaryLabel,
}: AdminPlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={title}
        description={description}
        actions={
          primaryHref && primaryLabel ? (
            <Link href={primaryHref}>
              <Button>{primaryLabel}</Button>
            </Link>
          ) : undefined
        }
      />

      <Card padding="lg" className="border-navy-100 shadow-elevation-low">
        <div className="max-w-3xl space-y-5">
          <div>
            <h2 className="text-headline-sm text-navy-900">Area ini sudah disiapkan</h2>
            <p className="mt-2 text-sm leading-6 text-navy-600">
              Shell admin, navigasi, dan struktur route sudah aktif. Tahap berikutnya tinggal mengisi modul domain dan koneksi data sesuai prioritas implementasi.
            </p>
          </div>
          {buildPlaceholderChecklist(checklist)}
        </div>
      </Card>
    </div>
  )
}

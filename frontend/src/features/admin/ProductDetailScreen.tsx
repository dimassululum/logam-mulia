import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Pencil } from 'lucide-react'
import { formatGram, formatRupiah } from '@/core/lib/utils'
import { adminProductRecords } from '@/features/admin/admin-management-data'
import { AdminPageHeader, Badge, Button, Card } from '@/shared/ui'

export default function ProductDetailScreen({ productId }: { productId: string }) {
  const product = adminProductRecords.find((item) => item.id === productId)

  if (!product) {
    notFound()
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title={product.name}
        actions={
          <>
            <Link href="/admin/products">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
            </Link>
            <Link href={`/admin/products/${product.id}/edit`}>
              <Button>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card padding="md">
          <div className={`flex aspect-square items-center justify-center rounded-2xl bg-gradient-to-br ${product.accent} text-3xl font-semibold text-navy-800`}>
            {product.weightGram}g
          </div>
        </Card>

        <Card padding="lg" className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-navy-500">{product.category}</p>
              <h2 className="mt-2 text-headline-sm text-navy-900">{product.name}</h2>
              <p className="mt-2 text-body-lg font-semibold text-navy-900">{formatRupiah(product.price)}</p>
            </div>
            <Badge variant={product.status} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-navy-50 p-4">
              <p className="text-xs text-navy-500">Gramasi</p>
              <p className="mt-2 font-semibold text-navy-900">{formatGram(product.weightGram)}</p>
            </div>
            <div className="rounded-2xl bg-navy-50 p-4">
              <p className="text-xs text-navy-500">Kadar</p>
              <p className="mt-2 font-semibold text-navy-900">{product.purity}</p>
            </div>
            <div className="rounded-2xl bg-navy-50 p-4">
              <p className="text-xs text-navy-500">Stok</p>
              <p className="mt-2 font-semibold text-navy-900">{product.stock}</p>
            </div>
            <div className="rounded-2xl bg-navy-50 p-4">
              <p className="text-xs text-navy-500">SKU</p>
              <p className="mt-2 font-semibold text-navy-900">{product.sku}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatGram, formatRupiah } from '@/core/lib/utils'
import { AdminPageHeader, Badge, Button, Card } from '@/shared/ui'
import { apiClient } from '@/core/lib/api-client'
import { resolvePublicAssetUrl } from '@/core/lib/public-url'

export default function ProductDetailScreen({ productId }: { productId: string }) {
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    apiClient.get(`/products/${productId}`)
      .then(res => setProduct(res.data.data))
      .catch(err => {
        console.error(err)
        setIsError(true)
      })
      .finally(() => setIsLoading(false))
  }, [productId])

  if (isLoading) {
    return <div className="p-8 text-center text-navy-500">Memuat detail produk...</div>
  }

  if (isError || !product) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">Produk tidak ditemukan atau terjadi kesalahan.</p>
        <Button onClick={() => router.push('/admin/products')}>Kembali ke Daftar</Button>
      </div>
    )
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
        <Card padding="md" className="overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <div className="flex w-full aspect-square items-center justify-center rounded-2xl bg-navy-50 overflow-hidden">
              <img src={resolvePublicAssetUrl(product.images[0].imageUrl)} alt={product.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className={`flex w-full aspect-square items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 text-3xl font-semibold text-navy-800`}>
              {product.weightGram}g
            </div>
          )}
        </Card>

        <Card padding="lg" className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-navy-500">{product.category?.name || 'Lainnya'}</p>
              <h2 className="mt-2 text-headline-sm text-navy-900">{product.name}</h2>
              <p className="mt-2 text-body-lg font-semibold text-navy-900">{formatRupiah(product.price)}</p>
            </div>
            <Badge variant={product.isActive ? 'active' : 'inactive'} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-navy-50 p-4">
              <p className="text-xs text-navy-500">Gramasi</p>
              <p className="mt-2 font-semibold text-navy-900">{formatGram(product.weightGram)}</p>
            </div>
            <div className="rounded-2xl bg-navy-50 p-4">
              <p className="text-xs text-navy-500">Kadar</p>
              <p className="mt-2 font-semibold text-navy-900">{product.kadar || '99.99%'}</p>
            </div>
            <div className="rounded-2xl bg-navy-50 p-4">
              <div className="flex justify-between items-center">
                <p className="text-xs text-navy-500">Stok</p>
                {product.stock === 0 ? (
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Kosong</span>
                ) : product.stock <= 5 ? (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Rendah</span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Aman</span>
                )}
              </div>
              <p className="mt-2 font-semibold text-navy-900">{product.stock}</p>
            </div>
            <div className="rounded-2xl bg-navy-50 p-4">
              <p className="text-xs text-navy-500">SKU / Slug</p>
              <p className="mt-2 font-semibold text-navy-900 truncate" title={product.slug}>{product.slug}</p>
            </div>
            <div className="rounded-2xl bg-navy-50 p-4">
              <p className="text-xs text-navy-500">Rating Tampilan</p>
              <p className="mt-2 font-semibold text-navy-900">{Number(product.displayRating ?? 5).toFixed(1)}</p>
            </div>
            <div className="rounded-2xl bg-navy-50 p-4">
              <p className="text-xs text-navy-500">Ulasan / Terjual</p>
              <p className="mt-2 font-semibold text-navy-900">{product.reviewCount ?? 0} ulasan · {product.soldCount ?? 0} terjual</p>
            </div>
          </div>

          {product.description && (
            <div className="rounded-2xl bg-navy-50 p-4">
              <p className="text-xs text-navy-500 mb-2">Deskripsi</p>
              <p className="text-sm text-navy-800 whitespace-pre-wrap">{product.description}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

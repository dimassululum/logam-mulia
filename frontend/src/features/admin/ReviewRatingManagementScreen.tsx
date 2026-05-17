'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Pencil, Search, Star } from 'lucide-react'
import { formatRupiah } from '@/core/lib/utils'
import { apiClient } from '@/core/lib/api-client'
import { resolvePublicAssetUrl } from '@/core/lib/public-url'
import { FilterInput, ManagementSection } from '@/features/admin/admin-management-shared'
import { InlineToast, type ToastTone } from '@/features/admin/admin-ui'
import type { AdminTableColumn, AdminTableRow } from '@/shared/ui/AdminTable'
import { AdminEmptyState, AdminPageHeader, AdminTable, Badge, Button } from '@/shared/ui'

interface ReviewProductRow {
  id: string
  name: string
  slug: string
  category: string
  price: number
  imageUrl: string
  displayRating: number
  reviewCount: number
  soldCount: number
  status: 'active' | 'inactive'
}

export default function ReviewRatingManagementScreen() {
  const [products, setProducts] = useState<ReviewProductRow[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  async function fetchProducts() {
    setIsLoading(true)
    try {
      const res = await apiClient.get('/products?limit=100')
      setProducts(res.data.data.map((product: any) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        category: product.category?.name || 'Lainnya',
        price: Number(product.price || 0),
        imageUrl: resolvePublicAssetUrl(product.images?.[0]?.imageUrl || ''),
        displayRating: Number(product.displayRating ?? 5),
        reviewCount: Number(product.reviewCount ?? 0),
        soldCount: Number(product.soldCount ?? 0),
        status: product.isActive ? 'active' : 'inactive',
      })))
    } catch (error) {
      console.error(error)
      setToast({ message: 'Gagal memuat data ulasan produk.', tone: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return products

    return products.filter((product) =>
      product.name.toLowerCase().includes(keyword) ||
      product.slug.toLowerCase().includes(keyword) ||
      product.category.toLowerCase().includes(keyword),
    )
  }, [products, search])

  const columns: AdminTableColumn[] = [
    { id: 'product', label: 'Produk', className: 'w-[46%]' },
    { id: 'rating', label: 'Rating', className: 'w-[16%]' },
    { id: 'sold', label: 'Jumlah Terjual', className: 'w-[18%]' },
    { id: 'actions', label: 'Aksi Edit', className: 'w-[20%]' },
  ]

  const rows: AdminTableRow[] = filteredProducts.map((product) => ({
    id: product.id,
    cells: [
      <div key={`${product.id}-product`} className="flex items-center gap-3">
        {product.imageUrl ? (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-navy-50">
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-xs font-semibold text-navy-500">
            LM
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-navy-900">{product.name}</p>
          <p className="mt-1 text-xs text-navy-500">{product.category} · {formatRupiah(product.price)}</p>
        </div>
      </div>,
      <div key={`${product.id}-rating`} className="flex items-center gap-2 font-semibold text-navy-900">
        <Star className="h-4 w-4 fill-gold-500 text-gold-500" />
        {product.displayRating.toFixed(1)}
      </div>,
      <span key={`${product.id}-sold`} className="font-semibold text-navy-900">{product.soldCount}</span>,
      <div key={`${product.id}-actions`} className="flex items-center gap-2">
        <Badge variant={product.status} />
        <Link
          href={`/admin/reviews-rating/${product.id}`}
          aria-label={`Edit ulasan ${product.name}`}
          title={`Edit ulasan ${product.name}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 text-blue-600 transition-colors hover:bg-blue-50"
        >
          <Pencil className="h-4 w-4" />
        </Link>
      </div>,
    ],
    mobileTitle: product.name,
    mobileSubtitle: `${product.category} · ${formatRupiah(product.price)}`,
    mobileAside: <Badge variant={product.status} />,
    mobileMeta: (
      <div className="flex items-center justify-between gap-4">
        <span>Rating {product.displayRating.toFixed(1)}</span>
        <span>{product.soldCount} terjual</span>
        <Link href={`/admin/reviews-rating/${product.id}`}>
          <Button size="sm" variant="ghost">Edit</Button>
        </Link>
      </div>
    ),
  }))

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Ulasan & Rating" description="Kelola rating, jumlah terjual, dan ulasan yang tampil di halaman produk." />
      <InlineToast toast={toast} />

      <ManagementSection
        title="Daftar Produk"
        actions={
          <div className="w-full min-w-[220px] lg:w-80">
            <FilterInput label="Cari produk" value={search} onChange={setSearch} placeholder="Cari produk atau kategori" />
          </div>
        }
      >
        {isLoading ? (
          <div className="rounded-2xl border border-navy-100 bg-white p-8 text-center text-sm text-navy-500">Memuat data produk...</div>
        ) : (
          <AdminTable
            columns={columns}
            rows={rows}
            emptyState={<AdminEmptyState title="Produk tidak ditemukan" description="Ubah kata kunci pencarian." />}
          />
        )}
      </ManagementSection>
    </div>
  )
}

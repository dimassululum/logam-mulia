'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, ImagePlus, Save } from 'lucide-react'
import {
  productCategoryOptions,
  type AdminProductRecord,
  type CatalogStatus,
} from '@/features/admin/admin-management-data'
import { productsApi } from '@/core/lib/api'
import { adminSelectClassName, ManagementSection } from '@/features/admin/admin-management-shared'
import { InlineToast, type ToastTone } from '@/features/admin/admin-ui'
import { AdminPageHeader, Button, Card, Input } from '@/shared/ui'

interface ProductFormScreenProps {
  productId?: string
}

interface ProductFormState {
  name: string
  category: string
  weightGram: string
  purity: string
  price: string
  stock: string
  status: CatalogStatus
  description: string
}

function buildInitialState(product?: AdminProductRecord): ProductFormState {
  return {
    name: product?.name ?? '',
    category: product?.category ?? productCategoryOptions[0],
    weightGram: product ? String(product.weightGram) : '',
    purity: product?.purity ?? '99.99%',
    price: product ? String(product.price) : '',
    stock: product ? String(product.stock) : '',
    status: product?.status ?? 'active',
    description: '',
  }
}

export default function ProductFormScreen({ productId }: ProductFormScreenProps) {
  const [product,   setProduct]   = useState<AdminProductRecord | undefined>(undefined)
  const [formState, setFormState] = useState<ProductFormState>(buildInitialState(undefined))

  useEffect(() => {
    if (!productId) return
    productsApi.getById(productId).then(({ data }) => {
      const p = data.product ?? data
      const mapped: AdminProductRecord = {
        id:         p.id,
        sku:        p.slug ?? p.id,
        name:       p.name,
        category:   p.category?.name ?? productCategoryOptions[0],
        weightGram: Number(p.weightGram) || 0,
        purity:     p.kadar ?? '99.99%',
        price:      Number(p.price),
        stock:      p.stock,
        status:     p.isActive ? 'active' : 'inactive',
        updatedAt:  p.updatedAt,
        accent:     '',
      }
      setProduct(mapped)
      setFormState(buildInitialState(mapped))
    }).catch(() => {})
  }, [productId])
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  function showToast(message: string, tone: ToastTone) {
    setToast({ message, tone })
  }

  function sanitize(value: string) {
    return value.replace(/[^\d]/g, '')
  }

  function saveProduct() {
    if (!formState.name.trim() || !formState.price || !formState.weightGram || !formState.stock) {
      showToast('Nama, harga, gramasi, dan stok wajib diisi.', 'error')
      return
    }

    showToast(product ? 'Perubahan produk disimpan.' : 'Produk baru disimpan.', 'success')
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title={product ? 'Edit Produk' : 'Tambah Produk'}
        actions={
          <Link href="/admin/products">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </Link>
        }
      />

      <InlineToast toast={toast} />

      <ManagementSection
        title={product ? product.name : 'Form Produk'}
        actions={
          <Button onClick={saveProduct}>
            <Save className="h-4 w-4" />
            Simpan
          </Button>
        }
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                id="product-name"
                label="Nama produk"
                value={formState.name}
                onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
              />
              <label className="flex flex-col gap-1.5 text-sm font-medium text-navy-700">
                Kategori
                <select
                  value={formState.category}
                  onChange={(event) => setFormState((current) => ({ ...current, category: event.target.value }))}
                  className={adminSelectClassName}
                >
                  {productCategoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                id="product-weight"
                label="Gramasi"
                value={formState.weightGram}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, weightGram: sanitize(event.target.value) }))
                }
              />
              <Input
                id="product-purity"
                label="Kadar"
                value={formState.purity}
                onChange={(event) => setFormState((current) => ({ ...current, purity: event.target.value }))}
              />
              <Input
                id="product-price"
                label="Harga"
                value={formState.price}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, price: sanitize(event.target.value) }))
                }
              />
              <Input
                id="product-stock"
                label="Stok"
                value={formState.stock}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, stock: sanitize(event.target.value) }))
                }
              />
              <label className="flex flex-col gap-1.5 text-sm font-medium text-navy-700 md:col-span-2">
                Status
                <select
                  value={formState.status}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, status: event.target.value as CatalogStatus }))
                  }
                  className={adminSelectClassName}
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-navy-700">
              Deskripsi
              <textarea
                value={formState.description}
                onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
                rows={6}
                className="w-full rounded-2xl border border-navy-200 bg-white px-4 py-3 text-sm text-navy-700 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
              />
            </label>
          </div>

          <Card padding="md" className="border-dashed border-navy-200">
            <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl bg-navy-50 text-center">
              <ImagePlus className="h-6 w-6 text-navy-400" />
              <p className="mt-3 text-sm font-medium text-navy-700">Thumbnail / foto utama</p>
              <p className="mt-1 text-xs text-navy-500">Area upload bisa disambungkan nanti.</p>
            </div>
          </Card>
        </div>
      </ManagementSection>
    </div>
  )
}

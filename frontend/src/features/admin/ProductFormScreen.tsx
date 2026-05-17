'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, ImagePlus, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { adminSelectClassName, ManagementSection } from '@/features/admin/admin-management-shared'
import { InlineToast, type ToastTone } from '@/features/admin/admin-ui'
import { AdminPageHeader, Button, Card, Input } from '@/shared/ui'
import { apiClient } from '@/core/lib/api-client'

interface ProductFormScreenProps {
  productId?: string
}

interface ProductFormState {
  name: string
  categoryId: string
  weightGram: string
  purity: string
  price: string
  stock: string
  displayRating: string
  reviewCount: string
  soldCount: string
  status: 'active' | 'inactive'
  description: string
}

const EMPTY_STATE: ProductFormState = {
  name: '',
  categoryId: '',
  weightGram: '',
  purity: '99.99%',
  price: '',
  stock: '',
  displayRating: '5.0',
  reviewCount: '0',
  soldCount: '0',
  status: 'active',
  description: '',
}

export default function ProductFormScreen({ productId }: ProductFormScreenProps) {
  const router = useRouter()
  const [formState, setFormState] = useState<ProductFormState>(EMPTY_STATE)
  const [categories, setCategories] = useState<any[]>([])
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)

  useEffect(() => {
    // Fetch categories for dropdown
    apiClient.get('/categories')
      .then(res => setCategories(res.data.data))
      .catch(err => console.error(err))

    if (productId) {
      // Fetch product data
      apiClient.get(`/products/${productId}`)
        .then(res => {
          const p = res.data.data
          setFormState({
            name: p.name,
            categoryId: p.categoryId,
            weightGram: String(p.weightGram),
            purity: p.kadar || '99.99%',
            price: String(p.price),
            stock: String(p.stock),
            displayRating: String(p.displayRating ?? '5.0'),
            reviewCount: String(p.reviewCount ?? '0'),
            soldCount: String(p.soldCount ?? '0'),
            status: p.isActive ? 'active' : 'inactive',
            description: p.description || '',
          })
          if (p.images && p.images.length > 0) {
            setImageUrl(p.images[0].imageUrl)
          }
        })
        .catch(err => {
          console.error(err)
          showToast('Gagal memuat produk', 'error')
        })
    }
  }, [productId])

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

  function sanitizeRating(value: string) {
    const normalized = value.replace(',', '.').replace(/[^\d.]/g, '')
    const [whole, decimal = ''] = normalized.split('.')
    return decimal ? `${whole}.${decimal.slice(0, 1)}` : whole
  }

  function handleFileSelect(file: File) {
    setPendingImageFile(file)
    setImageUrl(URL.createObjectURL(file))
  }

  async function uploadImageForProduct(pid: string, file: File) {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('isPrimary', 'true')
    await apiClient.post(`/products/${pid}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }

  async function saveProduct() {
    if (!formState.name.trim() || !formState.price || !formState.weightGram || !formState.stock || !formState.categoryId) {
      showToast('Nama, kategori, harga, gramasi, dan stok wajib diisi.', 'error')
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        name: formState.name.trim(),
        slug: formState.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        categoryId: formState.categoryId,
        description: formState.description.trim(),
        price: parseFloat(formState.price),
        weightGram: parseFloat(formState.weightGram),
        kadar: formState.purity,
        stock: parseInt(formState.stock, 10),
        displayRating: Math.min(5, Math.max(0, Number(formState.displayRating || 0))),
        reviewCount: parseInt(formState.reviewCount || '0', 10),
        soldCount: parseInt(formState.soldCount || '0', 10),
        isActive: productId ? formState.status === 'active' : true
      }

      if (productId) {
        await apiClient.put(`/products/${productId}`, payload)
        // Upload pending image if any
        if (pendingImageFile) {
          await uploadImageForProduct(productId, pendingImageFile)
          setPendingImageFile(null)
        }
        showToast('Perubahan produk disimpan.', 'success')
      } else {
        const res = await apiClient.post('/products', payload)
        const newProductId = res.data.data.id
        // Upload pending image for newly created product
        if (pendingImageFile) {
          await uploadImageForProduct(newProductId, pendingImageFile)
          setPendingImageFile(null)
        }
        showToast('Produk baru disimpan.', 'success')
        setTimeout(() => router.push('/admin/products'), 1000)
      }
    } catch (err: any) {
      console.error(err)
      showToast(err.response?.data?.message || 'Gagal menyimpan produk', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title={productId ? 'Edit Produk' : 'Tambah Produk'}
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
        title={productId ? formState.name : 'Form Produk'}
        actions={
          <Button onClick={saveProduct} isLoading={isLoading}>
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
                  value={formState.categoryId}
                  onChange={(event) => setFormState((current) => ({ ...current, categoryId: event.target.value }))}
                  className={adminSelectClassName}
                >
                  <option value="" disabled>Pilih Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                id="product-weight"
                label="Gramasi (g)"
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
              <Input
                id="product-rating"
                label="Rating tampilan"
                value={formState.displayRating}
                inputMode="decimal"
                hint="Angka 0-5, contoh 5.0"
                onChange={(event) =>
                  setFormState((current) => ({ ...current, displayRating: sanitizeRating(event.target.value) }))
                }
              />
              <Input
                id="product-review-count"
                label="Jumlah ulasan"
                value={formState.reviewCount}
                inputMode="numeric"
                onChange={(event) =>
                  setFormState((current) => ({ ...current, reviewCount: sanitize(event.target.value) }))
                }
              />
              <Input
                id="product-sold-count"
                label="Jumlah terjual"
                value={formState.soldCount}
                inputMode="numeric"
                onChange={(event) =>
                  setFormState((current) => ({ ...current, soldCount: sanitize(event.target.value) }))
                }
              />
              {productId && (
                <label className="flex flex-col gap-1.5 text-sm font-medium text-navy-700 md:col-span-2">
                  Status
                  <select
                    value={formState.status}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, status: event.target.value as 'active' | 'inactive' }))
                    }
                    className={adminSelectClassName}
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </label>
              )}
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

          <Card padding="md" className="border-dashed border-navy-200 flex flex-col justify-center overflow-hidden relative">
            {imageUrl ? (
              <div className="relative w-full h-full min-h-52 rounded-2xl overflow-hidden group">
                <img src={imageUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileSelect(file)
                      }}
                    />
                    <Button type="button" variant="ghost" className="text-white border-white hover:bg-white/20">Ganti Foto</Button>
                  </label>
                </div>
                {pendingImageFile && (
                  <div className="absolute bottom-2 left-2 right-2 bg-amber-500/90 text-white text-xs font-medium px-3 py-1.5 rounded-xl text-center">
                    ⏳ Foto akan diupload saat kamu klik Simpan
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center">
                <label className="cursor-pointer group flex min-h-52 w-full flex-col items-center justify-center rounded-2xl bg-navy-50 text-center transition hover:bg-navy-100">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileSelect(file)
                    }}
                  />
                  <ImagePlus className="h-6 w-6 text-navy-400 group-hover:text-gold-500 transition-colors" />
                  <p className="mt-3 text-sm font-medium text-navy-700 group-hover:text-gold-600 transition-colors">Upload Thumbnail / Foto Utama</p>
                  <p className="mt-1 text-xs text-navy-500">Maks. 5MB (JPG, PNG, WebP)</p>
                  {pendingImageFile && <p className="mt-2 text-xs text-amber-600 font-medium">✓ Foto siap, akan diupload saat Simpan</p>}
                </label>
              </div>
            )}
          </Card>
        </div>
      </ManagementSection>
    </div>
  )
}

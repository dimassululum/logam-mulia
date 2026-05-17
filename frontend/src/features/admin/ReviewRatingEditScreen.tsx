'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ImagePlus, Pencil, Plus, Save, Trash2 } from 'lucide-react'
import { formatRupiah } from '@/core/lib/utils'
import { apiClient } from '@/core/lib/api-client'
import { InlineToast, type ToastTone } from '@/features/admin/admin-ui'
import type { AdminTableColumn, AdminTableRow } from '@/shared/ui/AdminTable'
import { AdminEmptyState, AdminPageHeader, AdminTable, Button, Card, Input, Modal } from '@/shared/ui'

interface ProductDisplayReview {
  id: string
  reviewerName: string
  imageUrl: string
  description: string
}

interface ProductDetail {
  id: string
  name: string
  price: number
  imageUrl: string
  displayRating: number
  soldCount: number
  displayReviews: ProductDisplayReview[]
}

interface ReviewFormState {
  reviewerName: string
  imageUrl: string
  description: string
}

const EMPTY_REVIEW_FORM: ReviewFormState = {
  reviewerName: '',
  imageUrl: '',
  description: '',
}

function sanitizeNumberInput(value: string) {
  return value.replace(/[^\d]/g, '')
}

function sanitizeRating(value: string) {
  const normalized = value.replace(',', '.').replace(/[^\d.]/g, '')
  const [whole, decimal = ''] = normalized.split('.')
  return decimal ? `${whole}.${decimal.slice(0, 1)}` : whole
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ReviewRatingEditScreen({ productId }: { productId: string }) {
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [rating, setRating] = useState('5.0')
  const [soldCount, setSoldCount] = useState('0')
  const [reviewForm, setReviewForm] = useState<ReviewFormState>(EMPTY_REVIEW_FORM)
  const [editingReview, setEditingReview] = useState<ProductDisplayReview | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProductDisplayReview | null>(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [isSavingProduct, setIsSavingProduct] = useState(false)
  const [isSavingReview, setIsSavingReview] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  useEffect(() => {
    fetchProduct()
  }, [productId])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  async function fetchProduct() {
    setIsLoading(true)
    try {
      const res = await apiClient.get(`/products/${productId}`)
      const data = res.data.data
      const nextProduct = {
        id: data.id,
        name: data.name,
        price: Number(data.price || 0),
        imageUrl: data.images?.[0]?.imageUrl || '',
        displayRating: Number(data.displayRating ?? 5),
        soldCount: Number(data.soldCount ?? 0),
        displayReviews: (data.displayReviews || []).map((review: any) => ({
          id: review.id,
          reviewerName: review.reviewerName,
          imageUrl: review.imageUrl || '',
          description: review.description || '',
        })),
      }

      setProduct(nextProduct)
      setRating(nextProduct.displayRating.toFixed(1))
      setSoldCount(String(nextProduct.soldCount))
    } catch (error) {
      console.error(error)
      setToast({ message: 'Gagal memuat produk.', tone: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  function openCreateReviewModal() {
    setEditingReview(null)
    setReviewForm(EMPTY_REVIEW_FORM)
    setIsReviewModalOpen(true)
  }

  function openEditReviewModal(review: ProductDisplayReview) {
    setEditingReview(review)
    setReviewForm({
      reviewerName: review.reviewerName,
      imageUrl: review.imageUrl || '',
      description: review.description,
    })
    setIsReviewModalOpen(true)
  }

  async function handleReviewFileSelect(file: File) {
    setReviewForm((current) => ({ ...current, imageUrl: URL.createObjectURL(file) }))
    const dataUrl = await fileToDataUrl(file)
    setReviewForm((current) => ({ ...current, imageUrl: dataUrl }))
  }

  async function saveProductStats() {
    if (!product) return

    setIsSavingProduct(true)
    try {
      await apiClient.put(`/products/${product.id}`, {
        displayRating: Math.min(5, Math.max(0, Number(rating || 0))),
        soldCount: Number(soldCount || 0),
        reviewCount: product.displayReviews.length,
      })
      setToast({ message: 'Rating dan jumlah terjual disimpan.', tone: 'success' })
      fetchProduct()
    } catch (error) {
      console.error(error)
      setToast({ message: 'Gagal menyimpan rating produk.', tone: 'error' })
    } finally {
      setIsSavingProduct(false)
    }
  }

  async function saveReview() {
    if (!product) return
    if (!reviewForm.reviewerName.trim() || !reviewForm.description.trim()) {
      setToast({ message: 'Nama dan deskripsi ulasan wajib diisi.', tone: 'error' })
      return
    }

    setIsSavingReview(true)
    try {
      const payload = {
        reviewerName: reviewForm.reviewerName.trim(),
        imageUrl: reviewForm.imageUrl.trim(),
        description: reviewForm.description.trim(),
      }

      if (editingReview) {
        await apiClient.put(`/products/${product.id}/display-reviews/${editingReview.id}`, payload)
      } else {
        await apiClient.post(`/products/${product.id}/display-reviews`, payload)
      }

      setIsReviewModalOpen(false)
      setToast({ message: editingReview ? 'Ulasan diperbarui.' : 'Ulasan ditambahkan.', tone: 'success' })
      fetchProduct()
    } catch (error) {
      console.error(error)
      setToast({ message: 'Gagal menyimpan ulasan.', tone: 'error' })
    } finally {
      setIsSavingReview(false)
    }
  }

  async function deleteReview() {
    if (!product || !deleteTarget) return

    try {
      await apiClient.delete(`/products/${product.id}/display-reviews/${deleteTarget.id}`)
      setDeleteTarget(null)
      setToast({ message: 'Ulasan dihapus.', tone: 'success' })
      fetchProduct()
    } catch (error) {
      console.error(error)
      setToast({ message: 'Gagal menghapus ulasan.', tone: 'error' })
    }
  }

  const columns: AdminTableColumn[] = [
    { id: 'name', label: 'Nama', className: 'w-[22%]' },
    { id: 'image', label: 'Gambar', className: 'w-[18%]' },
    { id: 'description', label: 'Deskripsi', className: 'w-[42%]' },
    { id: 'actions', label: 'Aksi', className: 'w-[18%]' },
  ]

  const rows: AdminTableRow[] = useMemo(() => {
    if (!product) return []

    return product.displayReviews.map((review) => ({
      id: review.id,
      cells: [
        <span key={`${review.id}-name`} className="font-semibold text-navy-900">{review.reviewerName}</span>,
        review.imageUrl ? (
          <div key={`${review.id}-image`} className="h-14 w-14 overflow-hidden rounded-xl border border-navy-100 bg-navy-50">
            <img src={review.imageUrl} alt={`Ulasan ${review.reviewerName}`} className="h-full w-full object-cover" />
          </div>
        ) : (
          <span key={`${review.id}-image`} className="text-xs text-navy-400">Tanpa gambar</span>
        ),
        <p key={`${review.id}-description`} className="line-clamp-2 text-sm text-navy-700">{review.description}</p>,
        <div key={`${review.id}-actions`} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openEditReviewModal(review)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 text-blue-600 transition-colors hover:bg-blue-50"
            aria-label={`Edit ulasan ${review.reviewerName}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(review)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition-colors hover:bg-red-50"
            aria-label={`Hapus ulasan ${review.reviewerName}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>,
      ],
      mobileTitle: review.reviewerName,
      mobileSubtitle: review.description,
      mobileMeta: (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => openEditReviewModal(review)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => setDeleteTarget(review)}>Hapus</Button>
        </div>
      ),
    }))
  }, [product])

  if (isLoading) {
    return <div className="p-8 text-center text-navy-500">Memuat data ulasan...</div>
  }

  if (!product) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-red-500">Produk tidak ditemukan.</p>
        <Link href="/admin/reviews-rating"><Button>Kembali</Button></Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Edit Ulasan & Rating"
        actions={
          <Link href="/admin/reviews-rating">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </Link>
        }
      />
      <InlineToast toast={toast} />

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card padding="md">
          <div className="aspect-square overflow-hidden rounded-2xl bg-navy-50">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-navy-500">Tidak ada thumbnail</div>
            )}
          </div>
        </Card>

        <Card padding="lg" className="space-y-5">
          <div>
            <p className="text-sm text-navy-500">Nama produk</p>
            <h2 className="mt-2 text-headline-sm text-navy-900">{product.name}</h2>
            <p className="mt-2 font-semibold text-gold-600">{formatRupiah(product.price)}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              id="rating"
              label="Rating"
              value={rating}
              inputMode="decimal"
              hint="Angka 0-5"
              onChange={(event) => setRating(sanitizeRating(event.target.value))}
            />
            <Input
              id="sold-count"
              label="Jumlah terjual"
              value={soldCount}
              inputMode="numeric"
              onChange={(event) => setSoldCount(sanitizeNumberInput(event.target.value))}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={saveProductStats} isLoading={isSavingProduct}>
              <Save className="h-4 w-4" />
              Simpan Rating
            </Button>
          </div>
        </Card>
      </div>

      <Card padding="lg" className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-navy-900">Tabel Ulasan</h3>
            <p className="mt-1 text-sm text-navy-500">{product.displayReviews.length} ulasan tampil di detail produk.</p>
          </div>
          <Button onClick={openCreateReviewModal}>
            <Plus className="h-4 w-4" />
            Tambah Ulasan
          </Button>
        </div>

        <AdminTable
          columns={columns}
          rows={rows}
          emptyState={<AdminEmptyState title="Belum ada ulasan" description="Tambahkan ulasan untuk produk ini." />}
        />
      </Card>

      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={editingReview ? 'Edit Ulasan' : 'Tambah Ulasan'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            id="reviewer-name"
            label="Nama"
            value={reviewForm.reviewerName}
            onChange={(event) => setReviewForm((current) => ({ ...current, reviewerName: event.target.value }))}
          />

          <div className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)]">
            <div className="aspect-square overflow-hidden rounded-2xl border border-navy-100 bg-navy-50">
              {reviewForm.imageUrl ? (
                <img src={reviewForm.imageUrl} alt="Preview ulasan" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-navy-400">Preview</div>
              )}
            </div>
            <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-navy-200 bg-navy-50 px-4 py-6 text-center transition-colors hover:border-gold-300 hover:bg-gold-50/40">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) handleReviewFileSelect(file)
                }}
              />
              <ImagePlus className="h-5 w-5 text-navy-400" />
              <span className="mt-2 text-sm font-semibold text-navy-700">Upload Gambar</span>
              <span className="mt-1 text-xs text-navy-500">Opsional, JPG/PNG/WebP</span>
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-navy-700">
            Deskripsi
            <textarea
              value={reviewForm.description}
              onChange={(event) => setReviewForm((current) => ({ ...current, description: event.target.value }))}
              rows={5}
              className="w-full rounded-2xl border border-navy-200 bg-white px-4 py-3 text-sm text-navy-700 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
            />
          </label>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setIsReviewModalOpen(false)}>Batal</Button>
            <Button onClick={saveReview} isLoading={isSavingReview}>Simpan</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Hapus Ulasan" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-navy-600">Ulasan dari {deleteTarget?.reviewerName ?? ''} akan dihapus.</p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="danger" onClick={deleteReview}>Hapus</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

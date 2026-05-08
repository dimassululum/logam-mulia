'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, Pencil, Plus, Save, TicketPercent } from 'lucide-react'
import { cn, formatRupiah } from '@/core/lib/utils'
import {
  formatDateRange,
  type AdminProductRecord,
  type AdminVoucherRecord,
  type DiscountType,
  type VoucherStatus,
} from '@/features/admin/admin-management-data'
import { vouchersApi, productsApi } from '@/core/lib/api'
import { SelectField } from '@/features/admin/company-profile-shared'
import { InlineToast, type ToastTone } from '@/features/admin/admin-ui'
import { AdminPageHeader, Badge, Button, Card, Input, Modal } from '@/shared/ui'

type VoucherScreenMode = 'create' | 'detail' | 'edit'
type FormDiscountType = DiscountType | ''

interface VoucherFormScreenProps {
  mode: VoucherScreenMode
  voucherId?: string
}

interface VoucherFormState {
  code: string
  title: string
  discountType: FormDiscountType
  amount: string
  usageLimit: string
  startDate: string
  endDate: string
  selectedProductIds: string[]
  status: VoucherStatus
}

function generateVoucherCode() {
  return `GOLD${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function formatDiscountValue(type: DiscountType, amount: number) {
  return type === 'percentage' ? `${amount}%` : formatRupiah(amount)
}

function buildInitialState(voucher?: AdminVoucherRecord): VoucherFormState {
  return {
    code: voucher?.code ?? generateVoucherCode(),
    title: voucher?.title ?? '',
    discountType: voucher?.discountType ?? '',
    amount: voucher ? String(voucher.amount) : '',
    usageLimit: voucher ? String(voucher.usageLimit) : '',
    startDate: voucher?.startDate.slice(0, 10) ?? '',
    endDate: voucher?.endDate.slice(0, 10) ?? '',
    selectedProductIds: voucher?.productIds ?? [],
    status: voucher?.status ?? 'inactive',
  }
}

function MetaRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-3">
      <p className="text-sm text-navy-500">{label}</p>
      <div className="text-sm text-navy-800">{value}</div>
    </div>
  )
}

function SectionCard({
  title,
  actions,
  children,
}: {
  title: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card padding="md" className="border-navy-100 shadow-elevation-low">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-navy-900">{title}</h2>
        {actions}
      </div>
      {children}
    </Card>
  )
}

export default function VoucherFormScreen({ mode, voucherId }: VoucherFormScreenProps) {
  const [formState,    setFormState]    = useState<VoucherFormState>(buildInitialState(undefined))
  const [allProducts,  setAllProducts]  = useState<AdminProductRecord[]>([])

  useEffect(() => {
    // Load available products for the product picker
    productsApi.list({ limit: 200 }).then(({ data }) => {
      const raw = data.products ?? data.data ?? []
      setAllProducts(raw.map((p: any) => ({
        id: p.id, sku: p.slug ?? p.id, name: p.name,
        category: p.category?.name ?? '-', weightGram: Number(p.weightGram) || 0,
        purity: p.kadar ?? '-', price: Number(p.price), stock: p.stock,
        status: p.isActive ? 'active' : 'inactive', updatedAt: p.updatedAt, accent: '',
      })))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!voucherId) return
    vouchersApi.list({ limit: 1 }).then(({ data }) => {
      const raw = data.vouchers ?? data.data ?? []
      const v = raw.find((x: any) => x.id === voucherId)
      if (!v) return
      const mapped: AdminVoucherRecord = {
        id: v.id, code: v.code, title: v.code,
        discountType: v.discountType?.toLowerCase() === 'percentage' ? 'percentage' : 'fixed',
        amount: Number(v.discountValue), minPurchase: Number(v.minPurchase ?? 0),
        maxDiscount: v.maxDiscount ? Number(v.maxDiscount) : null,
        usageLimit: v.usageLimit ?? 0, usageCount: v.usageCount ?? 0,
        perCustomerLimit: v.perUserLimit ?? 1, applyTo: 'all',
        startDate: v.startsAt ?? v.createdAt, endDate: v.expiresAt ?? '',
        status: v.isActive ? 'active' : 'inactive',
      }
      setFormState(buildInitialState(mapped))
    }).catch(() => {})
  }, [voucherId])
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const isReadOnly = mode === 'detail'
  const canEditExisting = true

  const selectedProducts = useMemo(
    () => allProducts.filter((product) => formState.selectedProductIds.includes(product.id)),
    [allProducts, formState.selectedProductIds],
  )

  function showToast(message: string, tone: ToastTone) {
    setToast({ message, tone })
  }

  function updateField<Key extends keyof VoucherFormState>(key: Key, value: VoucherFormState[Key]) {
    setFormState((current) => ({ ...current, [key]: value }))
  }

  function toggleProductSelection(productId: string) {
    setFormState((current) => ({
      ...current,
      selectedProductIds: current.selectedProductIds.includes(productId)
        ? current.selectedProductIds.filter((id) => id !== productId)
        : [...current.selectedProductIds, productId],
    }))
  }

  function saveVoucher() {
    if (!formState.code.trim() || !formState.title.trim()) {
      showToast('Kode dan judul wajib diisi.', 'error')
      return
    }
    if (!formState.discountType) {
      showToast('Tipe diskon wajib dipilih.', 'error')
      return
    }
    if (!formState.amount.trim()) {
      showToast('Nilai diskon wajib diisi.', 'error')
      return
    }
    if (!formState.usageLimit.trim()) {
      showToast('Kuota wajib diisi.', 'error')
      return
    }
    if (!formState.startDate || !formState.endDate) {
      showToast('Tanggal mulai dan selesai wajib diisi.', 'error')
      return
    }
    if (!formState.selectedProductIds.length) {
      showToast('Pilih minimal satu produk.', 'error')
      return
    }

    showToast(mode === 'create' ? 'Voucher baru berhasil disimpan.' : 'Voucher berhasil diperbarui.', 'success')
  }

  function toggleStatus() {
    if (formState.status === 'expired') {
      showToast('Voucher kedaluwarsa tidak bisa diaktifkan kembali dari halaman ini.', 'error')
      return
    }
    updateField('status', formState.status === 'active' ? 'inactive' : 'active')
    showToast(`Status voucher diubah menjadi ${formState.status === 'active' ? 'nonaktif' : 'aktif'}.`, 'success')
  }

  const title =
    mode === 'create'
      ? 'Tambah Voucher'
      : mode === 'edit'
        ? 'Edit Voucher'
        : 'Detail Voucher'

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title={title}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/vouchers">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
            </Link>
            {mode === 'detail' && voucherId && canEditExisting ? (
              <Link href={`/admin/vouchers/${voucherId}/edit`}>
                <Button variant="ghost">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
            ) : null}
            {!isReadOnly ? (
              <Button onClick={saveVoucher}>
                <Save className="h-4 w-4" />
                Simpan
              </Button>
            ) : null}
          </div>
        }
      />

      <InlineToast toast={toast} />

      <SectionCard
        title="Informasi Voucher"
        actions={
          mode === 'detail' ? (
            <Button variant={formState.status === 'active' ? 'danger' : 'primary'} size="sm" onClick={toggleStatus}>
              {formState.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
            </Button>
          ) : undefined
        }
      >
        {isReadOnly ? (
          <div className="space-y-3">
            <MetaRow label="Kode" value={formState.code} />
            <MetaRow label="Judul" value={formState.title} />
            <MetaRow
              label="Tipe diskon"
              value={formState.discountType === 'percentage' ? 'Persentase' : formState.discountType === 'fixed' ? 'Nominal' : '-'}
            />
            <MetaRow
              label="Nilai diskon"
              value={
                formState.discountType
                  ? formatDiscountValue(formState.discountType, Number(formState.amount || '0'))
                  : '-'
              }
            />
            <MetaRow label="Kuota" value={formState.usageLimit || '-'} />
            <MetaRow
              label="Periode"
              value={formState.startDate && formState.endDate ? formatDateRange(formState.startDate, formState.endDate) : '-'}
            />
            <MetaRow label="Status" value={<Badge variant={formState.status} />} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
              <Input
                id="voucher-code"
                label="Kode"
                value={formState.code}
                onChange={(event) => updateField('code', event.target.value.toUpperCase())}
              />
              <div className="flex items-end">
                <Button variant="secondary" className="h-11" onClick={() => updateField('code', generateVoucherCode())}>
                  Generate
                </Button>
              </div>
            </div>

            <Input
              id="voucher-title"
              label="Judul"
              value={formState.title}
              onChange={(event) => updateField('title', event.target.value)}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                label="Tipe Diskon"
                value={formState.discountType}
                onChange={(value) => updateField('discountType', value as FormDiscountType)}
                options={[
                  { value: '', label: 'Pilih tipe diskon' },
                  { value: 'percentage', label: 'Persentase' },
                  { value: 'fixed', label: 'Nominal' },
                ]}
              />

              <div>
                <Input
                  id="voucher-amount"
                  label={
                    formState.discountType === 'percentage'
                      ? 'Nilai Diskon (%)'
                      : formState.discountType === 'fixed'
                        ? 'Nilai Diskon (Rp)'
                        : 'Nilai Diskon'
                  }
                  disabled={!formState.discountType}
                  value={formState.amount}
                  onChange={(event) => updateField('amount', event.target.value.replace(/[^\d]/g, ''))}
                  placeholder={
                    formState.discountType === 'percentage'
                      ? 'Contoh: 10'
                      : formState.discountType === 'fixed'
                        ? 'Contoh: 250000'
                        : 'Pilih tipe diskon dulu'
                  }
                />
              </div>

              <Input
                id="voucher-quota"
                label="Kuota"
                value={formState.usageLimit}
                onChange={(event) => updateField('usageLimit', event.target.value.replace(/[^\d]/g, ''))}
              />

              <SelectField
                label="Status"
                value={formState.status}
                onChange={(value) => updateField('status', value as VoucherStatus)}
                options={[
                  { value: 'active', label: 'Aktif' },
                  { value: 'inactive', label: 'Nonaktif' },
                  { value: 'expired', label: 'Kedaluwarsa' },
                ]}
              />

              <Input
                id="voucher-start"
                label="Tanggal Mulai"
                type="date"
                value={formState.startDate}
                onChange={(event) => updateField('startDate', event.target.value)}
              />

              <Input
                id="voucher-end"
                label="Tanggal Selesai"
                type="date"
                value={formState.endDate}
                onChange={(event) => updateField('endDate', event.target.value)}
              />
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Produk"
        actions={
          !isReadOnly ? (
            <Button variant="ghost" size="sm" onClick={() => setIsProductModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Pilih Produk
            </Button>
          ) : undefined
        }
      >
        {selectedProducts.length ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {selectedProducts.map((product) => (
                <span
                  key={product.id}
                  className="inline-flex items-center rounded-full border border-gold-200 bg-gold-50 px-3 py-1 text-sm font-medium text-gold-700"
                >
                  {product.name}
                </span>
              ))}
            </div>

            <div className="space-y-3">
              {selectedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-2xl border border-navy-100 bg-white px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-navy-900">{product.name}</p>
                    <p className="mt-1 text-sm text-navy-500">{product.category}</p>
                  </div>
                  <p className="text-sm font-semibold text-navy-900">{formatRupiah(product.price)}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-navy-200 bg-navy-50/70 p-4 text-sm text-navy-600">
            Belum ada produk yang dipilih.
          </div>
        )}
      </SectionCard>

      <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Pilih Produk" size="lg">
        <div className="space-y-4">
          <div className="space-y-3">
            {allProducts.map((product: AdminProductRecord) => {
              const checked = formState.selectedProductIds.includes(product.id)

              return (
                <label
                  key={product.id}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-colors',
                    checked ? 'border-gold-300 bg-gold-50' : 'border-navy-100 bg-white hover:bg-navy-50',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProductSelection(product.id)}
                      className="h-4 w-4 rounded border-navy-300 text-gold-500 focus:ring-gold-400"
                    />
                    <div>
                      <p className="text-sm font-semibold text-navy-900">{product.name}</p>
                      <p className="mt-1 text-sm text-navy-500">{formatRupiah(product.price)}</p>
                    </div>
                  </div>
                  {checked ? <Check className="h-4 w-4 text-gold-700" /> : null}
                </label>
              )
            })}
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setIsProductModalOpen(false)}>
              <TicketPercent className="h-4 w-4" />
              Selesai
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

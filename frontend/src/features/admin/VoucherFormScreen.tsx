'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArrowLeft, Check, Pencil, Plus, Save, TicketPercent } from 'lucide-react'
import { cn, formatRupiah } from '@/core/lib/utils'
import { SelectField } from '@/features/admin/company-profile-shared'
import { InlineToast, type ToastTone } from '@/features/admin/admin-ui'
import {
  createAdminVoucher,
  fetchAdminVoucher,
  fetchVoucherProductOptions,
  updateAdminVoucher,
  type AdminVoucher,
  type AdminVoucherDiscountType,
  type AdminVoucherProductOption,
} from '@/features/admin/voucher-api'
import { AdminPageHeader, Badge, Button, Card, Input, Modal } from '@/shared/ui'

type VoucherScreenMode = 'create' | 'detail' | 'edit'
type FormDiscountType = AdminVoucherDiscountType | ''

interface VoucherFormScreenProps {
  mode: VoucherScreenMode
  voucherId?: string
}

interface VoucherFormState {
  code: string
  discountType: FormDiscountType
  discountValue: string
  usageLimit: string
  isActive: boolean
  selectedProductIds: string[]
}

const emptyState: VoucherFormState = {
  code: '',
  discountType: '',
  discountValue: '',
  usageLimit: '',
  isActive: true,
  selectedProductIds: [],
}

function generateVoucherCode() {
  return `GOLD${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function formatDiscountValue(type: FormDiscountType, amount: string) {
  if (!type) return '-'
  const value = Number(amount || '0')
  return type === 'PERCENTAGE' ? `${value}%` : formatRupiah(value)
}

function buildInitialState(voucher?: AdminVoucher | null): VoucherFormState {
  if (!voucher) {
    return {
      ...emptyState,
      code: generateVoucherCode(),
    }
  }

  return {
    code: voucher.code,
    discountType: voucher.discountType,
    discountValue: String(voucher.discountValue),
    usageLimit: voucher.usageLimit === null ? '' : String(voucher.usageLimit),
    isActive: voucher.isActive,
    selectedProductIds: voucher.products.map((product) => product.id),
  }
}

function mergeProductOptions(
  options: AdminVoucherProductOption[],
  selected: AdminVoucherProductOption[],
) {
  const map = new Map<string, AdminVoucherProductOption>()
  options.forEach((product) => map.set(product.id, product))
  selected.forEach((product) => map.set(product.id, product))
  return Array.from(map.values()).sort((left, right) => left.name.localeCompare(right.name))
}

function numberOrZero(value: string) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function MetaRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-3">
      <p className="text-sm text-navy-500">{label}</p>
      <div className="text-sm text-navy-800">{value}</div>
    </div>
  )
}

function SectionCard({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
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
  const router = useRouter()
  const [voucher, setVoucher] = useState<AdminVoucher | null>(null)
  const [productOptions, setProductOptions] = useState<AdminVoucherProductOption[]>([])
  const [formState, setFormState] = useState<VoucherFormState>(buildInitialState())
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(mode !== 'create')
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  useEffect(() => {
    let alive = true

    async function loadData() {
      setIsLoading(true)
      setLoadError('')

      try {
        const [products, currentVoucher] = await Promise.all([
          fetchVoucherProductOptions(),
          voucherId ? fetchAdminVoucher(voucherId) : Promise.resolve(null),
        ])

        if (!alive) return

        setVoucher(currentVoucher)
        setProductOptions(mergeProductOptions(products, currentVoucher?.products ?? []))
        setFormState(buildInitialState(currentVoucher))

        if (voucherId && !currentVoucher) {
          setLoadError('Voucher tidak ditemukan.')
        }
      } catch {
        if (alive) setLoadError('Gagal memuat data voucher.')
      } finally {
        if (alive) setIsLoading(false)
      }
    }

    loadData()
    return () => {
      alive = false
    }
  }, [voucherId])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const isReadOnly = mode === 'detail'
  const selectedProducts = useMemo(
    () => productOptions.filter((product) => formState.selectedProductIds.includes(product.id)),
    [formState.selectedProductIds, productOptions],
  )

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

  function digitsOnly(value: string) {
    return value.replace(/[^\d]/g, '')
  }

  async function saveVoucher() {
    const discountValue = numberOrZero(formState.discountValue)
    const usageLimit = formState.usageLimit.trim() ? numberOrZero(formState.usageLimit) : null

    if (!formState.code.trim()) {
      setToast({ message: 'Kode voucher wajib diisi.', tone: 'error' })
      return
    }
    if (!formState.discountType) {
      setToast({ message: 'Tipe diskon wajib dipilih.', tone: 'error' })
      return
    }
    if (discountValue <= 0) {
      setToast({ message: 'Nilai diskon wajib lebih dari 0.', tone: 'error' })
      return
    }
    if (!formState.selectedProductIds.length) {
      setToast({ message: 'Pilih minimal satu produk.', tone: 'error' })
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        code: formState.code.trim().toUpperCase(),
        discountType: formState.discountType,
        discountValue,
        minPurchase: 0,
        maxDiscount: null,
        usageLimit,
        perUserLimit: 1,
        isActive: mode === 'create' ? true : formState.isActive,
        startsAt: null,
        expiresAt: null,
        productIds: formState.selectedProductIds,
      }

      const saved = mode === 'create'
        ? await createAdminVoucher(payload)
        : await updateAdminVoucher(voucherId!, payload)

      setToast({ message: mode === 'create' ? 'Voucher baru berhasil disimpan.' : 'Voucher berhasil diperbarui.', tone: 'success' })
      router.push(`/admin/vouchers/${saved.id}`)
    } catch {
      setToast({ message: 'Gagal menyimpan data voucher.', tone: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const title =
    mode === 'create'
      ? 'Tambah Voucher'
      : mode === 'edit'
        ? 'Edit Voucher'
        : voucher?.code ?? 'Detail Voucher'

  if (loadError) {
    return (
      <div className="space-y-4">
        <AdminPageHeader
          title={title}
          actions={
            <Link href="/admin/vouchers">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
            </Link>
          }
        />
        <Card padding="md" className="border-navy-100 shadow-elevation-low">
          <p className="text-sm text-navy-600">{loadError}</p>
        </Card>
      </div>
    )
  }

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
            {mode === 'detail' && voucher ? (
              <Link href={`/admin/vouchers/${voucher.id}/edit`}>
                <Button variant="ghost">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
            ) : null}
            {!isReadOnly ? (
              <Button onClick={saveVoucher} isLoading={isSaving} disabled={isLoading}>
                <Save className="h-4 w-4" />
                Simpan
              </Button>
            ) : null}
          </div>
        }
      />

      <InlineToast toast={toast} />

      <SectionCard title="Informasi Voucher">
        {isReadOnly ? (
          <div className="space-y-3">
            <MetaRow label="Kode" value={isLoading ? 'Memuat...' : formState.code} />
            <MetaRow label="Status" value={<Badge variant={formState.isActive ? 'active' : 'inactive'} />} />
            <MetaRow
              label="Tipe diskon"
              value={formState.discountType === 'PERCENTAGE' ? 'Persentase' : formState.discountType === 'FIXED' ? 'Nominal' : '-'}
            />
            <MetaRow label="Nilai diskon" value={formatDiscountValue(formState.discountType, formState.discountValue)} />
            <MetaRow label="Kuota" value={formState.usageLimit || 'Tanpa batas'} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
              <Input
                id="voucher-code"
                label="Kode"
                value={formState.code}
                onChange={(event) => updateField('code', event.target.value.toUpperCase())}
                disabled={isLoading}
              />
              <div className="flex items-end">
                <Button
                  variant="secondary"
                  className="h-11"
                  onClick={() => updateField('code', generateVoucherCode())}
                  disabled={isLoading}
                >
                  Generate
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                label="Tipe Diskon"
                value={formState.discountType}
                onChange={(value) => updateField('discountType', value as FormDiscountType)}
                options={[
                  { value: '', label: 'Pilih tipe diskon' },
                  { value: 'PERCENTAGE', label: 'Persentase' },
                  { value: 'FIXED', label: 'Nominal' },
                ]}
              />

              <Input
                id="voucher-discount"
                label={formState.discountType === 'PERCENTAGE' ? 'Nilai Diskon (%)' : 'Nilai Diskon (Rp)'}
                disabled={!formState.discountType || isLoading}
                value={formState.discountValue}
                onChange={(event) => updateField('discountValue', digitsOnly(event.target.value))}
                placeholder={formState.discountType === 'PERCENTAGE' ? 'Contoh: 10' : 'Contoh: 250000'}
              />

              <Input
                id="voucher-quota"
                label="Kuota"
                value={formState.usageLimit}
                onChange={(event) => updateField('usageLimit', digitsOnly(event.target.value))}
                placeholder="Kosongkan jika tanpa batas"
                disabled={isLoading}
              />

              {mode === 'edit' ? (
                <SelectField
                  label="Status"
                  value={formState.isActive ? 'active' : 'inactive'}
                  onChange={(value) => updateField('isActive', value === 'active')}
                  options={[
                    { value: 'active', label: 'Aktif' },
                    { value: 'inactive', label: 'Nonaktif' },
                  ]}
                />
              ) : null}
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Produk"
        actions={
          !isReadOnly ? (
            <Button variant="ghost" size="sm" onClick={() => setIsProductModalOpen(true)} disabled={isLoading}>
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
            {isLoading ? 'Memuat produk...' : 'Belum ada produk yang dipilih.'}
          </div>
        )}
      </SectionCard>

      <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Pilih Produk" size="lg">
        <div className="space-y-4">
          <div className="space-y-3">
            {productOptions.length ? productOptions.map((product) => {
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
                      <p className="mt-1 text-sm text-navy-500">{product.category} • {formatRupiah(product.price)}</p>
                    </div>
                  </div>
                  {checked ? <Check className="h-4 w-4 text-gold-700" /> : null}
                </label>
              )
            }) : (
              <div className="rounded-2xl border border-dashed border-navy-200 bg-navy-50/70 p-4 text-sm text-navy-600">
                Produk belum tersedia dari database.
              </div>
            )}
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

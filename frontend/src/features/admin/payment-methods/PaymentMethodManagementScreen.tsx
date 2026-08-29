'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { AlertTriangle, FileText, Lock, Pencil, Save, UploadCloud } from 'lucide-react'
import { resolvePublicAssetUrl } from '@/core/lib/public-url'
import { InlineToast, type ToastTone } from '@/features/admin/admin-ui'
import { BANK_OPTIONS, getBankLogo, getPaymentLogo } from '@/features/payment-methods/bank-assets'
import {
  fetchAdminPaymentGatewayMode,
  fetchAdminPaymentMethods,
  updateAdminPaymentGatewayMode,
  updateAdminPaymentMethod,
  uploadBankAccountAttachment,
  uploadQrisImage,
  type BankAccountConfig,
  type PaymentGatewayMode,
  type PaymentMethodRecord,
} from '@/features/payment-methods/payment-method-api'
import { AdminEmptyState, AdminPageHeader, AdminTable, Button, Card, Modal } from '@/shared/ui'

const MAX_QRIS_IMAGE_MB = 10
const MAX_QRIS_IMAGE_BYTES = MAX_QRIS_IMAGE_MB * 1024 * 1024
const MAX_SAVINGS_BOOK_MB = 5
const MAX_SAVINGS_BOOK_BYTES = MAX_SAVINGS_BOOK_MB * 1024 * 1024
const BANK_ACCOUNT_SLOTS = ['1', '2', '3'] as const
const MANUAL_METHOD_CODES = ['qris_manual', 'bank_transfer']
const MIDTRANS_METHOD_CODES = ['bri_va', 'bni_va', 'mandiri_va', 'cimb_va', 'permata_va', 'qris_midtrans']
const DUITKU_METHOD_CODES = [
  'duitku_bri_va',
  'duitku_bni_va',
  'duitku_mandiri_va',
  'duitku_cimb_va',
  'duitku_bsi_va',
  'duitku_danamon_va',
  'duitku_permata_va',
  'duitku_maybank_va',
  'duitku_sampoerna_va',
  'duitku_artha_graha_va',
  'duitku_neo_va',
  'duitku_alfamart',
  'duitku_pegadaian',
  'duitku_pos',
]

interface PaymentMethodForm {
  isActive: boolean
  imageUrl: string
  bankName: string
  accountNumber: string
  accountHolder: string
  instructions: string
  bankAccounts: BankAccountConfig[]
}

const emptyForm: PaymentMethodForm = {
  isActive: false,
  imageUrl: '',
  bankName: '',
  accountNumber: '',
  accountHolder: '',
  instructions: '',
  bankAccounts: BANK_ACCOUNT_SLOTS.map((id) => ({
    id,
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    isActive: id === '1',
    savingsBookAttachmentUrl: '',
  })),
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message
  return fallback
}

function MethodStatusBadge({ method, activeOverride }: { method: PaymentMethodRecord; activeOverride?: boolean }) {
  if (method.isLocked || method.status === 'COMING_SOON') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-navy-200 bg-navy-50 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-navy-500">
        <Lock className="h-3.5 w-3.5" />
        Coming Soon
      </span>
    )
  }

  const isActive = activeOverride ?? method.isActive

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
      isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-navy-200 bg-navy-50 text-navy-500'
    }`}>
      {isActive ? 'Aktif' : 'Nonaktif'}
    </span>
  )
}

function isCompleteBankAccount(account: BankAccountConfig) {
  return Boolean(account.bankName?.trim() && account.accountNumber?.trim() && account.accountHolder?.trim())
}

function getBankAccountLabel(account: BankAccountConfig) {
  return account.bankName?.trim() ? `Transfer Bank - ${account.bankName}` : `Transfer Bank ${account.id}`
}

function getBankAccountSubtitle(account: BankAccountConfig) {
  if (!account.accountNumber?.trim()) return `Slot rekening transfer ${account.id}`
  return `${account.accountNumber}${account.accountHolder?.trim() ? ` a.n. ${account.accountHolder}` : ''}`
}

function getPaymentModeLabel(mode: PaymentGatewayMode) {
  if (mode === 'midtrans') return 'Midtrans'
  if (mode === 'duitku') return 'Duitku'
  return 'Manual'
}

function getAttachmentKind(url: string) {
  const cleanUrl = url.split('?')[0].toLowerCase()
  if (cleanUrl.endsWith('.pdf')) return 'pdf'
  if (/\.(jpg|jpeg|png|webp)$/.test(cleanUrl)) return 'image'
  return 'file'
}

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-gold-500' : 'bg-navy-200'
      }`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

function buildForm(method: PaymentMethodRecord): PaymentMethodForm {
  const accountsById = new Map((method.config.bankAccounts ?? []).map((account) => [account.id, account]))
  const primaryAccount = accountsById.get('1')
  const bankAccounts = BANK_ACCOUNT_SLOTS.map((id) => {
    const account = accountsById.get(id)
    const fallbackPrimary = {
      bankName: id === '1' ? method.config.bankName ?? '' : '',
      accountNumber: id === '1' ? method.config.accountNumber ?? '' : '',
      accountHolder: id === '1' ? method.config.accountHolder ?? '' : '',
      isActive: id === '1',
      savingsBookAttachmentUrl: id === '1' ? method.config.savingsBookAttachmentUrl ?? '' : '',
    }

    return {
      id,
      bankName: account?.bankName ?? fallbackPrimary.bankName ?? '',
      accountNumber: account?.accountNumber ?? fallbackPrimary.accountNumber ?? '',
      accountHolder: account?.accountHolder ?? fallbackPrimary.accountHolder ?? '',
      isActive: account?.isActive ?? fallbackPrimary.isActive ?? false,
      savingsBookAttachmentUrl: account?.savingsBookAttachmentUrl ?? fallbackPrimary.savingsBookAttachmentUrl ?? '',
    }
  })

  return {
    isActive: method.isActive,
    imageUrl: method.config.imageUrl ?? '',
    bankName: primaryAccount?.bankName ?? method.config.bankName ?? '',
    accountNumber: primaryAccount?.accountNumber ?? method.config.accountNumber ?? '',
    accountHolder: primaryAccount?.accountHolder ?? method.config.accountHolder ?? '',
    instructions: method.config.instructions ?? '',
    bankAccounts,
  }
}

export default function PaymentMethodManagementScreen() {
  const [methods, setMethods] = useState<PaymentMethodRecord[]>([])
  const [paymentMode, setPaymentMode] = useState<PaymentGatewayMode>('manual')
  const [pendingPaymentMode, setPendingPaymentMode] = useState<PaymentGatewayMode | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodRecord | null>(null)
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('')
  const [form, setForm] = useState<PaymentMethodForm>(emptyForm)
  const [savingCode, setSavingCode] = useState('')
  const [togglingCode, setTogglingCode] = useState('')
  const [isSavingMode, setIsSavingMode] = useState(false)
  const [isUploadingQris, setIsUploadingQris] = useState(false)
  const [uploadingBankAccountId, setUploadingBankAccountId] = useState('')
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  async function loadMethods() {
    setIsLoading(true)
    try {
      const [nextMethods, nextMode] = await Promise.all([
        fetchAdminPaymentMethods(),
        fetchAdminPaymentGatewayMode(),
      ])
      setMethods(nextMethods)
      setPaymentMode(nextMode)
    } catch (error) {
      setToast({ message: getErrorMessage(error, 'Gagal memuat metode pembayaran.'), tone: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMethods()
  }, [])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(timeout)
  }, [toast])

  function openEditModal(method: PaymentMethodRecord, bankAccountId = '') {
    setSelectedMethod(method)
    setSelectedBankAccountId(bankAccountId)
    setForm(buildForm(method))
  }

  function closeEditModal() {
    setSelectedMethod(null)
    setSelectedBankAccountId('')
    setForm(emptyForm)
  }

  function updateMethod(nextMethod: PaymentMethodRecord) {
    setMethods((current) => current.map((method) => (method.code === nextMethod.code ? nextMethod : method)))
    setSelectedMethod(nextMethod)
    setForm(buildForm(nextMethod))
  }

  async function confirmPaymentModeChange() {
    if (!pendingPaymentMode) return

    setIsSavingMode(true)
    try {
      const nextMode = await updateAdminPaymentGatewayMode(pendingPaymentMode)
      setPaymentMode(nextMode)
      setPendingPaymentMode(null)
      setToast({ message: `Mode pembayaran diubah ke ${getPaymentModeLabel(nextMode)}.`, tone: 'success' })
    } catch (error) {
      setToast({ message: getErrorMessage(error, 'Gagal mengubah mode pembayaran.'), tone: 'error' })
    } finally {
      setIsSavingMode(false)
    }
  }

  async function handleToggleGatewayMethod(method: PaymentMethodRecord, checked: boolean) {
    setTogglingCode(method.code)
    try {
      const updated = await updateAdminPaymentMethod(method.code, { isActive: checked })
      setMethods((current) => current.map((item) => (item.code === updated.code ? updated : item)))
      setToast({ message: `${updated.label} ${updated.isActive ? 'diaktifkan' : 'dinonaktifkan'}.`, tone: 'success' })
    } catch (error) {
      setToast({ message: getErrorMessage(error, `Gagal mengubah status ${method.label}.`), tone: 'error' })
    } finally {
      setTogglingCode('')
    }
  }

  async function handleQrisImageChange(file?: File | null) {
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setToast({ message: 'Format QRIS harus JPG, PNG, atau WebP.', tone: 'error' })
      return
    }

    if (file.size > MAX_QRIS_IMAGE_BYTES) {
      setToast({ message: `Ukuran QRIS maksimal ${MAX_QRIS_IMAGE_MB}MB.`, tone: 'error' })
      return
    }

    setIsUploadingQris(true)
    try {
      const updated = await uploadQrisImage(file)
      updateMethod(updated)
      setToast({ message: 'Gambar QRIS berhasil diupload.', tone: 'success' })
    } catch (error) {
      setToast({ message: getErrorMessage(error, 'Gagal mengupload gambar QRIS.'), tone: 'error' })
    } finally {
      setIsUploadingQris(false)
    }
  }

  async function handleSavingsBookChange(accountId: string, file?: File | null) {
    if (!file) return

    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      setToast({ message: 'Format lampiran harus JPG, PNG, atau PDF.', tone: 'error' })
      return
    }

    if (file.size > MAX_SAVINGS_BOOK_BYTES) {
      setToast({ message: `Ukuran lampiran maksimal ${MAX_SAVINGS_BOOK_MB}MB.`, tone: 'error' })
      return
    }

    setUploadingBankAccountId(accountId)
    try {
      const updated = await uploadBankAccountAttachment(accountId, file)
      const updatedAccount = updated.config.bankAccounts?.find((account) => account.id === accountId)
      setMethods((current) => current.map((method) => (method.code === updated.code ? updated : method)))
      setSelectedMethod(updated)
      setForm((current) => ({
        ...current,
        bankAccounts: current.bankAccounts.map((account) => (
          account.id === accountId
            ? { ...account, savingsBookAttachmentUrl: updatedAccount?.savingsBookAttachmentUrl ?? account.savingsBookAttachmentUrl }
            : account
        )),
      }))
      setToast({ message: 'Lampiran buku tabungan berhasil diupload.', tone: 'success' })
    } catch (error) {
      setToast({ message: getErrorMessage(error, 'Gagal mengupload lampiran buku tabungan.'), tone: 'error' })
    } finally {
      setUploadingBankAccountId('')
    }
  }

  function updateBankAccount(accountId: string, patch: Partial<BankAccountConfig>) {
    setForm((current) => ({
      ...current,
      bankAccounts: current.bankAccounts.map((account) => (
        account.id === accountId ? { ...account, ...patch } : account
      )),
    }))
  }

  async function handleSave() {
    if (!selectedMethod || selectedMethod.isLocked) return

    setSavingCode(selectedMethod.code)
    try {
      const config = selectedMethod.code === 'qris_manual'
        ? {
          imageUrl: form.imageUrl,
          instructions: form.instructions,
        }
        : selectedMethod.code === 'bank_transfer'
          ? {
            bankName: form.bankAccounts[0]?.bankName ?? '',
            accountNumber: form.bankAccounts[0]?.accountNumber ?? '',
            accountHolder: form.bankAccounts[0]?.accountHolder ?? '',
            savingsBookAttachmentUrl: form.bankAccounts[0]?.savingsBookAttachmentUrl ?? '',
            bankAccounts: form.bankAccounts.map((account) => ({
              id: account.id,
              bankName: account.bankName,
              accountNumber: account.accountNumber,
              accountHolder: account.accountHolder,
              isActive: Boolean(account.isActive),
              savingsBookAttachmentUrl: account.savingsBookAttachmentUrl,
            })),
            instructions: form.instructions,
          }
          : {}

      const updated = await updateAdminPaymentMethod(selectedMethod.code, {
        isActive: selectedMethod.code === 'bank_transfer'
          ? form.bankAccounts.some((account) => Boolean(account.isActive))
          : form.isActive,
        config,
      })
      updateMethod(updated)
      setToast({ message: 'Metode pembayaran berhasil disimpan.', tone: 'success' })
      closeEditModal()
    } catch (error) {
      setToast({ message: getErrorMessage(error, 'Gagal menyimpan metode pembayaran.'), tone: 'error' })
    } finally {
      setSavingCode('')
    }
  }

  const manualTableRows = methods.filter((method) => MANUAL_METHOD_CODES.includes(method.code)).flatMap((method) => {
    if (method.code !== 'bank_transfer') {
      return [{
        id: method.code,
        mobileTitle: method.label,
        mobileSubtitle: method.code,
        mobileAside: <MethodStatusBadge method={method} />,
        mobileMeta: (
          <Button type="button" size="sm" variant="secondary" onClick={() => openEditModal(method)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        ),
        cells: [
          <div key={`${method.code}-name`}>
            <p className="font-semibold text-navy-900">{method.label}</p>
            <p className="mt-0.5 text-xs font-medium text-navy-500">{method.code}</p>
          </div>,
          <MethodStatusBadge key={`${method.code}-status`} method={method} />,
          <div key={`${method.code}-edit`} className="flex justify-end">
            <Button type="button" size="sm" variant="secondary" onClick={() => openEditModal(method)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </div>,
        ],
      }]
    }

    const accounts = buildForm(method).bankAccounts
    return accounts.map((account) => {
      const bankLogo = getBankLogo(account.bankName)
      const accountIsActive = method.isActive && Boolean(account.isActive) && isCompleteBankAccount(account)

      return {
        id: `${method.code}:${account.id}`,
        mobileTitle: getBankAccountLabel(account),
        mobileSubtitle: getBankAccountSubtitle(account),
        mobileAside: <MethodStatusBadge method={method} activeOverride={accountIsActive} />,
        mobileMeta: (
          <Button type="button" size="sm" variant="secondary" onClick={() => openEditModal(method, account.id)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        ),
        cells: [
          <div key={`${method.code}-${account.id}-name`} className="flex items-center gap-3">
            <div className="flex h-10 w-14 flex-shrink-0 items-center justify-center rounded-lg border border-navy-100 bg-navy-50 p-2">
              {bankLogo ? (
                <Image src={bankLogo} alt={account.bankName || getBankAccountLabel(account)} width={64} height={48} unoptimized className="h-full w-full object-contain" />
              ) : (
                <span className="text-xs font-bold text-navy-400">BANK</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-navy-900">{getBankAccountLabel(account)}</p>
              <p className="mt-0.5 truncate text-xs font-medium text-navy-500">{getBankAccountSubtitle(account)}</p>
            </div>
          </div>,
          <MethodStatusBadge key={`${method.code}-${account.id}-status`} method={method} activeOverride={accountIsActive} />,
          <div key={`${method.code}-${account.id}-edit`} className="flex justify-end">
            <Button type="button" size="sm" variant="secondary" onClick={() => openEditModal(method, account.id)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </div>,
        ],
      }
    })
  })

  function buildGatewayTableRows(methodCodes: string[], providerLabel: string) {
    const gatewayMethods = methodCodes
      .map((code) => methods.find((method) => method.code === code))
      .filter((method): method is PaymentMethodRecord => Boolean(method))

    return gatewayMethods.map((method) => {
      const logo = getPaymentLogo(method.label) ?? resolvePublicAssetUrl(method.config.imageUrl)

      return {
        id: method.code,
        mobileTitle: method.label,
        mobileSubtitle: method.category === 'QRIS' ? `${providerLabel} QRIS` : method.category === 'RETAIL' ? `${providerLabel} Retail` : undefined,
        mobileAside: <MethodStatusBadge method={method} />,
        mobileMeta: (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-navy-600">Aktifkan</span>
            <Toggle
              checked={method.isActive}
              disabled={togglingCode === method.code}
              onChange={(checked) => handleToggleGatewayMethod(method, checked)}
            />
          </div>
        ),
        cells: [
          <div key={`${method.code}-name`} className="flex items-center gap-3">
            <div className="flex h-10 w-16 flex-shrink-0 items-center justify-center rounded-lg border border-navy-100 bg-white p-2">
              {logo ? (
                <Image src={logo} alt={method.label} width={64} height={40} unoptimized className="h-full w-full object-contain" />
              ) : (
                <span className="text-xs font-bold text-navy-400">{method.label}</span>
              )}
            </div>
            <div>
              <p className="font-semibold text-navy-900">{method.label}</p>
              {method.category === 'QRIS' || method.category === 'RETAIL' ? (
                <p className="mt-0.5 text-xs font-medium text-navy-500">
                  {method.category === 'QRIS' ? `${providerLabel} QRIS` : `${providerLabel} Retail`}
                </p>
              ) : null}
            </div>
          </div>,
          <MethodStatusBadge key={`${method.code}-status`} method={method} />,
          <div key={`${method.code}-toggle`} className="flex justify-end">
            <Toggle
              checked={method.isActive}
              disabled={togglingCode === method.code}
              onChange={(checked) => handleToggleGatewayMethod(method, checked)}
            />
          </div>,
        ],
      }
    })
  }

  const midtransTableRows = buildGatewayTableRows(MIDTRANS_METHOD_CODES, 'Midtrans')
  const duitkuTableRows = buildGatewayTableRows(DUITKU_METHOD_CODES, 'Duitku')
  const activeRows = paymentMode === 'manual'
    ? manualTableRows
    : paymentMode === 'midtrans'
      ? midtransTableRows
      : duitkuTableRows

  const qrisImageUrl = resolvePublicAssetUrl(form.imageUrl)
  const visibleBankAccounts = selectedMethod?.code === 'bank_transfer' && selectedBankAccountId
    ? form.bankAccounts.filter((account) => account.id === selectedBankAccountId)
    : form.bankAccounts

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Pembayaran"
        description="Atur metode pembayaran yang tersedia untuk customer saat checkout."
      />

      <InlineToast toast={toast} />

      <Card padding="sm" className="max-w-xl">
        <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-navy-600 bg-white p-0.5">
          {(['manual', 'midtrans', 'duitku'] as const).map((mode) => {
            const isActive = paymentMode === mode
            return (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  if (mode !== paymentMode) setPendingPaymentMode(mode)
                }}
                className={`h-11 rounded-md text-sm font-bold transition-colors ${
                  isActive ? 'bg-navy-900 text-white' : 'text-navy-800 hover:bg-navy-50'
                }`}
              >
                {getPaymentModeLabel(mode)}
              </button>
            )
          })}
        </div>
      </Card>

      {isLoading ? (
        <Card padding="md">
          <p className="text-sm font-medium text-navy-600">Memuat pengaturan pembayaran...</p>
        </Card>
      ) : methods.length === 0 ? (
        <AdminEmptyState title="Belum ada metode pembayaran" description="Jalankan migrasi database untuk mengisi katalog metode pembayaran default." />
      ) : (
        <AdminTable
          columns={[
            { id: 'name', label: 'Nama', className: 'w-[55%]' },
            { id: 'status', label: 'Status', className: 'w-[25%]' },
            { id: 'edit', label: <span className="sr-only">{paymentMode === 'manual' ? 'Edit' : 'Aktifkan'}</span>, className: 'w-[20%] text-right' },
          ]}
          rows={activeRows}
          emptyState={
            <AdminEmptyState
              title={
                paymentMode === 'manual'
                  ? 'Belum ada metode manual'
                  : paymentMode === 'midtrans'
                    ? 'Belum ada metode Midtrans'
                    : 'Belum ada metode Duitku'
              }
              description={paymentMode === 'manual'
                ? 'Metode QRIS Manual dan Transfer Bank belum tersedia.'
                : `Jalankan migrasi terbaru untuk mengisi metode ${getPaymentModeLabel(paymentMode)}.`}
            />
          }
        />
      )}

      <Modal
        isOpen={Boolean(pendingPaymentMode)}
        onClose={() => {
          if (!isSavingMode) setPendingPaymentMode(null)
        }}
        title="Ubah Mode Pembayaran"
        size="sm"
      >
        <div className="space-y-5">
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold">Yakin ingin mengubah mode pembayaran?</p>
              <p className="mt-1 text-sm">
                Mode aktif akan berubah ke {pendingPaymentMode ? getPaymentModeLabel(pendingPaymentMode) : '-'} di halaman admin pembayaran.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPendingPaymentMode(null)} disabled={isSavingMode}>Batal</Button>
            <Button onClick={confirmPaymentModeChange} isLoading={isSavingMode}>Ya, Ubah</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(selectedMethod)}
        onClose={closeEditModal}
        title={selectedMethod ? `Edit ${selectedMethod.code === 'bank_transfer' && selectedBankAccountId ? `Transfer Bank ${selectedBankAccountId}` : selectedMethod.label}` : 'Edit Metode Pembayaran'}
        size="lg"
        className="max-h-[90vh] overflow-y-auto"
      >
        {selectedMethod ? (
          <div className="space-y-5">
            {selectedMethod.code !== 'bank_transfer' ? (
              <div className="flex items-center justify-between gap-4 rounded-lg border border-navy-100 bg-surface-container-low px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-navy-900">Status Metode</p>
                  <p className="mt-0.5 text-xs text-navy-500">Metode aktif akan muncul di checkout jika konfigurasinya lengkap.</p>
                </div>
                <Toggle checked={form.isActive} onChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))} />
              </div>
            ) : null}

            {selectedMethod.code === 'qris_manual' ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-navy-100 bg-navy-50 p-4">
                  {qrisImageUrl ? (
                    <Image
                      src={qrisImageUrl}
                      alt="QRIS Manual"
                      width={260}
                      height={260}
                      unoptimized
                      className="mx-auto aspect-square w-full max-w-[260px] rounded-lg border border-navy-100 bg-white object-contain p-3"
                    />
                  ) : (
                    <div className="mx-auto flex aspect-square w-full max-w-[260px] items-center justify-center rounded-lg border border-dashed border-navy-300 bg-white p-5 text-center text-sm font-semibold text-navy-600">
                      Gambar QRIS belum tersedia
                    </div>
                  )}
                </div>

                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-gold-400 px-5 py-3 text-sm font-semibold text-gold-600 transition-colors hover:bg-gold-50">
                  <UploadCloud className="h-4 w-4" />
                  {isUploadingQris ? 'Mengupload...' : 'Upload QRIS'}
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.webp"
                    disabled={isUploadingQris}
                    onChange={(event) => handleQrisImageChange(event.target.files?.[0] ?? null)}
                  />
                </label>

                <label className="space-y-2 block">
                  <span className="text-sm font-semibold text-navy-700">Instruksi Pembayaran</span>
                  <textarea
                    className="input-base min-h-28 resize-y"
                    value={form.instructions}
                    onChange={(event) => setForm((current) => ({ ...current, instructions: event.target.value }))}
                    placeholder="Contoh: Scan QRIS, masukkan nominal sesuai total, lalu upload bukti pembayaran."
                  />
                </label>
              </div>
            ) : selectedMethod.code === 'bank_transfer' ? (
              <div className="space-y-4">
                {visibleBankAccounts.map((account) => {
                  const bankLogo = getBankLogo(account.bankName)
                  const attachmentUrl = resolvePublicAssetUrl(account.savingsBookAttachmentUrl ?? '')
                  const attachmentKind = attachmentUrl ? getAttachmentKind(attachmentUrl) : ''

                  return (
                    <div key={account.id} className="rounded-xl border border-navy-100 bg-white p-4">
                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-16 items-center justify-center rounded-lg border border-navy-100 bg-navy-50 p-2">
                            {bankLogo ? (
                              <Image src={bankLogo} alt={account.bankName || `Transfer Bank ${account.id}`} width={64} height={48} unoptimized className="h-full w-full object-contain" />
                            ) : (
                              <span className="text-xs font-bold text-navy-400">BANK</span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-navy-900">Transfer Bank {account.id}</p>
                            <p className="text-xs text-navy-500">Slot rekening transfer</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                          <span className="text-xs font-semibold text-navy-500">Tampilkan</span>
                          <Toggle
                            checked={Boolean(account.isActive)}
                            onChange={(checked) => updateBankAccount(account.id, { isActive: checked })}
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-2">
                          <span className="text-sm font-semibold text-navy-700">Nama Bank</span>
                          <select
                            className="input-base bg-white"
                            value={account.bankName ?? ''}
                            onChange={(event) => updateBankAccount(account.id, { bankName: event.target.value })}
                          >
                            <option value="">Pilih bank</option>
                            {BANK_OPTIONS.map((bank) => (
                              <option key={bank} value={bank}>{bank}</option>
                            ))}
                          </select>
                        </label>
                        <label className="space-y-2">
                          <span className="text-sm font-semibold text-navy-700">Nomor Rekening</span>
                          <input
                            className="input-base"
                            value={account.accountNumber ?? ''}
                            onChange={(event) => updateBankAccount(account.id, { accountNumber: event.target.value })}
                            placeholder="Contoh: 1234567890"
                          />
                        </label>
                        <label className="space-y-2 sm:col-span-2">
                          <span className="text-sm font-semibold text-navy-700">Nama Pemilik Rekening</span>
                          <input
                            className="input-base"
                            value={account.accountHolder ?? ''}
                            onChange={(event) => updateBankAccount(account.id, { accountHolder: event.target.value })}
                            placeholder="Contoh: PT Logam Mulia"
                          />
                        </label>
                      </div>

                      <div className="mt-4 rounded-lg border border-navy-100 bg-navy-50 p-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-navy-900">Lampiran buku tabungan</p>
                            {attachmentUrl ? (
                              <a
                                href={attachmentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-flex min-w-0 items-center gap-1 text-sm font-semibold text-gold-600 hover:text-gold-700"
                              >
                                <FileText className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">Buka lampiran</span>
                              </a>
                            ) : (
                              <p className="mt-1 text-sm text-navy-500">Belum ada lampiran</p>
                            )}
                          </div>
                          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-gold-400 px-4 py-2 text-sm font-semibold text-gold-600 transition-colors hover:bg-gold-50">
                            <UploadCloud className="h-4 w-4" />
                            {uploadingBankAccountId === account.id ? 'Mengupload...' : attachmentUrl ? 'Ganti Lampiran' : 'Upload'}
                            <input
                              type="file"
                              className="hidden"
                              accept=".jpg,.jpeg,.png,.pdf"
                              disabled={Boolean(uploadingBankAccountId)}
                              onChange={(event) => handleSavingsBookChange(account.id, event.target.files?.[0] ?? null)}
                            />
                          </label>
                        </div>

                        {attachmentUrl ? (
                          <div className="mt-3 overflow-hidden rounded-lg border border-navy-100 bg-white">
                            {attachmentKind === 'image' ? (
                              <a href={attachmentUrl} target="_blank" rel="noreferrer" className="block">
                                <Image
                                  src={attachmentUrl}
                                  alt={`Preview lampiran buku tabungan Transfer Bank ${account.id}`}
                                  width={720}
                                  height={420}
                                  unoptimized
                                  className="max-h-[320px] w-full object-contain p-3"
                                />
                              </a>
                            ) : (
                              <a
                                href={attachmentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex min-h-36 items-center justify-center gap-3 p-5 text-center text-sm font-semibold text-navy-700 hover:bg-navy-50"
                              >
                                <FileText className="h-8 w-8 text-gold-600" />
                                <span>{attachmentKind === 'pdf' ? 'Preview PDF tersedia di tab baru' : 'Preview lampiran tersedia di tab baru'}</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="mt-3 flex min-h-32 items-center justify-center rounded-lg border border-dashed border-navy-200 bg-white px-4 text-center text-sm font-semibold text-navy-400">
                            Preview lampiran akan tampil setelah file diupload.
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                <label className="space-y-2 block">
                  <span className="text-sm font-semibold text-navy-700">Instruksi Pembayaran</span>
                  <textarea
                    className="input-base min-h-28 resize-y"
                    value={form.instructions}
                    onChange={(event) => setForm((current) => ({ ...current, instructions: event.target.value }))}
                    placeholder="Instruksi singkat untuk customer."
                  />
                </label>
              </div>
            ) : (
              <div className="rounded-lg border border-navy-100 bg-navy-50 p-4 text-sm text-navy-600">
                Metode ini masih coming soon dan belum bisa diedit.
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-navy-100 pt-5">
              <Button variant="ghost" onClick={closeEditModal}>Batal</Button>
              <Button onClick={handleSave} isLoading={savingCode === selectedMethod.code}>
                <Save className="h-4 w-4" />
                Simpan
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

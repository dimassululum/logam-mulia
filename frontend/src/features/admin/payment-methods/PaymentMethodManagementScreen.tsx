'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { FileText, Lock, Pencil, Save, UploadCloud } from 'lucide-react'
import { resolvePublicAssetUrl } from '@/core/lib/public-url'
import { InlineToast, type ToastTone } from '@/features/admin/admin-ui'
import { BANK_OPTIONS, getBankLogo } from '@/features/payment-methods/bank-assets'
import {
  fetchAdminPaymentMethods,
  updateAdminPaymentMethod,
  uploadBankAccountAttachment,
  uploadQrisImage,
  type BankAccountConfig,
  type PaymentMethodRecord,
} from '@/features/payment-methods/payment-method-api'
import { AdminEmptyState, AdminPageHeader, AdminTable, Button, Card, Modal } from '@/shared/ui'

const MAX_QRIS_IMAGE_MB = 10
const MAX_QRIS_IMAGE_BYTES = MAX_QRIS_IMAGE_MB * 1024 * 1024
const MAX_SAVINGS_BOOK_MB = 5
const MAX_SAVINGS_BOOK_BYTES = MAX_SAVINGS_BOOK_MB * 1024 * 1024
const BANK_ACCOUNT_SLOTS = ['1', '2', '3'] as const

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
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodRecord | null>(null)
  const [form, setForm] = useState<PaymentMethodForm>(emptyForm)
  const [savingCode, setSavingCode] = useState('')
  const [isUploadingQris, setIsUploadingQris] = useState(false)
  const [uploadingBankAccountId, setUploadingBankAccountId] = useState('')
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  async function loadMethods() {
    setIsLoading(true)
    try {
      setMethods(await fetchAdminPaymentMethods())
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

  function openEditModal(method: PaymentMethodRecord) {
    setSelectedMethod(method)
    setForm(buildForm(method))
  }

  function closeEditModal() {
    setSelectedMethod(null)
    setForm(emptyForm)
  }

  function updateMethod(nextMethod: PaymentMethodRecord) {
    setMethods((current) => current.map((method) => (method.code === nextMethod.code ? nextMethod : method)))
    setSelectedMethod(nextMethod)
    setForm(buildForm(nextMethod))
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
        isActive: form.isActive,
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

  const tableRows = methods.map((method) => ({
    id: method.code,
    mobileTitle: method.label,
    mobileSubtitle: method.code,
    mobileAside: <MethodStatusBadge method={method} />,
    mobileMeta: method.isLocked ? (
      <span className="text-sm text-navy-500">Metode ini masih coming soon.</span>
    ) : (
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
        {method.isLocked ? (
          <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-navy-100 px-3 text-xs font-semibold text-navy-400">
            <Lock className="h-4 w-4" />
            Locked
          </span>
        ) : (
          <Button type="button" size="sm" variant="secondary" onClick={() => openEditModal(method)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        )}
      </div>,
    ],
  }))

  const qrisImageUrl = resolvePublicAssetUrl(form.imageUrl)

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Pembayaran"
        description="Atur metode pembayaran yang tersedia untuk customer saat checkout."
      />

      <InlineToast toast={toast} />

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
            { id: 'edit', label: <span className="sr-only">Edit</span>, className: 'w-[20%] text-right' },
          ]}
          rows={tableRows}
        />
      )}

      <Modal
        isOpen={Boolean(selectedMethod)}
        onClose={closeEditModal}
        title={selectedMethod ? `Edit ${selectedMethod.label}` : 'Edit Metode Pembayaran'}
        size="lg"
        className="max-h-[90vh] overflow-y-auto"
      >
        {selectedMethod ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-navy-100 bg-surface-container-low px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-navy-900">Status Metode</p>
                <p className="mt-0.5 text-xs text-navy-500">Metode aktif akan muncul di checkout jika konfigurasinya lengkap.</p>
              </div>
              <Toggle checked={form.isActive} onChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))} />
            </div>

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
                {form.bankAccounts.map((account) => {
                  const bankLogo = getBankLogo(account.bankName)
                  const attachmentUrl = resolvePublicAssetUrl(account.savingsBookAttachmentUrl ?? '')

                  return (
                    <div key={account.id} className="rounded-xl border border-navy-100 bg-white p-4">
                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-16 items-center justify-center rounded-lg border border-navy-100 bg-navy-50 p-2">
                            {bankLogo ? (
                              <Image src={bankLogo} alt={account.bankName || `Transfer Bank ${account.id}`} className="h-full w-full object-contain" />
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

                      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-navy-100 bg-navy-50 p-3 sm:flex-row sm:items-center sm:justify-between">
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
                              <span className="truncate">Lihat lampiran</span>
                            </a>
                          ) : (
                            <p className="mt-1 text-sm text-navy-500">Belum ada lampiran</p>
                          )}
                        </div>
                        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-gold-400 px-4 py-2 text-sm font-semibold text-gold-600 transition-colors hover:bg-gold-50">
                          <UploadCloud className="h-4 w-4" />
                          {uploadingBankAccountId === account.id ? 'Mengupload...' : 'Upload'}
                          <input
                            type="file"
                            className="hidden"
                            accept=".jpg,.jpeg,.png,.pdf"
                            disabled={Boolean(uploadingBankAccountId)}
                            onChange={(event) => handleSavingsBookChange(account.id, event.target.files?.[0] ?? null)}
                          />
                        </label>
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

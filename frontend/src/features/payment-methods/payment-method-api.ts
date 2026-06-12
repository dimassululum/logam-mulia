import { apiClient } from '@/core/lib/api-client'
import { resolvePublicApiBaseUrl } from '@/core/lib/public-url'

const API_URL = resolvePublicApiBaseUrl()

export type PaymentMethodCategory = 'QRIS' | 'BANK_TRANSFER' | 'VIRTUAL_ACCOUNT'
export type PaymentMethodStatus = 'READY' | 'COMING_SOON'

export interface PaymentMethodConfig {
  imageUrl?: string
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  savingsBookAttachmentUrl?: string
  instructions?: string
  bankAccounts?: BankAccountConfig[]
}

export interface BankAccountConfig {
  id: string
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  isActive?: boolean
  savingsBookAttachmentUrl?: string
}

export interface PaymentMethodRecord {
  code: string
  label: string
  description?: string | null
  category: PaymentMethodCategory
  isActive: boolean
  isLocked: boolean
  status: PaymentMethodStatus
  config: PaymentMethodConfig
  isUsable: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export async function fetchPublicPaymentMethods() {
  const response = await fetch(`${API_URL}/payment-methods/public`, { cache: 'no-store' })
  const json = await response.json()
  if (!response.ok) throw new Error(json.message || 'Gagal memuat metode pembayaran')
  return json.data as PaymentMethodRecord[]
}

export async function fetchAdminPaymentMethods() {
  const response = await apiClient.get<{ data: PaymentMethodRecord[] }>('/payment-methods')
  return response.data.data
}

export async function updateAdminPaymentMethod(
  code: string,
  payload: { isActive?: boolean; config?: PaymentMethodConfig },
) {
  const response = await apiClient.put<{ data: PaymentMethodRecord }>(`/payment-methods/${encodeURIComponent(code)}`, payload)
  return response.data.data
}

export async function uploadQrisImage(file: File) {
  const formData = new FormData()
  formData.append('qrisImage', file)
  const response = await apiClient.post<{ data: PaymentMethodRecord }>('/payment-methods/qris-manual/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data.data
}

export async function uploadBankAccountAttachment(accountId: string, file: File) {
  const formData = new FormData()
  formData.append('savingsBookAttachment', file)
  const response = await apiClient.post<{ data: PaymentMethodRecord }>(
    `/payment-methods/bank-transfer/accounts/${encodeURIComponent(accountId)}/attachment`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  )
  return response.data.data
}

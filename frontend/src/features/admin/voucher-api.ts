import { apiClient } from '@/core/lib/api-client'

export type AdminVoucherDiscountType = 'PERCENTAGE' | 'FIXED'

export interface AdminVoucherProductOption {
  id: string
  name: string
  slug: string
  category: string
  price: number
}

export interface AdminVoucher {
  id: string
  code: string
  discountType: AdminVoucherDiscountType
  discountValue: number
  minPurchase: number
  maxDiscount: number | null
  usageLimit: number | null
  usageCount: number
  perUserLimit: number
  isActive: boolean
  startsAt: string | null
  expiresAt: string | null
  products: AdminVoucherProductOption[]
}

export interface AdminVoucherPayload {
  code: string
  discountType: AdminVoucherDiscountType
  discountValue: number
  minPurchase: number
  maxDiscount: number | null
  usageLimit: number | null
  perUserLimit: number
  isActive: boolean
  startsAt: string | null
  expiresAt: string | null
  productIds: string[]
}

interface ApiEnvelope<T> {
  data?: T
}

function toNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function mapProduct(product: any): AdminVoucherProductOption {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category?.name || 'Tanpa kategori',
    price: toNumber(product.price),
  }
}

function mapVoucher(voucher: any): AdminVoucher {
  return {
    id: voucher.id,
    code: voucher.code,
    discountType: voucher.discountType,
    discountValue: toNumber(voucher.discountValue),
    minPurchase: toNumber(voucher.minPurchase),
    maxDiscount: voucher.maxDiscount === null || voucher.maxDiscount === undefined ? null : toNumber(voucher.maxDiscount),
    usageLimit: voucher.usageLimit ?? null,
    usageCount: Number(voucher.usageCount ?? voucher._count?.usages ?? 0),
    perUserLimit: Number(voucher.perUserLimit ?? 1),
    isActive: Boolean(voucher.isActive),
    startsAt: voucher.startsAt ?? null,
    expiresAt: voucher.expiresAt ?? null,
    products: Array.isArray(voucher.products) ? voucher.products.map(mapProduct) : [],
  }
}

export async function fetchAdminVouchers() {
  const response = await apiClient.get<ApiEnvelope<any[]>>('/vouchers?limit=100')
  return (response.data.data || []).map(mapVoucher)
}

export async function fetchAdminVoucher(id: string) {
  const response = await apiClient.get<ApiEnvelope<any>>(`/vouchers/${encodeURIComponent(id)}`)
  return response.data.data ? mapVoucher(response.data.data) : null
}

export async function fetchVoucherProductOptions() {
  const response = await apiClient.get<ApiEnvelope<any[]>>('/products?limit=100&isActive=true')
  return (response.data.data || []).map(mapProduct)
}

export async function createAdminVoucher(payload: AdminVoucherPayload) {
  const response = await apiClient.post<ApiEnvelope<any>>('/vouchers', payload)
  return mapVoucher(response.data.data)
}

export async function updateAdminVoucher(id: string, payload: AdminVoucherPayload) {
  const response = await apiClient.put<ApiEnvelope<any>>(`/vouchers/${encodeURIComponent(id)}`, payload)
  return mapVoucher(response.data.data)
}

export async function deleteAdminVoucher(id: string) {
  await apiClient.delete(`/vouchers/${encodeURIComponent(id)}`)
}

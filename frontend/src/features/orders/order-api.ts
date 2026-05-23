import { apiClient } from '@/core/lib/api-client'
import type { OrderStatus } from '@/core/types'
import type { LocalCartItem, ClaimedVoucher } from '@/features/cart/cart-storage'
import type { GuestCheckoutAddress, GuestCheckoutProfile } from '@/features/checkout/guestCheckout'
import type { AdminOrderDetailRecord, AdminOrderRecord } from '@/features/admin/admin-management-data'
import { resolvePublicApiBaseUrl } from '@/core/lib/public-url'

const API_URL = resolvePublicApiBaseUrl()
const CURRENT_ORDER_KEY = 'lm-current-order'

interface CreateOrderInput {
  profile: GuestCheckoutProfile
  ordererName: string
  checkoutItems: LocalCartItem[]
  deliveryType: 'ekspedisi' | 'butik'
  selectedAddress: GuestCheckoutAddress | null
  selectedEkspedisi: { name: string; time: string; price: number; courier?: string; service?: string } | null
  selectedButik: { name: string; city: string; address: string } | null
  voucher: ClaimedVoucher | null
  discountAmount: number
}

export function saveCurrentOrder(order: AdminOrderDetailRecord) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CURRENT_ORDER_KEY, JSON.stringify(order))
}

export function readCurrentOrder() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CURRENT_ORDER_KEY)
    return raw ? (JSON.parse(raw) as AdminOrderDetailRecord) : null
  } catch {
    return null
  }
}

export async function createCustomerOrder(input: CreateOrderInput) {
  const shippingAddress = input.deliveryType === 'butik'
    ? input.selectedButik?.address || '-'
    : input.selectedAddress?.address || '-'

  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: input.profile.email,
      customerName: input.ordererName,
      customerPhone: input.selectedAddress?.phone || input.profile.phone || '',
      paymentMethod: 'Virtual Account',
      deliveryType: input.deliveryType,
      shippingCourier: input.deliveryType === 'butik' ? 'SELFPICKUP' : input.selectedEkspedisi?.courier || input.selectedEkspedisi?.name || 'Ekspedisi',
      shippingService: input.deliveryType === 'butik' ? 'Ambil di Butik' : input.selectedEkspedisi?.service || input.selectedEkspedisi?.time || '',
      shippingCost: input.deliveryType === 'ekspedisi' ? input.selectedEkspedisi?.price || 0 : 0,
      shippingAddress,
      shippingCity: input.deliveryType === 'butik' ? input.selectedButik?.name || '' : input.selectedAddress?.city || '',
      shippingProvince: input.deliveryType === 'butik' ? input.selectedButik?.city || '' : input.selectedAddress?.province || '',
      shippingDistrict: input.deliveryType === 'butik' ? '' : input.selectedAddress?.district || '',
      shippingVillage: input.deliveryType === 'butik' ? '' : input.selectedAddress?.village || '',
      shippingPostalCode: input.deliveryType === 'butik' ? '' : input.selectedAddress?.postalCode || '',
      boutiqueName: input.selectedButik?.name || null,
      boutiqueAddress: input.selectedButik?.address || null,
      voucherId: input.voucher?.id || null,
      discountAmount: input.discountAmount,
      items: input.checkoutItems.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        productImage: item.product.imageUrl || null,
        priceAtPurchase: item.product.totalPrice,
        quantity: item.quantity,
      })),
    }),
  })

  const json = await response.json()
  if (!response.ok) throw new Error(json.message || 'Gagal membuat pesanan')
  const order = json.data as AdminOrderDetailRecord
  saveCurrentOrder(order)
  return order
}

export async function markCurrentOrderPaid(orderId: string) {
  const response = await apiClient.post<{ data: AdminOrderDetailRecord }>(`/orders/${encodeURIComponent(orderId)}/mark-paid`)
  const order = response.data.data
  saveCurrentOrder(order)
  return order
}

export async function fetchCustomerOrders() {
  const response = await apiClient.get<{ data: AdminOrderRecord[] }>('/orders/my')
  return response.data.data
}

export async function fetchCustomerOrder(id: string) {
  const response = await apiClient.get<{ data: AdminOrderDetailRecord }>(`/orders/my/${encodeURIComponent(id)}`)
  return response.data.data
}

export async function fetchAdminOrders() {
  const response = await apiClient.get<{ data: AdminOrderRecord[] }>('/orders')
  return response.data.data
}

export async function fetchAdminOrder(id: string) {
  const response = await apiClient.get<{ data: AdminOrderDetailRecord }>(`/orders/${encodeURIComponent(id)}`)
  return response.data.data
}

export async function updateAdminOrderStatus(id: string, status: OrderStatus, trackingNumber?: string) {
  const backendStatus =
    status === 'success' ? 'PAID'
      : status === 'canceled' ? 'CANCELLED'
        : status === 'selesai' ? 'COMPLETED'
          : status.toUpperCase()
  const response = await apiClient.put<{ data: AdminOrderDetailRecord }>(`/orders/${encodeURIComponent(id)}/status`, {
    status: backendStatus,
    trackingNumber,
  })
  return response.data.data
}

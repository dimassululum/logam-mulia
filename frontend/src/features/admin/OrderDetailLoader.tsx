'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/core/lib/api'
import OrderDetailScreen from '@/features/admin/OrderDetailScreen'
import type { AdminOrderDetailRecord } from '@/features/admin/admin-management-data'

function buildDetailRecord(o: any): AdminOrderDetailRecord {
  const firstItem = o.items?.[0]
  let addr = '-'
  let city = o.shippingCity ?? '-'
  try {
    const parsed = typeof o.shippingAddress === 'string' ? JSON.parse(o.shippingAddress) : o.shippingAddress
    addr = parsed?.address ?? parsed?.street ?? addr
    city = parsed?.city ?? city
  } catch { /* noop */ }

  return {
    id:             o.id,
    customerName:   o.user?.name  ?? '-',
    customerEmail:  o.user?.email ?? '-',
    customerPhone:  o.user?.phone ?? '-',
    primaryItem:    firstItem?.product?.name ?? '-',
    itemCount:      o.items?.length ?? 0,
    totalAmount:    Number(o.grandTotal),
    paymentMethod:  o.paymentMethod ?? 'transfer',
    shippingMethod: o.shippingCourier ?? '-',
    trackingNumber: o.trackingNumber ?? '',
    requiresKtp:    false,
    address:        addr,
    status:         o.status.toLowerCase() as any,
    createdAt:      o.createdAt,
    updatedAt:      o.updatedAt,
    subtotalAmount:    Number(o.totalAmount),
    shippingFee:       Number(o.shippingCost),
    voucherAmount:     Number(o.discountAmount ?? 0),
    grandTotalAmount:  Number(o.grandTotal),
    lineItems: (o.items ?? []).map((item: any) => ({
      id:         item.id,
      productName: item.product?.name ?? '-',
      quantity:   item.quantity,
      unitPrice:  Number(item.priceAtPurchase),
      totalPrice: Number(item.subtotal ?? item.quantity * item.priceAtPurchase),
    })),
    customerDetail: {
      name:    o.user?.name  ?? '-',
      phone:   o.user?.phone ?? '-',
      email:   o.user?.email ?? '-',
    },
    recipientDetail: {
      name:             o.user?.name  ?? '-',
      phone:            o.user?.phone ?? '-',
      email:            o.user?.email ?? '-',
      province:         '-',
      city,
      district:         '-',
      village:          '-',
      address:          addr,
      postalCode:       '-',
      ktpDocumentLabel: '',
    },
    receiptCode:         o.trackingNumber ?? '-',
    receiptCreatedAt:    o.createdAt,
    receiptUpdatedAt:    o.updatedAt,
    fulfillmentDetail: {
      method:  'delivery' as const,
      courier: o.shippingCourier ?? '-',
      note:    '',
    },
    timeline: [
      {
        id:          '1',
        title:       'Order dibuat',
        description: `Order ${o.id} dibuat`,
        occurredAt:  o.createdAt,
        tone:        'info' as const,
      },
    ],
  }
}

export default function OrderDetailLoader({ orderId }: { orderId: string }) {
  const [order,     setOrder]     = useState<AdminOrderDetailRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    adminApi.getOrderById(orderId)
      .then(({ data }) => setOrder(buildDetailRecord(data.order ?? data)))
      .catch(() => setOrder(null))
      .finally(() => setIsLoading(false))
  }, [orderId])

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) {
    return <p className="text-center text-navy-500 py-16">Pesanan tidak ditemukan.</p>
  }

  return <OrderDetailScreen initialOrder={order} />
}

'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, PackageCheck, ShoppingBag } from 'lucide-react'
import { formatRupiah } from '@/core/lib/utils'
import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import { getOrderBadgeVariant, getOrderStatusLabel, type AdminOrderRecord } from '@/features/admin/admin-management-data'
import { fetchCustomerOrders } from '@/features/orders/order-api'

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<AdminOrderRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      router.replace('/login?redirect=/orders')
      return
    }

    let alive = true

    async function loadOrders() {
      try {
        const data = await fetchCustomerOrders()
        if (alive) setOrders(data)
      } catch {
        if (alive) setError('Gagal memuat riwayat pesanan.')
      } finally {
        if (alive) setIsLoading(false)
      }
    }

    loadOrders()
    return () => {
      alive = false
    }
  }, [router])

  const content = useMemo(() => {
    if (isLoading) {
      return <div className="rounded-2xl border border-navy-200 bg-white p-5 text-sm text-navy-600 shadow-sm">Memuat pesanan...</div>
    }

    if (error) {
      return <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">{error}</div>
    }

    if (orders.length === 0) {
      return (
        <section className="rounded-2xl border border-navy-200 bg-white p-6 text-center shadow-sm">
          <p className="font-heading text-lg font-bold text-navy-900">Belum ada pesanan</p>
          <p className="mt-2 text-sm text-navy-600">Pesanan yang dibuat dari checkout akan tampil di sini.</p>
          <Link href="/products" className="mt-5 block">
            <Button>Belanja Produk</Button>
          </Link>
        </section>
      )
    }

    return orders.map((order) => (
      <Link
        key={order.id}
        href={`/orders/${order.id}`}
        className="block rounded-2xl border border-navy-200 bg-white p-5 shadow-sm transition-all hover:border-gold-300 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-400">Order ID</p>
            <p className="mt-1 text-base font-bold text-navy-900">{order.id}</p>
            <p className="mt-1 text-sm text-navy-500">{formatOrderDate(order.createdAt)}</p>
          </div>
          <Badge variant={getOrderBadgeVariant(order.status)} label={getOrderStatusLabel(order.status)} />
        </div>

        <div className="mt-4 border-t border-navy-100 pt-4">
          <div className="mb-2 flex items-center gap-2 text-navy-700">
            <PackageCheck className="h-4 w-4 text-gold-500" />
            <span className="text-sm font-semibold">{order.itemCount} produk</span>
          </div>
          <p className="text-sm text-navy-700">{order.primaryItem}</p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-400">Total Belanja</p>
            <p className="mt-1 font-heading text-xl font-bold text-gold-600">{formatRupiah(order.totalAmount)}</p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-gold-600">
            Detail
            <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </Link>
    ))
  }, [error, isLoading, orders])

  return (
    <div className="min-h-screen bg-surface pb-28">
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        <section className="rounded-2xl border border-navy-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gold-50 text-gold-600">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold text-navy-900">Riwayat Pesanan</h1>
              <p className="mt-1 text-sm text-navy-600">
                Lihat status pesanan aktif dan pesanan yang sudah selesai di satu tempat.
              </p>
            </div>
          </div>
        </section>

        {content}
      </main>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ReceiptText, ShoppingCart } from 'lucide-react'
import { formatRupiah } from '@/core/lib/utils'
import {
  buildRecentOrderRows,
  recentOrderColumns,
  type RecentOrder,
} from '@/features/admin/mock-data'
import type { AdminOrderRecord } from '@/features/admin/admin-management-data'
import { fetchAdminOrders } from '@/features/orders/order-api'
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminStatCard,
  AdminTable,
  Card,
} from '@/shared/ui'

const successStatuses = new Set(['success', 'completed', 'selesai'])
const revenueStatuses = new Set(['paid', 'processing', 'success', 'shipped', 'delivered', 'completed', 'selesai'])

function isSuccessOrder(order: AdminOrderRecord) {
  return successStatuses.has(String(order.status).toLowerCase())
}

function isRevenueOrder(order: AdminOrderRecord) {
  return revenueStatuses.has(String(order.status).toLowerCase())
}

function isToday(dateValue: string) {
  const date = new Date(dateValue)
  const today = new Date()

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

function toRecentOrder(order: AdminOrderRecord): RecentOrder {
  return {
    id: order.id,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    totalAmount: order.totalAmount,
    status: order.status,
    createdAt: order.createdAt,
  }
}

export default function AdminDashboardScreen() {
  const [orders, setOrders] = useState<AdminOrderRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    async function loadOrders() {
      try {
        const result = await fetchAdminOrders({ limit: 100 })
        if (alive) setOrders(result.data)
      } catch {
        if (alive) setError('Gagal memuat data dashboard dari backend.')
      } finally {
        if (alive) setIsLoading(false)
      }
    }

    loadOrders()

    return () => {
      alive = false
    }
  }, [])

  const dashboardData = useMemo(() => {
    const successOrders = orders.filter(isSuccessOrder)
    const revenueOrders = orders.filter(isRevenueOrder)
    const revenueOrdersToday = revenueOrders.filter((order) => isToday(order.createdAt))

    return {
      successOrderCount: successOrders.length,
      todayRevenue: revenueOrdersToday.reduce((sum, order) => sum + order.totalAmount, 0),
      totalRevenue: revenueOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      latestOrders: orders.slice(0, 5).map(toRecentOrder),
    }
  }, [orders])

  const metrics = [
    {
      label: 'Pesanan Baru',
      value: String(dashboardData.successOrderCount),
      description: 'Order berstatus success',
      tone: 'gold' as const,
      icon: ShoppingCart,
    },
    {
      label: 'Pendapatan Hari Ini',
      value: formatRupiah(dashboardData.todayRevenue),
      description: 'Paid dan success hari ini',
      tone: 'success' as const,
      icon: CalendarDays,
    },
    {
      label: 'Total Pendapatan',
      value: formatRupiah(dashboardData.totalRevenue),
      description: 'Akumulasi paid dan success',
      tone: 'info' as const,
      icon: ReceiptText,
    },
  ]

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Dashboard"
        description="Ringkasan toko hari ini."
      />

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <AdminStatCard
            key={metric.label}
            label={metric.label}
            value={isLoading ? '...' : metric.value}
            description={metric.description}
            icon={metric.icon}
            tone={metric.tone}
          />
        ))}
      </section>

      <section>
        <Card padding="none" className="overflow-hidden border-navy-100 shadow-elevation-low">
          <div className="flex items-center justify-between border-b border-navy-100 px-4 py-3 md:px-5">
            <div>
              <h2 className="text-lg font-semibold text-navy-900">Pesanan Terbaru</h2>
            </div>
            <Link href="/admin/orders" className="text-sm font-semibold text-gold-600 hover:text-gold-500">
              Lihat semua
            </Link>
          </div>

          <div className="p-4 md:p-5">
            <AdminTable
              columns={recentOrderColumns}
              rows={buildRecentOrderRows(dashboardData.latestOrders)}
              emptyState={
                <AdminEmptyState
                  title={isLoading ? 'Memuat pesanan...' : 'Belum ada order terbaru'}
                  description={isLoading ? 'Data sedang diambil dari backend.' : 'Saat order pertama masuk, daftar pesanan terbaru akan muncul di sini.'}
                />
              }
            />
          </div>
        </Card>
      </section>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock3, ShoppingCart, Wallet, Users, Package } from 'lucide-react'
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminStatCard,
  AdminTable,
  Badge,
  Card,
} from '@/shared/ui'
import { adminApi } from '@/core/lib/api'
import { formatRupiah } from '@/core/lib/utils'
import type { AdminTableColumn, AdminTableRow } from '@/shared/ui/AdminTable'

interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  pendingOrders: number
  totalProducts: number
  totalUsers: number
  recentOrders: RecentOrder[]
}

interface RecentOrder {
  id: string
  user?: { name: string; email: string }
  totalAmount: number
  status: string
  createdAt: string
}

const ORDER_COLUMNS: AdminTableColumn[] = [
  { id: 'order', label: 'Order ID' },
  { id: 'customer', label: 'Customer' },
  { id: 'total', label: 'Total' },
  { id: 'status', label: 'Status' },
  { id: 'date', label: 'Tanggal' },
]

const STATUS_VARIANT: Record<string, string> = {
  pending: 'pending', paid: 'paid', processing: 'processing',
  shipped: 'shipped', delivered: 'delivered', completed: 'completed',
  cancelled: 'cancelled', refund: 'refund',
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(d))
}

function buildOrderRows(orders: RecentOrder[]): AdminTableRow[] {
  return orders.map((o) => ({
    id: o.id,
    href: `/admin/orders/${o.id}`,
    cells: [
      <div key="id"><p className="font-semibold text-navy-900 text-xs">{o.id.slice(0, 8)}...</p></div>,
      <div key="cust">
        <p className="font-medium text-navy-900">{o.user?.name ?? 'Customer'}</p>
        <p className="text-xs text-navy-500">{o.user?.email ?? ''}</p>
      </div>,
      <span key="total" className="font-semibold text-navy-900">{formatRupiah(Number(o.totalAmount))}</span>,
      <Badge
        key="status"
        variant={(STATUS_VARIANT[o.status] ?? 'neutral') as 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'refund' | 'neutral'}
        label={o.status.charAt(0).toUpperCase() + o.status.slice(1)}
      />,
      <span key="date" className="text-sm text-navy-600">{formatDate(o.createdAt)}</span>,
    ],
    mobileTitle: o.id.slice(0, 8) + '...',
    mobileSubtitle: <span className="font-medium text-navy-900">{o.user?.name ?? 'Customer'}</span>,
    mobileAside: (
      <Badge
        variant={(STATUS_VARIANT[o.status] ?? 'neutral') as 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'refund' | 'neutral'}
        label={o.status.charAt(0).toUpperCase() + o.status.slice(1)}
      />
    ),
    mobileMeta: (
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-navy-400">Total</p>
          <p className="mt-1 font-semibold text-navy-900">{formatRupiah(Number(o.totalAmount))}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.14em] text-navy-400">Tanggal</p>
          <p className="mt-1 font-medium text-navy-700">{formatDate(o.createdAt)}</p>
        </div>
      </div>
    ),
  }))
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getDashboard()
      .then(({ data }) => {
        const overview = data?.dashboard?.overview ?? data
        const rawOrders: RecentOrder[] = data?.dashboard?.recentOrders ?? []
        const statusStats: { status: string; count: number }[] = data?.dashboard?.orderStatusStats ?? []
        const pendingOrders = statusStats.find((s) => s.status === 'PENDING')?.count ?? 0
        setStats({
          totalRevenue:  overview.periodRevenue   ?? overview.totalRevenue ?? 0,
          totalOrders:   overview.totalOrders     ?? 0,
          pendingOrders,
          totalProducts: overview.totalProducts   ?? 0,
          totalUsers:    overview.totalUsers      ?? 0,
          recentOrders:  rawOrders,
        })
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  const metrics = stats ? [
    { label: 'Order Pending',     value: String(stats.pendingOrders), tone: 'warning' as const, icon: Clock3 },
    { label: 'Revenue Bulan Ini', value: formatRupiah(stats.totalRevenue), tone: 'success' as const, icon: Wallet },
    { label: 'Total Order',       value: String(stats.totalOrders),   tone: 'gold' as const,    icon: ShoppingCart },
    { label: 'Total Produk',      value: String(stats.totalProducts), tone: 'info' as const,    icon: Package },
    { label: 'Total Member',      value: String(stats.totalUsers),    tone: 'info' as const,    icon: Users },
  ] : []

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Dashboard" description="Ringkasan toko hari ini." />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-28 rounded-xl bg-navy-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <section className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {metrics.map((m) => (
            <AdminStatCard key={m.label} label={m.label} value={m.value} icon={m.icon} tone={m.tone} />
          ))}
        </section>
      )}

      <section>
        <Card padding="none" className="overflow-hidden border-navy-100 shadow-elevation-low">
          <div className="flex items-center justify-between border-b border-navy-100 px-4 py-3 md:px-5">
            <h2 className="text-lg font-semibold text-navy-900">Pesanan Terbaru</h2>
            <Link href="/admin/orders" className="text-sm font-semibold text-gold-600 hover:text-gold-500">
              Lihat semua
            </Link>
          </div>
          <div className="p-4 md:p-5">
            <AdminTable
              columns={ORDER_COLUMNS}
              rows={buildOrderRows(stats?.recentOrders ?? [])}
              emptyState={
                <AdminEmptyState
                  title="Belum ada order terbaru"
                  description="Saat order pertama masuk, daftar pesanan terbaru akan muncul di sini."
                  actionHref="/admin/products/new"
                  actionLabel="Tambah Produk"
                />
              }
            />
          </div>
        </Card>
      </section>
    </div>
  )
}

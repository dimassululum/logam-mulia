import Link from 'next/link'
import { ArrowRight, Clock3, ShoppingCart, Wallet } from 'lucide-react'
import type { OrderStatus } from '@/core/types'
import type { AdminTableColumn, AdminTableRow } from '@/shared/ui/AdminTable'
import Badge from '@/shared/ui/Badge'
import { formatRupiah } from '@/core/lib/utils'
import { getOrderBadgeVariant, getOrderStatusLabel } from '@/features/admin/admin-management-data'

export interface DashboardMetric {
  label: string
  value: string
  description?: string
  tone: 'gold' | 'success' | 'warning' | 'info'
  icon: typeof ShoppingCart
}

export interface QuickActionItem {
  title: string
  description: string
  href: string
  ctaLabel: string
  icon: typeof ShoppingCart
}

export interface RecentOrder {
  id: string
  customerName: string
  customerEmail: string
  totalAmount: number
  status: OrderStatus
  createdAt: string
}

export const dashboardMetrics: DashboardMetric[] = [
  {
    label: 'Order Pending',
    value: '18',
    tone: 'warning',
    icon: Clock3,
  },
  {
    label: 'Revenue Bulan Ini',
    value: formatRupiah(845000000),
    tone: 'success',
    icon: Wallet,
  },
  {
    label: 'Order Bulan Ini',
    value: '1.284',
    tone: 'gold',
    icon: ShoppingCart,
  },
]

export const recentOrders: RecentOrder[] = [
  {
    id: 'INV-20260426-001',
    customerName: 'Budi Santoso',
    customerEmail: 'budi.santoso@email.com',
    totalAmount: 12450000,
    status: 'pending',
    createdAt: '2026-04-26T09:15:00+07:00',
  },
  {
    id: 'INV-20260426-002',
    customerName: 'Rina Maharani',
    customerEmail: 'rina.maharani@email.com',
    totalAmount: 5600000,
    status: 'paid',
    createdAt: '2026-04-26T10:00:00+07:00',
  },
  {
    id: 'INV-20260426-003',
    customerName: 'Andi Wijaya',
    customerEmail: 'andi.wijaya@email.com',
    totalAmount: 28250000,
    status: 'processing',
    createdAt: '2026-04-26T11:45:00+07:00',
  },
  {
    id: 'INV-20260425-017',
    customerName: 'Salsabila Putri',
    customerEmail: 'salsabila.putri@email.com',
    totalAmount: 9800000,
    status: 'shipped',
    createdAt: '2026-04-25T16:20:00+07:00',
  },
  {
    id: 'INV-20260424-014',
    customerName: 'Michael Hartono',
    customerEmail: 'michael.hartono@email.com',
    totalAmount: 15000000,
    status: 'cancelled',
    createdAt: '2026-04-24T14:10:00+07:00',
  },
]

export const recentOrderColumns: AdminTableColumn[] = [
  { id: 'order', label: 'Order ID' },
  { id: 'customer', label: 'Customer' },
  { id: 'total', label: 'Total' },
  { id: 'status', label: 'Status' },
  { id: 'date', label: 'Tanggal' },
]

export function formatAdminDate(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function buildRecentOrderRows(orders: RecentOrder[]): AdminTableRow[] {
  return orders.map((order) => ({
    id: order.id,
    href: `/admin/orders/${order.id}`,
    cells: [
      <div key={`${order.id}-ref`}>
        <p className="font-semibold text-navy-900">{order.id}</p>
        <p className="mt-1 text-xs text-navy-500">Klik untuk buka detail</p>
      </div>,
      <div key={`${order.id}-customer`}>
        <p className="font-medium text-navy-900">{order.customerName}</p>
        <p className="mt-1 text-xs text-navy-500">{order.customerEmail}</p>
      </div>,
      <span key={`${order.id}-amount`} className="font-semibold text-navy-900">
        {formatRupiah(order.totalAmount)}
      </span>,
      <Badge
        key={`${order.id}-status`}
        variant={getOrderBadgeVariant(order.status)}
        label={getOrderStatusLabel(order.status)}
      />,
      <span key={`${order.id}-date`} className="text-sm text-navy-600">
        {formatAdminDate(order.createdAt)}
      </span>,
    ],
    mobileTitle: order.id,
    mobileSubtitle: (
      <>
        <span className="font-medium text-navy-900">{order.customerName}</span>
        <span className="block text-xs text-navy-500">{order.customerEmail}</span>
      </>
    ),
    mobileAside: (
      <Badge
        variant={getOrderBadgeVariant(order.status)}
        label={getOrderStatusLabel(order.status)}
      />
    ),
    mobileMeta: (
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-navy-400">Total</p>
          <p className="mt-1 font-semibold text-navy-900">{formatRupiah(order.totalAmount)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.14em] text-navy-400">Tanggal</p>
          <p className="mt-1 font-medium text-navy-700">{formatAdminDate(order.createdAt)}</p>
        </div>
      </div>
    ),
  }))
}

export function buildPlaceholderChecklist(items: string[]) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-sm text-navy-600">
          <span className="mt-1 h-2 w-2 rounded-full bg-gold-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function buildInlineLink(href: string, label: string) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-sm font-semibold text-gold-600 hover:text-gold-500">
      {label}
      <ArrowRight className="h-4 w-4" />
    </Link>
  )
}

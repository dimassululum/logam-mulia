'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import type { OrderStatus } from '@/core/types'
import { formatRupiah } from '@/core/lib/utils'
import {
  adminOrderRecords,
  getOrderBadgeVariant,
  type AdminOrderRecord,
} from '@/features/admin/admin-management-data'
import { FilterInput, FilterSelect, adminSelectClassName } from '@/features/admin/admin-management-shared'
import { FilterModal, FilterToggleButton, IconActionButton, InlineToast, TableToolbar, type ToastTone } from '@/features/admin/admin-ui'
import type { AdminTableColumn, AdminTableRow } from '@/shared/ui/AdminTable'
import { AdminEmptyState, AdminPageHeader, AdminTable, Badge, Button, Card, Input, Modal } from '@/shared/ui'

const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refund', label: 'Refund' },
]

function getStatusLabel(status: OrderStatus) {
  return ORDER_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status
}

export default function OrderManagementScreen() {
  const [orders, setOrders] = useState(adminOrderRecords)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [shippingFilter, setShippingFilter] = useState('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeOrder, setActiveOrder] = useState<AdminOrderRecord | null>(null)
  const [nextStatus, setNextStatus] = useState<OrderStatus>('processing')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const hasActiveFilter = statusFilter !== 'all' || shippingFilter !== 'all'

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const keyword = search.trim().toLowerCase()
        const matchesSearch =
          !keyword ||
          order.id.toLowerCase().includes(keyword) ||
          order.customerName.toLowerCase().includes(keyword) ||
          order.customerEmail.toLowerCase().includes(keyword)

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter
        const matchesShipping =
          shippingFilter === 'all' || order.shippingMethod.toLowerCase().includes(shippingFilter.toLowerCase())

        return matchesSearch && matchesStatus && matchesShipping
      }),
    [orders, search, statusFilter, shippingFilter],
  )

  function showToast(message: string, tone: ToastTone) {
    setToast({ message, tone })
  }

  function openStatusModal(order: AdminOrderRecord) {
    setActiveOrder(order)
    setNextStatus(order.status)
    setTrackingNumber(order.trackingNumber ?? '')
  }

  function resetFilters() {
    setStatusFilter('all')
    setShippingFilter('all')
  }

  function applyStatusUpdate() {
    if (!activeOrder) return
    if (nextStatus === 'shipped' && !trackingNumber.trim()) {
      showToast('Nomor resi wajib diisi.', 'error')
      return
    }
    setOrders((current) =>
      current.map((order) =>
        order.id === activeOrder.id
          ? {
              ...order,
              status: nextStatus,
              trackingNumber: nextStatus === 'shipped' ? trackingNumber.trim() : order.trackingNumber,
              updatedAt: new Date().toISOString(),
            }
          : order,
      ),
    )
    setActiveOrder(null)
    showToast('Status pesanan berhasil diperbarui.', 'success')
  }

  const columns: AdminTableColumn[] = [
    { id: 'order', label: 'Order ID', className: 'w-[18%]' },
    { id: 'customer', label: 'Customer', className: 'w-[22%]' },
    { id: 'item', label: 'Item', className: 'w-[20%]' },
    { id: 'total', label: 'Total', className: 'w-[12%]' },
    { id: 'shipping', label: 'Pengiriman', className: 'w-[15%]' },
    { id: 'status', label: 'Status', className: 'w-[8%]' },
    { id: 'actions', label: 'Aksi', className: 'w-[15%]' },
  ]

  const rows: AdminTableRow[] = filteredOrders.map((order) => ({
    id: order.id,
    cells: [
      <div key={`${order.id}-order`}>
        <p className="font-semibold text-navy-900">{order.id}</p>
        <p className="mt-1 text-xs text-navy-500">{order.customerPhone}</p>
      </div>,
      <div key={`${order.id}-customer`}>
        <p className="font-medium text-navy-900">{order.customerName}</p>
        <p className="mt-1 text-xs text-navy-500">{order.customerEmail}</p>
      </div>,
      <div key={`${order.id}-item`}>
        <p className="font-medium text-navy-900">{order.primaryItem}</p>
        <p className="mt-1 text-xs text-navy-500">{order.itemCount} item</p>
      </div>,
      <span key={`${order.id}-total`} className="font-semibold text-navy-900">{formatRupiah(order.totalAmount)}</span>,
      <div key={`${order.id}-shipping`}>
        <p className="font-medium text-navy-900">{order.shippingMethod}</p>
        <p className="mt-1 text-xs text-navy-500">{order.trackingNumber || '-'}</p>
      </div>,
      <Badge key={`${order.id}-status`} variant={getOrderBadgeVariant(order.status)} label={getStatusLabel(order.status)} />,
      <div key={`${order.id}-actions`} className="flex items-center gap-2">
        <Link
          href={`/admin/orders/${order.id}`}
          aria-label={`Detail ${order.id}`}
          title={`Detail ${order.id}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-navy-200 text-navy-700 transition-colors hover:bg-navy-50"
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
        <IconActionButton label={`Update ${order.id}`} tone="edit" onClick={() => openStatusModal(order)} />
      </div>,
    ],
    mobileTitle: order.id,
    mobileSubtitle: order.customerName,
    mobileAside: <Badge variant={getOrderBadgeVariant(order.status)} label={getStatusLabel(order.status)} />,
    mobileMeta: (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-navy-400">Total</p>
            <p className="mt-1 font-semibold text-navy-900">{formatRupiah(order.totalAmount)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-navy-400">Pengiriman</p>
            <p className="mt-1 font-medium text-navy-700">{order.shippingMethod}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/orders/${order.id}`}
            aria-label={`Detail ${order.id}`}
            title={`Detail ${order.id}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-navy-200 text-navy-700 transition-colors hover:bg-navy-50"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <IconActionButton label={`Update ${order.id}`} tone="edit" onClick={() => openStatusModal(order)} />
        </div>
      </div>
    ),
  }))

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Pesanan" />

      <InlineToast toast={toast} />

      <div className="space-y-4">
        <TableToolbar>
          <div className="w-full min-w-[220px] lg:w-72">
            <FilterInput label="Cari" value={search} onChange={setSearch} placeholder="Cari order atau customer" />
          </div>
          <FilterToggleButton active={hasActiveFilter} onClick={() => setIsFilterOpen(true)} />
          {hasActiveFilter && (
            <Button variant="ghost" className="h-11" onClick={resetFilters}>
              Reset
            </Button>
          )}
        </TableToolbar>

        <AdminTable
          columns={columns}
          rows={rows}
          emptyState={<AdminEmptyState title="Pesanan tidak ditemukan" description="Ubah pencarian atau filter." />}
        />
      </div>

      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Filter Pesanan">
        <div className="grid gap-4">
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={[{ value: 'all', label: 'Semua status' }, ...ORDER_STATUS_OPTIONS]} />
          <FilterSelect
            label="Pengiriman"
            value={shippingFilter}
            onChange={setShippingFilter}
            options={[
              { value: 'all', label: 'Semua pengiriman' },
              { value: 'JNE', label: 'JNE' },
              { value: 'J&T', label: 'J&T' },
              { value: 'Paxel', label: 'Paxel' },
              { value: 'Pos', label: 'Pos' },
              { value: 'Self Pickup', label: 'Self Pickup' },
            ]}
          />
        </div>
      </FilterModal>

      <Modal isOpen={activeOrder !== null} onClose={() => setActiveOrder(null)} title="Update Status" size="md">
        <div className="space-y-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-navy-700">
            Status
            <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as OrderStatus)} className={adminSelectClassName}>
              {ORDER_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          {nextStatus === 'shipped' && <Input id="tracking-number" label="Nomor resi" value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} />}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setActiveOrder(null)}>Batal</Button>
            <Button onClick={applyStatusUpdate}>Simpan</Button>
          </div>
        </div>
      </Modal>

    </div>
  )
}

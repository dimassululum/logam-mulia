'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowUpRight, HelpCircle, MessageCircle } from 'lucide-react'
import type { OrderStatus } from '@/core/types'
import { formatRupiah } from '@/core/lib/utils'
import {
  getOrderBadgeVariant,
  getOrderStatusLabel,
  type AdminOrderRecord,
} from '@/features/admin/admin-management-data'
import { fetchAdminOrders, updateAdminOrderStatus } from '@/features/orders/order-api'
import { FilterInput, FilterSelect, adminSelectClassName } from '@/features/admin/admin-management-shared'
import { FilterModal, FilterToggleButton, IconActionButton, InlineToast, TableToolbar, type ToastTone } from '@/features/admin/admin-ui'
import type { AdminTableColumn, AdminTableRow } from '@/shared/ui/AdminTable'
import { AdminEmptyState, AdminPageHeader, AdminTable, Badge, Button, Modal } from '@/shared/ui'
import { SHIPPING_CARRIERS, ShippingCarrierLabel, ShippingCarrierLogo } from '@/features/shipping/shipping-carriers'

const ORDER_PAGE_SIZE = 20

const STATUS_FILTER_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'success', label: 'Success' },
  { value: 'canceled', label: 'Canceled' },
]

const UPDATE_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'paid', label: 'Paid' },
  { value: 'success', label: 'Success' },
  { value: 'canceled', label: 'Canceled' },
]

const SHIPPING_FILTER_OPTIONS = [
  { value: 'all', label: 'Semua pengiriman' },
  ...SHIPPING_CARRIERS.map((carrier) => ({ value: carrier.code, label: carrier.label, carrier: carrier.code })),
  { value: 'Self Pickup', label: 'Self Pickup' },
]

const STATUS_GUIDE: { status: OrderStatus; description: string }[] = [
  { status: 'unpaid', description: 'Pengguna sudah membuat pesanan, tetapi belum upload bukti pembayaran.' },
  { status: 'pending', description: 'Pengguna sudah pesan dan upload bukti pembayaran. Menunggu konfirmasi admin.' },
  { status: 'paid', description: 'Pembayaran sudah dikonfirmasi admin.' },
  { status: 'canceled', description: 'Admin membatalkan pesanan.' },
  { status: 'success', description: 'Pesanan berhasil dikirim dengan ekspedisi atau diberikan di butik yang dipilih.' },
]

function normalizeWhatsappPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  return digits.startsWith('0') ? `62${digits.slice(1)}` : digits.startsWith('8') ? `62${digits}` : digits
}

function buildWhatsappUrl(phone: string) {
  const normalized = normalizeWhatsappPhone(phone)
  return normalized ? `https://wa.me/${normalized}` : null
}

function buildWhatsappBusinessUrl(phone: string) {
  const normalized = normalizeWhatsappPhone(phone)
  if (!normalized) return null
  if (typeof navigator === 'undefined') return `https://wa.me/${normalized}`

  const userAgent = navigator.userAgent.toLowerCase()
  if (/android/.test(userAgent)) {
    return `intent://send?phone=${normalized}#Intent;scheme=whatsapp;package=com.whatsapp.w4b;end`
  }
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return `whatsapp-business://send?phone=${normalized}`
  }

  return `https://wa.me/${normalized}`
}

function openWhatsappBusiness(phone: string) {
  const url = buildWhatsappBusinessUrl(phone)
  if (!url) return
  if (url.startsWith('https://')) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }
  window.location.href = url
}

function getPaymentAwareStatusLabel(order: AdminOrderRecord) {
  return getOrderStatusLabel(order.status)
}

function ShippingFilterPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-navy-700">Pengiriman</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {SHIPPING_FILTER_OPTIONS.map((option) => {
          const selected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                selected
                  ? 'border-gold-400 bg-gold-50 text-navy-900'
                  : 'border-navy-100 bg-white text-navy-700 hover:border-gold-200 hover:bg-gold-50/50'
              }`}
              aria-pressed={selected}
            >
              {'carrier' in option && option.carrier ? (
                <ShippingCarrierLogo carrier={option.carrier} className="h-8 w-12" />
              ) : (
                <span className="flex h-8 w-12 shrink-0 items-center justify-center rounded-md border border-navy-100 bg-navy-50 text-[10px] font-bold uppercase tracking-wide text-navy-500">
                  {option.value === 'all' ? 'All' : 'Pickup'}
                </span>
              )}
              <span className="min-w-0 truncate">{option.label}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export default function OrderManagementScreen() {
  const [orders, setOrders] = useState<AdminOrderRecord[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingStatus, setIsSavingStatus] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [shippingFilter, setShippingFilter] = useState('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isGuideOpen, setIsGuideOpen] = useState(false)
  const [activeOrder, setActiveOrder] = useState<AdminOrderRecord | null>(null)
  const [nextStatus, setNextStatus] = useState<OrderStatus>('pending')
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: ORDER_PAGE_SIZE, totalPages: 1 })

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    let alive = true

    async function loadOrders() {
      setIsLoading(true)
      try {
        const result = await fetchAdminOrders({
          page: currentPage,
          limit: ORDER_PAGE_SIZE,
          search,
          status: statusFilter,
          shipping: shippingFilter,
        })
        if (alive) {
          setOrders(result.data)
          setPagination(result.meta)
        }
      } catch {
        if (alive) showToast('Gagal memuat pesanan dari backend.', 'error')
      } finally {
        if (alive) setIsLoading(false)
      }
    }

    const timeout = window.setTimeout(loadOrders, search.trim() ? 300 : 0)
    return () => {
      alive = false
      window.clearTimeout(timeout)
    }
  }, [currentPage, search, shippingFilter, statusFilter])

  const hasActiveFilter = statusFilter !== 'all' || shippingFilter !== 'all'

  function showToast(message: string, tone: ToastTone) {
    setToast({ message, tone })
  }

  function openStatusModal(order: AdminOrderRecord) {
    setActiveOrder(order)
    setNextStatus(['unpaid', 'pending'].includes(order.status) ? 'paid' : order.status === 'paid' ? 'success' : 'canceled')
  }

  function resetFilters() {
    setCurrentPage(1)
    setSearch('')
    setStatusFilter('all')
    setShippingFilter('all')
  }

  function handleSearchChange(value: string) {
    setCurrentPage(1)
    setSearch(value)
  }

  function handleStatusFilterChange(value: string) {
    setCurrentPage(1)
    setStatusFilter(value)
  }

  function handleShippingFilterChange(value: string) {
    setCurrentPage(1)
    setShippingFilter(value)
  }

  async function applyStatusUpdate() {
    if (!activeOrder) return
    setIsSavingStatus(true)
    try {
      const updated = await updateAdminOrderStatus(activeOrder.id, nextStatus)
      setOrders((current) => current.map((order) => (order.id === updated.id ? updated : order)))
      setActiveOrder(null)
      showToast('Status pesanan berhasil diperbarui.', 'success')
    } catch {
      showToast('Gagal memperbarui status pesanan.', 'error')
    } finally {
      setIsSavingStatus(false)
    }
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

  const availableStatusOptions = activeOrder && ['unpaid', 'pending'].includes(activeOrder.status)
    ? UPDATE_STATUS_OPTIONS.filter((option) => option.value === 'paid' || option.value === 'canceled')
    : activeOrder?.status === 'paid'
      ? UPDATE_STATUS_OPTIONS.filter((option) => option.value === 'success' || option.value === 'canceled')
      : UPDATE_STATUS_OPTIONS.filter((option) => option.value === 'canceled')

  const rows: AdminTableRow[] = orders.map((order) => {
    const whatsappUrl = buildWhatsappUrl(order.customerPhone)
    const canUpdateStatus = !['success', 'canceled', 'cancelled', 'completed', 'selesai', 'refund'].includes(order.status)

    return {
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
          <p className="font-medium text-navy-900">
            <ShippingCarrierLabel carrier={order.shippingMethod} />
          </p>
          <p className="mt-1 text-xs text-navy-500">{order.trackingNumber || '-'}</p>
        </div>,
        <Badge key={`${order.id}-status`} variant={getOrderBadgeVariant(order.status)} label={getPaymentAwareStatusLabel(order)} />,
        <div key={`${order.id}-actions`} className="flex items-center gap-2">
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              onClick={(event) => {
                event.preventDefault()
                openWhatsappBusiness(order.customerPhone)
              }}
              rel="noopener noreferrer"
              aria-label={`WhatsApp Business ${order.customerName}`}
              title={`WhatsApp Business ${order.customerName}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 text-emerald-600 transition-colors hover:bg-emerald-50"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          ) : (
            <button
              type="button"
              disabled
              aria-label={`WhatsApp ${order.customerName} belum tersedia`}
              title="Nomor WhatsApp belum tersedia"
              className="inline-flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-lg border border-navy-100 text-navy-300"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
          )}
          <Link
            href={`/admin/orders/${order.id}`}
            aria-label={`Detail ${order.id}`}
            title={`Detail ${order.id}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-navy-200 text-navy-700 transition-colors hover:bg-navy-50"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          {canUpdateStatus ? <IconActionButton label={`Update ${order.id}`} tone="edit" onClick={() => openStatusModal(order)} /> : null}
        </div>,
      ],
      mobileTitle: order.id,
      mobileSubtitle: order.customerName,
      mobileAside: <Badge variant={getOrderBadgeVariant(order.status)} label={getPaymentAwareStatusLabel(order)} />,
      mobileMeta: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-navy-400">Total</p>
              <p className="mt-1 font-semibold text-navy-900">{formatRupiah(order.totalAmount)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-navy-400">Pengiriman</p>
              <p className="mt-1 font-medium text-navy-700">
                <ShippingCarrierLabel carrier={order.shippingMethod} />
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                onClick={(event) => {
                  event.preventDefault()
                  openWhatsappBusiness(order.customerPhone)
                }}
                rel="noopener noreferrer"
                aria-label={`WhatsApp Business ${order.customerName}`}
                title={`WhatsApp Business ${order.customerName}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 text-emerald-600 transition-colors hover:bg-emerald-50"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            ) : (
              <button
                type="button"
                disabled
                aria-label={`WhatsApp ${order.customerName} belum tersedia`}
                title="Nomor WhatsApp belum tersedia"
                className="inline-flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-lg border border-navy-100 text-navy-300"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
            )}
            <Link
              href={`/admin/orders/${order.id}`}
              aria-label={`Detail ${order.id}`}
              title={`Detail ${order.id}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-navy-200 text-navy-700 transition-colors hover:bg-navy-50"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            {canUpdateStatus ? <IconActionButton label={`Update ${order.id}`} tone="edit" onClick={() => openStatusModal(order)} /> : null}
          </div>
        </div>
      ),
    }
  })

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Pesanan"
        actions={
          <Button variant="secondary" onClick={() => setIsGuideOpen(true)}>
            <HelpCircle className="h-4 w-4" />
            Panduan Status
          </Button>
        }
      />

      <InlineToast toast={toast} />

      <div className="space-y-4">
        <TableToolbar>
          <div className="w-full min-w-[220px] lg:w-72">
            <FilterInput label="Cari" value={search} onChange={handleSearchChange} placeholder="Cari order atau customer" />
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
          emptyState={<AdminEmptyState title={isLoading ? 'Memuat pesanan...' : 'Pesanan tidak ditemukan'} description={isLoading ? 'Data sedang diambil dari backend.' : 'Ubah pencarian atau filter.'} />}
        />
        <div className="flex flex-col gap-3 rounded-2xl border border-navy-100 bg-white p-4 text-sm text-navy-600 shadow-elevation-low sm:flex-row sm:items-center sm:justify-between">
          <p>
            Menampilkan halaman <span className="font-semibold text-navy-900">{pagination.page}</span> dari{' '}
            <span className="font-semibold text-navy-900">{Math.max(1, pagination.totalPages)}</span> ({pagination.total} pesanan)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              Sebelumnya
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage >= pagination.totalPages || isLoading}
              onClick={() => setCurrentPage((page) => Math.min(Math.max(1, pagination.totalPages), page + 1))}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </div>

      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Filter Pesanan">
        <div className="grid gap-4">
          <FilterSelect label="Status" value={statusFilter} onChange={handleStatusFilterChange} options={[{ value: 'all', label: 'Semua status' }, ...STATUS_FILTER_OPTIONS]} />
          <ShippingFilterPicker value={shippingFilter} onChange={handleShippingFilterChange} />
        </div>
      </FilterModal>

      <Modal isOpen={activeOrder !== null} onClose={() => setActiveOrder(null)} title="Update Status" size="md">
        <div className="space-y-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-navy-700">
            Status
            <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as OrderStatus)} className={adminSelectClassName}>
              {availableStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setActiveOrder(null)} disabled={isSavingStatus}>Batal</Button>
            <Button onClick={applyStatusUpdate} isLoading={isSavingStatus}>Simpan</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} title="Panduan Status Pesanan" size="md">
        <div className="space-y-3">
          {STATUS_GUIDE.map((item) => (
            <div key={item.status} className="rounded-xl border border-navy-100 bg-white p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={getOrderBadgeVariant(item.status)} label={getOrderStatusLabel(item.status)} />
                <p className="text-sm font-medium text-navy-700">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>

    </div>
  )
}

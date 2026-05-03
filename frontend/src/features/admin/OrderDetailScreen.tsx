'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, Clock3, CreditCard, ExternalLink, IdCard, Package, Store, TicketX, Truck, UserRound } from 'lucide-react'
import type { OrderStatus } from '@/core/types'
import { cn, formatRupiah } from '@/core/lib/utils'
import {
  getOrderBadgeVariant,
  type AdminOrderTimelineEvent,
  type AdminOrderDetailRecord,
} from '@/features/admin/admin-management-data'
import { InlineToast, type ToastTone } from '@/features/admin/admin-ui'
import { AdminPageHeader, Badge, Button, Card, Input, Modal } from '@/shared/ui'

function getOrderStatusHeadline(status: OrderStatus) {
  switch (status) {
    case 'paid':
      return 'PAID (Lunas)'
    case 'pending':
      return 'PENDING'
    case 'processing':
      return 'PROCESSING'
    case 'shipped':
      return 'SHIPPED'
    case 'delivered':
      return 'DELIVERED'
    case 'completed':
      return 'COMPLETED'
    case 'cancelled':
      return 'CANCELLED'
    case 'refund':
      return 'REFUND'
    default:
      return String(status).toUpperCase()
  }
}

function getOrderStampLabel(status: OrderStatus) {
  switch (status) {
    case 'paid':
      return 'PAID'
    case 'pending':
      return 'PENDING'
    case 'processing':
      return 'PROCESSING'
    case 'shipped':
      return 'SHIPPED'
    case 'delivered':
      return 'DELIVERED'
    case 'completed':
      return 'COMPLETED'
    case 'cancelled':
      return 'CANCELLED'
    case 'refund':
      return 'REFUND'
    default:
      return String(status).toUpperCase()
  }
}

function formatDetailDate(date: string) {
  const parts = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).formatToParts(new Date(date))

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return `${values.day} ${values.month} ${values.year} pukul ${values.hour}.${values.minute} WIB`
}

function SectionCard({
  title,
  icon,
  children,
  className,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card padding="md" className={cn('border-navy-100 shadow-elevation-low', className)}>
      <div className="mb-4 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gold-50 text-gold-700">
          {icon}
        </div>
        <h2 className="text-lg font-semibold text-navy-900">{title}</h2>
      </div>
      {children}
    </Card>
  )
}

function MetaRow({
  label,
  value,
  mono = false,
  strong = false,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
  strong?: boolean
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-3">
      <p className="text-sm text-navy-500">{label}</p>
      <div className={cn('text-sm text-navy-800', mono && 'font-mono text-[13px]', strong && 'font-semibold text-navy-900')}>
        {value}
      </div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  emphasis = false,
  negative = false,
}: {
  label: string
  value: string
  emphasis?: boolean
  negative?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className={cn('text-navy-600', emphasis && 'text-base font-semibold uppercase tracking-[0.12em] text-navy-900')}>
        {label}
      </span>
      <span className={cn('font-semibold text-navy-900', negative && 'text-red-600', emphasis && 'text-xl')}>
        {negative ? `- ${value}` : value}
      </span>
    </div>
  )
}

function DocumentPreview({ order }: { order: AdminOrderDetailRecord }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-navy-200 bg-gradient-to-br from-gold-50 via-white to-navy-50 p-4">
      <div className="absolute inset-y-0 right-0 w-24 bg-[radial-gradient(circle_at_center,_rgba(212,168,75,0.22),_transparent_70%)]" />
      <div className="relative space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-700">Thumbnail KTP</p>
        <p className="text-sm font-semibold text-navy-900">{order.recipientDetail.ktpDocumentLabel}</p>
        <p className="text-sm text-navy-700">{order.recipientDetail.name.toUpperCase()}</p>
        <p className="text-xs text-navy-500">{order.recipientDetail.city}, {order.recipientDetail.province}</p>
      </div>
    </div>
  )
}

function TimelineItem({ event, isLast }: { event: AdminOrderTimelineEvent; isLast: boolean }) {
  return (
    <div className="relative flex gap-4">
      <div className="relative flex w-5 justify-center">
        {!isLast ? <span className="absolute top-5 h-[calc(100%+1rem)] w-px bg-navy-200" /> : null}
        <span
          className={cn(
            'relative mt-1 h-3.5 w-3.5 rounded-full border-2 bg-white',
            event.tone === 'success' && 'border-emerald-400',
            event.tone === 'warning' && 'border-amber-400',
            (!event.tone || event.tone === 'info') && 'border-blue-400',
          )}
        />
      </div>
      <div className="flex-1 rounded-2xl border border-navy-100 bg-white p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-semibold text-navy-900">{event.title}</p>
            <p className="mt-1 text-sm leading-6 text-navy-600">{event.description}</p>
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-navy-500">
            {formatDetailDate(event.occurredAt)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function OrderDetailScreen({ initialOrder }: { initialOrder: AdminOrderDetailRecord }) {
  const [status, setStatus] = useState<OrderStatus>(initialOrder.status)
  const [updatedAt, setUpdatedAt] = useState(initialOrder.updatedAt)
  const [receiptCode, setReceiptCode] = useState(initialOrder.receiptCode)
  const [receiptUpdatedAt, setReceiptUpdatedAt] = useState(initialOrder.receiptUpdatedAt)
  const [timeline, setTimeline] = useState(initialOrder.timeline)
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)
  const [isDocumentOpen, setIsDocumentOpen] = useState(false)
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false)
  const [trackingInput, setTrackingInput] = useState(initialOrder.receiptCode === '-' ? '' : initialOrder.receiptCode)

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const order = useMemo(
    () => ({
      ...initialOrder,
      status,
      updatedAt,
      receiptCode,
      receiptUpdatedAt,
      timeline,
    }),
    [initialOrder, receiptCode, receiptUpdatedAt, status, timeline, updatedAt],
  )

  function pushTimeline(nextStatus: OrderStatus, title: string, description: string, tone: ToastTone = 'success') {
    const now = new Date().toISOString()
    setStatus(nextStatus)
    setUpdatedAt(now)
    setTimeline((current) => [
      {
        id: `${nextStatus}-${now}`,
        title,
        description,
        occurredAt: now,
        tone: tone === 'success' ? 'success' : 'warning',
      },
      ...current,
    ])
  }

  function handleTrackingSave() {
    if (!trackingInput.trim()) {
      setToast({ message: 'Nomor resi wajib diisi.', tone: 'error' })
      return
    }

    const now = new Date().toISOString()
    setReceiptCode(trackingInput.trim())
    setReceiptUpdatedAt(now)
    setStatus('shipped')
    setUpdatedAt(now)
    setTimeline((current) => [
      {
        id: `resi-${now}`,
        title: 'Resi diinput',
        description: `Nomor resi ${trackingInput.trim()} sudah dimasukkan oleh admin.`,
        occurredAt: now,
        tone: 'info',
      },
      ...current,
    ])
    setIsTrackingModalOpen(false)
    setToast({ message: 'Resi berhasil disimpan.', tone: 'success' })
  }

  function handleRefund() {
    pushTimeline('refund', 'Refund diproses', 'Order ditandai refund dari halaman detail order.', 'success')
    setToast({ message: 'Order ditandai refund.', tone: 'success' })
  }

  function handleMarkReceived() {
    pushTimeline('delivered', 'Pesanan diterima', 'Admin menandai bahwa pesanan sudah diterima customer.', 'success')
    setToast({ message: 'Order ditandai diterima.', tone: 'success' })
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-20 -mx-4 border-b border-navy-100 bg-white/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <AdminPageHeader
          title="Detail Order"
          actions={
            <>
              <Link href="/admin/orders">
                <Button variant="ghost">
                  <ArrowLeft className="h-4 w-4" />
                  Kembali
                </Button>
              </Link>
              <Button variant="secondary" onClick={() => setIsTrackingModalOpen(true)}>
                <Truck className="h-4 w-4" />
                Input Resi
              </Button>
              <Button variant="danger" onClick={handleRefund}>
                <TicketX className="h-4 w-4" />
                Refund
              </Button>
              <Button onClick={handleMarkReceived}>
                <CheckCircle2 className="h-4 w-4" />
                Tandai Diterima
              </Button>
            </>
          }
        />
      </div>

      <InlineToast toast={toast} />

      <Card padding="none" className="relative overflow-hidden border-navy-100 shadow-elevation-low">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className={cn(
              'absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 rotate-[-18deg] rounded-[28px] border-[5px] px-10 py-4 text-4xl font-semibold tracking-[0.38em] opacity-0 transition-opacity md:text-6xl',
              order.status === 'paid' && 'border-emerald-400/20 text-emerald-500/20 opacity-100',
            )}
          >
            {getOrderStampLabel(order.status)}
          </div>
        </div>

        <div className="relative space-y-6 p-5 md:p-6">
          <SectionCard title="Informasi Umum Pesanan" icon={<IdCard className="h-5 w-5" />}>
            <div className="grid gap-3 md:grid-cols-2">
              <MetaRow label="ID Pesanan" value={`#${order.id}`} mono strong />
              <MetaRow label="Status" value={<Badge variant={getOrderBadgeVariant(order.status)} label={getOrderStatusHeadline(order.status)} />} />
              <MetaRow label="Tanggal Pesanan" value={formatDetailDate(order.createdAt)} />
              <MetaRow label="Total Tagihan" value={formatRupiah(order.grandTotalAmount)} strong />
            </div>
          </SectionCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Detail Pelanggan" icon={<UserRound className="h-5 w-5" />}>
              <div className="space-y-3">
                <MetaRow label="Nama" value={order.customerDetail.name} strong />
                <MetaRow label="Telepon" value={order.customerDetail.phone} />
                <MetaRow label="Email" value={order.customerDetail.email} />
                <div className="space-y-3 pt-2">
                  <DocumentPreview order={order} />
                  <div>
                    <Button variant="secondary" size="sm" onClick={() => setIsDocumentOpen(true)}>
                      <ExternalLink className="h-4 w-4" />
                      Lihat KTP
                    </Button>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Detail Pembayaran" icon={<CreditCard className="h-5 w-5" />}>
              <div className="space-y-3">
                <MetaRow label="Metode" value={order.paymentMethod} strong />
                <MetaRow label="Tanggal Order" value={formatDetailDate(order.createdAt)} />
                <MetaRow label="Terakhir Diperbarui" value={formatDetailDate(order.updatedAt)} />
                <div className="rounded-2xl bg-navy-50 p-4">
                  <div className="space-y-3">
                    <SummaryRow label="Subtotal Produk" value={formatRupiah(order.subtotalAmount)} />
                    <SummaryRow label="Biaya Pengiriman" value={formatRupiah(order.shippingFee)} />
                    <SummaryRow label="Voucher" value={formatRupiah(order.voucherAmount)} negative />
                    <div className="border-t border-navy-200" />
                    <SummaryRow label="Total Tagihan" value={formatRupiah(order.grandTotalAmount)} emphasis />
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Detail Produk" icon={<Package className="h-5 w-5" />}>
              <div className="space-y-3">
                {order.lineItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-navy-100 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-navy-900">{item.productName}</p>
                        <div className="mt-2 space-y-1 text-sm text-navy-600">
                          <p>Jumlah: {item.quantity}</p>
                          <p>Harga Satuan: {formatRupiah(item.unitPrice)}</p>
                        </div>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-xs uppercase tracking-[0.16em] text-navy-500">Total Harga</p>
                        <p className="mt-1 text-lg font-semibold text-navy-900">{formatRupiah(item.totalPrice)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Metode Penerimaan Barang"
              icon={order.fulfillmentDetail.method === 'self_pickup' ? <Store className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
            >
              <div className="mb-4">
                <Badge
                  variant={order.fulfillmentDetail.method === 'self_pickup' ? 'gold' : 'navy'}
                  label={order.fulfillmentDetail.method === 'self_pickup' ? 'Pengambilan di Butik' : 'Dikirim via Ekspedisi'}
                />
              </div>

              <div className="space-y-3">
                {order.fulfillmentDetail.method === 'self_pickup' ? (
                  <>
                    <MetaRow label="Butik" value={order.fulfillmentDetail.boutiqueName ?? '-'} strong />
                    <MetaRow label="Alamat Butik" value={order.fulfillmentDetail.boutiqueAddress ?? '-'} />
                    <MetaRow label="Kode Pickup" value={order.fulfillmentDetail.pickupCode ?? '-'} mono strong />
                    <MetaRow label="Jadwal Pickup" value={order.fulfillmentDetail.pickupWindow ?? '-'} />
                    <MetaRow label="PIC Butik" value={order.fulfillmentDetail.contactPerson ?? '-'} />
                    <MetaRow label="Catatan" value={order.fulfillmentDetail.note ?? '-'} />
                  </>
                ) : (
                  <>
                    <MetaRow label="Kurir" value={order.fulfillmentDetail.courier ?? order.shippingMethod} strong />
                    <MetaRow label="Layanan" value={order.fulfillmentDetail.serviceLabel ?? order.shippingMethod} />
                    <MetaRow label="Nama Penerima" value={order.recipientDetail.name} />
                    <MetaRow label="Telepon" value={order.recipientDetail.phone} />
                    <MetaRow label="Alamat" value={order.recipientDetail.address} />
                    <MetaRow
                      label="Wilayah"
                      value={`${order.recipientDetail.village}, ${order.recipientDetail.district}, ${order.recipientDetail.city}, ${order.recipientDetail.province}`}
                    />
                    <MetaRow label="Kode Pos" value={order.recipientDetail.postalCode} mono />
                    <MetaRow label="Resi" value={order.receiptCode} mono strong />
                  </>
                )}
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Timeline Transaksi" icon={<Clock3 className="h-5 w-5" />}>
            <div className="space-y-4">
              {order.timeline.map((event, index) => (
                <TimelineItem key={event.id} event={event} isLast={index === order.timeline.length - 1} />
              ))}
            </div>
          </SectionCard>
        </div>
      </Card>

      <Modal isOpen={isDocumentOpen} onClose={() => setIsDocumentOpen(false)} title="Dokumen KTP" size="lg">
        <div className="space-y-4">
          <DocumentPreview order={order} />
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-navy-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500">Nama pada dokumen</p>
              <p className="mt-2 font-semibold text-navy-900">{order.recipientDetail.name}</p>
            </div>
            <div className="rounded-2xl bg-navy-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500">Kontak</p>
              <p className="mt-2 font-semibold text-navy-900">{order.recipientDetail.phone}</p>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isTrackingModalOpen} onClose={() => setIsTrackingModalOpen(false)} title="Input Resi" size="md">
        <div className="space-y-4">
          <Input
            id="tracking-number"
            label="Nomor resi"
            value={trackingInput}
            onChange={(event) => setTrackingInput(event.target.value)}
            placeholder="Masukkan nomor resi"
          />
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setIsTrackingModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleTrackingSave}>Simpan Resi</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

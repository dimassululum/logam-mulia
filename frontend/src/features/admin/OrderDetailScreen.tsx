'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle2, CreditCard, ExternalLink, IdCard, Package, Store, Truck, UserRound, XCircle } from 'lucide-react'
import type { OrderStatus } from '@/core/types'
import { cn, formatRupiah } from '@/core/lib/utils'
import { resolvePublicAssetUrl } from '@/core/lib/public-url'
import {
  getOrderBadgeVariant,
  type AdminOrderDetailRecord,
} from '@/features/admin/admin-management-data'
import { confirmAdminOrderPayment, fetchAdminOrder, updateAdminOrderStatus } from '@/features/orders/order-api'
import { InlineToast, type ToastTone } from '@/features/admin/admin-ui'
import { AdminPageHeader, Badge, Button, Card, Modal } from '@/shared/ui'
import { ShippingCarrierLabel } from '@/features/shipping/shipping-carriers'

function normalizeOrderStatus(status: OrderStatus): OrderStatus {
  if (['processing'].includes(status)) return 'paid'
  if (['shipped', 'delivered', 'completed', 'selesai'].includes(status)) return 'success'
  if (status === 'cancelled') return 'canceled'
  return status
}

function getOrderStatusHeadline(status: OrderStatus) {
  switch (normalizeOrderStatus(status)) {
    case 'unpaid':
      return 'Unpaid'
    case 'paid':
      return 'Paid'
    case 'success':
      return 'Success'
    case 'pending':
      return 'Pending'
    case 'canceled':
      return 'Canceled'
    default:
      return String(status)
  }
}

function getPaymentStatusHeadline(order: AdminOrderDetailRecord) {
  return getOrderStatusHeadline(order.status)
}

function getOrderStampLabel(status: OrderStatus) {
  switch (normalizeOrderStatus(status)) {
    case 'unpaid':
      return 'UNPAID'
    case 'paid':
      return 'PAID'
    case 'success':
      return 'SUCCESS'
    case 'pending':
      return 'PENDING'
    case 'canceled':
      return 'CANCELED'
    default:
      return String(status).toUpperCase()
  }
}

function getWatermarkClassName(status: OrderStatus) {
  switch (normalizeOrderStatus(status)) {
    case 'unpaid':
      return 'text-slate-500/10'
    case 'paid':
      return 'text-emerald-600/10'
    case 'success':
      return 'text-blue-600/10'
    case 'canceled':
      return 'text-red-600/10'
    case 'pending':
      return 'text-amber-500/10'
    default:
      return 'text-navy-900/10'
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
    <Card padding="md" className={cn('border-navy-100 bg-white/78 shadow-elevation-low backdrop-blur-[1px]', className)}>
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

function AntamColorLogo() {
  const maskStyle = {
    WebkitMaskImage: "url('/images/antam.png')",
    maskImage: "url('/images/antam.png')",
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
  } as React.CSSProperties

  return (
    <div aria-label="Antam" role="img" className="relative h-[52px] w-[180px] overflow-hidden sm:h-[62px] sm:w-[214px]">
      <div className="absolute inset-0 bg-[#1f7067]" style={{ ...maskStyle, clipPath: 'inset(0 0 0 0)' }} />
      <div className="absolute inset-0 bg-[#f59c00]" style={{ ...maskStyle, clipPath: 'inset(48% 70% 0 0)' }} />
      <div className="absolute inset-0 bg-[#ed1c24]" style={{ ...maskStyle, clipPath: 'inset(0 0 0 82%)' }} />
    </div>
  )
}

export default function OrderDetailScreen({
  initialOrder,
  orderId,
}: {
  initialOrder?: AdminOrderDetailRecord
  orderId?: string
}) {
  const [order, setOrder] = useState<AdminOrderDetailRecord | null>(initialOrder ?? null)
  const [isLoading, setIsLoading] = useState(!initialOrder && Boolean(orderId))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!orderId || initialOrder) return
    let alive = true

    async function loadOrder() {
      try {
        const data = await fetchAdminOrder(orderId)
        if (alive) setOrder(data)
      } catch {
        if (alive) setError('Gagal memuat detail pesanan.')
      } finally {
        if (alive) setIsLoading(false)
      }
    }

    loadOrder()
    return () => {
      alive = false
    }
  }, [initialOrder, orderId])

  if (isLoading) {
    return (
      <Card padding="md" className="border-navy-100 shadow-elevation-low">
        <p className="text-sm text-navy-600">Memuat detail pesanan...</p>
      </Card>
    )
  }

  if (!order || error) {
    return (
      <Card padding="md" className="border-navy-100 shadow-elevation-low">
        <p className="text-sm text-navy-600">{error || 'Pesanan tidak ditemukan.'}</p>
      </Card>
    )
  }

  return <OrderDetailContent initialOrder={order} />
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
  const publicKtpUrl = getPublicKtpUrl(order)
  return (
    <div className="relative overflow-hidden rounded-2xl border border-navy-200 bg-white/70 p-4">
      {publicKtpUrl ? (
        <Image src={publicKtpUrl} alt={`KTP ${order.recipientDetail.name}`} width={640} height={400} unoptimized className="max-h-52 w-full rounded-xl object-contain" />
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-700">Thumbnail KTP</p>
          <p className="text-sm font-semibold text-navy-900">{order.recipientDetail.ktpDocumentLabel}</p>
        </div>
      )}
    </div>
  )
}

function OrderItemImage({ src, alt }: { src?: string | null; alt: string }) {
  const resolvedSrc = resolvePublicAssetUrl(src) || '/images/metal-gold.jpg'
  const [imageSrc, setImageSrc] = useState(resolvedSrc)

  useEffect(() => {
    setImageSrc(resolvedSrc)
  }, [resolvedSrc])

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      unoptimized
      sizes="64px"
      className="object-cover"
      onError={() => setImageSrc('/images/metal-gold.jpg')}
    />
  )
}

function getPublicKtpUrl(order: AdminOrderDetailRecord) {
  return resolvePublicAssetUrl(order.recipientDetail.ktpUrl) || null
}

function getPublicPaymentProofUrl(order: AdminOrderDetailRecord) {
  return resolvePublicAssetUrl(order.paymentProofUrl) || null
}

function OrderDetailContent({ initialOrder }: { initialOrder: AdminOrderDetailRecord }) {
  const [isDocumentOpen, setIsDocumentOpen] = useState(false)
  const [isPaymentProofOpen, setIsPaymentProofOpen] = useState(false)
  const [isCancelOrderOpen, setIsCancelOrderOpen] = useState(false)
  const [order, setOrder] = useState(initialOrder)
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false)
  const [isCancelingOrder, setIsCancelingOrder] = useState(false)
  const [paymentActionError, setPaymentActionError] = useState('')
  const [cancelActionError, setCancelActionError] = useState('')
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)
  const publicKtpUrl = getPublicKtpUrl(order)
  const publicPaymentProofUrl = getPublicPaymentProofUrl(order)
  const normalizedStatus = normalizeOrderStatus(order.status)
  const isGatewayOrder = ['midtrans', 'duitku'].includes(String(order.paymentMethodConfig?.provider || ''))
  const isGatewayPaid = isGatewayOrder && ['paid', 'success', 'completed', 'selesai'].includes(normalizedStatus)
  const gatewayProviderLabel = order.paymentMethodConfig?.provider === 'duitku' ? 'Duitku' : 'Midtrans'
  const canCancelOrder = !['canceled', 'refund', 'success'].includes(normalizedStatus)
  const canMarkPaid = !isGatewayOrder && (normalizedStatus === 'unpaid' || normalizedStatus === 'pending')
  const canMarkSuccess = normalizedStatus === 'paid'

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  async function handleConfirmPayment() {
    setIsConfirmingPayment(true)
    setPaymentActionError('')
    try {
      const updated = await confirmAdminOrderPayment(order.id)
      setOrder(updated)
      setToast({ message: 'Pembayaran berhasil dikonfirmasi.', tone: 'success' })
    } catch {
      setPaymentActionError('Gagal mengonfirmasi pembayaran.')
      setToast({ message: 'Gagal mengonfirmasi pembayaran.', tone: 'error' })
    } finally {
      setIsConfirmingPayment(false)
    }
  }

  async function handleCancelOrder() {
    setIsCancelingOrder(true)
    setCancelActionError('')
    try {
      const updated = await updateAdminOrderStatus(order.id, 'canceled')
      setOrder(updated)
      setIsCancelOrderOpen(false)
      setToast({ message: 'Pesanan berhasil dibatalkan.', tone: 'success' })
    } catch {
      setCancelActionError('Gagal membatalkan pesanan.')
      setToast({ message: 'Gagal membatalkan pesanan.', tone: 'error' })
    } finally {
      setIsCancelingOrder(false)
    }
  }

  async function handleMarkSuccess() {
    setIsConfirmingPayment(true)
    setPaymentActionError('')
    try {
      const updated = await updateAdminOrderStatus(order.id, 'success')
      setOrder(updated)
      setToast({ message: 'Pesanan berhasil ditandai success.', tone: 'success' })
    } catch {
      setPaymentActionError('Gagal menandai pesanan success.')
      setToast({ message: 'Gagal menandai pesanan success.', tone: 'error' })
    } finally {
      setIsConfirmingPayment(false)
    }
  }

  async function handleMarkPaid() {
    setIsConfirmingPayment(true)
    setPaymentActionError('')
    try {
      const updated = await updateAdminOrderStatus(order.id, 'paid')
      setOrder(updated)
      setToast({ message: 'Pesanan berhasil ditandai paid.', tone: 'success' })
    } catch {
      setPaymentActionError('Gagal menandai pesanan paid.')
      setToast({ message: 'Gagal menandai pesanan paid.', tone: 'error' })
    } finally {
      setIsConfirmingPayment(false)
    }
  }

  return (
    <div className="relative -m-4 min-h-[calc(100vh-4rem)] space-y-4 overflow-hidden bg-white p-4 sm:-m-6 sm:p-6 lg:-mx-8 lg:-my-6 lg:px-8 lg:py-6">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div
          className={cn(
            'absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 rotate-[-24deg] whitespace-nowrap text-6xl font-black uppercase tracking-[0.35em] md:text-8xl',
            getWatermarkClassName(order.status),
          )}
        >
          {getOrderStampLabel(order.status)}
        </div>
      </div>

      <div className="relative z-10 space-y-4">
        <AdminPageHeader
          title="Detail Pesanan"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {canCancelOrder ? (
                <Button variant="secondary" onClick={() => setIsCancelOrderOpen(true)} className="border-red-200 text-red-600 hover:bg-red-50">
                  <XCircle className="h-4 w-4" />
                  Cancel Order
                </Button>
              ) : null}
              <Link href="/admin/orders">
                <Button variant="ghost">
                  <ArrowLeft className="h-4 w-4" />
                  Kembali
                </Button>
              </Link>
            </div>
          }
        />

        <InlineToast toast={toast} />

        <SectionCard title="Informasi Umum Pesanan" icon={<IdCard className="h-5 w-5" />}>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)_220px] lg:items-center">
            <div className="space-y-3">
              <MetaRow label="ID Pesanan" value={`#${order.id}`} mono strong />
              <MetaRow label="Tanggal Pesanan" value={formatDetailDate(order.createdAt)} />
            </div>
            <div className="space-y-3">
              <MetaRow label="Status" value={<Badge variant={getOrderBadgeVariant(order.status)} label={getPaymentStatusHeadline(order)} />} />
              <MetaRow label="Total Tagihan" value={formatRupiah(order.grandTotalAmount)} strong />
            </div>
            <div className="flex items-center justify-start lg:justify-center">
              <AntamColorLogo />
            </div>
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
                  <MetaRow label="Kurir" value={<ShippingCarrierLabel carrier={order.fulfillmentDetail.courier ?? order.shippingMethod} />} strong />
                  <MetaRow label="Layanan" value={order.fulfillmentDetail.serviceLabel ?? order.shippingMethod} />
                  <MetaRow label="Nama Penerima" value={order.recipientDetail.name} />
                  <MetaRow label="Telepon" value={order.recipientDetail.phone} />
                  <MetaRow label="Alamat" value={order.recipientDetail.address} />
                  <MetaRow
                    label="Wilayah"
                    value={`${order.recipientDetail.village}, ${order.recipientDetail.district}, ${order.recipientDetail.city}, ${order.recipientDetail.province}`}
                  />
                  <MetaRow label="Kode Pos" value={order.recipientDetail.postalCode} mono />
                </>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Detail Produk" icon={<Package className="h-5 w-5" />}>
            <div className="space-y-3">
              {order.lineItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-navy-100 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-navy-100 bg-navy-50">
                        <OrderItemImage src={item.productImage} alt={item.productName} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-navy-900">{item.productName}</p>
                        <div className="mt-2 space-y-1 text-sm text-navy-600">
                          <p>Jumlah: {item.quantity}</p>
                          <p>Harga Satuan: {formatRupiah(item.unitPrice)}</p>
                        </div>
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

          <SectionCard title="Detail Pembayaran" icon={<CreditCard className="h-5 w-5" />}>
            <div className="space-y-3">
              <MetaRow label="Metode" value={order.paymentMethod} strong />
              <MetaRow
                label="Status Pembayaran"
                value={<Badge variant={getOrderBadgeVariant(order.status)} label={getPaymentStatusHeadline(order)} />}
              />
              <MetaRow
                label="Bukti Diupload"
                value={order.paymentProofUploadedAt ? formatDetailDate(order.paymentProofUploadedAt) : '-'}
              />
              <MetaRow label="Tanggal Order" value={formatDetailDate(order.createdAt)} />
              <MetaRow label="Terakhir Diperbarui" value={formatDetailDate(order.updatedAt)} />
              <div className="rounded-2xl border border-navy-100 bg-white/50 p-4">
                {publicPaymentProofUrl ? (
                  <div className="space-y-3">
                    <div className="relative h-56 overflow-hidden rounded-xl border border-navy-100 bg-navy-50">
                      <Image src={publicPaymentProofUrl} alt={`Bukti pembayaran ${order.id}`} fill unoptimized sizes="420px" className="object-contain" />
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button variant="secondary" size="sm" onClick={() => setIsPaymentProofOpen(true)}>
                        <ExternalLink className="h-4 w-4" />
                        Lihat Bukti
                      </Button>
                      {normalizeOrderStatus(order.status) === 'pending' ? (
                        <Button size="sm" onClick={handleConfirmPayment} isLoading={isConfirmingPayment}>
                          <CheckCircle2 className="h-4 w-4" />
                          Konfirmasi Pembayaran
                        </Button>
                      ) : null}
                      {canMarkPaid ? (
                        <Button variant="secondary" size="sm" onClick={handleMarkPaid} isLoading={isConfirmingPayment}>
                          <CheckCircle2 className="h-4 w-4" />
                          Tandai Paid
                        </Button>
                      ) : null}
                      {canMarkSuccess ? (
                        <Button size="sm" onClick={handleMarkSuccess} isLoading={isConfirmingPayment}>
                          <CheckCircle2 className="h-4 w-4" />
                          Tandai Success
                        </Button>
                      ) : null}
                    </div>
                    {paymentActionError ? <p className="text-sm font-medium text-red-600">{paymentActionError}</p> : null}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {isGatewayOrder ? (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-navy-800">
                          {isGatewayPaid ? `Pembayaran sudah diterima melalui ${gatewayProviderLabel}.` : `Menunggu pembayaran melalui ${gatewayProviderLabel}.`}
                        </p>
                        <p className="text-sm text-navy-600">
                          {isGatewayPaid
                            ? `Anda mungkin perlu menunggu waktu settlement untuk pencairan dana di dashboard ${gatewayProviderLabel}.`
                            : `Status akan diperbarui otomatis setelah ${gatewayProviderLabel} mengirim notifikasi pembayaran.`}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-navy-600">Bukti pembayaran belum diupload customer.</p>
                    )}
                    {canMarkPaid ? (
                      <Button size="sm" onClick={handleMarkPaid} isLoading={isConfirmingPayment}>
                        <CheckCircle2 className="h-4 w-4" />
                        Tandai Paid
                      </Button>
                    ) : null}
                    {paymentActionError ? <p className="text-sm font-medium text-red-600">{paymentActionError}</p> : null}
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-white/45 bg-white/35 p-4 backdrop-blur-[1px]">
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
        </div>
      </div>

      <Modal isOpen={isDocumentOpen} onClose={() => setIsDocumentOpen(false)} title="Dokumen KTP" size="lg">
        {publicKtpUrl ? (
          <Image src={publicKtpUrl} alt={`KTP ${order.recipientDetail.name}`} width={960} height={600} unoptimized className="max-h-[72vh] w-full rounded-xl object-contain" />
        ) : (
          <p className="text-sm text-navy-600">Gambar KTP belum tersedia.</p>
        )}
      </Modal>

      <Modal isOpen={isPaymentProofOpen} onClose={() => setIsPaymentProofOpen(false)} title="Bukti Pembayaran QRIS" size="lg">
        {publicPaymentProofUrl ? (
          <Image src={publicPaymentProofUrl} alt={`Bukti pembayaran ${order.id}`} width={960} height={600} unoptimized className="max-h-[72vh] w-full rounded-xl object-contain" />
        ) : (
          <p className="text-sm text-navy-600">Bukti pembayaran belum tersedia.</p>
        )}
      </Modal>

      <Modal isOpen={isCancelOrderOpen} onClose={() => setIsCancelOrderOpen(false)} title="Cancel Order" size="md">
        <div className="space-y-4">
          <p className="text-sm leading-6 text-navy-600">
            Pesanan #{order.id} akan diubah menjadi canceled. Gunakan aksi ini untuk pesanan duplikat atau pesanan yang memang tidak perlu diproses.
          </p>
          {cancelActionError ? <p className="text-sm font-medium text-red-600">{cancelActionError}</p> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setIsCancelOrderOpen(false)} disabled={isCancelingOrder}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleCancelOrder} isLoading={isCancelingOrder}>
              <XCircle className="h-4 w-4" />
              Cancel Order
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  )
}

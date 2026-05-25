'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowRight,
  CreditCard,
  Package2,
  ReceiptText,
  ShieldCheck,
  Store,
  Truck,
  UserRound,
} from 'lucide-react'
import { formatRupiah } from '@/core/lib/utils'
import { resolvePublicAssetUrl } from '@/core/lib/public-url'
import AppBar from '@/shared/ui/AppBar'
import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'
import OrderWhatsappButton from '@/features/orders/OrderWhatsappButton'
import { getOrderBadgeVariant, type AdminOrderDetailRecord } from '@/features/admin/admin-management-data'
import { fetchCustomerOrder } from '@/features/orders/order-api'

function formatOrderDate(value: string) {
  const parts = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).formatToParts(new Date(value))

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.day} ${values.month} ${values.year} pukul ${values.hour}.${values.minute} WIB`
}

function joinRegion(order: AdminOrderDetailRecord) {
  return [
    order.recipientDetail.village,
    order.recipientDetail.district,
    order.recipientDetail.city,
    order.recipientDetail.province,
  ].filter(Boolean).join(', ') || '-'
}

function getPaymentStatusLabel(order: AdminOrderDetailRecord) {
  if (order.status === 'pending' && order.paymentProofUrl) return 'Menunggu Verifikasi'
  if (order.status === 'pending') return 'Menunggu Pembayaran'
  if (order.status === 'success') return 'Sudah Dibayar'
  if (order.status === 'selesai') return 'Selesai'
  if (order.status === 'canceled') return 'Dibatalkan'
  return String(order.status)
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card padding="md" className="border-navy-100 shadow-elevation-low">
      <div className="mb-4 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold-50 text-gold-700">
          {icon}
        </div>
        <h2 className="text-base font-semibold text-navy-900 sm:text-lg">{title}</h2>
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
    <div className="grid gap-1 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-3">
      <p className="text-sm text-navy-500">{label}</p>
      <div className={`text-sm text-navy-800 ${mono ? 'font-mono text-[13px]' : ''} ${strong ? 'font-semibold text-navy-900' : ''}`}>
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
      <span className={emphasis ? 'font-semibold text-navy-900' : 'text-navy-600'}>{label}</span>
      <span className={`${emphasis ? 'text-xl font-bold text-gold-600' : 'font-semibold text-navy-900'} ${negative ? 'text-red-600' : ''}`}>
        {negative ? `- ${value}` : value}
      </span>
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
      sizes="72px"
      className="object-cover"
      onError={() => setImageSrc('/images/metal-gold.jpg')}
    />
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

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<AdminOrderDetailRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      router.replace(`/login?redirect=/orders/${encodeURIComponent(params.id)}`)
      return
    }

    let alive = true

    async function loadOrder() {
      try {
        const data = await fetchCustomerOrder(params.id)
        if (alive) setOrder(data)
      } catch {
        if (alive) setError('Pesanan tidak ditemukan atau tidak dapat diakses.')
      } finally {
        if (alive) setIsLoading(false)
      }
    }

    loadOrder()
    return () => {
      alive = false
    }
  }, [params.id, router])

  return (
    <div className="min-h-screen bg-surface pb-12">
      <AppBar title="Detail Pesanan" />

      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
        {isLoading ? (
          <Card padding="md" className="border-navy-100 shadow-elevation-low">
            <p className="text-sm text-navy-600">Memuat detail pesanan...</p>
          </Card>
        ) : error || !order ? (
          <Card padding="md" className="border-red-100 bg-red-50 shadow-elevation-low">
            <p className="text-sm text-red-700">{error || 'Pesanan tidak ditemukan.'}</p>
          </Card>
        ) : (
          <>
            <SectionCard title="Informasi Umum Pesanan" icon={<ReceiptText className="h-5 w-5" />}>
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)_220px] lg:items-center">
                <div className="space-y-3">
                  <MetaRow label="ID Pesanan" value={`#${order.id}`} mono strong />
                  <MetaRow label="Tanggal Pesanan" value={formatOrderDate(order.createdAt)} />
                </div>
                <div className="rounded-xl border border-navy-100 bg-navy-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy-500">Total Tagihan</p>
                  <p className="mt-2 font-heading text-2xl font-bold text-gold-600">{formatRupiah(order.grandTotalAmount)}</p>
                </div>
                <div className="flex items-center justify-start lg:justify-center">
                  <AntamColorLogo />
                </div>
              </div>
            </SectionCard>

            <div className="grid gap-4 lg:grid-cols-2">
              <SectionCard title="Detail Pelanggan" icon={<UserRound className="h-5 w-5" />}>
                <div className="space-y-3">
                  <MetaRow label="Nama" value={order.customerDetail.name} strong />
                  <MetaRow label="Telepon" value={order.customerDetail.phone || '-'} />
                  <MetaRow label="Email" value={order.customerDetail.email || '-'} />
                </div>
              </SectionCard>

              <SectionCard title="Detail Pembayaran" icon={<CreditCard className="h-5 w-5" />}>
                <div className="space-y-3">
                  <MetaRow label="Metode" value={order.paymentMethod} strong />
                  <MetaRow label="Status" value={<Badge variant={getOrderBadgeVariant(order.status)} label={getPaymentStatusLabel(order)} />} />
                  <MetaRow label="Bukti Diupload" value={order.paymentProofUploadedAt ? formatOrderDate(order.paymentProofUploadedAt) : '-'} />
                  <MetaRow label="Dibuat" value={formatOrderDate(order.createdAt)} />
                  <MetaRow label="Update Terakhir" value={formatOrderDate(order.updatedAt)} />
                </div>
              </SectionCard>
            </div>

            <SectionCard title="Detail Produk" icon={<Package2 className="h-5 w-5" />}>
              <div className="space-y-3">
                {order.lineItems.map((item) => (
                  <div key={item.id} className="rounded-xl border border-navy-100 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 gap-3">
                        <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl border border-navy-100 bg-navy-50">
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

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
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
                      <MetaRow label="Catatan" value={order.fulfillmentDetail.note ?? '-'} />
                    </>
                  ) : (
                    <>
                      <MetaRow label="Kurir" value={order.fulfillmentDetail.courier ?? order.shippingMethod} strong />
                      <MetaRow label="Layanan" value={order.fulfillmentDetail.serviceLabel ?? order.shippingMethod} />
                      <MetaRow label="Resi" value={order.trackingNumber || '-'} mono />
                      <MetaRow label="Nama Penerima" value={order.recipientDetail.name} />
                      <MetaRow label="Telepon" value={order.recipientDetail.phone || '-'} />
                      <MetaRow label="Alamat" value={order.recipientDetail.address || '-'} />
                      <MetaRow label="Wilayah" value={joinRegion(order)} />
                      <MetaRow label="Kode Pos" value={order.recipientDetail.postalCode || '-'} mono />
                    </>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Ringkasan Pembayaran" icon={<CreditCard className="h-5 w-5" />}>
                <div className="space-y-3">
                  <SummaryRow label="Subtotal Produk" value={formatRupiah(order.subtotalAmount)} />
                  <SummaryRow label="Biaya Pengiriman" value={formatRupiah(order.shippingFee)} />
                  <SummaryRow label="Voucher" value={formatRupiah(order.voucherAmount)} negative />
                  <div className="border-t border-navy-100" />
                  <SummaryRow label="Total Tagihan" value={formatRupiah(order.grandTotalAmount)} emphasis />
                </div>
              </SectionCard>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <OrderWhatsappButton orderId={order.id} />
              <Link href="/products" className="block">
                <Button variant="primary" size="lg" fullWidth>
                  <ShieldCheck className="h-5 w-5" />
                  Belanja Lagi
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

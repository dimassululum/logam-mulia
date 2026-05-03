import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatRupiah } from '@/core/lib/utils'
import AppBar from '@/shared/ui/AppBar'
import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import { ArrowRight, CreditCard, MapPin, Package2, ShieldCheck, Truck } from 'lucide-react'

interface PageProps {
  params: { id: string }
}

const orders = {
  'INV-20231025-001': {
    id: 'INV-20231025-001',
    createdAt: '25 Okt 2023, 14:30 WIB',
    status: 'processing' as const,
    paymentMethod: 'BRI Virtual Account',
    shippingMethod: 'JNE Reguler (2-3 hari)',
    trackingNumber: 'JNE2404250001',
    totalAmount: 25300200,
    subtotal: 25450000,
    shippingFee: 150000,
    discount: 299800,
    recipient: {
      name: 'Budi Santoso',
      phone: '0812-3456-7890',
      address: 'Jl. Sudirman No. 123, Komplek Elit Kav. 45, Kebayoran Baru, Jakarta Selatan, DKI Jakarta 12345',
    },
    timeline: [
      'Pembayaran berhasil diverifikasi.',
      'Pesanan sedang disiapkan oleh tim Logam Mulia.',
      'Menunggu penyerahan ke ekspedisi.',
    ],
    items: [
      { name: 'Antam Logam Mulia 10 Gram', quantity: 1, price: 12800000 },
      { name: 'Antam Logam Mulia 5 Gram', quantity: 2, price: 12650000 },
    ],
  },
  'INV-20231020-004': {
    id: 'INV-20231020-004',
    createdAt: '20 Okt 2023, 09:10 WIB',
    status: 'shipped' as const,
    paymentMethod: 'BCA Virtual Account',
    shippingMethod: 'J&T Express (2-4 hari)',
    trackingNumber: 'JNT2404200004',
    totalAmount: 1145000,
    subtotal: 1145000,
    shippingFee: 0,
    discount: 0,
    recipient: {
      name: 'Budi Santoso',
      phone: '0812-3456-7890',
      address: 'Gedung Menara Mulia Lt. 15, Jl. Gatot Subroto Kav. 9-11, Setiabudi, Jakarta Selatan, DKI Jakarta 12930',
    },
    timeline: [
      'Pembayaran berhasil diterima.',
      'Pesanan diproses dan dikemas.',
      'Paket telah diserahkan ke kurir.',
    ],
    items: [{ name: 'Emas Antam 1g', quantity: 1, price: 1145000 }],
  },
  'INV-20231010-011': {
    id: 'INV-20231010-011',
    createdAt: '10 Okt 2023, 18:45 WIB',
    status: 'completed' as const,
    paymentMethod: 'Mandiri Virtual Account',
    shippingMethod: 'Ambil di Butik LM - Graha Dipta',
    trackingNumber: '-',
    totalAmount: 27200000,
    subtotal: 27200000,
    shippingFee: 0,
    discount: 0,
    recipient: {
      name: 'Budi Santoso',
      phone: '0812-3456-7890',
      address: 'Butik Emas LM - Graha Dipta, Jl. Pemuda No.1, Pulo Gadung, Jakarta Timur',
    },
    timeline: [
      'Pembayaran berhasil diterima.',
      'Pesanan selesai disiapkan.',
      'Pesanan sudah diambil pelanggan.',
    ],
    items: [{ name: 'Emas Antam 25g', quantity: 1, price: 27200000 }],
  },
} as const

export default function OrderDetailPage({ params }: PageProps) {
  const order = orders[params.id as keyof typeof orders]

  if (!order) {
    notFound()
  }

  return (
    <div className="bg-surface min-h-screen pb-12">
      <AppBar title="Detail Pesanan" />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <section className="bg-white rounded-2xl border border-navy-200 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-navy-400 font-semibold">Order ID</p>
              <h1 className="font-heading text-2xl font-bold text-navy-900 mt-1">{order.id}</h1>
              <p className="text-sm text-navy-500 mt-2">{order.createdAt}</p>
            </div>
            <Badge variant={order.status} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-navy-50 border border-navy-100 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-navy-400 font-semibold">Pembayaran</p>
              <p className="text-sm font-bold text-navy-900 mt-2">{order.paymentMethod}</p>
            </div>
            <div className="rounded-xl bg-navy-50 border border-navy-100 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-navy-400 font-semibold">Pengiriman</p>
              <p className="text-sm font-bold text-navy-900 mt-2">{order.shippingMethod}</p>
            </div>
            <div className="rounded-xl bg-navy-50 border border-navy-100 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-navy-400 font-semibold">Resi</p>
              <p className="text-sm font-bold text-navy-900 mt-2">{order.trackingNumber}</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-navy-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Package2 className="w-5 h-5 text-gold-500" />
            <h2 className="font-heading text-lg font-bold text-navy-900">Item Pesanan</h2>
          </div>

          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.name} className="flex items-start justify-between gap-4 border-b border-navy-100 pb-4 last:border-b-0 last:pb-0">
                <div>
                  <p className="font-bold text-navy-900">{item.name}</p>
                  <p className="text-sm text-navy-500 mt-1">Jumlah {item.quantity}</p>
                </div>
                <p className="font-bold text-navy-900">{formatRupiah(item.price)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-navy-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-5 h-5 text-gold-500" />
            <h2 className="font-heading text-lg font-bold text-navy-900">Status Terbaru</h2>
          </div>

          <div className="space-y-3">
            {order.timeline.map((entry, index) => (
              <div key={entry} className="flex items-start gap-3">
                <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-gold-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-navy-900">Update {index + 1}</p>
                  <p className="text-sm text-navy-600 mt-0.5">{entry}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-navy-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-gold-500" />
            <h2 className="font-heading text-lg font-bold text-navy-900">Tujuan Pengiriman</h2>
          </div>
          <p className="font-bold text-navy-900">{order.recipient.name}</p>
          <p className="text-sm text-navy-600 mt-1">{order.recipient.phone}</p>
          <p className="text-sm text-navy-600 mt-2 leading-relaxed">{order.recipient.address}</p>
        </section>

        <section className="bg-white rounded-2xl border border-navy-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-gold-500" />
            <h2 className="font-heading text-lg font-bold text-navy-900">Ringkasan Pembayaran</h2>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between text-navy-600">
              <span>Subtotal</span>
              <span>{formatRupiah(order.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-navy-600">
              <span>Ongkir</span>
              <span>{formatRupiah(order.shippingFee)}</span>
            </div>
            <div className="flex items-center justify-between text-navy-600">
              <span>Diskon</span>
              <span>-{formatRupiah(order.discount)}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-navy-100">
              <span className="font-bold text-navy-900">Total</span>
              <span className="font-heading text-xl font-bold text-gold-600">{formatRupiah(order.totalAmount)}</span>
            </div>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/orders" className="block">
            <Button variant="secondary" size="lg" fullWidth>
              Kembali ke Pesanan
            </Button>
          </Link>
          <Link href="/products" className="block">
            <Button variant="primary" size="lg" fullWidth>
              <ShieldCheck className="w-5 h-5" />
              Belanja Lagi
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}

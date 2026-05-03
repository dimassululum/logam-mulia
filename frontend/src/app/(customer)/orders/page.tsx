import Link from 'next/link'
import { formatRupiah } from '@/core/lib/utils'
import Badge from '@/shared/ui/Badge'
import AppBar from '@/shared/ui/AppBar'
import { ChevronRight, PackageCheck, ShoppingBag } from 'lucide-react'

const orders = [
  {
    id: 'INV-20231025-001',
    createdAt: '25 Okt 2023, 14:30 WIB',
    status: 'processing' as const,
    totalAmount: 25300200,
    itemCount: 2,
    items: ['Antam Logam Mulia 10 Gram', 'Antam Logam Mulia 5 Gram'],
  },
  {
    id: 'INV-20231020-004',
    createdAt: '20 Okt 2023, 09:10 WIB',
    status: 'shipped' as const,
    totalAmount: 1145000,
    itemCount: 1,
    items: ['Emas Antam 1g'],
  },
  {
    id: 'INV-20231010-011',
    createdAt: '10 Okt 2023, 18:45 WIB',
    status: 'completed' as const,
    totalAmount: 27200000,
    itemCount: 1,
    items: ['Emas Antam 25g'],
  },
]

export default function OrdersPage() {
  return (
    <div className="bg-surface min-h-screen pb-28">
      <AppBar title="Pesanan Saya" />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <section className="bg-white rounded-2xl border border-navy-200 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gold-50 text-gold-600 flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold text-navy-900">Riwayat Pesanan</h1>
              <p className="text-sm text-navy-600 mt-1">
                Lihat status pesanan aktif dan pesanan yang sudah selesai di satu tempat.
              </p>
            </div>
          </div>
        </section>

        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="block bg-white rounded-2xl border border-navy-200 p-5 shadow-sm hover:border-gold-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-navy-400 font-semibold">Order ID</p>
                <p className="text-base font-bold text-navy-900 mt-1">{order.id}</p>
                <p className="text-sm text-navy-500 mt-1">{order.createdAt}</p>
              </div>
              <Badge variant={order.status} />
            </div>

            <div className="mt-4 pt-4 border-t border-navy-100">
              <div className="flex items-center gap-2 text-navy-700 mb-2">
                <PackageCheck className="w-4 h-4 text-gold-500" />
                <span className="text-sm font-semibold">{order.itemCount} produk</span>
              </div>
              <p className="text-sm text-navy-700">
                {order.items.join(' • ')}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-navy-400 font-semibold">Total Belanja</p>
                <p className="font-heading text-xl font-bold text-gold-600 mt-1">{formatRupiah(order.totalAmount)}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-gold-600">
                Detail
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        ))}
      </main>
    </div>
  )
}

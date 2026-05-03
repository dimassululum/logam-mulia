import Link from 'next/link'
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminStatCard,
  AdminTable,
  Card,
} from '@/shared/ui'
import {
  buildRecentOrderRows,
  dashboardMetrics,
  recentOrderColumns,
  recentOrders,
} from '@/features/admin/mock-data'

export default function AdminDashboardPage() {
  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Dashboard"
        description="Ringkasan toko hari ini."
      />

      <section className="grid gap-4 md:grid-cols-3">
        {dashboardMetrics.map((metric) => (
          <AdminStatCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
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
              rows={buildRecentOrderRows(recentOrders)}
              emptyState={
                <AdminEmptyState
                  title="Belum ada order terbaru"
                  description="Saat order pertama masuk, daftar pesanan terbaru akan muncul di sini untuk membantu tim bergerak lebih cepat."
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

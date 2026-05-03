import AdminPlaceholderPage from '@/features/admin/AdminPlaceholderPage'

export default function AdminPromosPage() {
  return (
    <AdminPlaceholderPage
      title="Promo"
      description="Panel promo akan mengatur campaign diskon berbasis produk atau kategori dengan periode aktif yang jelas."
      checklist={[
        'Tabel promo aktif dan nonaktif dengan rentang tanggal dan tipe diskon.',
        'Form promo untuk produk atau kategori target.',
        'Preview dampak promo ke katalog customer sebelum publish.',
      ]}
    />
  )
}

import AdminPlaceholderPage from '@/features/admin/AdminPlaceholderPage'

export default function AdminCostsPage() {
  return (
    <AdminPlaceholderPage
      title="Biaya"
      description="Modul biaya dapat dipakai untuk ongkir, biaya admin, atau komponen biaya operasional lain yang memengaruhi checkout."
      checklist={[
        'Daftar biaya aktif dan aturan perhitungannya.',
        'Kontrol biaya pengiriman atau biaya admin tambahan.',
        'Sinkronisasi biaya ke flow checkout customer di iterasi berikutnya.',
      ]}
    />
  )
}

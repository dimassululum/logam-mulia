import AdminPlaceholderPage from '@/features/admin/AdminPlaceholderPage'

export default function AdminSettingsPage() {
  return (
    <AdminPlaceholderPage
      title="Settings"
      description="Halaman settings dipersiapkan untuk konfigurasi global yang memengaruhi storefront dan operasional admin."
      checklist={[
        'Pengaturan umum seperti kontak bisnis, SLA, dan message defaults.',
        'Konfigurasi feature flags ringan untuk modul admin/customer.',
        'Pusat setting global yang bisa dihubungkan ke model Setting di backend.',
      ]}
    />
  )
}

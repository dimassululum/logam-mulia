import AdminPlaceholderPage from '@/features/admin/AdminPlaceholderPage'

export default function AdminAdminsPage() {
  return (
    <AdminPlaceholderPage
      title="Admin"
      description="Halaman ini disiapkan untuk pengelolaan akun admin internal dan kontrol akses per peran."
      checklist={[
        'Daftar admin aktif dan super admin.',
        'Kontrol role dan status akses untuk tim operasional.',
        'Audit ringan untuk aktivitas perubahan penting di panel.',
      ]}
    />
  )
}

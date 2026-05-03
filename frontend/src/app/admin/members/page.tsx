import AdminPlaceholderPage from '@/features/admin/AdminPlaceholderPage'

export default function AdminMembersPage() {
  return (
    <AdminPlaceholderPage
      title="Member"
      description="Halaman member akan membantu admin membaca aktivitas customer, total order, dan status verifikasi data."
      checklist={[
        'Table member dengan nama, email, telepon, total orders, dan join date.',
        'Entry point ke detail customer dan riwayat pembelian.',
        'Filter untuk segmentasi high-value members dan akun baru.',
      ]}
    />
  )
}

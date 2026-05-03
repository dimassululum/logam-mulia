import AdminShell from '@/shared/layout/AdminShell'
import { requireAdminUser } from '@/core/lib/mock-auth-server'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const currentUser = requireAdminUser()

  return (
    <AdminShell currentUser={currentUser}>
      {children}
    </AdminShell>
  )
}

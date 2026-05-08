'use client'

import AdminShell from '@/shared/layout/AdminShell'
import AdminGuard from '@/shared/layout/AdminGuard'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      {(currentUser) => (
        <AdminShell currentUser={currentUser}>
          {children}
        </AdminShell>
      )}
    </AdminGuard>
  )
}

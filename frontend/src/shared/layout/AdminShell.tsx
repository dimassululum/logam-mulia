'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { CurrentUser } from '@/core/types'
import AdminSidebar from '@/shared/layout/AdminSidebar'
import AdminTopbar from '@/shared/layout/AdminTopbar'

interface AdminShellProps {
  currentUser: CurrentUser
  children: React.ReactNode
}

export default function AdminShell({ currentUser, children }: AdminShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,222,162,0.2),_transparent_32%),linear-gradient(180deg,_#f8f9fa_0%,_#eef1f4_100%)]">
      <div className="flex min-h-screen">
        <AdminSidebar
          currentUser={currentUser}
          collapsed={sidebarCollapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
        />

        <div className="min-w-0 flex-1">
          <AdminTopbar
            currentUser={currentUser}
            onMenuClick={() => setMobileOpen(true)}
          />
          <main className="px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

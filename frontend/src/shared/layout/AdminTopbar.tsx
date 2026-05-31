'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Menu } from 'lucide-react'
import type { CurrentUser } from '@/core/types'
import { MOCK_AUTH_COOKIES } from '@/core/lib/mock-auth'
import { apiClient } from '@/core/lib/api-client'

interface AdminTopbarProps {
  currentUser: CurrentUser
  onMenuClick: () => void
}

export default function AdminTopbar({
  currentUser,
  onMenuClick,
}: AdminTopbarProps) {
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  async function handleLogout() {
    const refreshToken = localStorage.getItem('refresh_token')

    try {
      await apiClient.post('/auth/logout', { refreshToken })
    } catch {
      // Local admin session is cleared either way.
    }

    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_name')
    localStorage.removeItem('user_email')
    document.cookie = `${MOCK_AUTH_COOKIES.role}=; path=/; max-age=0; SameSite=Lax`
    document.cookie = `${MOCK_AUTH_COOKIES.name}=; path=/; max-age=0; SameSite=Lax`
    document.cookie = `${MOCK_AUTH_COOKIES.email}=; path=/; max-age=0; SameSite=Lax`
    setProfileOpen(false)
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 border-b border-navy-100 bg-white/90 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex rounded-xl border border-navy-200 p-2.5 text-navy-700 transition-colors hover:bg-navy-50 sm:hidden"
          aria-label="Buka navigasi admin"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold leading-tight text-navy-900 sm:text-[1.75rem]">
            Admin Panel
          </h1>
        </div>

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((current) => !current)}
            className="flex items-center gap-2 rounded-xl border border-navy-100 bg-white px-2.5 py-2 shadow-elevation-low transition-colors hover:bg-navy-50 sm:px-3"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-100 text-xs font-semibold text-gold-700">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="max-w-[120px] truncate text-sm font-semibold text-navy-900">{currentUser.name}</p>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-[calc(100%+0.5rem)] w-44 rounded-2xl border border-navy-100 bg-white p-2 shadow-elevation-low">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                role="menuitem"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

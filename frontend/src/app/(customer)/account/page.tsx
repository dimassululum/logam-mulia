'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/shared/ui/Card'
import { ChevronRight, MapPin, Headset, LogOut, User } from 'lucide-react'
import { apiClient } from '@/core/lib/api-client'
import { MOCK_AUTH_COOKIES } from '@/core/lib/mock-auth'
import { fetchAccountProfile, type AccountProfile } from '@/features/account/account-api'

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<AccountProfile | null>(null)

  useEffect(() => {
    let alive = true

    async function loadUser() {
      if (!localStorage.getItem('access_token')) {
        router.replace('/login?redirect=/account')
        return
      }

      try {
        const data = await fetchAccountProfile()
        if (alive) setUser(data)
      } catch {
        if (alive) router.replace('/login?redirect=/account')
      }
    }

    loadUser()
    return () => {
      alive = false
    }
  }, [router])

  const initials = useMemo(() => {
    const name = user?.name || 'Customer'
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment[0]?.toUpperCase())
      .join('') || 'CU'
  }, [user?.name])

  async function handleLogout() {
    const refreshToken = localStorage.getItem('refresh_token')
    try {
      await apiClient.post('/auth/logout', { refreshToken })
    } catch {
      // Token is cleared locally either way so the customer can leave the session.
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_name')
      localStorage.removeItem('user_email')
      document.cookie = `${MOCK_AUTH_COOKIES.role}=; path=/; max-age=0; SameSite=Lax`
      document.cookie = `${MOCK_AUTH_COOKIES.name}=; path=/; max-age=0; SameSite=Lax`
      document.cookie = `${MOCK_AUTH_COOKIES.email}=; path=/; max-age=0; SameSite=Lax`
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-navy-50 flex flex-col pb-[100px]">
      <main className="flex-1 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-md md:py-stack-lg">
        {/* Profile Brief */}
        <section className="bg-navy-900 md:rounded-xl shadow-elevation-low px-6 py-stack-md mb-stack-md flex items-center gap-6 relative overflow-hidden text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-gold-400/10 to-transparent pointer-events-none"></div>
          
          <div className="relative z-10 w-20 h-20 rounded-full bg-gold-400 flex items-center justify-center text-navy-900 text-2xl font-bold shrink-0 border-2 border-gold-400/20">
            {initials}
          </div>
          <div className="relative z-10 flex-grow">
            <h2 className="text-headline-sm text-white mb-1">Akun Saya</h2>
            <p className="text-navy-300 text-body-md">{user?.name || 'Memuat akun...'}</p>
            {user?.email ? <p className="mt-1 text-sm text-navy-400">{user.email}</p> : null}
          </div>
        </section>

        {/* Menu List */}
        <section className="grid grid-cols-1 gap-3">
          <Link href="/account/profile">
            <Card hoverable padding="sm" className="flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-gold-600 group-hover:bg-gold-50 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-label-md text-navy-900">Profil Detail</h3>
                  <p className="text-body-md text-navy-600 text-sm">Kelola data pribadi & verifikasi</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-navy-500 group-hover:text-gold-600 transition-colors" />
            </Card>
          </Link>

          <Link href="/account/address">
            <Card hoverable padding="sm" className="flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-gold-600 group-hover:bg-gold-50 transition-colors">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-label-md text-navy-900">Alamat Pengiriman</h3>
                  <p className="text-body-md text-navy-600 text-sm">Atur alamat untuk pengiriman fisik</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-navy-500 group-hover:text-gold-600 transition-colors" />
            </Card>
          </Link>

          <Link href="/account/support">
            <Card hoverable padding="sm" className="flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-gold-600 group-hover:bg-gold-50 transition-colors">
                  <Headset className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-label-md text-navy-900">Hubungi CS</h3>
                  <p className="text-body-md text-navy-600 text-sm">Layanan bantuan pelanggan</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-navy-500 group-hover:text-gold-600 transition-colors" />
            </Card>
          </Link>
        </section>

        {/* Footer Menu */}
        <section className="mt-stack-md">
          <button onClick={handleLogout} className="w-full bg-white rounded-lg p-4 border border-navy-300 flex items-center justify-center gap-3 hover:bg-red-50 transition-colors group shadow-elevation-low">
            <LogOut className="w-5 h-5 text-red-600 group-hover:text-red-700" />
            <span className="text-label-md text-red-600 group-hover:text-red-700">Keluar (Log Out)</span>
          </button>
        </section>
      </main>
    </div>
  )
}

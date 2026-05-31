'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppBar from '@/shared/ui/AppBar'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'
import { CheckCircle2, Mail, Phone, Settings, ShieldCheck, User } from 'lucide-react'
import { fetchAccountProfile, type AccountProfile } from '@/features/account/account-api'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      router.replace('/login?redirect=/account/profile')
      return
    }

    let alive = true

    async function loadProfile() {
      try {
        const data = await fetchAccountProfile()
        if (alive) setProfile(data)
      } catch {
        if (alive) setError('Gagal memuat profil. Silakan login ulang.')
      } finally {
        if (alive) setIsLoading(false)
      }
    }

    loadProfile()
    return () => {
      alive = false
    }
  }, [router])

  const initials = useMemo(() => {
    const name = profile?.name || 'Customer'
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment[0]?.toUpperCase())
      .join('') || 'CU'
  }, [profile?.name])

  return (
    <div className="min-h-screen bg-navy-50 pb-28 text-navy-900">
      <AppBar title="Profil Saya" />

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6">
        {isLoading ? (
          <Card padding="md" className="text-sm text-navy-600">Memuat profil...</Card>
        ) : error ? (
          <Card padding="md" className="border-red-100 bg-red-50 text-sm text-red-700">{error}</Card>
        ) : profile ? (
          <>
            <section className="rounded-xl border border-navy-800 bg-navy-900 p-5 text-white shadow-elevation-low">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-gold-400 text-2xl font-bold text-navy-900">
                  {initials}
                </div>
                <div className="min-w-0">
                  <h2 className="font-heading text-xl font-bold text-white">{profile.name}</h2>
                  <p className="mt-1 truncate text-sm text-navy-300">{profile.email}</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-gold-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {profile.isKycVerified || profile.ktpUrl ? 'KTP tersimpan' : 'KTP belum tersimpan'}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-navy-200 bg-white shadow-elevation-low">
              <div className="border-b border-navy-100 px-5 py-4">
                <h3 className="font-bold text-navy-900">Informasi Pribadi</h3>
              </div>
              <div className="divide-y divide-navy-100">
                <ProfileRow icon={<User className="h-4 w-4" />} label="Nama Lengkap" value={profile.name} />
                <ProfileRow icon={<Mail className="h-4 w-4" />} label="Alamat Email" value={profile.email} />
                <ProfileRow icon={<Phone className="h-4 w-4" />} label="No. Handphone" value={profile.phone || 'Belum diisi'} />
                <ProfileRow
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  label="Alamat Tersimpan"
                  value={`${profile.addresses?.length ?? 0} alamat`}
                />
              </div>
            </section>

            <Link href="/account/profile/edit">
              <Button variant="primary" size="lg" fullWidth>
                <Settings className="h-5 w-5" />
                Ubah Profil
              </Button>
            </Link>
          </>
        ) : null}
      </main>
    </div>
  )
}

function ProfileRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gold-50 text-gold-700">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase text-navy-500">{label}</p>
        <p className="mt-1 break-words font-semibold text-navy-900">{value}</p>
      </div>
    </div>
  )
}

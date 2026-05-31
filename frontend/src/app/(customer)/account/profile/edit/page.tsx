'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppBar from '@/shared/ui/AppBar'
import Input from '@/shared/ui/Input'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'
import { Save } from 'lucide-react'
import { fetchAccountProfile, updateAccountProfile, type AccountProfile } from '@/features/account/account-api'

export default function EditProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      router.replace('/login?redirect=/account/profile/edit')
      return
    }

    let alive = true

    async function loadProfile() {
      try {
        const data = await fetchAccountProfile()
        if (!alive) return
        setProfile(data)
        setName(data.name || '')
        setPhone(data.phone || '')
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
    const source = name || profile?.name || 'Customer'
    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment[0]?.toUpperCase())
      .join('') || 'CU'
  }, [name, profile?.name])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (name.trim().length < 2) {
      setError('Nama minimal 2 karakter.')
      return
    }

    setIsSaving(true)
    try {
      const updated = await updateAccountProfile({ name, phone })
      setProfile(updated)
      setName(updated.name)
      setPhone(updated.phone || '')
      localStorage.setItem('user_name', updated.name)
      setSuccess('Profil berhasil diperbarui.')
      router.refresh()
    } catch (saveError: any) {
      const message = saveError?.response?.data?.message || 'Gagal menyimpan profil. Coba lagi sebentar.'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-50 pb-28 text-navy-900">
      <AppBar title="Edit Profil" />

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6">
        {isLoading ? (
          <Card padding="md" className="text-sm text-navy-600">Memuat profil...</Card>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <section className="flex flex-col items-center rounded-xl border border-navy-200 bg-white p-5 shadow-elevation-low">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-navy-900 text-2xl font-bold text-gold-400">
                {initials}
              </div>
              <p className="mt-3 text-sm font-medium text-navy-500">Avatar mengikuti inisial nama profil.</p>
            </section>

            <section className="rounded-xl border border-navy-200 bg-white p-5 shadow-elevation-low">
              <div className="grid gap-4">
                <Input
                  label="Nama Lengkap"
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
                <Input
                  label="Alamat Email"
                  id="profile-email"
                  type="email"
                  value={profile?.email || ''}
                  disabled
                />
                <Input
                  label="No. Handphone"
                  id="profile-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="081234567890"
                />
              </div>
            </section>

            {error ? <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p> : null}
            {success ? <p className="rounded-lg border border-green-100 bg-green-50 p-3 text-sm font-semibold text-green-700">{success}</p> : null}

            <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isSaving}>
              <Save className="h-5 w-5" />
              Simpan Perubahan
            </Button>
          </form>
        )}
      </main>
    </div>
  )
}

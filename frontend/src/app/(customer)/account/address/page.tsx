'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin } from 'lucide-react'
import AppBar from '@/shared/ui/AppBar'
import Card from '@/shared/ui/Card'
import { fetchAccountProfile, type AccountAddress } from '@/features/account/account-api'

export default function AccountAddressPage() {
  const router = useRouter()
  const [addresses, setAddresses] = useState<AccountAddress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      router.replace('/login?redirect=/account/address')
      return
    }

    let alive = true

    async function loadAddresses() {
      try {
        const data = await fetchAccountProfile()
        if (alive) setAddresses(data.addresses || [])
      } catch {
        if (alive) setError('Gagal memuat alamat pengiriman.')
      } finally {
        if (alive) setIsLoading(false)
      }
    }

    loadAddresses()
    return () => {
      alive = false
    }
  }, [router])

  return (
    <div className="min-h-screen bg-navy-50 pb-28">
      <AppBar title="Alamat Pengiriman" />

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        {isLoading ? (
          <Card padding="md" className="text-sm text-navy-600">Memuat alamat...</Card>
        ) : error ? (
          <Card padding="md" className="border-red-100 bg-red-50 text-sm text-red-700">{error}</Card>
        ) : addresses.length === 0 ? (
          <Card padding="lg" className="text-center">
            <MapPin className="mx-auto h-8 w-8 text-gold-500" />
            <p className="mt-3 font-heading text-lg font-bold text-navy-900">Belum ada alamat</p>
            <p className="mt-2 text-sm text-navy-600">Alamat akan tersimpan setelah Anda mengisi data pengiriman saat checkout.</p>
          </Card>
        ) : (
          addresses.map((address) => (
            <Card key={address.id} padding="md" className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-navy-900">{address.fullName || address.label}</p>
                  {address.phone ? <p className="mt-1 text-sm text-navy-500">{address.phone}</p> : null}
                </div>
                {address.isDefault ? <span className="rounded-full bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-700">Utama</span> : null}
              </div>
              <p className="text-sm leading-6 text-navy-700">{address.address}</p>
              <p className="text-sm text-navy-500">
                {[address.village, address.district, address.city, address.province, address.postalCode].filter(Boolean).join(', ')}
              </p>
            </Card>
          ))
        )}
      </main>
    </div>
  )
}

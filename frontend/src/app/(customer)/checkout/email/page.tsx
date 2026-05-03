'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, Mail, Search, UserPlus } from 'lucide-react'
import AppBar from '@/shared/ui/AppBar'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'
import Input from '@/shared/ui/Input'
import {
  GuestCheckoutProfile,
  lookupGuestProfile,
  saveGuestCheckoutProfile,
} from '@/features/checkout/guestCheckout'

export default function CheckoutEmailPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<GuestCheckoutProfile | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email.trim()) {
      setError('Email wajib diisi')
      setProfile(null)
      return
    }

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    if (!isValidEmail) {
      setError('Format email tidak valid')
      setProfile(null)
      return
    }

    const nextProfile = lookupGuestProfile(email)
    saveGuestCheckoutProfile(nextProfile)
    setProfile(nextProfile)
    setError('')
  }

  const handleContinue = () => {
    if (profile) saveGuestCheckoutProfile(profile)
    const product = new URLSearchParams(window.location.search).get('product')
    const checkoutHref = product ? `/checkout?product=${product}` : '/checkout'
    router.push(checkoutHref)
  }

  return (
    <div className="min-h-screen bg-surface">
      <AppBar title="Email" />

      <main className="container-main py-6">
        <div className="mx-auto max-w-md">
          <Card padding="lg" className="shadow-elevation-low">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h1 className="font-heading text-2xl font-bold text-navy-900">Masukkan email</h1>
              </div>

              <Input
                id="checkout-email"
                type="email"
                label="Email"
                placeholder="nama@email.com"
                value={email}
                error={error}
                leftIcon={<Mail className="h-4 w-4" />}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setError('')
                  setProfile(null)
                }}
                autoComplete="email"
                required
              />

              <Button type="submit" variant="secondary" size="lg" fullWidth>
                <Search className="h-4 w-4" />
                Cek Email
              </Button>
            </form>

            {profile && (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-navy-200 bg-navy-50 p-4">
                  <div className="flex items-start gap-3">
                    {profile.found ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                    ) : (
                      <UserPlus className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold-600" />
                    )}
                    <div>
                      <p className="font-semibold text-navy-900">
                        {profile.found ? 'Email ditemukan' : 'Email belum ditemukan'}
                      </p>
                      <p className="mt-1 text-sm text-navy-600">
                        {profile.found
                          ? 'Data alamat dan KTP akan dipakai di checkout.'
                          : 'Checkout lanjut dengan data kosong.'}
                      </p>
                    </div>
                  </div>
                </div>

                <Button type="button" size="lg" fullWidth onClick={handleContinue}>
                  Lanjut Checkout
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}

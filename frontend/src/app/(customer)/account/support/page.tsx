'use client'

import Link from 'next/link'
import { Headset, MessageCircle } from 'lucide-react'
import AppBar from '@/shared/ui/AppBar'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'
import { useCompanyWhatsAppLink } from '@/features/company/useCompanyContact'

export default function AccountSupportPage() {
  const waLink = useCompanyWhatsAppLink('Halo admin, saya membutuhkan bantuan terkait akun atau pesanan saya.')

  return (
    <div className="min-h-screen bg-navy-50 pb-28">
      <AppBar title="Hubungi CS" />

      <main className="mx-auto max-w-3xl px-4 py-6">
        <Card padding="lg" className="space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-50 text-gold-600">
            <Headset className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-navy-900">Layanan Bantuan Pelanggan</h1>
            <p className="mt-2 text-sm leading-6 text-navy-600">
              Tim CS siap membantu pertanyaan seputar akun, checkout, pembayaran, dan status pesanan.
            </p>
          </div>
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="block">
            <Button fullWidth size="lg">
              <MessageCircle className="h-5 w-5" />
              Chat WhatsApp
            </Button>
          </a>
          <Link href="/account" className="block">
            <Button variant="secondary" fullWidth>
              Kembali ke Akun
            </Button>
          </Link>
        </Card>
      </main>
    </div>
  )
}

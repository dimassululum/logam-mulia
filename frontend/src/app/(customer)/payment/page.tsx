'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clock, Copy, Info } from 'lucide-react'
import { formatRupiah } from '@/core/lib/utils'
import AppBar from '@/shared/ui/AppBar'
import Accordion, { type AccordionItem } from '@/shared/ui/Accordion'
import Button from '@/shared/ui/Button'

/** Payment instruction steps — data separated from markup */
const PAYMENT_INSTRUCTIONS: AccordionItem[] = [
  {
    id: 1,
    label: 'Mobile Banking BRI (BRImo)',
    children: (
      <ol className="list-decimal list-inside space-y-2">
        <li>Buka aplikasi BRImo dan login</li>
        <li>Pilih menu &apos;Pembayaran&apos; lalu &apos;BRIVA&apos;</li>
        <li>Masukkan nomor Virtual Account Anda</li>
        <li>Masukkan PIN dan konfirmasi pembayaran</li>
      </ol>
    ),
  },
  {
    id: 2,
    label: 'ATM BRI',
    children: (
      <ol className="list-decimal list-inside space-y-2">
        <li>Masukkan kartu ATM dan PIN Anda</li>
        <li>Pilih menu &apos;Transaksi Lain&apos; &gt; &apos;Pembayaran&apos;</li>
        <li>Pilih &apos;Lainnya&apos; &gt; &apos;BRIVA&apos;</li>
        <li>Masukkan nomor Virtual Account Anda</li>
      </ol>
    ),
  },
  {
    id: 3,
    label: 'Internet Banking BRI',
    children: (
      <ol className="list-decimal list-inside space-y-2">
        <li>Login ke Internet Banking BRI</li>
        <li>Pilih menu &apos;Pembayaran&apos; &gt; &apos;BRIVA&apos;</li>
        <li>Masukkan nomor Virtual Account</li>
        <li>Ikuti instruksi untuk menyelesaikan transaksi</li>
      </ol>
    ),
  },
]

const VA_NUMBER = '128085845591668'
const VA_DISPLAY = '128 0858 4559 1668'

export default function PaymentPage() {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(VA_NUMBER)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-surface min-h-screen flex flex-col pb-28">
      {/* ── AppBar ─────────────────────────────────────────────────────── */}
      <AppBar title="Pembayaran" onBack={() => router.back()} />

      <main className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6 w-full">

        {/* ── Transaction Summary ──────────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-navy-200 p-6 flex flex-col items-center justify-center text-center shadow-elevation-low">
          <h2 className="font-bold text-xs text-navy-500 mb-1 uppercase tracking-widest">Total Pembayaran</h2>
          <div className="font-heading text-3xl font-bold text-navy-900 mb-4 tracking-tight">
            {formatRupiah(25300200)}
          </div>
          <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-full text-red-600 border border-red-100">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">Selesaikan pembayaran dalam <strong className="font-bold">00:29:59</strong></span>
          </div>
        </section>

        {/* ── Virtual Account Info ─────────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-navy-200 p-6 shadow-elevation-low relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <h3 className="font-heading text-xl font-bold text-navy-900 mb-4">Informasi Virtual Account</h3>

          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-navy-100">
            <div className="w-16 h-16 bg-surface rounded-lg flex items-center justify-center p-2 border border-navy-200">
              <span className="font-bold text-navy-900 text-sm">BRI</span>
            </div>
            <div>
              <div className="text-sm font-bold text-navy-500 mb-1">Bank Tujuan</div>
              <div className="text-lg font-bold text-navy-900">Bank BRI (BRIVA)</div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-navy-500 mb-2">Nomor Virtual Account</div>
              <div className="font-heading text-2xl md:text-3xl tracking-wider text-navy-900 font-mono font-bold">
                {VA_DISPLAY}
              </div>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={handleCopy}
              className="self-start md:self-auto"
            >
              <Copy className="w-5 h-5" />
              {copied ? 'Disalin!' : 'Salin'}
            </Button>
          </div>
        </section>

        {/* ── Payment Instructions (Accordion) ───────────────────────── */}
        <section>
          <h3 className="font-heading text-xl font-bold text-navy-900 mb-4">Petunjuk Pembayaran</h3>
          <Accordion items={PAYMENT_INSTRUCTIONS} defaultOpen={[1]} />
        </section>

        {/* ── Info Box ─────────────────────────────────────────────────── */}
        <div className="bg-navy-50 border border-navy-100 p-4 rounded-xl flex items-start gap-3">
          <Info className="w-6 h-6 text-gold-500 flex-shrink-0" />
          <p className="text-sm text-navy-600 leading-relaxed">
            Verifikasi pembayaran akan dilakukan secara otomatis. Pastikan nominal yang Anda bayar sudah sesuai dengan tagihan.
          </p>
        </div>
      </main>

      {/* ── Sticky Bottom Action ─────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 w-full z-40 bg-white/95 backdrop-blur-md border-t border-navy-200 p-4 md:px-6 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto flex justify-end">
          <Link href="/payment/success" className="w-full md:w-auto">
            <Button variant="primary" size="lg" fullWidth>
              OK, SAYA SUDAH BAYAR
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

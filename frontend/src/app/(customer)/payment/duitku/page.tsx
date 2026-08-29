'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Clock, CreditCard, Info, QrCode, Store } from 'lucide-react'
import { formatRupiah } from '@/core/lib/utils'
import { resolvePublicAssetUrl } from '@/core/lib/public-url'
import { getPaymentLogo } from '@/features/payment-methods/bank-assets'
import { fetchCustomerOrder, readCurrentOrder, saveCurrentOrder } from '@/features/orders/order-api'
import AppBar from '@/shared/ui/AppBar'
import CopyButton from '@/shared/ui/CopyButton'

function isPaidStatus(status?: string | null) {
  return ['paid', 'success', 'completed', 'selesai'].includes(String(status || '').toLowerCase())
}

function isCanceledStatus(status?: string | null) {
  return ['canceled', 'cancelled'].includes(String(status || '').toLowerCase())
}

function getResultMessage(resultCode: string | null) {
  if (resultCode === '00') return 'Pembayaran berhasil. Menunggu sinkronisasi status pesanan.'
  if (resultCode === '01') return 'Pembayaran masih diproses.'
  if (resultCode === '02') return 'Pembayaran dibatalkan atau kedaluwarsa.'
  return null
}

const VA_GUIDES: Record<string, { title: string; app: string; steps: string[] }> = {
  BRI: { title: 'Bank Rakyat Indonesia VA', app: 'Melalui BRImo', steps: ['Buka aplikasi BRImo dan login.', 'Pilih menu Tagihan.', 'Pilih BRIVA.', 'Masukkan Nomor Virtual Account yang tertera pada halaman pembayaran.', 'Periksa detail transaksi dan nominal pembayaran.', 'Jika sudah sesuai, masukkan PIN BRImo.', 'Pembayaran berhasil. Simpan bukti transaksi.'] },
  BNI: { title: 'Bank Negara Indonesia VA', app: 'Melalui wondr by BNI', steps: ['Buka aplikasi wondr by BNI dan login.', 'Pilih menu Virtual Account.', 'Pilih Tujuan Baru.', 'Masukkan Nomor Virtual Account.', 'Pilih Lanjut.', 'Periksa detail pembayaran dan pilih rekening sumber dana.', 'Pilih Transaksi Sekarang.', 'Masukkan PIN.', 'Pembayaran berhasil. Simpan bukti transaksi.'] },
  Mandiri: { title: 'Bank Mandiri VA', app: "Melalui Livin' by Mandiri", steps: ['Buka aplikasi Livin by Mandiri dan login.', 'Pilih Bayar/VA.', 'Masukkan atau salin Nomor Virtual Account.', 'Pilih penyedia jasa yang sesuai.', 'Periksa detail pembayaran dan nominal.', 'Pilih sumber dana.', 'Pilih Lanjut Bayar.', "Masukkan PIN Livin'", 'Pembayaran berhasil. Simpan bukti transaksi.'] },
  'CIMB Niaga': { title: 'CIMB Niaga VA', app: 'Melalui OCTO Mobile', steps: ['Buka aplikasi OCTO Mobile dan login.', 'Pilih menu Transfer.', 'Pilih Transfer ke Rekening CIMB Niaga Lain.', 'Pilih rekening sumber dana.', 'Masukkan Nomor Virtual Account.', 'Masukkan nominal pembayaran sesuai tagihan.', 'Periksa kembali detail transaksi.', 'Masukkan PIN untuk konfirmasi.', 'Pembayaran berhasil.'] },
  BSI: { title: 'Bank Syariah Indonesia VA', app: 'Melalui BYOND by BSI', steps: ['Buka aplikasi BYOND by BSI dan login.', 'Pilih Bayar & Beli.', 'Pilih Virtual Account.', 'Masukkan Nomor Virtual Account.', 'Pilih Lanjutkan.', 'Periksa kembali detail dan nominal pembayaran.', 'Pilih Konfirmasi.', 'Masukkan PIN BYOND by BSI.', 'Pembayaran berhasil.'] },
  Danamon: { title: 'Bank Danamon VA', app: 'Melalui D-Bank PRO', steps: ['Buka aplikasi D-Bank PRO dan login.', 'Pilih menu Virtual Account.', 'Pilih Tambah Virtual Account jika nomor VA belum tersimpan.', 'Masukkan Nomor Virtual Account.', 'Pilih rekening sumber dana.', 'Periksa detail pembayaran.', 'Pilih Lanjut atau Bayar.', 'Masukkan PIN/password transaksi.', 'Pembayaran berhasil. Simpan bukti transaksi.'] },
  Permata: { title: 'Bank Permata VA', app: 'Melalui PermataMobile X', steps: ['Buka aplikasi PermataMobile X dan login.', 'Pilih menu Pembayaran.', 'Pilih Virtual Account.', 'Masukkan Nomor Virtual Account.', 'Periksa detail dan nominal pembayaran.', 'Pilih rekening sumber dana.', 'Konfirmasi pembayaran.', 'Masukkan PIN/otorisasi transaksi.', 'Pembayaran berhasil. Simpan bukti transaksi.'] },
  Maybank: { title: 'Maybank VA', app: 'Melalui M2U ID App', steps: ['Buka aplikasi M2U ID dan login.', 'Pilih Transfer.', 'Pilih Virtual Account.', 'Pilih rekening sumber dana.', 'Masukkan Nomor Virtual Account.', 'Masukkan nominal sesuai tagihan.', 'Pilih Proses.', 'Periksa kembali detail transaksi.', 'Pilih Konfirmasi.', 'Masukkan Passcode Secure2u atau metode autentikasi yang diminta.', 'Pembayaran berhasil.'] },
  Sampoerna: { title: 'Bank Sahabat Sampoerna VA', app: 'Melalui Sampoerna Mobile Banking', steps: ['Buka aplikasi Sampoerna Mobile Banking.', 'Pilih menu Transfer.', 'Pilih sumber dana.', 'Pilih Bank Sahabat Sampoerna sebagai bank tujuan.', 'Masukkan Nomor Virtual Account.', 'Masukkan nominal pembayaran.', 'Periksa detail transaksi.', 'Masukkan password/PIN yang diminta.', 'Pembayaran berhasil. Simpan bukti transaksi.'] },
  'Artha Graha International': { title: 'Bank Artha Graha International VA', app: 'Melalui Mobile Banking Artha Graha', steps: ['Buka aplikasi Mobile Banking Artha Graha.', 'Login ke akun Anda.', 'Pilih menu Pembayaran.', 'Pilih Virtual Account.', 'Masukkan Nomor Virtual Account.', 'Masukkan nominal pembayaran.', 'Periksa kembali detail transaksi.', 'Masukkan Mobile PIN.', 'Pembayaran berhasil. Simpan bukti transaksi.'] },
  Neo: { title: 'Bank Neo Commerce VA', app: 'Melalui neobank', steps: ['Buka aplikasi neobank dan login.', 'Pilih menu Pembayaran VA.', 'Pilih Bank Neo Commerce / BNC.', 'Masukkan Nomor Virtual Account.', 'Periksa informasi pembayaran.', 'Masukkan PIN.', 'Pembayaran berhasil. Simpan bukti transaksi.'] },
}

export default function DuitkuPaymentPage() {
  const router = useRouter()
  const [order, setOrder] = useState(() => readCurrentOrder())
  const [statusMessage, setStatusMessage] = useState('Menunggu konfirmasi pembayaran.')
  const [countdownEndsAt] = useState(() => Date.now() + 10 * 60 * 1000)
  const [remainingSeconds, setRemainingSeconds] = useState(10 * 60)
  const [returnResultCode, setReturnResultCode] = useState<string | null>(null)
  const paymentConfig = order?.paymentMethodConfig ?? {}
  const vaNumber = paymentConfig.vaNumber || ''
  const qrString = paymentConfig.qrString || ''
  const isRetail = order?.paymentMethodCategory === 'RETAIL'
  const logo = useMemo(
    () => getPaymentLogo(order?.paymentMethod) ?? resolvePublicAssetUrl(paymentConfig.imageUrl),
    [order?.paymentMethod, paymentConfig.imageUrl],
  )
  const total = order?.grandTotalAmount ?? 0
  const orderId = order?.id ?? '-'
  const resultMessage = getResultMessage(returnResultCode)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setReturnResultCode(params.get('resultCode'))
  }, [])

  useEffect(() => {
    if (!order?.id) return undefined

    let cancelled = false

    const refreshOrder = async () => {
      try {
        const latestOrder = await fetchCustomerOrder(order.id)
        if (cancelled) return
        saveCurrentOrder(latestOrder)
        setOrder(latestOrder)

        if (isPaidStatus(latestOrder.status)) {
          setStatusMessage('Pembayaran berhasil dikonfirmasi. Mengarahkan ke halaman sukses...')
          router.replace('/payment/success')
          return
        }

        if (isCanceledStatus(latestOrder.status)) {
          setStatusMessage('Transaksi dibatalkan atau kedaluwarsa.')
          return
        }

        setStatusMessage('Menunggu konfirmasi pembayaran.')
      } catch {
        if (!cancelled) {
          setStatusMessage('Belum bisa memperbarui status. Halaman akan mencoba lagi otomatis.')
        }
      }
    }

    refreshOrder()
    const intervalId = window.setInterval(refreshOrder, 5000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [order?.id, router])

  useEffect(() => {
    const updateCountdown = () => setRemainingSeconds(Math.max(0, Math.ceil((countdownEndsAt - Date.now()) / 1000)))
    updateCountdown()
    const intervalId = window.setInterval(updateCountdown, 1000)
    return () => window.clearInterval(intervalId)
  }, [countdownEndsAt])

  const countdownText = `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`

  return (
    <div className="bg-surface min-h-screen flex flex-col pb-8">
      <AppBar title="Pembayaran" onBack={() => router.back()} />

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
        <section className="rounded-xl border border-navy-200 bg-white p-6 text-center shadow-elevation-low">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-navy-500">Total Pembayaran</h2>
          <div className="mb-3 font-heading text-3xl font-bold tracking-tight text-navy-900">
            {formatRupiah(total)}
          </div>
          <p className="text-sm font-semibold text-navy-600">Order ID: {orderId}</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-4 py-2 text-amber-700">
            <Clock className="h-5 w-5" />
            <span className="text-sm font-medium">Selesaikan dalam {countdownText}</span>
          </div>
        </section>

        <section className="rounded-xl border border-navy-200 bg-white p-6 shadow-elevation-low">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-16 items-center justify-center rounded-lg border border-navy-200 bg-white p-2">
                {logo ? (
                  <Image src={logo} alt={order?.paymentMethod || 'Metode pembayaran'} width={64} height={40} unoptimized className="h-full w-full object-contain" />
                ) : isRetail ? (
                  <Store className="h-6 w-6 text-navy-500" />
                ) : (
                  <CreditCard className="h-6 w-6 text-navy-500" />
                )}
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-navy-900">{order?.paymentMethod || 'Metode pembayaran'}</h3>
                <p className="text-sm text-navy-500">
                  {isRetail ? 'Bayar di gerai retail sesuai petunjuk.' : 'Gunakan nomor virtual account untuk menyelesaikan pembayaran.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {vaNumber ? (
              <div className="rounded-lg border border-navy-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy-500">Nomor Pembayaran</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <p className="break-all font-mono text-3xl font-bold leading-tight tracking-wide text-navy-900 sm:text-4xl">{vaNumber}</p>
                  <CopyButton value={vaNumber} />
                </div>
              </div>
            ) : null}

            {qrString ? (
              <div className="rounded-lg border border-navy-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy-500">Kode QRIS</p>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
                  <p className="break-all font-mono text-sm font-bold leading-relaxed text-navy-900">{qrString}</p>
                  <CopyButton value={qrString} />
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-xl border border-navy-200 bg-white p-6 shadow-elevation-low">
          <h3 className="mb-4 font-heading text-xl font-bold text-navy-900">Panduan Pembayaran Virtual Account</h3>
          {VA_GUIDES[order?.paymentMethod || ''] ? (() => {
            const guide = VA_GUIDES[order?.paymentMethod || '']
            return <div className="rounded-lg border border-navy-100 bg-navy-50 p-4"><h4 className="font-bold text-navy-900">{guide.title}</h4><p className="mt-1 text-sm font-semibold text-navy-600">{guide.app}</p><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-navy-700">{guide.steps.map((step, index) => <li key={step}>{index === guide.steps.length - 1 ? `${step} Sistem akan mendeteksi pembayaran secara otomatis.` : step}</li>)}</ol></div>
          })() : <p className="text-sm text-navy-600">Ikuti instruksi pembayaran sesuai metode yang dipilih.</p>}
          <details className="mt-4 rounded-lg border border-navy-200 bg-white p-4"><summary className="cursor-pointer font-bold text-navy-900">Pembayaran Melalui ATM</summary><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-navy-700"><li>Masukkan kartu ATM dan PIN.</li><li>Pilih menu Transfer / Pembayaran.</li><li>Pilih Transfer Antar Bank atau Virtual Account.</li><li>Pilih bank tujuan sesuai bank Virtual Account.</li><li>Masukkan Nomor Virtual Account.</li><li>Masukkan nominal pembayaran jika diminta.</li><li>Periksa nama penerima dan nominal pembayaran.</li><li>Konfirmasi transaksi.</li><li>Simpan struk sebagai bukti pembayaran.</li></ol><p className="mt-3 text-xs text-navy-500">Nama menu dan tahapan ATM dapat berbeda tergantung bank yang digunakan.</p></details>
          <details className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4"><summary className="cursor-pointer font-bold text-amber-900">Perhatian Sebelum Membayar</summary><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-amber-900"><li>Pastikan Nomor Virtual Account sudah benar.</li><li>Pastikan nominal pembayaran sesuai tagihan.</li><li>Jangan membayar menggunakan nomor VA yang sudah kedaluwarsa.</li><li>Jangan transfer ke rekening selain nomor VA dari sistem.</li><li>Simpan bukti transaksi.</li><li>Pembayaran diproses otomatis setelah diterima sistem.</li></ul></details>
        </section>

        <div className="flex items-start gap-3 rounded-xl border border-navy-100 bg-navy-50 p-4">
          {paymentConfig.qrString ? (
            <QrCode className="h-6 w-6 flex-shrink-0 text-gold-500" />
          ) : (
            <Info className="h-6 w-6 flex-shrink-0 text-gold-500" />
          )}
          <p className="text-sm leading-relaxed text-navy-600">
            {resultMessage || statusMessage}
          </p>
        </div>
      </main>
    </div>
  )
}

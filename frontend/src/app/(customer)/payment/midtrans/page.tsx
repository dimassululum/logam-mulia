'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Clock, CreditCard, Info, QrCode } from 'lucide-react'
import { formatRupiah } from '@/core/lib/utils'
import { getPaymentLogo } from '@/features/payment-methods/bank-assets'
import { fetchCustomerOrder, readCurrentOrder, saveCurrentOrder } from '@/features/orders/order-api'
import AppBar from '@/shared/ui/AppBar'
import CopyButton from '@/shared/ui/CopyButton'

type MidtransMethodCode = 'bri_va' | 'bni_va' | 'mandiri_va' | 'cimb_va' | 'permata_va' | 'qris_midtrans'

interface MidtransMethodPreview {
  code: MidtransMethodCode
  label: string
  accountLabel: string
  accountNumber: string
  secondaryLabel?: string
  secondaryValue?: string
}

const METHOD_PREVIEWS: MidtransMethodPreview[] = [
  { code: 'bri_va', label: 'BRI', accountLabel: 'Nomor Virtual Account', accountNumber: '8808001234567890' },
  { code: 'bni_va', label: 'BNI', accountLabel: 'Nomor Virtual Account', accountNumber: '9888001234567890' },
  { code: 'mandiri_va', label: 'Mandiri', accountLabel: 'Kode Pembayaran', accountNumber: '7001201234567890', secondaryLabel: 'Kode Perusahaan', secondaryValue: '70012' },
  { code: 'cimb_va', label: 'CIMB Niaga', accountLabel: 'Nomor Virtual Account', accountNumber: '8259001234567890' },
  { code: 'permata_va', label: 'Permata Bank', accountLabel: 'Nomor Virtual Account', accountNumber: '8560001234567890' },
  { code: 'qris_midtrans', label: 'QRIS', accountLabel: 'Kode QRIS', accountNumber: 'QRIS-MIDTRANS-PREVIEW-001' },
]

function resolveInitialMethod(code?: string | null): MidtransMethodCode {
  return METHOD_PREVIEWS.some((method) => method.code === code) ? (code as MidtransMethodCode) : 'bri_va'
}

function isPaidStatus(status?: string | null) {
  return ['paid', 'success', 'completed', 'selesai'].includes(String(status || '').toLowerCase())
}

function formatCountdown(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds)
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function MidtransPaymentPage() {
  const router = useRouter()
  const [order, setOrder] = useState(() => readCurrentOrder())
  const [statusMessage, setStatusMessage] = useState('Menunggu konfirmasi pembayaran dari Midtrans.')
  const [countdownEndsAt] = useState(() => Date.now() + 10 * 60 * 1000)
  const [remainingSeconds, setRemainingSeconds] = useState(10 * 60)
  const paymentConfig = order?.paymentMethodConfig ?? {}
  const [selectedCode, setSelectedCode] = useState<MidtransMethodCode>(() => resolveInitialMethod(order?.paymentMethodCode))
  const selectedMethod = useMemo(
    () => METHOD_PREVIEWS.find((method) => method.code === selectedCode) ?? METHOD_PREVIEWS[0],
    [selectedCode],
  )
  const logo = getPaymentLogo(selectedMethod.label)
  const total = order?.grandTotalAmount ?? 12875000
  const orderId = order?.id ?? 'INV-PREVIEW-MIDTRANS'
  const isQris = selectedMethod.code === 'qris_midtrans'
  const isRealOrder = Boolean(order?.id && paymentConfig.provider === 'midtrans')
  const realAccountNumber = selectedMethod.code === 'mandiri_va'
    ? paymentConfig.billKey || ''
    : selectedMethod.code === 'qris_midtrans'
      ? paymentConfig.qrString || ''
      : paymentConfig.vaNumber || ''
  const accountNumber = isRealOrder
    ? realAccountNumber
    : selectedMethod.accountNumber
  const secondaryValue = isRealOrder && selectedMethod.code === 'mandiri_va'
    ? paymentConfig.billerCode || ''
    : selectedMethod.secondaryValue
  const qrUrl = isRealOrder ? paymentConfig.qrUrl : null
  const hasPaymentCode = selectedMethod.code === 'mandiri_va'
    ? Boolean(accountNumber && secondaryValue)
    : selectedMethod.code === 'qris_midtrans'
      ? Boolean(accountNumber || qrUrl)
      : Boolean(accountNumber)
  const isPaymentUnavailable = isRealOrder && !hasPaymentCode
  const contactAdminMessage = 'Silakan hubungi admin untuk jalur pembayaran yang aman.'
  const unavailableMessage = selectedMethod.code === 'qris_midtrans'
    ? `QRIS belum tersedia dari Midtrans. ${contactAdminMessage}`
    : selectedMethod.code === 'mandiri_va'
      ? `Kode pembayaran Mandiri belum tersedia dari Midtrans. ${contactAdminMessage}`
      : `Nomor Virtual Account belum tersedia dari Midtrans. ${contactAdminMessage}`
  const countdownText = formatCountdown(remainingSeconds)

  useEffect(() => {
    const updateCountdown = () => {
      setRemainingSeconds(Math.max(0, Math.ceil((countdownEndsAt - Date.now()) / 1000)))
    }

    updateCountdown()
    const countdownId = window.setInterval(updateCountdown, 1000)
    return () => window.clearInterval(countdownId)
  }, [countdownEndsAt])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setSelectedCode(resolveInitialMethod(params.get('method') || order?.paymentMethodCode))
  }, [order?.paymentMethodCode])

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

        if (String(latestOrder.status).toLowerCase() === 'canceled') {
          setStatusMessage('Transaksi dibatalkan atau kedaluwarsa.')
          return
        }

        setStatusMessage('Menunggu konfirmasi pembayaran dari Midtrans.')
      } catch {
        if (!cancelled) {
          setStatusMessage('Belum bisa memperbarui status. Halaman akan mencoba lagi otomatis.')
        }
      }
    }

    refreshOrder()
    const intervalId = window.setInterval(refreshOrder, 3000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [order?.id, router])

  return (
    <div className="bg-surface min-h-screen flex flex-col pb-8">
      <AppBar title="Pembayaran Midtrans" onBack={() => router.back()} />

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
                  <Image src={logo} alt={selectedMethod.label} width={64} height={48} unoptimized className="h-full w-full object-contain" />
                ) : isQris ? (
                  <QrCode className="h-6 w-6 text-navy-500" />
                ) : (
                  <CreditCard className="h-6 w-6 text-navy-500" />
                )}
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-navy-900">{selectedMethod.label}</h3>
                <p className="text-sm text-navy-500">{isQris ? 'Scan QRIS untuk menyelesaikan pembayaran.' : 'Gunakan kode pembayaran berikut.'}</p>
              </div>
            </div>
            {!isRealOrder ? (
              <select
                className="input-base h-10 w-full bg-white text-sm sm:w-44"
                value={selectedCode}
                onChange={(event) => setSelectedCode(event.target.value as MidtransMethodCode)}
              >
                {METHOD_PREVIEWS.map((method) => (
                  <option key={method.code} value={method.code}>{method.label}</option>
                ))}
              </select>
            ) : null}
          </div>

          {isPaymentUnavailable ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700">{unavailableMessage}</p>
              <p className="mt-2 text-sm text-red-600">
                Jangan lakukan pembayaran ke nomor preview atau nomor yang tidak diterbitkan untuk Order ID ini.
              </p>
            </div>
          ) : isQris ? (
            <div className="space-y-4">
              <div className="mx-auto flex aspect-square w-full max-w-[320px] flex-col items-center justify-center rounded-lg border border-navy-100 bg-white p-6 text-center">
                {qrUrl ? (
                  <Image src={qrUrl} alt="QRIS Midtrans" width={320} height={320} unoptimized className="h-full w-full object-contain" />
                ) : (
                  <>
                    {logo ? <Image src={logo} alt="QRIS" width={128} height={80} unoptimized className="mb-4 h-20 w-32 object-contain" /> : <QrCode className="mb-4 h-14 w-14 text-navy-400" />}
                    <QrCode className="h-28 w-28 text-navy-900" />
                    <p className="mt-4 text-sm font-semibold text-navy-700">{isRealOrder ? 'QRIS belum tersedia dari Midtrans' : 'Preview QRIS Midtrans'}</p>
                  </>
                )}
              </div>
              <div className="rounded-lg border border-navy-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy-500">{selectedMethod.accountLabel}</p>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
                  <p className="break-all font-mono text-base font-bold leading-relaxed text-navy-900">{accountNumber}</p>
                  {accountNumber ? <CopyButton value={accountNumber} /> : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {selectedMethod.secondaryLabel && secondaryValue ? (
                <div className="rounded-lg border border-navy-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy-500">{selectedMethod.secondaryLabel}</p>
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
                    <p className="font-mono text-2xl font-bold tracking-wide text-navy-900">{secondaryValue}</p>
                    <CopyButton value={secondaryValue} />
                  </div>
                </div>
              ) : null}
              <div className="rounded-lg border border-navy-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy-500">{selectedMethod.accountLabel}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <p className="break-all font-mono text-3xl font-bold leading-tight tracking-wide text-navy-900 sm:text-4xl">{accountNumber}</p>
                  {accountNumber ? <CopyButton value={accountNumber} /> : null}
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-navy-200 bg-white p-6 shadow-elevation-low">
          <h3 className="mb-4 font-heading text-xl font-bold text-navy-900">Petunjuk Pembayaran</h3>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-navy-700">
            {isQris ? (
              <>
                <li>Buka aplikasi mobile banking atau e-wallet yang mendukung QRIS.</li>
                <li>Scan kode QRIS di halaman ini.</li>
              </>
            ) : (
              <>
                <li>Buka aplikasi mobile banking, internet banking, atau ATM {selectedMethod.label}.</li>
                <li>Pilih menu pembayaran Virtual Account atau pembayaran tagihan sesuai instruksi bank.</li>
                <li>Masukkan kode pembayaran yang tersedia di halaman ini.</li>
              </>
            )}
            <li>Pastikan nominal sama dengan total pembayaran.</li>
            <li>Selesaikan pembayaran sebelum batas waktu berakhir.</li>
          </ol>
        </section>

        <div className="flex items-start gap-3 rounded-xl border border-navy-100 bg-navy-50 p-4">
          <Info className="h-6 w-6 flex-shrink-0 text-gold-500" />
          <p className="text-sm leading-relaxed text-navy-600">
            {isRealOrder
              ? isPaymentUnavailable ? unavailableMessage : statusMessage
              : 'Halaman ini sedang menampilkan data preview karena belum ada order Midtrans aktif di browser ini.'}
          </p>
        </div>
      </main>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Clock, Info, QrCode, UploadCloud } from 'lucide-react'
import { formatRupiah } from '@/core/lib/utils'
import AppBar from '@/shared/ui/AppBar'
import Button from '@/shared/ui/Button'
import { readCurrentOrder, uploadCurrentOrderPaymentProof } from '@/features/orders/order-api'

const MAX_PAYMENT_PROOF_MB = 10
const MAX_PAYMENT_PROOF_BYTES = MAX_PAYMENT_PROOF_MB * 1024 * 1024

export default function PaymentPage() {
  const router = useRouter()
  const order = readCurrentOrder()
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [proofError, setProofError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [qrisAvailable, setQrisAvailable] = useState(true)

  function handleProofChange(file?: File | null) {
    setProofError('')

    if (!file) {
      setPaymentProof(null)
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPaymentProof(null)
      setProofError('Format bukti pembayaran harus JPG, PNG, atau WebP.')
      return
    }

    if (file.size > MAX_PAYMENT_PROOF_BYTES) {
      setPaymentProof(null)
      setProofError(`Ukuran bukti pembayaran maksimal ${MAX_PAYMENT_PROOF_MB}MB.`)
      return
    }

    setPaymentProof(file)
  }

  async function handleUploadProof() {
    if (!order?.id || !paymentProof) return

    setIsUploading(true)
    setProofError('')
    try {
      await uploadCurrentOrderPaymentProof(order.id, paymentProof)
      router.push('/payment/success')
    } catch (error) {
      setProofError(error instanceof Error ? error.message : 'Gagal mengupload bukti pembayaran.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-surface min-h-screen flex flex-col pb-32">
      <AppBar title="Pembayaran QRIS" onBack={() => router.back()} />

      <main className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6 w-full">
        <section className="bg-white rounded-xl border border-navy-200 p-6 flex flex-col items-center justify-center text-center shadow-elevation-low">
          <h2 className="font-bold text-xs text-navy-500 mb-1 uppercase tracking-widest">Total Pembayaran</h2>
          <div className="font-heading text-3xl font-bold text-navy-900 mb-3 tracking-tight">
            {formatRupiah(order?.grandTotalAmount ?? 0)}
          </div>
          <p className="text-sm font-semibold text-navy-600">Order ID: {order?.id ?? '-'}</p>
          <div className="mt-4 flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full text-amber-700 border border-amber-100">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">Upload bukti setelah pembayaran QRIS berhasil.</span>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-navy-200 p-6 shadow-elevation-low">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-gold-200 bg-gold-50 text-gold-700">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold text-navy-900">Scan QRIS Manual</h3>
              <p className="text-sm text-navy-500">Pastikan nominal transfer sama dengan total pembayaran.</p>
            </div>
          </div>

          <div className="rounded-xl border border-navy-200 bg-navy-50 p-4">
            {qrisAvailable ? (
              <Image
                src="/images/qris.png"
                alt="QRIS Manual Logam Mulia"
                width={320}
                height={320}
                className="mx-auto aspect-square w-full max-w-[320px] rounded-lg border border-navy-100 bg-white object-contain p-3"
                onError={() => setQrisAvailable(false)}
              />
            ) : (
              <div className="mx-auto flex aspect-square w-full max-w-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-navy-300 bg-white p-6 text-center">
                <QrCode className="mb-3 h-12 w-12 text-navy-300" />
                <p className="font-semibold text-navy-900">QRIS belum tersedia</p>
                <p className="mt-2 text-sm text-navy-500">Tambahkan file QRIS ke folder public images.</p>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-navy-200 p-6 shadow-elevation-low">
          <h3 className="font-heading text-xl font-bold text-navy-900 mb-4">Petunjuk Pembayaran</h3>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-navy-700">
            <li>Buka aplikasi mobile banking atau e-wallet yang mendukung QRIS.</li>
            <li>Scan QRIS di halaman ini.</li>
            <li>Masukkan nominal persis sesuai total pembayaran.</li>
            <li>Selesaikan pembayaran, lalu simpan screenshot bukti pembayaran.</li>
            <li>Upload bukti pembayaran di form bawah untuk diverifikasi admin.</li>
          </ol>
        </section>

        <section className="bg-white rounded-xl border border-navy-200 p-6 shadow-elevation-low">
          <h3 className="font-heading text-xl font-bold text-navy-900 mb-4">Upload Bukti Pembayaran</h3>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-navy-300 bg-surface p-6 text-center transition-colors [transition-duration:var(--transition-fast)] hover:bg-navy-50">
            <UploadCloud className="mb-3 h-9 w-9 text-navy-400" />
            <p className="mb-1 font-bold text-navy-900">{paymentProof ? paymentProof.name : 'Pilih bukti pembayaran'}</p>
            <p className="text-sm text-navy-500">JPG, PNG, atau WebP. Maksimal {MAX_PAYMENT_PROOF_MB}MB.</p>
            <input
              type="file"
              className="hidden"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(event) => handleProofChange(event.target.files?.[0] ?? null)}
            />
          </label>
          {proofError ? <p className="mt-3 text-sm font-semibold text-red-600">{proofError}</p> : null}
        </section>

        <div className="bg-navy-50 border border-navy-100 p-4 rounded-xl flex items-start gap-3">
          <Info className="w-6 h-6 text-gold-500 flex-shrink-0" />
          <p className="text-sm text-navy-600 leading-relaxed">
            Pesanan akan tetap berstatus menunggu verifikasi sampai admin memeriksa bukti pembayaran Anda.
          </p>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full z-40 bg-white/95 backdrop-blur-md border-t border-navy-200 p-4 md:px-6 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto flex justify-end">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!order?.id || !paymentProof}
            isLoading={isUploading}
            onClick={handleUploadProof}
            className={!order?.id || !paymentProof ? 'opacity-50 cursor-not-allowed md:w-auto' : 'md:w-auto'}
          >
            Upload Bukti Pembayaran
          </Button>
        </div>
      </div>
    </div>
  )
}

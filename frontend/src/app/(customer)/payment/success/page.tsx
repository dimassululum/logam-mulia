'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, Home } from 'lucide-react'
import { formatRupiah } from '@/core/lib/utils'
import Button from '@/shared/ui/Button'
import { useCompanyWhatsAppLink } from '@/features/company/useCompanyContact'
import { readCurrentOrder } from '@/features/orders/order-api'

export default function PaymentSuccessPage() {
  const [show, setShow] = useState(false)
  const [order, setOrder] = useState(readCurrentOrder())
  const waLink = useCompanyWhatsAppLink('Halo admin, saya ingin bertanya tentang pesanan yang sedang diproses.')
  const normalizedStatus = String(order?.status || '').toLowerCase()
  const isGatewayOrder = ['midtrans', 'duitku'].includes(String(order?.paymentMethodConfig?.provider || ''))
  const isPaymentConfirmed = ['paid', 'success', 'completed', 'selesai'].includes(normalizedStatus)
  const title = isGatewayOrder && isPaymentConfirmed ? 'Pembayaran Berhasil' : 'Menunggu Verifikasi'
  const description = isGatewayOrder && isPaymentConfirmed
    ? ''
    : 'Terima kasih. Bukti pembayaran Anda sudah kami terima dan akan diverifikasi oleh admin.'
  const notice = isGatewayOrder && isPaymentConfirmed
    ? 'Pesanan akan diproses oleh admin setelah pembayaran berhasil.'
    : 'Pesanan akan diproses setelah pembayaran dikonfirmasi admin.'

  useEffect(() => {
    // Small delay to trigger animation after mount
    setTimeout(() => setShow(true), 100)
    setOrder(readCurrentOrder())
  }, [])

  return (
    <div className="bg-surface min-h-screen flex flex-col items-center justify-center p-4 py-12 md:py-20">

      {/* Payment Success Card */}
      <main className={`w-full max-w-2xl bg-white rounded-2xl border border-navy-200 shadow-[0_8px_30px_rgba(15,27,45,0.08)] overflow-hidden transition-all duration-700 ease-out transform ${show ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>

        {/* Header Section */}
        <div className="flex flex-col items-center text-center border-b border-navy-100">

          {/* Logo Banner */}
          <div className="w-full bg-[#202737] py-6 px-6 flex items-center justify-center gap-4 animate-in slide-in-from-top-4 duration-700">
            <Image
              src="/images/logo-lm.png"
              alt="Logo Logam Mulia"
              width={64}
              height={64}
              className="object-contain"
            />
            <div className="flex flex-col items-start">
              <h2 className="text-[#c19a5b] font-bold text-[32px] tracking-wider leading-none">LOGAM MULIA</h2>
              <p className="text-[#c19a5b] text-[15px] italic font-serif leading-none mt-1">Purity is reliable</p>
            </div>
          </div>

          <div className="pt-10 pb-12 px-6 md:px-12 flex flex-col items-center">
            <h1 className="font-heading text-[28px] font-bold text-navy-900 mb-3 animate-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
              {title}
            </h1>
            <div className="w-16 h-1 bg-gold-400 rounded-full mb-6 animate-in slide-in-from-bottom-4 duration-500 delay-400 fill-mode-both"></div>
            {description ? (
              <p className="text-navy-600 text-base leading-relaxed max-w-md animate-in slide-in-from-bottom-4 duration-500 delay-500 fill-mode-both">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {/* Transaction Details Section */}
        <div className="py-8 px-6 md:px-12 bg-white animate-in slide-in-from-bottom-4 duration-500 delay-700 fill-mode-both">
          <h2 className="font-bold text-xs text-navy-500 uppercase mb-6 tracking-widest">Ringkasan Transaksi</h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-navy-50 last:border-0">
              <span className="text-sm text-navy-600">Order ID</span>
              <span className="text-sm font-bold text-navy-900">{order?.id ?? '-'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-navy-50 last:border-0">
              <span className="text-sm text-navy-600">Nama Pemesan</span>
              <span className="text-sm font-bold text-navy-900">{order?.customerName ?? '-'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-navy-50 last:border-0">
              <span className="text-sm text-navy-600">Email Pemesan</span>
              <span className="text-sm font-bold text-navy-900">{order?.customerEmail ?? '-'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-navy-50 last:border-0">
              <span className="text-sm text-navy-600">Waktu Transaksi</span>
              <span className="text-sm text-navy-900">{order ? new Date(order.createdAt).toLocaleString('id-ID') : '-'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-navy-50 last:border-0">
              <span className="text-sm text-navy-600">Metode Pembayaran</span>
              <span className="text-sm font-bold text-navy-900">{order?.paymentMethod ?? 'QRIS Manual'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-navy-50 last:border-0">
              <span className="text-sm text-navy-600">Total Pembayaran</span>
              <span className="font-heading text-xl font-bold text-gold-600">{formatRupiah(order?.grandTotalAmount ?? 0)}</span>
            </div>
          </div>

          {/* Delivery Estimate Notice */}
          <div className="mt-8 p-4 bg-navy-50 rounded-xl flex items-start gap-4 border border-navy-100">
            <Clock className="w-6 h-6 text-navy-900 flex-shrink-0" />
            <p className="text-sm text-navy-700 leading-relaxed">
              {notice}
            </p>
          </div>
        </div>

        {/* Actions Section */}
        <div className="py-8 px-6 md:px-12 bg-surface flex flex-col sm:flex-row gap-4 justify-center items-center border-t border-navy-100 animate-in slide-in-from-bottom-4 duration-500 delay-1000 fill-mode-both">
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" fullWidth className="bg-[#25D366] hover:bg-[#128C7E] border-none text-white shadow-md shadow-[#25D366]/20">
              <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Hubungi Admin (WA)
            </Button>
          </a>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" fullWidth>
              <Home className="w-5 h-5" />
              Beranda
            </Button>
          </Link>
        </div>

      </main>
    </div>
  )
}

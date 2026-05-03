'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Home, LineChart, Truck } from 'lucide-react'
import { formatRupiah } from '@/core/lib/utils'
import Button from '@/shared/ui/Button'

export default function PaymentSuccessPage() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Small delay to trigger animation after mount
    setTimeout(() => setShow(true), 100)
  }, [])

  return (
    <div className="bg-surface min-h-screen flex flex-col items-center justify-center p-4 py-12 md:py-20">
      
      {/* Payment Success Card */}
      <main className={`w-full max-w-2xl bg-white rounded-2xl border border-navy-200 shadow-[0_8px_30px_rgba(15,27,45,0.08)] overflow-hidden transition-all duration-700 ease-out transform ${show ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
        
        {/* Header Section */}
        <div className="pt-12 pb-10 px-6 md:px-12 flex flex-col items-center text-center border-b border-navy-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-navy-50 via-white to-white">
          
          {/* Animated Logo */}
          <div className="relative mb-8">
            {/* Ripple Effects */}
            <div className={`absolute inset-0 bg-gold-400/20 rounded-full animate-ping opacity-75 ${show ? 'block' : 'hidden'}`} style={{ animationDuration: '2s' }}></div>
            <div className="relative w-24 h-24 rounded-full bg-navy-900 shadow-xl shadow-navy-900/20 flex items-center justify-center border-4 border-gold-400 z-10 animate-in zoom-in spin-in-12 duration-700">
              <Image 
                src="/images/logo-lm.png" 
                alt="Logo Logam Mulia" 
                width={50} 
                height={50} 
                className="object-contain"
              />
            </div>
          </div>

          <h1 className="font-heading text-3xl font-bold text-navy-900 mb-4 animate-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
            Pembayaran Berhasil!
          </h1>
          <p className="text-navy-600 max-w-md animate-in slide-in-from-bottom-4 duration-500 delay-500 fill-mode-both">
            Terima kasih atas kepercayaan Anda. Pesanan Anda sedang kami proses untuk pengiriman.
          </p>
        </div>

        {/* Transaction Details Section */}
        <div className="py-8 px-6 md:px-12 bg-white animate-in slide-in-from-bottom-4 duration-500 delay-700 fill-mode-both">
          <h2 className="font-bold text-xs text-navy-500 uppercase mb-6 tracking-widest">Ringkasan Transaksi</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-navy-50 last:border-0">
              <span className="text-sm text-navy-600">Order ID</span>
              <span className="text-sm font-bold text-navy-900">INV-20231025-001</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-navy-50 last:border-0">
              <span className="text-sm text-navy-600">Waktu Transaksi</span>
              <span className="text-sm text-navy-900">25 Okt 2023, 14:30 WIB</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-navy-50 last:border-0">
              <span className="text-sm text-navy-600">Metode Pembayaran</span>
              <span className="text-sm font-bold text-navy-900">BRI Virtual Account</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-navy-50 last:border-0">
              <span className="text-sm text-navy-600">Total Pembayaran</span>
              <span className="font-heading text-xl font-bold text-gold-600">{formatRupiah(25300200)}</span>
            </div>
          </div>

          {/* Delivery Estimate Notice */}
          <div className="mt-8 p-4 bg-navy-50 rounded-xl flex items-start gap-4 border border-navy-100">
            <Truck className="w-6 h-6 text-navy-900 flex-shrink-0" />
            <p className="text-sm text-navy-700 leading-relaxed">
              Pesanan Anda diperkirakan tiba dalam <strong className="font-bold text-navy-900">2-3 hari kerja</strong>.
            </p>
          </div>
        </div>

        {/* Actions Section */}
        <div className="py-8 px-6 md:px-12 bg-surface flex flex-col sm:flex-row gap-4 justify-center items-center border-t border-navy-100 animate-in slide-in-from-bottom-4 duration-500 delay-1000 fill-mode-both">
          <Link href="/orders/INV-20231025-001" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" fullWidth>
              <LineChart className="w-5 h-5" />
              Pantau Status
            </Button>
          </Link>
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

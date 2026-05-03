'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, HeadphonesIcon, Trash2, Minus, Plus, Ticket, Check, X, Tag, ShoppingCart } from 'lucide-react'
import { formatRupiah } from '@/core/lib/utils'

export default function CartPage() {
  const [items, setItems] = useState([
    { 
      id: 1, 
      name: 'Emas Batangan Antam 10 Gram', 
      price: 12800000, 
      qty: 2, 
      checked: true, 
      purity: '999.9 Purity • 10G',
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBH3u1sYzkqWZx6AQue8DOWHQDq1Tk9C8uMTADH3a-RH_D3a_JlahFYzHzMGBHOJjT9UF5PGotpm51QApPUPAmrqf-qMIwjdCnxhnA3gzywoJ8kQwbEv1molmx_0Xzn-GdvMD_pxubA_L5-eVVFu1L-UCR4VljUKv1BUrK0rq-uk1vrxSfaK4Tff7ZmlhIqwwDIvVIq6Qzp2TtVhLr1CdiMhupo635BeDXrtGi1E0kp7HPSI6spNErPsZlh_6hU0YGI3F9V2V5BtnZC"
    },
    { 
      id: 2, 
      name: 'Emas Batangan Antam 5 Gram', 
      price: 6450000, 
      qty: 1, 
      checked: true, 
      purity: '999.9 Purity • 5G',
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAwF6R89lLwa8dK2zjrQFUrw1X-d140VTHk1yXG0Gdo4qUzFZSrZmEgUiBn-8wV_hRD_5JMzwuCXIZKEt162UybIhnErRw7Z-3gVSloA-KIP4OQWum2ogggnExb6OdWdQSOQOF4lFV2OqJYbjVOJXpB9WARehPjPg80p1jC45E2saOZTlHYLVj-v3szU-MY2eBMiiQlG1Ci3rUzlbCJ8ySgCeIG7hIxd8OpBRd50tIpd-nl8FH8hO6DZ_WLOV1WaUAjISD6UoD5vQV8"
    }
  ])

  const [showVoucherModal, setShowVoucherModal] = useState(false)
  const [activeVoucher, setActiveVoucher] = useState('')
  const [voucherInput, setVoucherInput] = useState('')

  const allChecked = items.length > 0 && items.every(item => item.checked)
  const selectedCount = items.filter(item => item.checked).reduce((sum, item) => sum + item.qty, 0)

  const toggleAll = () => {
    const newState = !allChecked
    setItems(items.map(item => ({ ...item, checked: newState })))
  }

  const toggleItem = (id: number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ))
  }

  const updateQty = (id: number, delta: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta
        return { ...item, qty: newQty > 0 ? newQty : 1 }
      }
      return item
    }))
  }

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id))
  }

  const subtotalPrice = items
    .filter(item => item.checked)
    .reduce((sum, item) => sum + (item.price * item.qty), 0)

  const discount = activeVoucher === 'ANTAMGOLD' ? 500000 : 0
  const totalPrice = Math.max(0, subtotalPrice - discount)

  const applyVoucher = () => {
    if (voucherInput.toUpperCase() === 'ANTAMGOLD') {
      setActiveVoucher('ANTAMGOLD')
      setShowVoucherModal(false)
    } else {
      alert('Kode voucher tidak valid')
    }
  }

  return (
    <div className="bg-surface min-h-screen pb-44">
      {/* Top AppBar */}
      <header className="flex justify-between items-center px-5 py-4 w-full sticky top-0 z-40 bg-navy-900 border-b border-navy-800 shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gold-400 hover:text-gold-300 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="font-heading text-gold-400 font-bold text-lg tracking-tight">Keranjang</h1>
        </div>
        <div className="flex items-center">
          <button className="text-gold-400 hover:text-gold-300 transition-colors">
            <HeadphonesIcon className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Cart Items List */}
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className={`bg-white p-4 rounded-xl border flex gap-4 items-start shadow-sm transition-colors ${item.checked ? 'border-gold-400 bg-gold-50/10' : 'border-navy-200'}`}>
              <div className="pt-1">
                <label className="cursor-pointer group block relative">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${item.checked ? 'bg-gold-500 border-gold-500' : 'bg-white border-navy-300 group-hover:border-gold-400'}`}>
                    {item.checked && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden"
                    checked={item.checked}
                    onChange={() => toggleItem(item.id)}
                  />
                </label>
              </div>
              <div className="flex-grow flex flex-col sm:flex-row gap-4">
                <div className="w-24 h-24 bg-surface rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-navy-200 relative">
                  <Image 
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-contain p-2"
                  />
                </div>
                <div className="flex-grow flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-heading text-base font-bold text-navy-900 leading-tight">{item.name}</h3>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-navy-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-navy-900 text-gold-400 text-[10px] font-bold uppercase tracking-wider">
                      {item.purity}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-auto">
                    <span className="font-heading text-lg font-bold text-gold-600">{formatRupiah(item.price)}</span>
                    <div className="flex items-center border border-navy-200 rounded-lg bg-surface">
                      <button 
                        onClick={() => updateQty(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center text-navy-600 hover:text-gold-600 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-sm text-navy-900">{item.qty}</span>
                      <button 
                        onClick={() => updateQty(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center text-navy-600 hover:text-gold-600 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-navy-200">
              <ShoppingCart className="w-12 h-12 text-navy-200 mx-auto mb-3" />
              <p className="text-navy-500 font-medium">Keranjang kamu kosong</p>
            </div>
          )}
        </div>
      </main>

      {/* Sticky Bottom Summary with Integrated Voucher & Select All */}
      <div className="fixed bottom-0 left-0 w-full z-30 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
        {/* Voucher Bar */}
        <div 
          onClick={() => setShowVoucherModal(true)}
          className="bg-navy-900 px-5 py-3 border-b border-navy-800 flex justify-between items-center cursor-pointer hover:bg-navy-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-gold-400" />
            <span className="text-gold-400 font-bold text-xs uppercase tracking-wider">
              {activeVoucher ? `Voucher: ${activeVoucher}` : 'Makin Hemat Pakai Promo!'}
            </span>
          </div>
          <button className="text-navy-900 bg-gold-400 hover:bg-gold-300 text-xs font-bold px-4 py-1.5 rounded-lg transition-colors">
            {activeVoucher ? 'Ganti' : 'Gunakan'}
          </button>
        </div>
        
        {/* Checkout Bar */}
        <div className="bg-white/95 backdrop-blur-md px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${allChecked ? 'bg-gold-500 border-gold-500' : 'bg-white border-navy-300 group-hover:border-gold-400'}`}>
                {allChecked && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden"
                checked={allChecked}
                onChange={toggleAll}
              />
              <span className="font-semibold text-sm text-navy-800">Semua</span>
            </label>
            <div className="w-px h-8 bg-navy-200"></div>
            <div className="flex flex-col">
              <span className="text-[11px] text-navy-500 font-bold uppercase tracking-wider mb-0.5">Total</span>
              <span className="font-heading text-xl font-bold text-gold-600 leading-none">
                {formatRupiah(totalPrice)}
              </span>
            </div>
          </div>
          <Link 
            href="/checkout/email"
            className={`font-bold px-6 py-3.5 rounded-xl flex items-center gap-2 transition-all shadow-lg text-sm whitespace-nowrap ${
              totalPrice > 0 
                ? 'bg-gold-400 text-navy-900 hover:brightness-105 active:scale-95 shadow-gold-400/20' 
                : 'bg-navy-100 text-navy-400 pointer-events-none'
            }`}
          >
            Checkout ({selectedCount})
          </Link>
        </div>
      </div>

      {/* Voucher Modal */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy-900/40 backdrop-blur-sm p-4">
          <div className="bg-surface w-full max-w-md rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <div className="flex justify-between items-center p-5 border-b border-navy-200 bg-white">
              <h3 className="font-heading font-bold text-lg text-navy-900">Promo & Voucher</h3>
              <button onClick={() => setShowVoucherModal(false)} className="text-navy-400 hover:text-navy-900 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-5 bg-surface space-y-6">
              {/* Input Code */}
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value)}
                  placeholder="Masukkan kode voucher" 
                  className="flex-grow bg-white border border-navy-200 rounded-xl px-4 py-3 text-navy-900 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all text-sm font-medium"
                />
                <button 
                  onClick={applyVoucher}
                  className="bg-navy-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-navy-800 active:scale-95 transition-all text-sm shadow-md"
                >
                  Terapkan
                </button>
              </div>

              {/* Available Promos */}
              <div>
                <p className="font-bold text-navy-900 mb-3 text-sm">Voucher Tersedia</p>
                <div className="space-y-3">
                  {/* Promo Card */}
                  <div className="bg-white border-2 border-gold-300 rounded-xl p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gold-50 rounded-bl-full -z-0"></div>
                    <div className="relative z-10 flex gap-4">
                      <div className="w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center flex-shrink-0 text-gold-600">
                        <Tag className="w-6 h-6" />
                      </div>
                      <div className="flex-grow">
                        <p className="font-bold text-navy-900">Potongan Ongkir Rp 500rb</p>
                        <p className="text-xs text-navy-500 mt-1">Min. transaksi Rp 10 Juta</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-[10px] font-bold text-gold-600 bg-gold-50 px-2 py-1 rounded uppercase tracking-wider border border-gold-200">
                            ANTAMGOLD
                          </span>
                          <button 
                            onClick={() => { setVoucherInput('ANTAMGOLD'); setActiveVoucher('ANTAMGOLD'); setShowVoucherModal(false); }}
                            className="text-sm font-bold text-navy-900 bg-gold-400 px-4 py-1.5 rounded-lg hover:bg-gold-300 transition-colors"
                          >
                            Pakai
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {activeVoucher && (
              <div className="p-4 border-t border-navy-200 bg-white">
                <button 
                  onClick={() => { setActiveVoucher(''); setVoucherInput(''); setShowVoucherModal(false) }}
                  className="w-full text-red-500 font-bold py-3 rounded-xl hover:bg-red-50 transition-colors text-sm"
                >
                  Lepas Voucher
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

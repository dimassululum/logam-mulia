'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Check, HeadphonesIcon, Minus, Plus, ShoppingCart, Tag, Ticket, Trash2, X } from 'lucide-react'
import { formatRupiah } from '@/core/lib/utils'
import {
  calculateVoucherDiscount,
  ClaimedVoucher,
  LocalCartItem,
  readCartItems,
  readClaimedVouchers,
  saveCartItems,
  saveCheckoutItems,
  saveCheckoutVoucher,
} from '@/features/cart/cart-storage'
import { useCompanyWhatsAppLink } from '@/features/company/useCompanyContact'

export default function CartPage() {
  const waLink = useCompanyWhatsAppLink('Halo admin, saya butuh bantuan terkait keranjang belanja.')
  const [items, setItems] = useState<LocalCartItem[]>([])
  const [claimedVouchers, setClaimedVouchers] = useState<ClaimedVoucher[]>([])
  const [showVoucherModal, setShowVoucherModal] = useState(false)
  const [activeVoucherId, setActiveVoucherId] = useState('')
  const [checkoutHref, setCheckoutHref] = useState('/login?redirect=/checkout')

  useEffect(() => {
    setItems(readCartItems())
    setClaimedVouchers(readClaimedVouchers())
    setCheckoutHref(localStorage.getItem('access_token') ? '/checkout' : '/login?redirect=/checkout')
  }, [])

  function persistItems(nextItems: LocalCartItem[]) {
    setItems(nextItems)
    saveCartItems(nextItems)
  }

  const allChecked = items.length > 0 && items.every((item) => item.checked)
  const selectedItems = items.filter((item) => item.checked)
  const selectedCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0)
  const subtotalPrice = selectedItems.reduce((sum, item) => sum + item.product.totalPrice * item.quantity, 0)
  const activeVoucher = claimedVouchers.find((voucher) => voucher.id === activeVoucherId) ?? null
  const discount = calculateVoucherDiscount(activeVoucher, subtotalPrice)
  const totalPrice = Math.max(0, subtotalPrice - discount)

  const eligibleVouchers = useMemo(
    () => claimedVouchers.filter((voucher) => subtotalPrice >= voucher.minPurchase),
    [claimedVouchers, subtotalPrice],
  )

  function toggleAll() {
    const newState = !allChecked
    persistItems(items.map((item) => ({ ...item, checked: newState })))
  }

  function toggleItem(id: string) {
    persistItems(items.map((item) => (item.product.id === id ? { ...item, checked: !item.checked } : item)))
  }

  function updateQty(id: string, delta: number) {
    persistItems(
      items.map((item) =>
        item.product.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item,
      ),
    )
  }

  function removeItem(id: string) {
    const nextItems = items.filter((item) => item.product.id !== id)
    persistItems(nextItems)
    saveCheckoutItems(nextItems.filter((item) => item.checked))
  }

  function prepareCheckout() {
    saveCheckoutItems(selectedItems)
    saveCheckoutVoucher(activeVoucher)
  }

  return (
    <div className="bg-surface min-h-screen pb-44">
      <header className="flex justify-between items-center px-5 py-4 w-full sticky top-0 z-40 bg-navy-900 border-b border-navy-800 shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gold-400 hover:text-gold-300 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="font-heading text-gold-400 font-bold text-lg tracking-tight">Keranjang</h1>
        </div>
        <a href={waLink} target="_blank" rel="noreferrer" className="text-gold-400 hover:text-gold-300 transition-colors" aria-label="Hubungi CS">
          <HeadphonesIcon className="w-6 h-6" />
        </a>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.product.id} className={`bg-white p-4 rounded-xl border flex gap-4 items-start shadow-sm transition-colors ${item.checked ? 'border-gold-400 bg-gold-50/10' : 'border-navy-200'}`}>
              <div className="pt-1">
                <label className="cursor-pointer group block relative">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${item.checked ? 'bg-gold-500 border-gold-500' : 'bg-white border-navy-300 group-hover:border-gold-400'}`}>
                    {item.checked && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={item.checked} onChange={() => toggleItem(item.product.id)} />
                </label>
              </div>
              <div className="flex-grow flex flex-col sm:flex-row gap-4">
                <div className="w-24 h-24 bg-surface rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-navy-200 relative">
                  {item.product.imageUrl ? (
                    <Image src={item.product.imageUrl} alt={item.product.name} fill className="object-contain p-2" />
                  ) : (
                    <ShoppingCart className="w-8 h-8 text-gold-400/60" />
                  )}
                </div>
                <div className="flex-grow flex flex-col">
                  <div className="flex justify-between items-start mb-1 gap-3">
                    <Link href={`/products/${item.product.slug}`} className="font-heading text-base font-bold text-navy-900 leading-tight hover:text-gold-600">
                      {item.product.name}
                    </Link>
                    <button onClick={() => removeItem(item.product.id)} className="text-navy-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-navy-900 text-gold-400 text-[10px] font-bold uppercase tracking-wider">
                      {item.product.purity || 'Kadar'} • {item.product.weightGram}G
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-auto">
                    <span className="font-heading text-lg font-bold text-gold-600">{formatRupiah(item.product.totalPrice)}</span>
                    <div className="flex items-center border border-navy-200 rounded-lg bg-surface">
                      <button onClick={() => updateQty(item.product.id, -1)} className="w-8 h-8 flex items-center justify-center text-navy-600 hover:text-gold-600 transition-colors">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-sm text-navy-900">{item.quantity}</span>
                      <button onClick={() => updateQty(item.product.id, 1)} className="w-8 h-8 flex items-center justify-center text-navy-600 hover:text-gold-600 transition-colors">
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
              <Link href="/products" className="mt-4 inline-flex rounded-xl bg-gold-400 px-5 py-3 text-sm font-bold text-navy-900">
                Belanja Produk
              </Link>
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full z-30 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
        <button
          type="button"
          onClick={() => setShowVoucherModal(true)}
          className="w-full bg-navy-900 px-5 py-3 border-b border-navy-800 flex justify-between items-center cursor-pointer hover:bg-navy-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-gold-400" />
            <span className="text-gold-400 font-bold text-xs uppercase tracking-wider">
              {activeVoucher ? `Voucher: ${activeVoucher.code}` : 'Pakai voucher yang sudah diklaim'}
            </span>
          </div>
          <span className="text-navy-900 bg-gold-400 text-xs font-bold px-4 py-1.5 rounded-lg">
            {activeVoucher ? 'Ganti' : 'Gunakan'}
          </span>
        </button>

        <div className="bg-white/95 backdrop-blur-md px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${allChecked ? 'bg-gold-500 border-gold-500' : 'bg-white border-navy-300 group-hover:border-gold-400'}`}>
                {allChecked && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <input type="checkbox" className="hidden" checked={allChecked} onChange={toggleAll} />
              <span className="font-semibold text-sm text-navy-800">Semua</span>
            </label>
            <div className="w-px h-8 bg-navy-200"></div>
            <div className="flex flex-col">
              <span className="text-[11px] text-navy-500 font-bold uppercase tracking-wider mb-0.5">Total</span>
              <span className="font-heading text-xl font-bold text-gold-600 leading-none">{formatRupiah(totalPrice)}</span>
              {discount > 0 ? <span className="mt-1 text-xs font-semibold text-green-600">Hemat {formatRupiah(discount)}</span> : null}
            </div>
          </div>
          <Link
            href={checkoutHref}
            onClick={prepareCheckout}
            className={`font-bold px-6 py-3.5 rounded-xl flex items-center gap-2 transition-all shadow-lg text-sm whitespace-nowrap ${
              totalPrice > 0 ? 'bg-gold-400 text-navy-900 hover:brightness-105 active:scale-95 shadow-gold-400/20' : 'bg-navy-100 text-navy-400 pointer-events-none'
            }`}
          >
            Checkout ({selectedCount})
          </Link>
        </div>
      </div>

      {showVoucherModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy-900/40 backdrop-blur-sm p-4">
          <div className="bg-surface w-full max-w-md rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <div className="flex justify-between items-center p-5 border-b border-navy-200 bg-white">
              <h3 className="font-heading font-bold text-lg text-navy-900">Voucher Diklaim</h3>
              <button onClick={() => setShowVoucherModal(false)} className="text-navy-400 hover:text-navy-900 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-5 bg-surface space-y-3">
              {eligibleVouchers.length === 0 ? (
                <div className="rounded-xl border border-navy-200 bg-white p-5 text-center">
                  <Tag className="mx-auto mb-3 h-8 w-8 text-navy-300" />
                  <p className="font-bold text-navy-900">Belum ada voucher yang bisa dipakai</p>
                  <p className="mt-1 text-sm text-navy-500">Ambil voucher di detail produk atau penuhi minimum belanja.</p>
                </div>
              ) : (
                eligibleVouchers.map((voucher) => (
                  <button
                    key={voucher.id}
                    type="button"
                    onClick={() => {
                      setActiveVoucherId(voucher.id)
                      setShowVoucherModal(false)
                    }}
                    className={`w-full rounded-xl border-2 p-4 text-left transition-colors ${
                      activeVoucherId === voucher.id ? 'border-gold-400 bg-gold-50' : 'border-navy-200 bg-white hover:border-gold-300'
                    }`}
                  >
                    <p className="font-bold text-navy-900">{voucher.code}</p>
                    <p className="mt-1 text-sm text-navy-500">Min. transaksi {formatRupiah(voucher.minPurchase)}</p>
                    <p className="mt-3 text-sm font-bold text-red-500">
                      Potongan {voucher.discountType === 'PERCENTAGE' ? `${voucher.discountValue}%` : formatRupiah(voucher.discountValue)}
                    </p>
                  </button>
                ))
              )}
            </div>

            {activeVoucher && (
              <div className="p-4 border-t border-navy-200 bg-white">
                <button
                  onClick={() => {
                    setActiveVoucherId('')
                    setShowVoucherModal(false)
                  }}
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

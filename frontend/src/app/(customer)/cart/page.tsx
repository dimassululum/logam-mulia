'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Check, HeadphonesIcon, Minus, Plus, ShoppingCart, Tag, Trash2 } from 'lucide-react'
import type { Product } from '@/core/types'
import { formatRupiah } from '@/core/lib/utils'
import {
  LocalCartItem,
  readCartItems,
  saveCartItems,
  saveCheckoutItems,
  saveCheckoutVoucher,
} from '@/features/cart/cart-storage'
import { useCompanyWhatsAppLink } from '@/features/company/useCompanyContact'
import { resolvePublicApiBaseUrl } from '@/core/lib/public-url'
import { mapApiProduct } from '@/features/products/product-api'
import { mapStorefrontVoucher, summarizeApplicableVouchers, type StorefrontVoucher } from '@/features/products/voucher-pricing'

const API_URL = resolvePublicApiBaseUrl()

export default function CartPage() {
  const waLink = useCompanyWhatsAppLink('Halo admin, saya butuh bantuan terkait keranjang belanja.')
  const [items, setItems] = useState<LocalCartItem[]>([])
  const [vouchers, setVouchers] = useState<StorefrontVoucher[]>([])
  const [checkoutHref, setCheckoutHref] = useState('/login?redirect=/checkout')

  useEffect(() => {
    const storedItems = readCartItems()
    setItems(storedItems)
    setCheckoutHref(localStorage.getItem('access_token') ? '/checkout' : '/login?redirect=/checkout')

    let alive = true

    async function hydrateCartProducts() {
      if (storedItems.length === 0) return

      try {
        const response = await fetch(`${API_URL}/products?limit=1000&isActive=true`, { cache: 'no-store' })
        const json = await response.json()
        if (!alive || !response.ok || !Array.isArray(json.data)) return

        const productsBySlug = new Map<string, Product>(json.data.map((product: any) => {
          const mappedProduct = mapApiProduct(product)
          return [mappedProduct.slug, mappedProduct]
        }))
        setItems((current) => current.map((item) => {
          const freshProduct = productsBySlug.get(item.product.slug)
          return freshProduct ? { ...item, product: freshProduct } : item
        }))
      } catch (error) {
        console.error('Error refreshing cart products', error)
      }
    }

    hydrateCartProducts()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let alive = true

    async function loadVouchers() {
      try {
        const response = await fetch(`${API_URL}/vouchers/public?limit=100`, { cache: 'no-store' })
        const json = await response.json()
        if (!alive || !response.ok) return
        setVouchers(Array.isArray(json.data) ? json.data.map(mapStorefrontVoucher) : [])
      } catch (error) {
        console.error('Error fetching public vouchers', error)
      }
    }

    loadVouchers()
    return () => {
      alive = false
    }
  }, [])

  function persistItems(nextItems: LocalCartItem[]) {
    setItems(nextItems)
    saveCartItems(nextItems)
  }

  const allChecked = items.length > 0 && items.every((item) => item.checked)
  const selectedItems = items.filter((item) => item.checked)
  const selectedCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0)
  const subtotalPrice = selectedItems.reduce((sum, item) => sum + item.product.totalPrice * item.quantity, 0)
  const voucherSummary = summarizeApplicableVouchers(vouchers, selectedItems.map((item) => ({
    productId: item.product.id,
    price: item.product.totalPrice,
    quantity: item.quantity,
  })))
  const hasAppliedVoucher = voucherSummary.appliedVouchers.length > 0
  const discount = voucherSummary.discountAmount
  const totalPrice = Math.max(0, subtotalPrice - discount)

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
    const primaryVoucher = voucherSummary.appliedVouchers[0]?.voucher
    saveCheckoutVoucher(primaryVoucher ? { ...primaryVoucher, claimedAt: new Date().toISOString() } : null)
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
        <div className={`w-full px-5 py-2.5 border-t flex justify-between items-center transition-colors ${
          hasAppliedVoucher ? 'border-green-200 bg-[#E8F5E9]' : 'border-navy-100 bg-white'
        }`}>
          <div className="flex items-center gap-2">
            <Tag className={`w-4 h-4 ${hasAppliedVoucher ? 'text-[#2E7D32]' : 'text-navy-500'}`} />
            <span className={`text-xs font-semibold ${hasAppliedVoucher ? 'text-[#2E7D32]' : 'text-navy-700'}`}>
              {hasAppliedVoucher ? 'Voucher sudah diterapkan!' : 'Voucher diterapkan otomatis jika tersedia'}
            </span>
          </div>
          {hasAppliedVoucher ? (
            <span className="text-xs font-semibold text-[#2E7D32]">
              Hemat {formatRupiah(discount)}
            </span>
          ) : null}
        </div>

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
              {discount > 0 ? <span className="mt-1 text-xs font-semibold text-[#2E7D32]">Hemat {formatRupiah(discount)}</span> : null}
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
    </div>
  )
}

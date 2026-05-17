'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lock, Ticket } from 'lucide-react'
import Button from '@/shared/ui/Button'
import type { Product } from '@/core/types'
import type { StorefrontVoucher } from '@/features/products/product-api'
import {
  addProductToCart,
  claimVoucher,
  readClaimedVouchers,
  saveCheckoutItems,
} from '@/features/cart/cart-storage'
import { formatRupiah } from '@/core/lib/utils'

export default function ProductDetailActions({
  product,
  vouchers,
}: {
  product: Product
  vouchers: StorefrontVoucher[]
}) {
  const [claimedIds, setClaimedIds] = useState<string[]>([])

  useEffect(() => {
    setClaimedIds(readClaimedVouchers().map((voucher) => voucher.id))
  }, [])

  function handleAddToCart() {
    addProductToCart(product)
  }

  function handleBuyNow() {
    saveCheckoutItems([{ product, quantity: 1, checked: true }])
  }

  function handleClaimVoucher(voucher: StorefrontVoucher) {
    claimVoucher(voucher)
    setClaimedIds(readClaimedVouchers().map((item) => item.id))
  }

  return (
    <>
      {vouchers.length > 0 ? (
        <div className="space-y-3">
          {vouchers.slice(0, 2).map((voucher) => {
            const isClaimed = claimedIds.includes(voucher.id)
            const benefit =
              voucher.discountType === 'PERCENTAGE'
                ? `${voucher.discountValue}%${voucher.maxDiscount ? ` maks. ${formatRupiah(voucher.maxDiscount)}` : ''}`
                : formatRupiah(voucher.discountValue)

            return (
              <div
                key={voucher.id}
                className="bg-gold-50 border-2 border-dashed border-gold-300 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-gold-100/50 transition-colors"
              >
                <div className="flex items-start gap-3 w-full sm:w-auto">
                  <Ticket className="w-5 h-5 text-gold-600 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-gold-600 uppercase tracking-widest mb-1">Voucher Promo</p>
                    <p className="text-sm font-bold text-navy-900">{voucher.code}</p>
                    <p className="mt-1 text-xs text-navy-500">Min. belanja {formatRupiah(voucher.minPurchase)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-dashed border-gold-300">
                  <div className="text-right">
                    <p className="text-[10px] text-navy-500 uppercase tracking-widest mb-0.5">Potongan</p>
                    <p className="text-sm font-bold text-red-500">{benefit}</p>
                  </div>
                  <button
                    type="button"
                    disabled={isClaimed}
                    onClick={() => handleClaimVoucher(voucher)}
                    className="bg-gold-500 text-navy-900 px-5 py-2 rounded-lg text-sm font-bold hover:brightness-105 transition-all shadow-sm disabled:bg-navy-200 disabled:text-navy-500"
                  >
                    {isClaimed ? 'Diklaim' : 'Ambil'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      <div className="fixed bottom-0 left-0 z-50 flex h-20 w-full items-stretch gap-3 border-t border-navy-200 bg-white px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="flex flex-1 items-center justify-center rounded-xl border border-navy-200 bg-white px-3 text-sm font-bold text-navy-900 transition-colors [transition-duration:var(--transition-fast)] hover:bg-navy-50 disabled:text-navy-300"
          aria-label="Tambah ke keranjang"
        >
          Tambah ke Keranjang
        </button>
        <Link href="/checkout/email" onClick={handleBuyNow} className="flex flex-1 flex-col items-center justify-center">
          <Button variant="primary" size="md" fullWidth className="h-full rounded-xl flex-col gap-1" disabled={product.stock === 0}>
            <Lock className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Beli Sekarang</span>
          </Button>
        </Link>
      </div>
    </>
  )
}

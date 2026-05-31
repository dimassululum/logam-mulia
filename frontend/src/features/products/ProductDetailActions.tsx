'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import Button from '@/shared/ui/Button'
import type { Product } from '@/core/types'
import {
  addProductToCart,
  saveCheckoutItems,
} from '@/features/cart/cart-storage'

export default function ProductDetailActions({
  product,
}: {
  product: Product
}) {
  const [checkoutHref, setCheckoutHref] = useState('/login?redirect=/checkout')

  useEffect(() => {
    setCheckoutHref(localStorage.getItem('access_token') ? '/checkout' : '/login?redirect=/checkout')
  }, [])

  function handleAddToCart() {
    addProductToCart(product)
  }

  function handleBuyNow() {
    saveCheckoutItems([{ product, quantity: 1, checked: true }])
  }

  return (
    <>
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
        <Link href={checkoutHref} onClick={handleBuyNow} className="flex flex-1 flex-col items-center justify-center">
          <Button variant="primary" size="md" fullWidth className="h-full rounded-xl flex-col gap-1" disabled={product.stock === 0}>
            <Lock className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Beli Sekarang</span>
          </Button>
        </Link>
      </div>
    </>
  )
}

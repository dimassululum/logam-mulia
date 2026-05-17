'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { ShoppingCart } from 'lucide-react'
import { cn } from '@/core/lib/utils'
import { onCartUpdated, readCartCount } from '@/features/cart/cart-storage'

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const pathname = usePathname()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const syncCartCount = () => setCartCount(readCartCount())

    syncCartCount()
    return onCartUpdated(syncCartCount)
  }, [])

  // Hide on focused flows where a compact AppBar owns navigation.
  const isFocusedFlow =
    pathname === '/cart' ||
    pathname?.startsWith('/checkout') ||
    pathname?.startsWith('/payment')
  
  if (isFocusedFlow) return null;

  return (
    <>
      {/* Spacer to push content down below the fixed header */}
      <div className="h-16 w-full" aria-hidden="true" />
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-40 transition-all [transition-duration:var(--transition-slow)]',
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-elevation-high'
            : 'bg-white',
        )}
      >
        <nav className="container-main h-16 flex items-center relative">

          {/* ── Logo (Kiri) ── */}
          <Link href="/" className="flex items-center group relative z-10" aria-label="Logam Mulia Antam - Beranda">
            <div className="w-10 h-10 relative flex-shrink-0">
              <Image 
                src="/images/logo-lm.png" 
                alt="Logo Logam Mulia" 
                fill
                className="object-contain drop-shadow-md group-hover:drop-shadow-lg transition-all"
              />
            </div>
          </Link>

          {/* ── Title (Tengah) ── */}
          <Link 
            href="/" 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center z-10" 
            aria-label="Logam Mulia Antam - Beranda"
          >
            <div className="leading-tight">
              <span className="block text-[24px] font-heading font-bold text-navy-900 tracking-wide">Logam Mulia</span>
            </div>
          </Link>

          {/* ── Right Actions ── */}
          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            {/* Cart */}
            <Link
              href="/cart"
              id="nav-cart-btn"
              className="relative p-2 text-navy-900 hover:text-white hover:bg-gold-600 rounded-lg [transition-duration:var(--transition-fast)] transition-all"
              aria-label="Keranjang Belanja"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-navy-900 ring-2 ring-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              ) : null}
            </Link>
          </div>
        </nav>
      </header>
    </>
  )
}

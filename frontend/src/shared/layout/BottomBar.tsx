'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/core/lib/utils'
import { onCartUpdated, readCartCount } from '@/features/cart/cart-storage'
import {
  CUSTOMER_NAV_ITEMS,
  isCustomerNavActive,
  resolveCustomerHref,
} from './customerNavigation'

export default function BottomBar() {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const syncAuth = () => setIsLoggedIn(Boolean(localStorage.getItem('access_token')))

    syncAuth()
    window.addEventListener('storage', syncAuth)
    window.addEventListener('lm-auth-updated', syncAuth)

    return () => {
      window.removeEventListener('storage', syncAuth)
      window.removeEventListener('lm-auth-updated', syncAuth)
    }
  }, [pathname])

  useEffect(() => {
    const syncCartCount = () => setCartCount(readCartCount())

    syncCartCount()
    return onCartUpdated(syncCartCount)
  }, [])

  // Hide on detail pages, cart, and checkout to avoid overlap
  const isHidden = 
    pathname.match(/^\/products\/[^/]+$/) || 
    pathname.match(/^\/orders\/[^/]+$/) ||
    pathname.startsWith('/account/profile') ||
    pathname === '/cart' || 
    pathname === '/checkout' ||
    pathname?.startsWith('/payment');

  if (isHidden) return null;

  const bottomNavLinks = CUSTOMER_NAV_ITEMS.filter((link) => link.showInBottomBar)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[9999] bg-navy-900 border-t border-navy-800 shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.3)] md:hidden">
      <div className="container-main flex items-center justify-between h-16 pb-1">
        {bottomNavLinks.map((link) => {
          const isActive = isCustomerNavActive(pathname, link)
          const Icon = link.icon
          const href = resolveCustomerHref(link, isLoggedIn)
          const label = link.id === 'account' && !isLoggedIn ? 'Masuk' : link.label

          return (
            <Link
              key={link.href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center h-full gap-1 group cursor-pointer"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div
                className={cn(
                  'relative p-1 rounded-xl transition-all [transition-duration:var(--transition-fast)] pointer-events-none',
                  isActive 
                    ? 'text-gold-400 bg-gold-400/10' 
                    : 'text-navy-400 group-hover:text-gold-300 group-hover:bg-navy-800'
                )}
              >
                <Icon className={cn('w-6 h-6', isActive ? 'fill-gold-400/20' : '')} />
                {link.id === 'cart' && cartCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-navy-900 ring-2 ring-navy-900">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                ) : null}
              </div>
              <span 
                className={cn(
                  'text-[10px] font-medium transition-colors pointer-events-none',
                  isActive ? 'text-gold-400' : 'text-navy-400 group-hover:text-gold-300'
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

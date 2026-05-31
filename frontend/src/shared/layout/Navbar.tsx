'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRef, useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, ClipboardList, Headphones, LogOut, Menu, ShoppingCart, User, UserPlus, X } from 'lucide-react'
import { cn } from '@/core/lib/utils'
import { onCartUpdated, readCartCount } from '@/features/cart/cart-storage'
import { useCompanyWhatsAppLink } from '@/features/company/useCompanyContact'
import { apiClient } from '@/core/lib/api-client'
import { MOCK_AUTH_COOKIES } from '@/core/lib/mock-auth'
import {
  CUSTOMER_AUTH_ITEMS,
  CUSTOMER_NAV_ITEMS,
  isCustomerNavActive,
  resolveCustomerHref,
  type CustomerNavItem,
} from './customerNavigation'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const supportHref = useCompanyWhatsAppLink('Halo admin, saya butuh bantuan terkait layanan Logam Mulia.')
  const [scrolled,  setScrolled]  = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const readCookie = (name: string) => {
      const match = document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${name}=`))

      return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : ''
    }

    const syncAuth = () => {
      const hasToken = Boolean(localStorage.getItem('access_token'))
      setIsLoggedIn(hasToken)
      setUserName(hasToken ? localStorage.getItem('user_name') || readCookie(MOCK_AUTH_COOKIES.name) || 'Akun' : '')
    }

    syncAuth()
    window.addEventListener('storage', syncAuth)
    window.addEventListener('lm-auth-updated', syncAuth)

    return () => {
      window.removeEventListener('storage', syncAuth)
      window.removeEventListener('lm-auth-updated', syncAuth)
    }
  }, [pathname])

  useEffect(() => {
    setIsMenuOpen(false)
    setIsProfileOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!profileRef.current?.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Hide on focused flows where a compact AppBar owns navigation.
  const isFocusedFlow =
    pathname === '/cart' ||
    pathname?.startsWith('/account/profile') ||
    pathname?.match(/^\/orders\/[^/]+$/) ||
    pathname?.startsWith('/checkout') ||
    pathname?.startsWith('/payment')
  
  if (isFocusedFlow) return null;

  const desktopLinks = CUSTOMER_NAV_ITEMS.filter((item) => {
    if (!item.showInDesktop) return false
    return ['home', 'products', 'boutiques', 'articles'].includes(item.id)
  })

  const utilityLinks = CUSTOMER_NAV_ITEMS.filter((item) => {
    if (item.id === 'support') return true
    return isLoggedIn && item.id === 'orders'
  })

  const drawerLinks = CUSTOMER_NAV_ITEMS.filter((item) => isLoggedIn || (item.id !== 'account' && item.id !== 'orders'))

  function getHref(item: CustomerNavItem) {
    return item.id === 'support' ? supportHref : resolveCustomerHref(item, isLoggedIn)
  }

  async function handleLogout() {
    const refreshToken = localStorage.getItem('refresh_token')
    try {
      await apiClient.post('/auth/logout', { refreshToken })
    } catch {
      // The local session is cleared either way.
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_name')
      localStorage.removeItem('user_email')
      document.cookie = `${MOCK_AUTH_COOKIES.role}=; path=/; max-age=0; SameSite=Lax`
      document.cookie = `${MOCK_AUTH_COOKIES.name}=; path=/; max-age=0; SameSite=Lax`
      document.cookie = `${MOCK_AUTH_COOKIES.email}=; path=/; max-age=0; SameSite=Lax`
      window.dispatchEvent(new Event('lm-auth-updated'))
      setIsLoggedIn(false)
      setUserName('')
      setIsMenuOpen(false)
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <>
      {/* Spacer to push content down below the fixed header */}
      <div className="h-16 w-full md:h-20" aria-hidden="true" />
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-40 border-b border-navy-100 transition-all [transition-duration:var(--transition-slow)]',
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-[0_10px_30px_-24px_rgba(15,27,45,0.6)]'
            : 'bg-white',
        )}
      >
        <nav className="relative flex h-16 w-full items-center gap-6 px-5 md:grid md:h-20 md:grid-cols-[minmax(260px,1fr)_auto_minmax(260px,1fr)] md:px-7 lg:px-10">

          {/* ── Logo (Kiri) ── */}
          <Link href="/" className="flex min-w-0 items-center group relative z-10 md:justify-self-start" aria-label="Logam Mulia - Beranda">
            <div className="relative h-9 w-9 flex-shrink-0 md:flex md:h-12 md:w-14 md:items-center md:justify-center md:rounded-lg md:bg-navy-950 md:p-2">
              <Image 
                src="/images/logo-lm.png" 
                alt="Logo Logam Mulia" 
                fill
                className="object-contain drop-shadow-sm transition-all group-hover:drop-shadow-md md:p-1.5"
              />
            </div>
            <span className="ml-3 hidden whitespace-nowrap font-heading text-[24px] font-bold tracking-wide text-navy-900 md:block">
              Logam Mulia
            </span>
          </Link>

          {/* ── Title (Tengah mobile) ── */}
          <Link 
            href="/" 
            className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center z-10 md:hidden"
            aria-label="Logam Mulia - Beranda"
          >
            <div className="leading-tight">
              <span className="block text-[24px] font-heading font-bold text-navy-900 tracking-wide">Logam Mulia</span>
            </div>
          </Link>

          <div className="hidden items-center justify-center gap-10 md:flex md:justify-self-center">
            {desktopLinks.map((item) => {
              const isActive = isCustomerNavActive(pathname, item)

              return (
                <Link
                  key={item.id}
                  href={getHref(item)}
                  className={cn(
                    'relative py-2 text-[17px] font-bold transition-colors after:absolute after:left-0 after:right-0 after:-bottom-1.5 after:mx-auto after:h-0.5 after:w-0 after:rounded-full after:bg-gold-500 after:transition-all',
                    isActive
                      ? 'text-navy-900 after:w-full'
                      : 'text-navy-700 hover:text-navy-950',
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* ── Right Actions ── */}
          <div className="flex items-center gap-1 sm:gap-2 ml-auto md:ml-0 md:justify-self-end">
            <div className="hidden items-center gap-2 md:flex">
              {utilityLinks.map((item) => {
                const isActive = isCustomerNavActive(pathname, item)
                if (item.id === 'support') {
                  return (
                    <Link
                      key={item.id}
                      href={getHref(item)}
                      target="_blank"
                      rel="noreferrer"
                      className="relative flex h-10 w-10 items-center justify-center rounded-full text-navy-800 transition-all [transition-duration:var(--transition-fast)] hover:bg-navy-50 hover:text-gold-700"
                      aria-label="Bantuan pelanggan"
                      title="Bantuan pelanggan"
                    >
                      <Headphones className="h-5 w-5" />
                    </Link>
                  )
                }

                return (
                  <Link
                    key={item.id}
                    href={getHref(item)}
                    className={cn(
                      'text-[15px] font-bold transition-colors',
                      isActive ? 'text-gold-700' : 'text-navy-500 hover:text-navy-900',
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
            {/* Cart */}
            <Link
              href="/cart"
              id="nav-cart-btn"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-navy-800 transition-all [transition-duration:var(--transition-fast)] hover:bg-navy-50 hover:text-gold-700 md:ml-0"
              aria-label="Keranjang Belanja"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 ? (
                <span className="absolute -right-0.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-navy-900 ring-2 ring-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              ) : null}
            </Link>
            <div ref={profileRef} className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setIsProfileOpen((current) => !current)}
                className={cn(
                  'inline-flex h-12 items-center gap-2 rounded-full border px-5 text-[16px] font-bold transition-all',
                  isProfileOpen
                    ? 'border-gold-500 bg-white text-gold-700 shadow-[0_8px_22px_-18px_rgba(15,27,45,0.8)]'
                    : 'border-gold-300 bg-white text-gold-700 hover:border-gold-500 hover:text-gold-800',
                )}
                aria-expanded={isProfileOpen}
                aria-haspopup="menu"
              >
                <User className="h-[18px] w-[18px]" />
                <span className="max-w-32 truncate">{isLoggedIn ? userName : 'Masuk'}</span>
                <ChevronDown className={cn('h-4 w-4 transition-transform', isProfileOpen ? 'rotate-180' : '')} />
              </button>

              {isProfileOpen ? (
                <div className="absolute right-0 top-full mt-3 w-[360px] overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-[0_24px_70px_-34px_rgba(15,27,45,0.55)]" role="menu">
                  <div className="border-b border-navy-100 px-6 py-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-navy-400">
                      {isLoggedIn ? 'Menu Akun' : 'Akses Akun'}
                    </p>
                    <p className="mt-2 text-base font-medium leading-7 text-navy-900">
                      {isLoggedIn ? userName : 'Masuk untuk checkout dan menyimpan profil belanja.'}
                    </p>
                  </div>

                  <div className="p-6">
                    {isLoggedIn ? (
                      <>
                        <Link
                          href="/account"
                          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-navy-800 hover:bg-navy-50"
                          role="menuitem"
                        >
                          <User className="h-4 w-4 text-gold-600" />
                          Akun Saya
                        </Link>
                        <Link
                          href="/orders"
                          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-navy-800 hover:bg-navy-50"
                          role="menuitem"
                        >
                          <ClipboardList className="h-4 w-4 text-gold-600" />
                          Pesanan Saya
                        </Link>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="mt-1 flex w-full items-center gap-3 rounded-xl border-t border-navy-100 px-3 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                          role="menuitem"
                        >
                          <LogOut className="h-4 w-4" />
                          Keluar
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          className="flex items-center justify-center gap-2 rounded-lg bg-gold-500 px-3 py-4 text-base font-bold text-white shadow-[0_10px_20px_-18px_rgba(15,27,45,0.8)] hover:bg-gold-600"
                          role="menuitem"
                        >
                          <User className="h-4 w-4" />
                          Masuk
                        </Link>
                        <Link
                          href="/register"
                          className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-navy-200 px-3 py-4 text-base font-bold text-navy-800 hover:bg-navy-50"
                          role="menuitem"
                        >
                          <UserPlus className="h-4 w-4 text-gold-600" />
                          Daftar
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-navy-900 transition-colors hover:bg-navy-50 md:hidden"
              aria-label="Buka menu navigasi"
              aria-expanded={isMenuOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </nav>
      </header>

      {isMenuOpen ? (
        <div className="fixed inset-0 z-[10000] md:hidden">
          <button
            type="button"
            aria-label="Tutup menu navigasi"
            className="absolute inset-0 bg-navy-900/45 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          <aside className="absolute right-0 top-0 flex h-full w-[86vw] max-w-sm flex-col bg-white shadow-elevation-high">
            <div className="flex h-16 items-center justify-between border-b border-navy-100 px-5">
              <div className="flex items-center gap-3">
                <div className="relative h-9 w-9">
                  <Image src="/images/logo-lm.png" alt="Logo Logam Mulia" fill className="object-contain" sizes="36px" />
                </div>
                <span className="font-heading text-xl font-bold text-navy-900">Logam Mulia</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-navy-700 hover:bg-navy-50"
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-1">
                {drawerLinks.map((item) => {
                  const Icon = item.icon
                  const isActive = isCustomerNavActive(pathname, item)

                  return (
                    <Link
                      key={item.id}
                      href={getHref(item)}
                      target={item.id === 'support' ? '_blank' : undefined}
                      rel={item.id === 'support' ? 'noreferrer' : undefined}
                      className={cn(
                        'flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-colors',
                        isActive ? 'bg-gold-50 text-gold-700' : 'text-navy-800 hover:bg-navy-50',
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </span>
                      {item.id === 'cart' && cartCount > 0 ? (
                        <span className="rounded-full bg-gold-500 px-2 py-0.5 text-xs font-bold text-navy-900">
                          {cartCount > 99 ? '99+' : cartCount}
                        </span>
                      ) : null}
                    </Link>
                  )
                })}
              </div>

              <div className="mt-5 border-t border-navy-100 pt-4">
                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5" />
                    Keluar
                  </button>
                ) : (
                  <div className="grid gap-2">
                    {CUSTOMER_AUTH_ITEMS.map((item) => {
                      const Icon = item.icon

                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          className={cn(
                            'flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold',
                            item.id === 'register'
                              ? 'bg-gold-500 text-navy-900 hover:bg-gold-400'
                              : 'border border-navy-200 text-navy-800 hover:bg-navy-50',
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  )
}

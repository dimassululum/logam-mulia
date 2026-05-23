import {
  ClipboardList,
  Headphones,
  Home,
  LogIn,
  Package,
  ScrollText,
  ShoppingCart,
  Store,
  User,
  UserPlus,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface CustomerNavItem {
  id: 'home' | 'products' | 'boutiques' | 'articles' | 'orders' | 'cart' | 'support' | 'account'
  label: string
  href: string
  protectedHref?: string
  icon: LucideIcon
  showInDesktop?: boolean
  showInBottomBar?: boolean
}

export const CUSTOMER_NAV_ITEMS: CustomerNavItem[] = [
  { id: 'home', label: 'Beranda', href: '/', icon: Home, showInDesktop: true, showInBottomBar: true },
  { id: 'products', label: 'Produk', href: '/products', icon: Package, showInDesktop: true, showInBottomBar: true },
  { id: 'boutiques', label: 'Butik', href: '/boutiques', icon: Store, showInDesktop: true },
  { id: 'articles', label: 'Artikel', href: '/#artikel', icon: ScrollText, showInDesktop: true },
  {
    id: 'orders',
    label: 'Pesanan',
    href: '/orders',
    protectedHref: '/login?redirect=/orders',
    icon: ClipboardList,
    showInDesktop: true,
  },
  { id: 'cart', label: 'Keranjang', href: '/cart', icon: ShoppingCart, showInBottomBar: true },
  { id: 'support', label: 'Bantuan', href: '#support', icon: Headphones, showInDesktop: true },
  {
    id: 'account',
    label: 'Akun',
    href: '/account',
    protectedHref: '/login?redirect=/account',
    icon: User,
    showInDesktop: true,
    showInBottomBar: true,
  },
]

export const CUSTOMER_AUTH_ITEMS = [
  { id: 'login', label: 'Masuk', href: '/login', icon: LogIn },
  { id: 'register', label: 'Daftar', href: '/register', icon: UserPlus },
] as const

export function resolveCustomerHref(item: CustomerNavItem, isLoggedIn: boolean) {
  return !isLoggedIn && item.protectedHref ? item.protectedHref : item.href
}

export function isCustomerNavActive(pathname: string | null, item: CustomerNavItem) {
  if (!pathname) return false
  if (item.id === 'home') return pathname === '/'
  if (item.href.startsWith('/#')) return false
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

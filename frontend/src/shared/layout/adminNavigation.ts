import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  TicketPercent,
  Users,
  Building2,
  Store,
  Newspaper,
  Clapperboard,
  Image,
  LineChart,
  PanelsTopLeft,
  Star,
} from 'lucide-react'

export interface AdminNavChildItem {
  href: string
  label: string
  icon: LucideIcon
}

export interface AdminNavItem {
  href?: string
  label: string
  icon: LucideIcon
  children?: AdminNavChildItem[]
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Produk', icon: Package },
  { href: '/admin/reviews-rating', label: 'Ulasan & Rating', icon: Star },
  { href: '/admin/metal-prices', label: 'Harga Logam', icon: LineChart },
  { href: '/admin/categories', label: 'Kategori', icon: FolderTree },
  { href: '/admin/orders', label: 'Pesanan', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Data Customer', icon: Users },
  { href: '/admin/vouchers', label: 'Voucher', icon: TicketPercent },
  { href: '/admin/boutiques', label: 'Butik', icon: Store },
  { href: '/admin/articles', label: 'Artikel', icon: Newspaper },
  {
    href: '/admin/company-profile',
    label: 'Company Profile',
    icon: Building2,
    children: [
      { href: '/admin/company-profile/video-animasi', label: 'Video Animasi', icon: Clapperboard },
      { href: '/admin/company-profile/banner', label: 'Banner', icon: Image },
      { href: '/admin/company-profile/footer', label: 'Informasi Perusahaan', icon: PanelsTopLeft },
    ],
  },
]

export function getAdminPageLabel(pathname: string) {
  const childMatch = ADMIN_NAV_ITEMS.flatMap((item) => item.children ?? []).find((child) =>
    pathname === child.href || pathname.startsWith(`${child.href}/`),
  )

  if (childMatch) return childMatch.label

  const matched = ADMIN_NAV_ITEMS.find((item) => {
    if (!item.href) return false
    if (item.href === '/admin') return pathname === '/admin'
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  })

  return matched?.label || 'Admin'
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Package, ClipboardList, User } from 'lucide-react'
import { cn } from '@/core/lib/utils'

const bottomNavLinks = [
  { href: '/',         label: 'Beranda', icon: Home },
  { href: '/products', label: 'Produk',  icon: Package },
  { href: '/orders',   label: 'Pesanan', icon: ClipboardList },
  { href: '/account',  label: 'Akun',    icon: User },
]

export default function BottomBar() {
  const pathname = usePathname()

  // Hide on detail pages, cart, and checkout to avoid overlap
  const isHidden = 
    pathname.match(/^\/products\/[^/]+$/) || 
    pathname.match(/^\/orders\/[^/]+$/) ||
    pathname === '/cart' || 
    pathname === '/checkout' ||
    pathname?.startsWith('/payment');

  if (isHidden) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[9999] bg-navy-900 border-t border-navy-800 shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.3)]">
      <div className="container-main flex items-center justify-between h-16 pb-1">
        {bottomNavLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
          const Icon = link.icon

          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex-1 flex flex-col items-center justify-center h-full gap-1 group cursor-pointer"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div
                className={cn(
                  'p-1 rounded-xl transition-all [transition-duration:var(--transition-fast)] pointer-events-none',
                  isActive 
                    ? 'text-gold-400 bg-gold-400/10' 
                    : 'text-navy-400 group-hover:text-gold-300 group-hover:bg-navy-800'
                )}
              >
                <Icon className={cn('w-6 h-6', isActive ? 'fill-gold-400/20' : '')} />
              </div>
              <span 
                className={cn(
                  'text-[10px] font-medium transition-colors pointer-events-none',
                  isActive ? 'text-gold-400' : 'text-navy-400 group-hover:text-gold-300'
                )}
              >
                {link.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

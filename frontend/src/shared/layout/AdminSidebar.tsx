'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChevronRight, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import type { CurrentUser } from '@/core/types'
import { cn } from '@/core/lib/utils'
import { ADMIN_NAV_ITEMS } from '@/shared/layout/adminNavigation'

interface AdminSidebarProps {
  currentUser: CurrentUser
  collapsed: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
  onToggleCollapsed: () => void
}

export default function AdminSidebar({
  currentUser,
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapsed,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setExpandedGroups((current) => {
      const nextState = { ...current }

      for (const item of ADMIN_NAV_ITEMS) {
        if (!item.children?.length) continue

        const hasActiveChild = item.children.some(
          (child) => pathname === child.href || pathname.startsWith(`${child.href}/`),
        )

        if (hasActiveChild && current[item.label] === undefined) {
          nextState[item.label] = true
        }
      }

      return nextState
    })
  }, [pathname])

  function toggleGroup(label: string) {
    setExpandedGroups((current) => ({
      ...current,
      [label]: !current[label],
    }))
  }

  const content = (
    <div className="flex h-full flex-col bg-navy-900 text-white">
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-4">
        <Link href="/admin" className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-elevation-low">
            <div className="relative h-8 w-8">
              <Image
                src="/images/logo-lm.png"
                alt="Logo Logam Mulia"
                fill
                className="object-contain"
                sizes="32px"
              />
            </div>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">Logam Mulia</p>
              <p className="truncate text-xs text-navy-300">Admin Console</p>
            </div>
          )}
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="hidden rounded-xl border border-white/10 p-2 text-navy-200 transition-colors hover:bg-white/10 sm:inline-flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-xl border border-white/10 p-2 text-navy-200 transition-colors hover:bg-white/10 sm:hidden"
            aria-label="Tutup navigasi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = item.children?.length
            ? item.children.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`))
            : item.href === '/admin'
              ? pathname === item.href
              : item.href
                ? pathname === item.href || pathname.startsWith(`${item.href}/`)
                : false
          const isExpanded = expandedGroups[item.label] ?? isActive
          const Icon = item.icon

          if (item.children?.length) {
            return (
              <div key={item.label} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(item.label)}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition-all',
                    collapsed ? 'justify-center' : 'justify-start',
                    isActive
                      ? 'bg-white/8 text-white'
                      : 'text-navy-200 hover:bg-white/8 hover:text-white',
                  )}
                  title={collapsed ? item.label : undefined}
                  aria-expanded={collapsed ? undefined : isExpanded}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && (
                    <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                      <span className="truncate">{item.label}</span>
                      <ChevronRight className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-90')} />
                    </span>
                  )}
                </button>

                {!collapsed && isExpanded && (
                  <div className="space-y-1 pl-3">
                    {item.children.map((child) => {
                      const childActive = pathname === child.href || pathname.startsWith(`${child.href}/`)
                      const ChildIcon = child.icon

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onCloseMobile}
                          className={cn(
                            'flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm transition-colors',
                            childActive
                              ? 'bg-gold-400 text-navy-900 shadow-elevation-gold'
                              : 'text-navy-300 hover:bg-white/8 hover:text-white',
                          )}
                        >
                          <ChildIcon className="h-4 w-4 shrink-0" />
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href ?? '/admin'}
              onClick={onCloseMobile}
              className={cn(
                'group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all',
                collapsed ? 'justify-center' : 'justify-start',
                isActive
                  ? 'bg-gold-400 text-navy-900 shadow-elevation-gold'
                  : 'text-navy-200 hover:bg-white/8 hover:text-white',
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>
    </div>
  )

  return (
    <>
      <div className="hidden sm:block">
        <aside className={cn('sticky top-0 h-screen border-r border-navy-100 bg-navy-900 transition-[width] duration-300', collapsed ? 'w-24' : 'w-72')}>
          {content}
        </aside>
      </div>

      <div className={cn('fixed inset-0 z-50 sm:hidden', mobileOpen ? 'pointer-events-auto' : 'pointer-events-none')}>
        <div
          className={cn('absolute inset-0 bg-navy-900/40 backdrop-blur-sm transition-opacity', mobileOpen ? 'opacity-100' : 'opacity-0')}
          onClick={onCloseMobile}
        />
        <aside className={cn('absolute inset-y-0 left-0 w-[88vw] max-w-xs transform transition-transform duration-300', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
          {content}
        </aside>
      </div>
    </>
  )
}

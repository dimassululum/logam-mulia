'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/core/store/auth.store'
import type { CurrentUser } from '@/core/types'

interface AdminGuardProps {
  children: (user: CurrentUser) => React.ReactNode
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-navy-500">{message}</p>
      </div>
    </div>
  )
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter()
  const { user, isAuthenticated, fetchMe, isLoading } = useAuthStore()

  // Prevent SSR hydration mismatch — only render auth-dependent UI on client
  const [mounted,     setMounted]     = useState(false)
  const [verified,    setVerified]    = useState(false)

  useEffect(() => {
    setMounted(true)
    // Validate token against API (silently restores session or clears stale tokens)
    fetchMe()
      .catch(() => {})
      .finally(() => setVerified(true))
  }, [fetchMe])

  useEffect(() => {
    if (!mounted || !verified) return
    if (!isAuthenticated || !user) {
      router.replace('/login')
      return
    }
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      router.replace('/')
    }
  }, [mounted, verified, isAuthenticated, user, router])

  if (!mounted || !verified || isLoading) {
    return <LoadingScreen message="Memverifikasi akses..." />
  }

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return <LoadingScreen message="Mengalihkan ke halaman login..." />
  }

  const currentUser: CurrentUser = {
    id:    user.id,
    name:  user.name,
    email: user.email,
    role:  user.role === 'SUPER_ADMIN' ? 'super_admin' : 'admin',
  }

  return <>{children(currentUser)}</>
}

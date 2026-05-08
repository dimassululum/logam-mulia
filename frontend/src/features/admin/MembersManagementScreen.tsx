'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ShieldCheck, Users, UserCheck, XCircle } from 'lucide-react'
import { adminApi } from '@/core/lib/api'
import { FilterInput, FilterSelect } from '@/features/admin/admin-management-shared'
import { FilterModal, FilterToggleButton, InlineToast, TableToolbar, type ToastTone } from '@/features/admin/admin-ui'
import type { AdminTableColumn, AdminTableRow } from '@/shared/ui/AdminTable'
import { AdminEmptyState, AdminPageHeader, AdminStatCard, AdminTable, Badge, Card } from '@/shared/ui'

interface MemberRecord {
  id: string
  name: string
  email: string
  phone: string
  role: string
  isActive: boolean
  isKycVerified: boolean
  totalOrders: number
  joinedAt: string
}

const ROLE_OPTIONS = [
  { value: 'all', label: 'Semua role' },
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function MembersManagementScreen() {
  const [members,   setMembers]   = useState<MemberRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search,       setSearch]       = useState('')
  const [roleFilter,   setRoleFilter]   = useState('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  useEffect(() => {
    adminApi.getUsers({ limit: 200 })
      .then(({ data }) => {
        const raw = data.users ?? data.data ?? []
        setMembers(raw.map((u: any) => ({
          id:             u.id,
          name:           u.name,
          email:          u.email,
          phone:          u.phone ?? '-',
          role:           u.role,
          isActive:       u.isActive,
          isKycVerified:  u.isKycVerified,
          totalOrders:    u._count?.orders ?? 0,
          joinedAt:       u.createdAt,
        })))
      })
      .catch(() => setMembers([]))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(t)
  }, [toast])

  const hasActiveFilter = roleFilter !== 'all'

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase()
    return members.filter((m) => {
      const matchesSearch = !kw || m.name.toLowerCase().includes(kw) || m.email.toLowerCase().includes(kw) || m.phone.includes(kw)
      const matchesRole   = roleFilter === 'all' || m.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [members, search, roleFilter])

  const totalActive    = members.filter((m) => m.isActive).length
  const totalVerified  = members.filter((m) => m.isKycVerified).length
  const totalCustomers = members.filter((m) => m.role === 'CUSTOMER').length

  const columns: AdminTableColumn[] = [
    { id: 'member',   label: 'Member',        className: 'w-[30%]' },
    { id: 'phone',    label: 'Telepon',        className: 'w-[15%]' },
    { id: 'role',     label: 'Role',           className: 'w-[10%]' },
    { id: 'orders',   label: 'Total Order',    className: 'w-[10%]' },
    { id: 'kyc',      label: 'KYC',            className: 'w-[10%]' },
    { id: 'status',   label: 'Status',         className: 'w-[10%]' },
    { id: 'joined',   label: 'Bergabung',      className: 'w-[15%]' },
  ]

  const rows: AdminTableRow[] = filtered.map((m) => ({
    id: m.id,
    mobileTitle: m.name,
    mobileSubtitle: m.email,
    cells: [
      <div key={`${m.id}-member`}>
        <p className="font-semibold text-navy-900 text-sm">{m.name}</p>
        <p className="text-xs text-navy-500 mt-0.5">{m.email}</p>
      </div>,
      <span key={`${m.id}-phone`} className="text-sm text-navy-700">{m.phone}</span>,
      <Badge key={`${m.id}-role`} variant={m.role === 'SUPER_ADMIN' ? 'gold' : m.role === 'ADMIN' ? 'navy' : 'neutral'} label={m.role === 'SUPER_ADMIN' ? 'Super Admin' : m.role === 'ADMIN' ? 'Admin' : 'Customer'} />,
      <span key={`${m.id}-orders`} className="text-sm font-medium text-navy-800">{m.totalOrders}</span>,
      m.isKycVerified
        ? <CheckCircle2 key={`${m.id}-kyc`} className="h-4 w-4 text-green-500" />
        : <XCircle     key={`${m.id}-kyc`} className="h-4 w-4 text-navy-300" />,
      <Badge key={`${m.id}-status`} variant={m.isActive ? 'active' : 'inactive'} />,
      <span key={`${m.id}-joined`} className="text-xs text-navy-500">{formatDate(m.joinedAt)}</span>,
    ],
  }))

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Member"
        description={`${members.length} total member terdaftar`}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminStatCard label="Total Member"  value={String(members.length)}   icon={Users}       tone="gold" />
        <AdminStatCard label="Customer"      value={String(totalCustomers)}   icon={Users}       tone="info" />
        <AdminStatCard label="Aktif"         value={String(totalActive)}      icon={UserCheck}   tone="success" />
        <AdminStatCard label="KYC Verified"  value={String(totalVerified)}    icon={ShieldCheck} tone="gold" />
      </div>

      <Card>
        <TableToolbar>
          <FilterInput
            value={search}
            onChange={setSearch}
            placeholder="Cari nama, email, telepon…"
          />
          <FilterToggleButton
            active={hasActiveFilter}
            onClick={() => setIsFilterOpen((v) => !v)}
          />
        </TableToolbar>

        <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} onReset={() => setRoleFilter('all')}>
          <FilterSelect label="Role" value={roleFilter} onChange={setRoleFilter} options={ROLE_OPTIONS} />
        </FilterModal>

        {isLoading ? (
          <div className="py-16 flex justify-center">
            <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <AdminEmptyState title="Tidak ada member" description="Tidak ada member yang sesuai filter." />
        ) : (
          <AdminTable columns={columns} rows={rows} />
        )}
      </Card>

      <InlineToast toast={toast} />
    </div>
  )
}

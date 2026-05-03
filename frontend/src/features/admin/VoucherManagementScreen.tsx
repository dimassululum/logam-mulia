'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  adminVoucherRecords,
  formatDateRange,
  type AdminVoucherRecord,
  type VoucherStatus,
} from '@/features/admin/admin-management-data'
import { FilterInput, FilterSelect } from '@/features/admin/admin-management-shared'
import { FilterModal, FilterToggleButton, IconActionButton, InlineToast, TableToolbar, type ToastTone } from '@/features/admin/admin-ui'
import type { AdminTableColumn, AdminTableRow } from '@/shared/ui/AdminTable'
import { AdminEmptyState, AdminPageHeader, AdminTable, Badge, Button, Modal } from '@/shared/ui'

function formatBenefit(voucher: AdminVoucherRecord) {
  return voucher.discountType === 'percentage' ? `${voucher.title} • ${voucher.amount}%` : `${voucher.title} • Rp${voucher.amount.toLocaleString('id-ID')}`
}

export default function VoucherManagementScreen() {
  const [vouchers, setVouchers] = useState(adminVoucherRecords)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminVoucherRecord | null>(null)
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const hasActiveFilter = statusFilter !== 'all'

  const filteredVouchers = useMemo(
    () =>
      vouchers.filter((voucher) => {
        const keyword = search.trim().toLowerCase()
        const matchesSearch =
          !keyword ||
          voucher.code.toLowerCase().includes(keyword) ||
          voucher.title.toLowerCase().includes(keyword)

        const matchesStatus = statusFilter === 'all' || voucher.status === statusFilter
        return matchesSearch && matchesStatus
      }),
    [vouchers, search, statusFilter],
  )

  function resetFilters() {
    setStatusFilter('all')
  }

  function showToast(message: string, tone: ToastTone) {
    setToast({ message, tone })
  }

  const columns: AdminTableColumn[] = [
    { id: 'code', label: 'Kode', className: 'w-[20%]' },
    { id: 'benefit', label: 'Benefit', className: 'w-[34%]' },
    { id: 'period', label: 'Periode', className: 'w-[22%]' },
    { id: 'status', label: 'Status', className: 'w-[10%]' },
    { id: 'actions', label: 'Aksi', className: 'w-[14%]' },
  ]

  const rows: AdminTableRow[] = filteredVouchers.map((voucher) => ({
    id: voucher.id,
    cells: [
      <p key={`${voucher.id}-code`} className="text-sm font-semibold text-navy-900">{voucher.code}</p>,
      <div key={`${voucher.id}-benefit`} className="space-y-1">
        <p className="text-sm font-semibold text-navy-900">{voucher.title}</p>
        <p className="text-sm text-navy-500">{voucher.discountType === 'percentage' ? `${voucher.amount}%` : `Rp${voucher.amount.toLocaleString('id-ID')}`}</p>
      </div>,
      <span key={`${voucher.id}-period`} className="text-sm text-navy-700">{formatDateRange(voucher.startDate, voucher.endDate)}</span>,
      <Badge key={`${voucher.id}-status`} variant={voucher.status} />,
      <div key={`${voucher.id}-actions`} className="flex items-center gap-2">
        <Link href={`/admin/vouchers/${voucher.id}`}>
          <span className="inline-flex">
            <IconActionButton label={`Detail ${voucher.code}`} tone="detail" onClick={() => undefined} />
          </span>
        </Link>
        {voucher.status !== 'active' ? (
          <Link href={`/admin/vouchers/${voucher.id}/edit`}>
            <span className="inline-flex">
              <IconActionButton label={`Edit ${voucher.code}`} tone="edit" onClick={() => undefined} />
            </span>
          </Link>
        ) : null}
        <IconActionButton label={`Hapus ${voucher.code}`} tone="delete" onClick={() => setDeleteTarget(voucher)} />
      </div>,
    ],
    mobileTitle: voucher.code,
    mobileSubtitle: (
      <div>
        <p className="font-medium text-navy-900">{voucher.title}</p>
        <p className="mt-1 text-sm text-navy-500">{voucher.discountType === 'percentage' ? `${voucher.amount}%` : `Rp${voucher.amount.toLocaleString('id-ID')}`}</p>
      </div>
    ),
    mobileAside: <Badge variant={voucher.status} />,
    mobileMeta: (
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-navy-700">{formatDateRange(voucher.startDate, voucher.endDate)}</span>
        <div className="flex items-center gap-2">
          <Link href={`/admin/vouchers/${voucher.id}`}>
            <span className="inline-flex">
              <IconActionButton label={`Detail ${voucher.code}`} tone="detail" onClick={() => undefined} />
            </span>
          </Link>
          {voucher.status !== 'active' ? (
            <Link href={`/admin/vouchers/${voucher.id}/edit`}>
              <span className="inline-flex">
                <IconActionButton label={`Edit ${voucher.code}`} tone="edit" onClick={() => undefined} />
              </span>
            </Link>
          ) : null}
          <IconActionButton label={`Hapus ${voucher.code}`} tone="delete" onClick={() => setDeleteTarget(voucher)} />
        </div>
      </div>
    ),
  }))

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Voucher" />

      <InlineToast toast={toast} />

      <div className="space-y-4">
        <TableToolbar>
          <div className="w-full min-w-[220px] lg:w-72">
            <FilterInput label="Cari" value={search} onChange={setSearch} placeholder="Cari kode atau benefit" />
          </div>
          <FilterToggleButton active={hasActiveFilter} onClick={() => setIsFilterOpen(true)} />
          {hasActiveFilter && <Button variant="ghost" className="h-11" onClick={resetFilters}>Reset</Button>}
          <Link href="/admin/vouchers/new">
            <Button className="h-11"><Plus className="h-4 w-4" />Tambah</Button>
          </Link>
        </TableToolbar>

        <AdminTable
          columns={columns}
          rows={rows}
          emptyState={<AdminEmptyState title="Voucher tidak ditemukan" description="Ubah pencarian atau filter." />}
        />
      </div>

      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Filter Voucher">
        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'all', label: 'Semua status' },
            { value: 'active', label: 'Aktif' },
            { value: 'inactive', label: 'Nonaktif' },
            { value: 'expired', label: 'Expired' },
          ]}
        />
      </FilterModal>

      <Modal isOpen={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Hapus Voucher" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-navy-600">Voucher <span className="font-semibold text-navy-900">{deleteTarget?.code}</span> akan dihapus.</p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="danger" onClick={() => {
              if (!deleteTarget) return
              setVouchers((current) => current.filter((voucher) => voucher.id !== deleteTarget.id))
              setDeleteTarget(null)
              showToast('Voucher berhasil dihapus.', 'success')
            }}>
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

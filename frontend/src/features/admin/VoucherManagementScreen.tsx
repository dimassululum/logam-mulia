'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { formatRupiah } from '@/core/lib/utils'
import { FilterInput } from '@/features/admin/admin-management-shared'
import { IconActionButton, InlineToast, TableToolbar, type ToastTone } from '@/features/admin/admin-ui'
import {
  deleteAdminVoucher,
  fetchAdminVouchers,
  type AdminVoucher,
} from '@/features/admin/voucher-api'
import type { AdminTableColumn, AdminTableRow } from '@/shared/ui/AdminTable'
import { AdminEmptyState, AdminPageHeader, AdminTable, Badge, Button, Modal } from '@/shared/ui'

function formatDiscount(voucher: AdminVoucher) {
  return voucher.discountType === 'PERCENTAGE'
    ? `${voucher.discountValue}%`
    : formatRupiah(voucher.discountValue)
}

function formatProducts(voucher: AdminVoucher) {
  if (!voucher.products.length) return 'Semua produk'
  if (voucher.products.length === 1) return voucher.products[0].name
  return `${voucher.products[0].name} +${voucher.products.length - 1} produk`
}

export default function VoucherManagementScreen() {
  const [vouchers, setVouchers] = useState<AdminVoucher[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminVoucher | null>(null)
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  useEffect(() => {
    let alive = true

    async function loadVouchers() {
      try {
        const data = await fetchAdminVouchers()
        if (alive) setVouchers(data)
      } catch {
        if (alive) setToast({ message: 'Gagal memuat data voucher.', tone: 'error' })
      } finally {
        if (alive) setIsLoading(false)
      }
    }

    loadVouchers()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const filteredVouchers = useMemo(
    () =>
      vouchers.filter((voucher) => {
        const keyword = search.trim().toLowerCase()
        if (!keyword) return true

        return (
          voucher.code.toLowerCase().includes(keyword) ||
          voucher.products.some((product) => product.name.toLowerCase().includes(keyword))
        )
      }),
    [vouchers, search],
  )

  async function confirmDelete() {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      await deleteAdminVoucher(deleteTarget.id)
      setVouchers((current) => current.filter((voucher) => voucher.id !== deleteTarget.id))
      setDeleteTarget(null)
      setToast({ message: 'Voucher berhasil dihapus.', tone: 'success' })
    } catch {
      setToast({ message: 'Gagal menghapus voucher.', tone: 'error' })
    } finally {
      setIsDeleting(false)
    }
  }

  const columns: AdminTableColumn[] = [
    { id: 'code', label: 'Kode', className: 'w-[18%]' },
    { id: 'discount', label: 'Diskon', className: 'w-[22%]' },
    { id: 'products', label: 'Produk', className: 'w-[26%]' },
    { id: 'quota', label: 'Kuota', className: 'w-[14%]' },
    { id: 'status', label: 'Status', className: 'w-[10%]' },
    { id: 'actions', label: 'Aksi', className: 'w-[14%]' },
  ]

  const rows: AdminTableRow[] = filteredVouchers.map((voucher) => ({
    id: voucher.id,
    cells: [
      <p key={`${voucher.id}-code`} className="text-sm font-semibold text-navy-900">{voucher.code}</p>,
      <p key={`${voucher.id}-discount`} className="text-sm font-semibold text-navy-900">{formatDiscount(voucher)}</p>,
      <p key={`${voucher.id}-products`} className="text-sm text-navy-700">{formatProducts(voucher)}</p>,
      <p key={`${voucher.id}-quota`} className="text-sm text-navy-700">
        {voucher.usageLimit ? `${voucher.usageCount}/${voucher.usageLimit}` : `${voucher.usageCount} terpakai`}
      </p>,
      <Badge key={`${voucher.id}-status`} variant={voucher.isActive ? 'active' : 'inactive'} />,
      <div key={`${voucher.id}-actions`} className="flex items-center gap-2">
        <Link href={`/admin/vouchers/${voucher.id}`}>
          <span className="inline-flex">
            <IconActionButton label={`Detail ${voucher.code}`} tone="detail" onClick={() => undefined} />
          </span>
        </Link>
        <Link href={`/admin/vouchers/${voucher.id}/edit`}>
          <span className="inline-flex">
            <IconActionButton label={`Edit ${voucher.code}`} tone="edit" onClick={() => undefined} />
          </span>
        </Link>
        <IconActionButton label={`Hapus ${voucher.code}`} tone="delete" onClick={() => setDeleteTarget(voucher)} />
      </div>,
    ],
    mobileTitle: voucher.code,
    mobileSubtitle: (
      <div>
        <p className="font-medium text-navy-900">{formatDiscount(voucher)}</p>
        <p className="mt-1 text-sm text-navy-500">{formatProducts(voucher)}</p>
      </div>
    ),
    mobileAside: <Badge variant={voucher.isActive ? 'active' : 'inactive'} />,
    mobileMeta: (
      <div className="flex items-center justify-end gap-2">
        <Link href={`/admin/vouchers/${voucher.id}`}>
          <span className="inline-flex">
            <IconActionButton label={`Detail ${voucher.code}`} tone="detail" onClick={() => undefined} />
          </span>
        </Link>
        <Link href={`/admin/vouchers/${voucher.id}/edit`}>
          <span className="inline-flex">
            <IconActionButton label={`Edit ${voucher.code}`} tone="edit" onClick={() => undefined} />
          </span>
        </Link>
        <IconActionButton label={`Hapus ${voucher.code}`} tone="delete" onClick={() => setDeleteTarget(voucher)} />
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
            <FilterInput label="Cari" value={search} onChange={setSearch} placeholder="Cari kode atau produk" />
          </div>
          <Link href="/admin/vouchers/new">
            <Button className="h-11"><Plus className="h-4 w-4" />Tambah</Button>
          </Link>
        </TableToolbar>

        <AdminTable
          columns={columns}
          rows={rows}
          emptyState={
            <AdminEmptyState
              title={isLoading ? 'Memuat voucher...' : 'Voucher tidak ditemukan'}
              description={isLoading ? 'Data sedang diambil dari backend.' : 'Ubah pencarian atau tambah voucher baru.'}
            />
          }
        />
      </div>

      <Modal isOpen={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Hapus Voucher" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-navy-600">Voucher <span className="font-semibold text-navy-900">{deleteTarget?.code}</span> akan dihapus dari daftar.</p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Batal</Button>
            <Button variant="danger" onClick={confirmDelete} isLoading={isDeleting}>
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

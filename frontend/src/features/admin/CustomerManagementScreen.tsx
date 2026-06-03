'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { Eye } from 'lucide-react'
import { apiClient } from '@/core/lib/api-client'
import { resolvePublicAssetUrl } from '@/core/lib/public-url'
import { FilterInput } from '@/features/admin/admin-management-shared'
import { InlineToast, TableToolbar, type ToastTone } from '@/features/admin/admin-ui'
import type { AdminTableColumn, AdminTableRow } from '@/shared/ui/AdminTable'
import { AdminEmptyState, AdminPageHeader, AdminTable, Button, Modal } from '@/shared/ui'

interface CustomerRecord {
  id: string
  name: string
  email: string
  ktpUrl: string | null
}

export default function CustomerManagementScreen() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [previewTarget, setPreviewTarget] = useState<CustomerRecord | null>(null)
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  useEffect(() => {
    let alive = true

    async function loadCustomers() {
      try {
        const { data } = await apiClient.get('/customers')
        if (alive) setCustomers(data.data || [])
      } catch {
        if (alive) setToast({ message: 'Gagal memuat data customer.', tone: 'error' })
      } finally {
        if (alive) setIsLoading(false)
      }
    }

    loadCustomers()
    return () => {
      alive = false
    }
  }, [])

  const filteredCustomers = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return customers
    return customers.filter((customer) => (
      customer.name.toLowerCase().includes(keyword) ||
      customer.email.toLowerCase().includes(keyword)
    ))
  }, [customers, search])

  const columns: AdminTableColumn[] = [
    { id: 'name', label: 'Nama', className: 'w-[30%]' },
    { id: 'email', label: 'Email', className: 'w-[34%]' },
    { id: 'ktp', label: 'Thumbnail KTP', className: 'w-[20%]' },
    { id: 'actions', label: 'Aksi', className: 'w-[16%]' },
  ]

  const rows: AdminTableRow[] = filteredCustomers.map((customer) => {
    const ktpUrl = resolvePublicAssetUrl(customer.ktpUrl) || null

    return {
      id: customer.id,
      cells: [
        <p key={`${customer.id}-name`} className="text-sm font-semibold text-navy-900">{customer.name}</p>,
        <p key={`${customer.id}-email`} className="text-sm text-navy-700">{customer.email}</p>,
        <div key={`${customer.id}-ktp`} className="h-14 w-20 overflow-hidden rounded-lg border border-navy-200 bg-navy-50">
          {ktpUrl ? <Image src={ktpUrl} alt={`KTP ${customer.name}`} width={80} height={56} unoptimized className="h-full w-full object-cover" /> : null}
        </div>,
        <div key={`${customer.id}-actions`} className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPreviewTarget(customer)} disabled={!ktpUrl}>
            <Eye className="h-4 w-4" />
            Lihat KTP
          </Button>
        </div>,
      ],
      mobileTitle: customer.name,
      mobileSubtitle: customer.email,
      mobileAside: ktpUrl ? (
        <div className="h-12 w-16 overflow-hidden rounded-lg border border-navy-200 bg-navy-50">
          <Image src={ktpUrl} alt={`KTP ${customer.name}`} width={64} height={48} unoptimized className="h-full w-full object-cover" />
        </div>
      ) : null,
      mobileMeta: (
        <Button variant="ghost" size="sm" onClick={() => setPreviewTarget(customer)} disabled={!ktpUrl}>
          <Eye className="h-4 w-4" />
          Lihat KTP
        </Button>
      ),
    }
  })

  const previewUrl = resolvePublicAssetUrl(previewTarget?.ktpUrl ?? null) || null

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Data Customer" />
      <InlineToast toast={toast} />

      <TableToolbar>
        <div className="w-full min-w-[220px] lg:w-72">
          <FilterInput label="Cari" value={search} onChange={setSearch} placeholder="Cari nama atau email" />
        </div>
      </TableToolbar>

      <AdminTable
        columns={columns}
        rows={rows}
        emptyState={
          <AdminEmptyState
            title={isLoading ? 'Memuat customer...' : 'Customer tidak ditemukan'}
            description={isLoading ? 'Data sedang diambil dari backend.' : 'Belum ada data customer checkout.'}
          />
        }
      />

      <Modal isOpen={previewTarget !== null} onClose={() => setPreviewTarget(null)} title="KTP Customer" size="lg">
        {previewUrl ? (
          <div className="overflow-hidden rounded-xl border border-navy-200 bg-navy-50">
            <Image src={previewUrl} alt={`KTP ${previewTarget?.name}`} width={900} height={560} unoptimized className="h-auto w-full object-contain" />
          </div>
        ) : (
          <p className="text-sm text-navy-600">Customer belum mengunggah KTP.</p>
        )}
      </Modal>
    </div>
  )
}

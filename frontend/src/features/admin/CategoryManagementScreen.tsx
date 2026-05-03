'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  adminCategoryRecords,
  type AdminCategoryRecord,
  type CatalogStatus,
} from '@/features/admin/admin-management-data'
import { FilterInput, FilterSelect, adminSelectClassName } from '@/features/admin/admin-management-shared'
import {
  FilterModal,
  FilterToggleButton,
  IconActionButton,
  InlineToast,
  SortableColumnHeader,
  TableToolbar,
  type SortDirection,
  type ToastTone,
} from '@/features/admin/admin-ui'
import type { AdminTableColumn, AdminTableRow } from '@/shared/ui/AdminTable'
import { AdminEmptyState, AdminPageHeader, AdminTable, Badge, Button, Card, Input, Modal } from '@/shared/ui'

type CategorySortKey = 'productCount'

const EMPTY_FORM = {
  id: '',
  name: '',
  description: '',
  status: 'active' as CatalogStatus,
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
}

export default function CategoryManagementScreen() {
  const [categories, setCategories] = useState(adminCategoryRecords)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [sortKey, setSortKey] = useState<CategorySortKey>('productCount')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formState, setFormState] = useState(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<AdminCategoryRecord | null>(null)
  const [detailTarget, setDetailTarget] = useState<AdminCategoryRecord | null>(null)
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const hasActiveFilter = statusFilter !== 'all'

  const filteredCategories = useMemo(() => {
    const base = categories.filter((category) => {
      const keyword = search.trim().toLowerCase()
      const matchesSearch =
        !keyword ||
        category.name.toLowerCase().includes(keyword) ||
        category.slug.toLowerCase().includes(keyword) ||
        category.description.toLowerCase().includes(keyword)

      const matchesStatus = statusFilter === 'all' || category.status === statusFilter
      return matchesSearch && matchesStatus
    })

    return [...base].sort((left, right) => {
      const direction = sortDirection === 'asc' ? 1 : -1
      return (left[sortKey] - right[sortKey]) * direction
    })
  }, [categories, search, statusFilter, sortKey, sortDirection])

  function showToast(message: string, tone: ToastTone) {
    setToast({ message, tone })
  }

  function openCreateModal() {
    setFormState(EMPTY_FORM)
    setIsFormOpen(true)
  }

  function openEditModal(category: AdminCategoryRecord) {
    setFormState({
      id: category.id,
      name: category.name,
      description: category.description,
      status: category.status,
    })
    setIsFormOpen(true)
  }

  function saveCategory() {
    if (!formState.name.trim() || !formState.description.trim()) {
      showToast('Nama dan deskripsi wajib diisi.', 'error')
      return
    }

    const existing = categories.find((category) => category.id === formState.id)
    const nextCategory: AdminCategoryRecord = {
      id: formState.id || `CAT-${String(categories.length + 1).padStart(3, '0')}`,
      name: formState.name.trim(),
      slug: slugify(formState.name),
      description: formState.description.trim(),
      imageHint: existing?.imageHint ?? '',
      productCount: existing?.productCount ?? 0,
      status: formState.status,
      updatedAt: new Date().toISOString(),
    }

    setCategories((current) => {
      const exists = current.some((category) => category.id === nextCategory.id)
      if (!exists) return [nextCategory, ...current]
      return current.map((category) => (category.id === nextCategory.id ? nextCategory : category))
    })
    setIsFormOpen(false)
    showToast('Kategori berhasil disimpan.', 'success')
  }

  const columns: AdminTableColumn[] = [
    { id: 'name', label: 'Kategori', className: 'w-[28%]' },
    { id: 'description', label: 'Deskripsi', className: 'w-[42%]' },
    {
      id: 'count',
      label: (
        <SortableColumnHeader
          label="Total Produk"
          active={sortKey === 'productCount'}
          direction={sortDirection}
          onClick={() => {
            setSortKey('productCount')
            setSortDirection((current) => (sortKey === 'productCount' && current === 'desc' ? 'asc' : 'desc'))
          }}
        />
      ),
      className: 'w-[12%]',
    },
    { id: 'status', label: 'Status', className: 'w-[8%]' },
    { id: 'actions', label: 'Aksi', className: 'w-[10%]' },
  ]

  const rows: AdminTableRow[] = filteredCategories.map((category) => ({
    id: category.id,
    cells: [
      <div key={`${category.id}-name`}>
        <p className="font-semibold text-navy-900">{category.name}</p>
        <p className="mt-1 text-xs text-navy-500">{category.slug}</p>
      </div>,
      <p key={`${category.id}-description`} className="max-w-xl text-sm text-navy-600">{category.description}</p>,
      <span key={`${category.id}-count`} className="font-semibold text-navy-900">{category.productCount}</span>,
      <Badge key={`${category.id}-status`} variant={category.status} />,
      <div key={`${category.id}-actions`} className="flex items-center gap-2">
        <IconActionButton label={`Detail ${category.name}`} tone="detail" onClick={() => setDetailTarget(category)} />
        <IconActionButton label={`Edit ${category.name}`} tone="edit" onClick={() => openEditModal(category)} />
        <IconActionButton label={`Hapus ${category.name}`} tone="delete" onClick={() => setDeleteTarget(category)} />
      </div>,
    ],
    mobileTitle: category.name,
    mobileSubtitle: category.description,
    mobileAside: <Badge variant={category.status} />,
    mobileMeta: (
      <div className="flex items-center justify-between">
        <span className="text-sm text-navy-700">{category.productCount} produk</span>
        <div className="flex items-center gap-2">
          <IconActionButton label={`Detail ${category.name}`} tone="detail" onClick={() => setDetailTarget(category)} />
          <IconActionButton label={`Edit ${category.name}`} tone="edit" onClick={() => openEditModal(category)} />
          <IconActionButton label={`Hapus ${category.name}`} tone="delete" onClick={() => setDeleteTarget(category)} />
        </div>
      </div>
    ),
  }))

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Kategori" />

      <InlineToast toast={toast} />

      <div className="space-y-4">
        <TableToolbar>
          <div className="w-full min-w-[220px] lg:w-72">
            <FilterInput label="Cari" value={search} onChange={setSearch} placeholder="Cari nama kategori" />
          </div>
          <FilterToggleButton active={hasActiveFilter} onClick={() => setIsFilterOpen(true)} />
          {hasActiveFilter && (
            <Button variant="ghost" className="h-11" onClick={() => setStatusFilter('all')}>
              Reset
            </Button>
          )}
          <Button className="h-11" onClick={openCreateModal}>Tambah</Button>
        </TableToolbar>

        <AdminTable
          columns={columns}
          rows={rows}
          emptyState={<AdminEmptyState title="Kategori tidak ditemukan" description="Ubah pencarian atau filter." />}
        />
      </div>

      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Filter Kategori">
        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'all', label: 'Semua status' },
            { value: 'active', label: 'Aktif' },
            { value: 'inactive', label: 'Nonaktif' },
          ]}
        />
      </FilterModal>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={formState.id ? 'Edit Kategori' : 'Tambah Kategori'} size="md">
        <div className="space-y-4">
          <Input id="category-name" label="Nama" value={formState.name} onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))} />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-navy-700">
            Status
            <select value={formState.status} onChange={(event) => setFormState((current) => ({ ...current, status: event.target.value as CatalogStatus }))} className={adminSelectClassName}>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-navy-700">
            Deskripsi
            <textarea value={formState.description} onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))} rows={4} className="w-full rounded-2xl border border-navy-200 bg-white px-4 py-3 text-sm text-navy-700 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30" />
          </label>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setIsFormOpen(false)}>Batal</Button>
            <Button onClick={saveCategory}>Simpan</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={detailTarget !== null} onClose={() => setDetailTarget(null)} title="Detail Kategori" size="sm">
        <div className="space-y-3 text-sm text-navy-700">
          <div>
            <p className="text-xs text-navy-500">Nama</p>
            <p className="font-medium text-navy-900">{detailTarget?.name}</p>
          </div>
          <div>
            <p className="text-xs text-navy-500">Slug</p>
            <p>{detailTarget?.slug}</p>
          </div>
          <div>
            <p className="text-xs text-navy-500">Total produk</p>
            <p>{detailTarget?.productCount}</p>
          </div>
          <div>
            <p className="text-xs text-navy-500">Deskripsi</p>
            <p>{detailTarget?.description}</p>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Hapus Kategori" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-navy-600">
            Kategori <span className="font-semibold text-navy-900">{deleteTarget?.name}</span> akan dihapus.
          </p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="danger" onClick={() => {
              if (!deleteTarget) return
              setCategories((current) => current.filter((category) => category.id !== deleteTarget.id))
              setDeleteTarget(null)
              showToast('Kategori berhasil dihapus.', 'success')
            }}>
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

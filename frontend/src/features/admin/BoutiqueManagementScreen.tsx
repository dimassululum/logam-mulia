'use client'

import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, MapPinned } from 'lucide-react'
import { apiClient } from '@/core/lib/api-client'
import {
  type AdminBoutiqueRecord,
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

type BoutiqueSortKey = 'city'

type BoutiqueFormField = 'name' | 'city' | 'address' | 'contactPhone' | 'googleMapsUrl' | 'form'
type BoutiqueFormErrors = Partial<Record<BoutiqueFormField, string>>

const EMPTY_FORM = {
  id: '',
  name: '',
  city: '',
  address: '',
  contactPhone: '',
  googleMapsUrl: '',
  status: 'active' as CatalogStatus,
}

function generateSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function mapBoutique(boutique: any): AdminBoutiqueRecord {
  return {
    id: boutique.id,
    name: boutique.name,
    city: boutique.city,
    address: boutique.address,
    contactPhone: boutique.contactPhone,
    googleMapsUrl: boutique.googleMapsUrl,
    status: boutique.isActive ? 'active' : 'inactive',
    updatedAt: boutique.updatedAt,
  }
}

export default function BoutiqueManagementScreen() {
  const [boutiques, setBoutiques] = useState<AdminBoutiqueRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [sortKey, setSortKey] = useState<BoutiqueSortKey>('city')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formState, setFormState] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<BoutiqueFormErrors>({})
  const [isSaving, setIsSaving] = useState(false)
  const [detailTarget, setDetailTarget] = useState<AdminBoutiqueRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminBoutiqueRecord | null>(null)
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  const fetchBoutiques = async () => {
    setIsLoading(true)
    try {
      const { data } = await apiClient.get('/boutiques')
      setBoutiques(data.data.map(mapBoutique))
    } catch (error) {
      console.error('Error fetching boutiques', error)
      showToast('Gagal memuat data butik.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBoutiques()
  }, [])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const hasActiveFilter = statusFilter !== 'all'

  const filteredBoutiques = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    const base = boutiques.filter((boutique) => {
      const matchesSearch =
        !keyword ||
        boutique.name.toLowerCase().includes(keyword) ||
        boutique.city.toLowerCase().includes(keyword) ||
        boutique.address.toLowerCase().includes(keyword) ||
        boutique.contactPhone.toLowerCase().includes(keyword)

      const matchesStatus = statusFilter === 'all' || boutique.status === statusFilter
      return matchesSearch && matchesStatus
    })

    return [...base].sort((left, right) => {
      const direction = sortDirection === 'asc' ? 1 : -1
      return left[sortKey].localeCompare(right[sortKey]) * direction
    })
  }, [boutiques, search, statusFilter, sortKey, sortDirection])

  function showToast(message: string, tone: ToastTone) {
    setToast({ message, tone })
  }

  function updateFormField<Field extends keyof typeof EMPTY_FORM>(field: Field, value: (typeof EMPTY_FORM)[Field]) {
    setFormState((current) => ({ ...current, [field]: value }))
    setFormErrors((current) => {
      if (!current[field as BoutiqueFormField] && !current.form) return current
      const next = { ...current }
      delete next[field as BoutiqueFormField]
      delete next.form
      return next
    })
  }

  function validateForm() {
    const nextErrors: BoutiqueFormErrors = {}
    const mapsUrl = normalizeUrl(formState.googleMapsUrl)

    if (formState.name.trim().length < 2) {
      nextErrors.name = 'Nama butik minimal 2 karakter.'
    }
    if (formState.city.trim().length < 2) {
      nextErrors.city = 'Kota minimal 2 karakter.'
    }
    if (formState.address.trim().length < 5) {
      nextErrors.address = 'Alamat minimal 5 karakter.'
    }
    if (formState.contactPhone.trim().length < 5) {
      nextErrors.contactPhone = 'Nomor kontak minimal 5 karakter.'
    }
    if (!mapsUrl) {
      nextErrors.googleMapsUrl = 'Link Google Maps wajib diisi.'
    } else if (!isValidUrl(mapsUrl)) {
      nextErrors.googleMapsUrl = 'Masukkan URL valid, contoh: https://maps.google.com/?q=Butik.'
    }
    if (!generateSlug(`${formState.name}-${formState.city}`)) {
      nextErrors.name = nextErrors.name ?? 'Nama dan kota harus membentuk slug yang valid.'
      nextErrors.city = nextErrors.city ?? 'Nama dan kota harus membentuk slug yang valid.'
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function applyApiErrors(error: any) {
    const errors = error?.response?.data?.errors
    const message = error?.response?.data?.message

    if (Array.isArray(errors) && errors.length > 0) {
      const nextErrors: BoutiqueFormErrors = {}
      errors.forEach((item: { field?: string; message?: string }) => {
        const field = item.field as BoutiqueFormField | undefined
        if (field && ['name', 'city', 'address', 'contactPhone', 'googleMapsUrl'].includes(field)) {
          nextErrors[field] = item.message || 'Format field belum valid.'
        }
      })
      if (Object.keys(nextErrors).length > 0) {
        setFormErrors(nextErrors)
        return
      }
    }

    if (message?.toLowerCase().includes('slug')) {
      setFormErrors({ name: 'Kombinasi nama dan kota sudah dipakai.', city: 'Gunakan kota atau nama butik yang berbeda.' })
      return
    }

    setFormErrors({ form: message || 'Gagal menyimpan butik. Periksa data lalu coba lagi.' })
  }

  function openCreateModal() {
    setFormState(EMPTY_FORM)
    setFormErrors({})
    setIsFormOpen(true)
  }

  function openEditModal(boutique: AdminBoutiqueRecord) {
    setFormState({
      id: boutique.id,
      name: boutique.name,
      city: boutique.city,
      address: boutique.address,
      contactPhone: boutique.contactPhone,
      googleMapsUrl: boutique.googleMapsUrl,
      status: boutique.status,
    })
    setFormErrors({})
    setIsFormOpen(true)
  }

  async function saveBoutique() {
    if (!validateForm()) return

    const payload = {
      name: formState.name.trim(),
      slug: generateSlug(`${formState.name}-${formState.city}`),
      city: formState.city.trim(),
      address: formState.address.trim(),
      contactPhone: formState.contactPhone.trim(),
      googleMapsUrl: normalizeUrl(formState.googleMapsUrl),
      isActive: formState.status === 'active',
    }

    if (!payload.slug) {
      setFormErrors({ form: 'Slug tidak valid. Ubah nama atau kota butik.' })
      return
    }

    setIsSaving(true)
    try {
      if (formState.id) {
        await apiClient.put(`/boutiques/${formState.id}`, payload)
      } else {
        await apiClient.post('/boutiques', payload)
      }
      setIsFormOpen(false)
      await fetchBoutiques()
      showToast('Butik berhasil disimpan.', 'success')
    } catch (error) {
      console.error('Error saving boutique', error)
      applyApiErrors(error)
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteBoutique() {
    if (!deleteTarget) return

    try {
      await apiClient.delete(`/boutiques/${deleteTarget.id}`)
      setBoutiques((current) => current.filter((boutique) => boutique.id !== deleteTarget.id))
      setDeleteTarget(null)
      showToast('Butik berhasil dihapus.', 'success')
    } catch (error) {
      console.error('Error deleting boutique', error)
      showToast('Gagal menghapus butik.', 'error')
    }
  }

  const columns: AdminTableColumn[] = [
    {
      id: 'boutique',
      label: (
        <SortableColumnHeader
          label="Butik"
          active={sortKey === 'city'}
          direction={sortDirection}
          onClick={() => {
            setSortKey('city')
            setSortDirection((current) => (sortKey === 'city' && current === 'asc' ? 'desc' : 'asc'))
          }}
        />
      ),
      className: 'w-[28%]',
    },
    { id: 'address', label: 'Alamat', className: 'w-[34%]' },
    { id: 'contact', label: 'Kontak', className: 'w-[16%]' },
    { id: 'maps', label: 'Google Maps', className: 'w-[10%]' },
    { id: 'status', label: 'Status', className: 'w-[6%]' },
    { id: 'actions', label: 'Aksi', className: 'w-[6%]' },
  ]

  const rows: AdminTableRow[] = filteredBoutiques.map((boutique) => ({
    id: boutique.id,
    cells: [
      <div key={`${boutique.id}-name`}>
        <p className="text-sm font-semibold text-navy-900">{boutique.name}</p>
        <p className="mt-1 text-sm text-navy-500">{boutique.city}</p>
      </div>,
      <p key={`${boutique.id}-address`} className="max-w-md text-sm text-navy-600">{boutique.address}</p>,
      <p key={`${boutique.id}-contact`} className="text-sm text-navy-700">{boutique.contactPhone}</p>,
      <a
        key={`${boutique.id}-maps`}
        href={boutique.googleMapsUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-sm font-medium text-gold-700 hover:text-gold-600"
      >
        Buka
        <ExternalLink className="h-4 w-4" />
      </a>,
      <Badge key={`${boutique.id}-status`} variant={boutique.status} />,
      <div key={`${boutique.id}-actions`} className="flex items-center gap-2">
        <IconActionButton label={`Detail ${boutique.name}`} tone="detail" onClick={() => setDetailTarget(boutique)} />
        <IconActionButton label={`Edit ${boutique.name}`} tone="edit" onClick={() => openEditModal(boutique)} />
        <IconActionButton label={`Hapus ${boutique.name}`} tone="delete" onClick={() => setDeleteTarget(boutique)} />
      </div>,
    ],
    mobileTitle: boutique.name,
    mobileSubtitle: boutique.address,
    mobileAside: <Badge variant={boutique.status} />,
    mobileMeta: (
      <div className="space-y-3">
        <div className="flex items-start gap-2 text-sm text-navy-700">
          <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />
          <div>
            <p className="font-medium text-navy-900">{boutique.city}</p>
            <p className="mt-1 text-navy-500">{boutique.contactPhone}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <a
            href={boutique.googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-gold-700 hover:text-gold-600"
          >
            Buka Maps
            <ExternalLink className="h-4 w-4" />
          </a>
          <div className="flex items-center gap-2">
            <IconActionButton label={`Detail ${boutique.name}`} tone="detail" onClick={() => setDetailTarget(boutique)} />
            <IconActionButton label={`Edit ${boutique.name}`} tone="edit" onClick={() => openEditModal(boutique)} />
            <IconActionButton label={`Hapus ${boutique.name}`} tone="delete" onClick={() => setDeleteTarget(boutique)} />
          </div>
        </div>
      </div>
    ),
  }))

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Butik" />

      <InlineToast toast={toast} />

      <div className="space-y-4">
        <TableToolbar>
          <div className="w-full min-w-[220px] lg:w-72">
            <FilterInput label="Cari butik" value={search} onChange={setSearch} placeholder="Cari nama butik, kota, alamat" />
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
          emptyState={
            <AdminEmptyState
              title={isLoading ? 'Memuat butik' : 'Butik tidak ditemukan'}
              description={isLoading ? 'Mengambil data dari backend.' : 'Ubah pencarian atau filter.'}
            />
          }
        />
      </div>

      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Filter Butik">
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

      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setFormErrors({})
        }}
        title={formState.id ? 'Edit Butik' : 'Tambah Butik'}
        size="md"
      >
        <div className="space-y-4">
          {formErrors.form ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {formErrors.form}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              id="boutique-name"
              label="Nama butik"
              value={formState.name}
              error={formErrors.name}
              onChange={(event) => updateFormField('name', event.target.value)}
            />
            <Input
              id="boutique-city"
              label="Kota"
              value={formState.city}
              error={formErrors.city}
              onChange={(event) => updateFormField('city', event.target.value)}
            />
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-navy-700">
            Alamat
            <textarea
              value={formState.address}
              onChange={(event) => updateFormField('address', event.target.value)}
              rows={4}
              className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-navy-700 outline-none transition focus:ring-2 ${
                formErrors.address
                  ? 'border-red-400 focus:border-red-400 focus:ring-red-400/30'
                  : 'border-navy-200 focus:border-gold-400 focus:ring-gold-400/30'
              }`}
            />
            {formErrors.address ? <p className="text-xs text-red-500">{formErrors.address}</p> : null}
          </label>

          <Input
            id="boutique-contact-phone"
            label="Nomor kontak"
            value={formState.contactPhone}
            error={formErrors.contactPhone}
            onChange={(event) => updateFormField('contactPhone', event.target.value)}
          />

          <Input
            id="boutique-maps-url"
            label="Link Google Maps"
            value={formState.googleMapsUrl}
            hint="Bisa pakai maps.google.com/... atau URL lengkap https://..."
            error={formErrors.googleMapsUrl}
            onChange={(event) => updateFormField('googleMapsUrl', event.target.value)}
          />

          {formState.id ? (
            <label className="flex flex-col gap-1.5 text-sm font-medium text-navy-700">
              Status
              <select
                value={formState.status}
                onChange={(event) => updateFormField('status', event.target.value as CatalogStatus)}
                className={adminSelectClassName}
              >
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </label>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => {
              setIsFormOpen(false)
              setFormErrors({})
            }}>Batal</Button>
            <Button onClick={saveBoutique} isLoading={isSaving}>Simpan</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={detailTarget !== null} onClose={() => setDetailTarget(null)} title="Detail Butik" size="md">
        <div className="space-y-3 text-sm text-navy-700">
          <div>
            <p className="text-xs text-navy-500">Nama butik</p>
            <p className="font-medium text-navy-900">{detailTarget?.name}</p>
          </div>
          <div>
            <p className="text-xs text-navy-500">Kota</p>
            <p>{detailTarget?.city}</p>
          </div>
          <div>
            <p className="text-xs text-navy-500">Alamat</p>
            <p>{detailTarget?.address}</p>
          </div>
          <div>
            <p className="text-xs text-navy-500">Kontak</p>
            <p>{detailTarget?.contactPhone}</p>
          </div>
          <div>
            <p className="text-xs text-navy-500">Google Maps</p>
            {detailTarget?.googleMapsUrl ? (
              <a
                href={detailTarget.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium text-gold-700 hover:text-gold-600"
              >
                Buka link
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <p>-</p>
            )}
          </div>
          <div>
            <p className="text-xs text-navy-500">Status</p>
            {detailTarget && <Badge variant={detailTarget.status} />}
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Hapus Butik" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-navy-600">
            Butik <span className="font-semibold text-navy-900">{deleteTarget?.name}</span> akan dihapus dari daftar.
          </p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="danger" onClick={deleteBoutique}>Hapus</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

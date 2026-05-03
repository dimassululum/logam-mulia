'use client'

import { useEffect, useMemo, useState } from 'react'
import { ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react'
import { CompanyProfileToast, SelectField, useCompanyProfileToast, type PublishStatus } from '@/features/admin/company-profile-shared'
import { IconActionButton } from '@/features/admin/admin-ui'
import type { AdminTableColumn, AdminTableRow } from '@/shared/ui/AdminTable'
import { AdminEmptyState, AdminPageHeader, AdminTable, Badge, Button, Card, Input, Modal } from '@/shared/ui'

interface BannerRecord {
  id: string
  title: string
  thumbnailUrl: string
  thumbnailName: string
  status: PublishStatus
  expiresAt: string
}

const initialBanners: BannerRecord[] = [
  {
    id: 'banner-1',
    title: 'Promo Beli Emas Online',
    thumbnailUrl: '/images/banner-1.png',
    thumbnailName: 'banner-1.png',
    status: 'active',
    expiresAt: '2026-12-31',
  },
  {
    id: 'banner-2',
    title: 'Gempita Hari Raya',
    thumbnailUrl: '/images/banner-2.png',
    thumbnailName: 'banner-2.png',
    status: 'active',
    expiresAt: '2026-06-30',
  },
  {
    id: 'banner-3',
    title: 'Simfoni Ibu Pertiwi',
    thumbnailUrl: '/images/banner-3.jpg',
    thumbnailName: 'banner-3.jpg',
    status: 'inactive',
    expiresAt: '2026-04-15',
  },
]

const EMPTY_FORM = {
  id: '',
  title: '',
  thumbnailUrl: '',
  thumbnailName: '',
  status: 'active' as PublishStatus,
  expiresAt: '',
}

function formatDateLabel(value: string) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

export default function CompanyProfileBannerScreen() {
  const { toast, showToast } = useCompanyProfileToast()
  const [banners, setBanners] = useState(initialBanners)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formState, setFormState] = useState(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<BannerRecord | null>(null)

  useEffect(() => {
    return () => {
      banners.forEach((banner) => {
        if (banner.thumbnailUrl.startsWith('blob:')) {
          URL.revokeObjectURL(banner.thumbnailUrl)
        }
      })
    }
  }, [banners])

  const columns: AdminTableColumn[] = [
    { id: 'title', label: 'Judul Internal', className: 'w-[34%]' },
    { id: 'thumbnail', label: 'Thumbnail', className: 'w-[22%]' },
    { id: 'status', label: 'Status', className: 'w-[14%]' },
    { id: 'expires', label: 'Kedaluwarsa', className: 'w-[18%]' },
    { id: 'actions', label: 'Aksi', className: 'w-[12%]' },
  ]

  const rows: AdminTableRow[] = useMemo(
    () =>
      banners.map((banner) => {
        return {
          id: banner.id,
          cells: [
            <p key={`${banner.id}-title`} className="text-sm font-semibold text-navy-900">{banner.title}</p>,
            <div key={`${banner.id}-thumb`} className="flex items-center gap-3">
              <div className="h-14 w-24 overflow-hidden rounded-xl border border-navy-100 bg-navy-50">
                {banner.thumbnailUrl ? (
                  <img src={banner.thumbnailUrl} alt={banner.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-navy-400">
                    <ImagePlus className="h-4 w-4" />
                  </div>
                )}
              </div>
            </div>,
            <Badge key={`${banner.id}-status`} variant={banner.status} />,
            <span key={`${banner.id}-expires`} className="text-sm text-navy-700">{formatDateLabel(banner.expiresAt)}</span>,
            <div key={`${banner.id}-actions`} className="flex items-center gap-2">
              <IconActionButton label={`Edit ${banner.title}`} tone="edit" onClick={() => openEditModal(banner)} />
              <IconActionButton label={`Hapus ${banner.title}`} tone="delete" onClick={() => setDeleteTarget(banner)} />
            </div>,
          ],
          mobileTitle: banner.title,
          mobileSubtitle: (
            <div className="flex items-center gap-3">
              <div className="h-12 w-20 overflow-hidden rounded-xl border border-navy-100 bg-navy-50">
                {banner.thumbnailUrl ? (
                  <img src={banner.thumbnailUrl} alt={banner.title} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <span className="text-sm text-navy-500">{formatDateLabel(banner.expiresAt)}</span>
            </div>
          ),
          mobileAside: <Badge variant={banner.status} />,
          mobileMeta: (
            <div className="flex items-center justify-end gap-2">
              <IconActionButton label={`Edit ${banner.title}`} tone="edit" onClick={() => openEditModal(banner)} />
              <IconActionButton label={`Hapus ${banner.title}`} tone="delete" onClick={() => setDeleteTarget(banner)} />
            </div>
          ),
        }
      }),
    [banners],
  )

  function openCreateModal() {
    setFormState(EMPTY_FORM)
    setIsFormOpen(true)
  }

  function openEditModal(banner: BannerRecord) {
    setFormState({
      id: banner.id,
      title: banner.title,
      thumbnailUrl: banner.thumbnailUrl,
      thumbnailName: banner.thumbnailName,
      status: banner.status,
      expiresAt: banner.expiresAt,
    })
    setIsFormOpen(true)
  }

  function handleThumbnailChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (formState.thumbnailUrl.startsWith('blob:')) {
      URL.revokeObjectURL(formState.thumbnailUrl)
    }

    setFormState((current) => ({
      ...current,
      thumbnailName: file.name,
      thumbnailUrl: URL.createObjectURL(file),
    }))
  }

  function saveBanner() {
    if (!formState.title.trim() || !formState.thumbnailUrl.trim() || !formState.expiresAt) {
      showToast('Judul, file banner, dan tanggal kedaluwarsa wajib diisi.', 'error')
      return
    }

    const nextRecord: BannerRecord = {
      id: formState.id || `banner-${banners.length + 1}`,
      title: formState.title.trim(),
      thumbnailUrl: formState.thumbnailUrl,
      thumbnailName: formState.thumbnailName || 'banner-image',
      status: formState.status,
      expiresAt: formState.expiresAt,
    }

    setBanners((current) => {
      const exists = current.some((banner) => banner.id === nextRecord.id)
      if (!exists) return [nextRecord, ...current]
      return current.map((banner) => (banner.id === nextRecord.id ? nextRecord : banner))
    })
    setIsFormOpen(false)
    showToast('Banner berhasil disimpan.', 'success')
  }

  function deleteBanner() {
    if (!deleteTarget) return
    if (deleteTarget.thumbnailUrl.startsWith('blob:')) {
      URL.revokeObjectURL(deleteTarget.thumbnailUrl)
    }
    setBanners((current) => current.filter((banner) => banner.id !== deleteTarget.id))
    setDeleteTarget(null)
    showToast('Banner berhasil dihapus.', 'success')
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Banner"
        description="Kelola banner-banner yang muncul dan bergeser secara otomatis pada halaman home."
      />

      <CompanyProfileToast toast={toast} />

      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <Button size="sm" onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Tambah Banner
          </Button>
        </div>
        <AdminTable
          columns={columns}
          rows={rows}
          emptyState={<AdminEmptyState title="Banner belum tersedia" description="Tambahkan banner pertama untuk homepage." />}
        />
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={formState.id ? 'Edit Banner' : 'Tambah Banner'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            id="banner-title"
            label="Judul"
            value={formState.title}
            onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))}
          />

          <label className="flex flex-col gap-1.5 text-sm font-medium text-navy-700">
            <span>File upload</span>
            <label className="flex min-h-28 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-navy-200 bg-navy-50 px-4 py-6 text-center transition-colors hover:border-gold-300 hover:bg-gold-50/40">
              <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} />
              <div className="space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-navy-500 shadow-elevation-low">
                  <ImagePlus className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium text-navy-900">{formState.thumbnailName || 'Pilih file banner'}</p>
                <p className="text-xs text-navy-500">Klik untuk upload atau ganti gambar</p>
              </div>
            </label>
          </label>

          {formState.thumbnailUrl && (
            <Card padding="sm" className="border-navy-100">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-navy-900">Preview</p>
                <div className="overflow-hidden rounded-2xl border border-navy-100 bg-navy-50">
                  <img src={formState.thumbnailUrl} alt={formState.title || 'Preview banner'} className="aspect-[16/6] w-full object-cover" />
                </div>
              </div>
            </Card>
          )}

          <Input
            id="banner-expiry"
            label="Tanggal kedaluwarsa"
            type="date"
            value={formState.expiresAt}
            onChange={(event) => setFormState((current) => ({ ...current, expiresAt: event.target.value }))}
          />

          <SelectField
            label="Status"
            value={formState.status}
            onChange={(value) => setFormState((current) => ({ ...current, status: value as PublishStatus }))}
            options={[
              { value: 'active', label: 'Aktif' },
              { value: 'inactive', label: 'Nonaktif' },
            ]}
          />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setIsFormOpen(false)}>Batal</Button>
            <Button onClick={saveBanner}>
              <Pencil className="h-4 w-4" />
              Simpan
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Hapus Banner" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-navy-600">
            Banner <span className="font-semibold text-navy-900">{deleteTarget?.title}</span> akan dihapus dari daftar.
          </p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="danger" onClick={deleteBanner}>
              <Trash2 className="h-4 w-4" />
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

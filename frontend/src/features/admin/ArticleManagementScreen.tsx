'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  formatAdminDateShort,
  type AdminArticleRecord,
} from '@/features/admin/admin-management-data'
import { contentsApi } from '@/core/lib/api'
import { FilterInput, FilterSelect } from '@/features/admin/admin-management-shared'
import { FilterModal, FilterToggleButton, IconActionButton, InlineToast, TableToolbar, type ToastTone } from '@/features/admin/admin-ui'
import type { AdminTableColumn, AdminTableRow } from '@/shared/ui/AdminTable'
import { AdminEmptyState, AdminPageHeader, AdminTable, Badge, Button, Modal } from '@/shared/ui'

function mapApiArticle(c: any): AdminArticleRecord {
  return {
    id:           c.id,
    slug:         c.slug,
    title:        c.title,
    thumbnailUrl: c.imageUrl ?? '',
    contentHtml:  c.content ?? '',
    publishedAt:  c.createdAt,
    status:       c.status === 'published' ? 'active' : 'inactive',
  }
}

export default function ArticleManagementScreen() {
  const [articles,  setArticles]  = useState<AdminArticleRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    contentsApi.list({ limit: 100 })
      .then(({ data }) => {
        const raw = data.contents ?? data.data ?? []
        setArticles(raw.map(mapApiArticle))
      })
      .catch(() => setArticles([]))
      .finally(() => setIsLoading(false))
  }, [])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminArticleRecord | null>(null)
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const hasActiveFilter = statusFilter !== 'all'

  const filteredArticles = useMemo(
    () =>
      articles.filter((article) => {
        const keyword = search.trim().toLowerCase()
        const matchesSearch =
          !keyword ||
          article.title.toLowerCase().includes(keyword) ||
          article.slug.toLowerCase().includes(keyword)

        const matchesStatus = statusFilter === 'all' || article.status === statusFilter
        return matchesSearch && matchesStatus
      }),
    [articles, search, statusFilter],
  )

  function showToast(message: string, tone: ToastTone) {
    setToast({ message, tone })
  }

  const columns: AdminTableColumn[] = [
    { id: 'thumbnail', label: 'Thumbnail', className: 'w-[16%]' },
    { id: 'title', label: 'Judul', className: 'w-[42%]' },
    { id: 'published', label: 'Waktu Terbit', className: 'w-[18%]' },
    { id: 'status', label: 'Status', className: 'w-[10%]' },
    { id: 'actions', label: 'Aksi', className: 'w-[14%]' },
  ]

  const rows: AdminTableRow[] = filteredArticles.map((article) => ({
    id: article.id,
    cells: [
      <div key={`${article.id}-thumb`} className="h-14 w-24 overflow-hidden rounded-xl border border-navy-100 bg-navy-50">
        <img src={article.thumbnailUrl} alt={article.title} className="h-full w-full object-cover" />
      </div>,
      <p key={`${article.id}-title`} className="text-sm font-semibold text-navy-900">{article.title}</p>,
      <span key={`${article.id}-published`} className="text-sm text-navy-700">{formatAdminDateShort(article.publishedAt)}</span>,
      <Badge key={`${article.id}-status`} variant={article.status} />,
      <div key={`${article.id}-actions`} className="flex items-center gap-2">
        <Link href={`/admin/articles/${article.id}/edit`}>
          <span className="inline-flex">
            <IconActionButton label={`Edit ${article.title}`} tone="edit" onClick={() => undefined} />
          </span>
        </Link>
        <IconActionButton label={`Hapus ${article.title}`} tone="delete" onClick={() => setDeleteTarget(article)} />
      </div>,
    ],
    mobileTitle: article.title,
    mobileSubtitle: formatAdminDateShort(article.publishedAt),
    mobileAside: <Badge variant={article.status} />,
    mobileMeta: (
      <div className="flex justify-end gap-2">
        <Link href={`/admin/articles/${article.id}/edit`}>
          <span className="inline-flex">
            <IconActionButton label={`Edit ${article.title}`} tone="edit" onClick={() => undefined} />
          </span>
        </Link>
        <IconActionButton label={`Hapus ${article.title}`} tone="delete" onClick={() => setDeleteTarget(article)} />
      </div>
    ),
  }))

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Artikel" />

      <InlineToast toast={toast} />

      <div className="space-y-4">
        <TableToolbar>
          <div className="w-full min-w-[220px] lg:w-72">
            <FilterInput label="Cari" value={search} onChange={setSearch} placeholder="Cari judul artikel" />
          </div>
          <FilterToggleButton active={hasActiveFilter} onClick={() => setIsFilterOpen(true)} />
          {hasActiveFilter && <Button variant="ghost" className="h-11" onClick={() => setStatusFilter('all')}>Reset</Button>}
          <Link href="/admin/articles/new">
            <Button className="h-11">
              <Plus className="h-4 w-4" />
              Tambah
            </Button>
          </Link>
        </TableToolbar>

        <AdminTable
          columns={columns}
          rows={rows}
          emptyState={<AdminEmptyState title="Artikel tidak ditemukan" description="Ubah pencarian atau filter." />}
        />
      </div>

      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Filter Artikel">
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

      <Modal isOpen={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Hapus Artikel" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-navy-600">Artikel <span className="font-semibold text-navy-900">{deleteTarget?.title}</span> akan dihapus.</p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="danger" onClick={() => {
              if (!deleteTarget) return
              setArticles((current) => current.filter((article) => article.id !== deleteTarget.id))
              setDeleteTarget(null)
              showToast('Artikel berhasil dihapus.', 'success')
            }}>
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

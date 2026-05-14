'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, PackagePlus, Pencil, XCircle } from 'lucide-react'
import { formatRupiah } from '@/core/lib/utils'
import { apiClient } from '@/core/lib/api-client'
import {
  adminProductRecords,
  productCategoryOptions,
  type AdminProductRecord,
} from '@/features/admin/admin-management-data'
import { FilterInput, FilterSelect } from '@/features/admin/admin-management-shared'
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
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminStatCard,
  AdminTable,
  Badge,
  Button,
  Card,
  Input,
  Modal,
} from '@/shared/ui'

type PriceChangeMode = 'set' | 'increase' | 'decrease'
type ProductSortKey = 'price' | 'stock'

interface ProductPriceField {
  id: string
  value: string
}

const STOCK_FILTER_OPTIONS = [
  { value: 'all', label: 'Semua stok' },
  { value: 'healthy', label: 'Stok aman' },
  { value: 'low', label: 'Stok rendah' },
  { value: 'empty', label: 'Stok habis' },
]

const PRICE_MODE_OPTIONS: { value: PriceChangeMode; label: string }[] = [
  { value: 'set', label: 'Set harga' },
  { value: 'increase', label: 'Naikkan %' },
  { value: 'decrease', label: 'Turunkan %' },
]

function sanitizeNumberInput(value: string) {
  return value.replace(/[^\d]/g, '')
}

function isUpdatedToday(value: string) {
  const now = new Date()
  const date = new Date(value)
  return now.getFullYear() === date.getFullYear() && now.getMonth() === date.getMonth() && now.getDate() === date.getDate()
}

function getStockTone(stock: number) {
  if (stock === 0) return 'text-red-600'
  if (stock <= 5) return 'text-amber-600'
  return 'text-navy-900'
}

export default function ProductManagementScreen() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [sortKey, setSortKey] = useState<ProductSortKey>('price')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false)
  const [priceMode, setPriceMode] = useState<PriceChangeMode>('set')
  const [percentageValue, setPercentageValue] = useState('')
  const [priceFields, setPriceFields] = useState<ProductPriceField[]>([])
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [deleteScope, setDeleteScope] = useState<'single' | 'bulk'>('single')
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        apiClient.get('/products?limit=100'),
        apiClient.get('/categories')
      ])

      setCategories(categoriesRes.data.data)
      setProducts(productsRes.data.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.slug, // using slug as sku for now
        category: p.category?.name || 'Lainnya',
        price: p.price,
        stock: p.stock,
        weightGram: p.weightGram,
        status: p.isActive ? 'active' : 'inactive',
        updatedAt: p.updatedAt,
        accent: 'from-blue-50 to-blue-100', // Mock accent color
        imageUrl: p.images?.[0]?.imageUrl || '',
      })))
    } catch (err) {
      console.error('Error fetching data', err)
      showToast('Gagal memuat data produk', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const hasActiveFilter = statusFilter !== 'all' || categoryFilter !== 'all' || stockFilter !== 'all'

  const filteredProducts = useMemo(() => {
    const base = products.filter((product) => {
      const keyword = search.trim().toLowerCase()
      const matchesSearch =
        !keyword ||
        product.name.toLowerCase().includes(keyword) ||
        product.sku.toLowerCase().includes(keyword) ||
        product.category.toLowerCase().includes(keyword)

      const matchesStatus = statusFilter === 'all' || product.status === statusFilter
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'healthy' && product.stock > 5) ||
        (stockFilter === 'low' && product.stock > 0 && product.stock <= 5) ||
        (stockFilter === 'empty' && product.stock === 0)

      return matchesSearch && matchesStatus && matchesCategory && matchesStock
    })

    return [...base].sort((left, right) => {
      const direction = sortDirection === 'asc' ? 1 : -1
      return (left[sortKey] - right[sortKey]) * direction
    })
  }, [products, search, statusFilter, categoryFilter, stockFilter, sortKey, sortDirection])

  const selectedProducts = products.filter((product) => selectedProductIds.includes(product.id))
  const allVisibleSelected =
    filteredProducts.length > 0 && filteredProducts.every((product) => selectedProductIds.includes(product.id))
  const notUpdatedTodayCount = products.filter((product) => !isUpdatedToday(product.updatedAt)).length

  function showToast(message: string, tone: ToastTone) {
    setToast({ message, tone })
  }

  function toggleProductSelection(productId: string) {
    setSelectedProductIds((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId],
    )
  }

  function toggleSelectVisible() {
    setSelectedProductIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !filteredProducts.some((product) => product.id === id))
      }
      const merged = new Set(current)
      filteredProducts.forEach((product) => merged.add(product.id))
      return Array.from(merged)
    })
  }

  function resetFilters() {
    setStatusFilter('all')
    setCategoryFilter('all')
    setStockFilter('all')
    showToast('Filter direset.', 'success')
  }

  function openPriceModal(productIds = selectedProductIds) {
    if (!productIds.length) {
      showToast('Pilih produk dulu.', 'error')
      return
    }
    const targets = products.filter((product) => productIds.includes(product.id))
    setSelectedProductIds(productIds)
    setPriceMode('set')
    setPercentageValue('')
    setPriceFields(targets.map((product) => ({ id: product.id, value: String(product.price) })))
    setIsPriceModalOpen(true)
  }

  function handlePriceFieldChange(id: string, value: string) {
    setPriceFields((current) =>
      current.map((field) => (field.id === id ? { ...field, value: sanitizeNumberInput(value) } : field)),
    )
  }

  async function applyPriceUpdate() {
    try {
      const updates: Promise<any>[] = []

      if (priceMode === 'set') {
        if (priceFields.some((field) => !Number(field.value))) {
          showToast('Harga baru tiap produk wajib diisi.', 'error')
          return
        }
        priceFields.forEach(field => {
          if (field.value) {
            updates.push(apiClient.put(`/products/${field.id}`, { price: Number(field.value) }))
          }
        })
      } else {
        const percentage = Number(percentageValue)
        if (!percentage) {
          showToast('Persentase wajib diisi.', 'error')
          return
        }
        products.forEach((product) => {
          if (!selectedProductIds.includes(product.id)) return
          const delta = Math.round(product.price * (percentage / 100))
          const nextPrice = priceMode === 'increase' ? product.price + delta : Math.max(0, product.price - delta)
          updates.push(apiClient.put(`/products/${product.id}`, { price: nextPrice }))
        })
      }

      await Promise.all(updates)
      setIsPriceModalOpen(false)
      showToast('Harga produk berhasil diperbarui.', 'success')
      fetchData()
    } catch (err) {
      console.error(err)
      showToast('Gagal mengupdate harga produk.', 'error')
    }
  }

  async function deleteSelectedProducts() {
    try {
      await Promise.all(selectedProductIds.map(id => apiClient.delete(`/products/${id}`)))
      setSelectedProductIds([])
      setDeleteTarget(null)
      showToast('Produk berhasil dihapus.', 'success')
      fetchData()
    } catch (err) {
      console.error(err)
      showToast('Gagal menghapus produk.', 'error')
    }
  }

  async function deleteSingleProduct(productId: string) {
    try {
      await apiClient.delete(`/products/${productId}`)
      setSelectedProductIds((current) => current.filter((id) => id !== productId))
      setDeleteTarget(null)
      showToast('Produk berhasil dihapus.', 'success')
      fetchData()
    } catch (err) {
      console.error(err)
      showToast('Gagal menghapus produk.', 'error')
    }
  }

  const columns: AdminTableColumn[] = [
    {
      id: 'select',
      label: (
        <label className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={toggleSelectVisible}
            aria-label="Pilih semua produk yang terlihat"
            className="h-4 w-4 rounded border-navy-300 text-gold-500 focus:ring-gold-400"
          />
        </label>
      ),
      className: 'w-[6%]',
    },
    { id: 'product', label: 'Produk', className: 'w-[40%]' },
    {
      id: 'price',
      label: (
        <SortableColumnHeader
          label="Harga"
          active={sortKey === 'price'}
          direction={sortDirection}
          onClick={() => {
            setSortKey('price')
            setSortDirection((current) => (sortKey === 'price' && current === 'desc' ? 'asc' : 'desc'))
          }}
        />
      ),
      className: 'w-[18%]',
    },
    {
      id: 'stock',
      label: (
        <SortableColumnHeader
          label="Stok"
          active={sortKey === 'stock'}
          direction={sortDirection}
          onClick={() => {
            setSortKey('stock')
            setSortDirection((current) => (sortKey === 'stock' && current === 'desc' ? 'asc' : 'desc'))
          }}
        />
      ),
      className: 'w-[10%]',
    },
    { id: 'status', label: 'Status', className: 'w-[10%]' },
    { id: 'updated', label: <span title="Indikator apakah harga produk sudah diperbarui hari ini.">Harga Terkini?</span>, className: 'w-[8%]' },
    { id: 'actions', label: 'Aksi', className: 'w-[18%]' },
  ]

  const rows: AdminTableRow[] = filteredProducts.map((product) => {
    const checked = selectedProductIds.includes(product.id)
    const updatedToday = isUpdatedToday(product.updatedAt)

    return {
      id: product.id,
      cells: [
        <label key={`${product.id}-checkbox`} className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={checked}
            onChange={() => toggleProductSelection(product.id)}
            aria-label={`Pilih produk ${product.name}`}
            className="h-4 w-4 rounded border-navy-300 text-gold-500 focus:ring-gold-400"
          />
        </label>,
        <div key={`${product.id}-product`} className="flex items-center gap-3">
          {product.imageUrl ? (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-navy-50">
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${product.accent} text-xs font-semibold text-navy-700`}>
              {product.weightGram}g
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold text-navy-900">{product.name}</p>
            <p className="mt-1 text-xs text-navy-500">{product.category}</p>
          </div>
        </div>,
        <span key={`${product.id}-price`} className="font-semibold text-navy-900">{formatRupiah(product.price)}</span>,
        <span key={`${product.id}-stock`} className={`font-semibold ${getStockTone(product.stock)}`}>{product.stock}</span>,
        <Badge key={`${product.id}-status`} variant={product.status} />,
        <div key={`${product.id}-updated`} className="flex justify-center">
          {updatedToday ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-red-500" />}
        </div>,
        <div key={`${product.id}-actions`} className="flex items-center gap-2">
          <Link href={`/admin/products/${product.id}`}>
            <span className="inline-flex">
              <IconActionButton label={`Detail ${product.name}`} tone="detail" onClick={() => undefined} />
            </span>
          </Link>
          <Link
            href={`/admin/products/${product.id}/edit`}
            aria-label={`Edit ${product.name}`}
            title={`Edit ${product.name}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 text-blue-600 transition-colors hover:bg-blue-50"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <IconActionButton label={`Hapus ${product.name}`} tone="delete" onClick={() => {
            setDeleteScope('single')
            setDeleteTarget(product)
          }} />
        </div>,
      ],
      mobileTitle: product.name,
      mobileSubtitle: product.category,
      mobileAside: <Badge variant={product.status} />,
      mobileMeta: (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-navy-400">Harga</p>
              <p className="mt-1 font-semibold text-navy-900">{formatRupiah(product.price)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-navy-400">Stok</p>
              <p className={`mt-1 font-semibold ${getStockTone(product.stock)}`}>{product.stock}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-navy-400">Harga Terkini?</p>
              <p className="mt-1 font-semibold text-navy-900">{updatedToday ? 'Ya' : 'Belum'}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm text-navy-700">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleProductSelection(product.id)}
                className="h-4 w-4 rounded border-navy-300 text-gold-500 focus:ring-gold-400"
              />
              Pilih
            </label>
            <div className="flex items-center gap-2">
              <Link href={`/admin/products/${product.id}`}>
                <span className="inline-flex">
                  <IconActionButton label={`Detail ${product.name}`} tone="detail" onClick={() => undefined} />
                </span>
              </Link>
              <Link
                href={`/admin/products/${product.id}/edit`}
                aria-label={`Edit ${product.name}`}
                title={`Edit ${product.name}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 text-blue-600 transition-colors hover:bg-blue-50"
              >
                <Pencil className="h-4 w-4" />
              </Link>
              <IconActionButton label={`Hapus ${product.name}`} tone="delete" onClick={() => {
                setDeleteScope('single')
                setDeleteTarget(product)
              }} />
            </div>
          </div>
        </div>
      ),
    }
  })

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Produk" />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <AdminStatCard label="Total Produk" value={String(products.length)} icon={PackagePlus} tone="gold" />
        <AdminStatCard label="Produk Aktif" value={String(products.filter((product) => product.status === 'active').length)} icon={CheckCircle2} tone="success" />
        <AdminStatCard label="Stok Rendah" value={String(products.filter((product) => product.stock <= 5).length)} icon={XCircle} tone="warning" />
        <AdminStatCard label="Belum Update Harga" value={String(notUpdatedTodayCount)} icon={CheckCircle2} tone="info" />
      </section>

      <InlineToast toast={toast} />

      <div className="border-t border-navy-200/70 pt-4">
        <div className="space-y-4">
        <TableToolbar>
          <div className="w-full min-w-[220px] lg:w-72">
            <FilterInput label="Cari produk" value={search} onChange={setSearch} placeholder="Cari nama produk, SKU, kategori" />
          </div>
          <FilterToggleButton active={hasActiveFilter} onClick={() => setIsFilterOpen(true)} />
          {hasActiveFilter && <Button variant="ghost" className="h-11" onClick={resetFilters}>Reset</Button>}
          <Link href="/admin/products/new">
            <Button className="h-11">
              <PackagePlus className="h-4 w-4" />
              Tambah
            </Button>
          </Link>
        </TableToolbar>

        {selectedProductIds.length > 0 && (
          <Card padding="sm" className="border-gold-200 bg-gold-50/60">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm font-medium text-navy-900">{selectedProductIds.length} produk dipilih</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => openPriceModal()}>Ubah Harga</Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedProductIds([])}>Batalkan Pilihan</Button>
              </div>
            </div>
          </Card>
        )}

        <AdminTable
          columns={columns}
          rows={rows}
          emptyState={<AdminEmptyState title="Produk tidak ditemukan" description="Ubah pencarian atau filter." actionHref="/admin/products/new" actionLabel="Tambah Produk" />}
        />
        </div>
      </div>

      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Filter Produk">
        <div className="grid gap-4">
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
          <FilterSelect
            label="Kategori"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { value: 'all', label: 'Semua kategori' },
              ...categories.map((category) => ({ value: category.name, label: category.name })),
            ]}
          />
          <FilterSelect label="Stok" value={stockFilter} onChange={setStockFilter} options={STOCK_FILTER_OPTIONS} />
        </div>
      </FilterModal>

      <Modal isOpen={isPriceModalOpen} onClose={() => setIsPriceModalOpen(false)} title="Ubah Harga Produk" size="lg">
        <div className="space-y-4">
          <div className="space-y-3">
            {selectedProducts.map((product) => {
              const field = priceFields.find((item) => item.id === product.id)
              return (
                <div key={product.id} className="grid gap-3 rounded-2xl border border-navy-100 p-4 md:grid-cols-[minmax(0,1fr)_220px]">
                  <div>
                    <p className="font-medium text-navy-900">{product.name}</p>
                    <p className="mt-1 text-xs text-navy-500">{formatRupiah(product.price)}</p>
                  </div>
                  <Input id={`price-${product.id}`} label="Harga baru" value={field?.value ?? ''} onChange={(event) => handlePriceFieldChange(product.id, event.target.value)} placeholder="Masukkan harga" />
                </div>
              )
            })}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setIsPriceModalOpen(false)}>Batal</Button>
            <Button onClick={applyPriceUpdate}>Simpan</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Hapus Produk" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-navy-600">
            {deleteScope === 'bulk' ? `${selectedProductIds.length} produk akan dihapus.` : `Produk ${deleteTarget?.name ?? ''} akan dihapus.`}
          </p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="danger" onClick={() =>
              deleteScope === 'bulk' && deleteTarget ? deleteSelectedProducts() : deleteTarget ? deleteSingleProduct(deleteTarget.id) : undefined
            }>
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

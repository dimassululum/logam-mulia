'use client'

import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Save, TrendingDown, TrendingUp } from 'lucide-react'
import { formatRupiah } from '@/core/lib/utils'
import { InlineToast, type ToastTone } from '@/features/admin/admin-ui'
import { AdminEmptyState, AdminPageHeader, Button, Card } from '@/shared/ui'
import {
  fetchMetalPrices,
  updateMetalPrices,
  type MetalPriceSummary,
  type MetalPricesSummary,
} from './metal-price-api'

const emptySummary = (metal: 'GOLD' | 'SILVER'): MetalPriceSummary => ({
  metal,
  current: null,
  previous: null,
  changePercent: null,
  history: [],
})

const emptyPrices: MetalPricesSummary = {
  gold: emptySummary('GOLD'),
  silver: emptySummary('SILVER'),
}

function formatDateTime(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatChange(value: number | null) {
  if (value === null) return '0,00%'
  return `${value > 0 ? '+' : ''}${value.toFixed(2).replace('.', ',')}%`
}

function PriceSummaryCard({
  title,
  tone,
  summary,
}: {
  title: string
  tone: 'gold' | 'silver'
  summary: MetalPriceSummary
}) {
  const change = summary.changePercent
  const isUp = (change ?? 0) > 0
  const isDown = (change ?? 0) < 0

  return (
    <Card padding="md" className={tone === 'gold' ? 'border-gold-200 bg-gold-50' : 'border-navy-200 bg-surface-container-low'}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-navy-900">
            {summary.current ? formatRupiah(summary.current.price) : 'Belum tersedia'}
          </p>
          <p className="mt-1 text-xs font-medium text-navy-500">Harga hari ini</p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ${
          isUp ? 'bg-emerald-100 text-emerald-700' : isDown ? 'bg-red-100 text-red-700' : 'bg-white text-navy-600 ring-1 ring-navy-200'
        }`}>
          {isUp ? <TrendingUp className="h-4 w-4" /> : isDown ? <TrendingDown className="h-4 w-4" /> : null}
          {formatChange(change)}
        </span>
      </div>
      <div className="mt-4 rounded-lg bg-white/80 p-3 ring-1 ring-black/5">
        <p className="text-xs font-bold uppercase text-navy-500">Harga kemarin</p>
        <p className="mt-1 text-sm font-semibold text-navy-900">
          {summary.previous ? formatRupiah(summary.previous.price) : 'Belum tersedia'}
        </p>
      </div>
    </Card>
  )
}

function HistoryList({ title, summary }: { title: string; summary: MetalPriceSummary }) {
  return (
    <Card padding="md">
      <h3 className="font-body text-base font-bold text-navy-900">{title}</h3>
      <div className="mt-4 space-y-3">
        {summary.history.length > 0 ? summary.history.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4 rounded-lg border border-navy-100 bg-white px-3 py-2">
            <span className="text-xs font-medium text-navy-500">{formatDateTime(item.recordedAt)}</span>
            <span className="text-sm font-bold text-navy-900">{formatRupiah(item.price)}</span>
          </div>
        )) : (
          <AdminEmptyState
            title="Belum ada riwayat"
            description="Riwayat akan terisi setelah harga diupdate dari form."
          />
        )}
      </div>
    </Card>
  )
}

export default function MetalPriceManagementScreen() {
  const [prices, setPrices] = useState<MetalPricesSummary>(emptyPrices)
  const [goldPrice, setGoldPrice] = useState('')
  const [silverPrice, setSilverPrice] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  async function loadPrices() {
    setIsLoading(true)
    try {
      const data = await fetchMetalPrices()
      setPrices(data)
      setGoldPrice(data.gold.current?.price ? String(data.gold.current.price) : '')
      setSilverPrice(data.silver.current?.price ? String(data.silver.current.price) : '')
    } catch {
      setToast({ message: 'Gagal memuat harga logam.', tone: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPrices()
  }, [])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const canSave = useMemo(() => {
    return Object.keys(buildUpdatePayload()).length > 0
  }, [prices, goldPrice, silverPrice])

  function buildUpdatePayload() {
    const gold = Number(goldPrice)
    const silver = Number(silverPrice)
    const payload: { goldPrice?: number; silverPrice?: number } = {}

    if (Number.isFinite(gold) && gold > 0 && gold !== prices.gold.current?.price) {
      payload.goldPrice = gold
    }

    if (Number.isFinite(silver) && silver > 0 && silver !== prices.silver.current?.price) {
      payload.silverPrice = silver
    }

    return payload
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSave) return

    setIsSaving(true)
    try {
      const next = await updateMetalPrices(buildUpdatePayload())
      setPrices(next)
      setToast({ message: 'Harga emas dan perak berhasil diupdate.', tone: 'success' })
    } catch {
      setToast({ message: 'Gagal menyimpan harga logam.', tone: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Harga Emas dan Perak"
        description="Update harga harian dan pantau riwayat perubahan 1 minggu terakhir."
        actions={
          <Button variant="secondary" onClick={loadPrices} disabled={isLoading}>
            <RefreshCw className="h-4 w-4" />
            Muat Ulang
          </Button>
        }
      />

      <InlineToast toast={toast} />

      <div className="grid gap-4 lg:grid-cols-2">
        <PriceSummaryCard title="Emas" tone="gold" summary={prices.gold} />
        <PriceSummaryCard title="Perak" tone="silver" summary={prices.silver} />
      </div>

      <Card padding="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h2 className="font-body text-lg font-bold text-navy-900">Update Harga</h2>
            <p className="mt-1 text-sm text-navy-500">Isi salah satu atau keduanya. Setiap simpan akan masuk ke riwayat harga.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-navy-700">Harga Emas</span>
              <input
                type="number"
                min="0"
                step="100"
                value={goldPrice}
                onChange={(event) => setGoldPrice(event.target.value)}
                className="input-base"
                placeholder="Contoh: 1500000"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-navy-700">Harga Perak</span>
              <input
                type="number"
                min="0"
                step="100"
                value={silverPrice}
                onChange={(event) => setSilverPrice(event.target.value)}
                className="input-base"
                placeholder="Contoh: 25000"
              />
            </label>
          </div>
          <div className="flex justify-end">
            <Button type="submit" isLoading={isSaving} disabled={!canSave || isSaving}>
              <Save className="h-4 w-4" />
              Simpan Harga
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <HistoryList title="History Emas 1 Minggu" summary={prices.gold} />
        <HistoryList title="History Perak 1 Minggu" summary={prices.silver} />
      </div>
    </div>
  )
}

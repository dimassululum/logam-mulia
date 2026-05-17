import { apiClient } from '@/core/lib/api-client'

export type MetalType = 'GOLD' | 'SILVER'

export interface MetalPriceRecord {
  id: string
  metal: MetalType
  price: number
  recordedAt: string
  createdAt: string
  updatedAt: string
}

export interface MetalPriceSummary {
  metal: MetalType
  current: MetalPriceRecord | null
  previous: MetalPriceRecord | null
  changePercent: number | null
  history: MetalPriceRecord[]
}

export interface MetalPricesSummary {
  gold: MetalPriceSummary
  silver: MetalPriceSummary
}

interface ApiEnvelope<T> {
  data?: T
}

function toNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function mapRecord(record: any): MetalPriceRecord | null {
  if (!record) return null

  return {
    id: record.id,
    metal: record.metal,
    price: toNumber(record.price),
    recordedAt: record.recordedAt || '',
    createdAt: record.createdAt || '',
    updatedAt: record.updatedAt || '',
  }
}

function mapSummary(summary: any, metal: MetalType): MetalPriceSummary {
  return {
    metal,
    current: mapRecord(summary?.current),
    previous: mapRecord(summary?.previous),
    changePercent: summary?.changePercent === null || summary?.changePercent === undefined ? null : toNumber(summary.changePercent),
    history: Array.isArray(summary?.history) ? summary.history.map(mapRecord).filter(Boolean) as MetalPriceRecord[] : [],
  }
}

function mapMetalPrices(data: any): MetalPricesSummary {
  return {
    gold: mapSummary(data?.gold, 'GOLD'),
    silver: mapSummary(data?.silver, 'SILVER'),
  }
}

export async function fetchMetalPrices() {
  const response = await apiClient.get<ApiEnvelope<any>>('/metal-prices')
  return mapMetalPrices(response.data.data)
}

export async function updateMetalPrices(payload: { goldPrice?: number; silverPrice?: number }) {
  const response = await apiClient.post<ApiEnvelope<any>>('/metal-prices', payload)
  return mapMetalPrices(response.data.data)
}

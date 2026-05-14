import type { Product } from '@/core/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export interface ProductDetail extends Product {
  images: string[]
  cert: string
  dimensions: string
}

export interface StorefrontVoucher {
  id: string
  code: string
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  minPurchase: number
  maxDiscount: number | null
  expiresAt: string | null
  productIds: string[]
}

async function fetchApi<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' })
    if (!res.ok) return fallback
    const json = await res.json()
    return (json.data ?? fallback) as T
  } catch (error) {
    console.error(`Error fetching ${path}:`, error)
    return fallback
  }
}

function toNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export function mapApiProduct(product: any): ProductDetail {
  const images = (product.images || [])
    .sort((left: any, right: any) => Number(left.sortOrder || 0) - Number(right.sortOrder || 0))
    .map((image: any) => image.imageUrl)
    .filter(Boolean)

  const weightGram = toNumber(product.weightGram)
  const price = toNumber(product.price)

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description || '',
    pricePerGram: weightGram > 0 ? price / weightGram : price,
    weightGram,
    totalPrice: price,
    stock: toNumber(product.stock),
    imageUrl: images[0] || '',
    category: product.category?.name || 'Lainnya',
    purity: product.kadar || '',
    createdAt: product.createdAt || '',
    updatedAt: product.updatedAt || '',
    images,
    cert: 'LBMA Certified',
    dimensions: '-',
  }
}

export async function getStorefrontProducts() {
  const products = await fetchApi<any[]>('/products?limit=100&isActive=true', [])
  return products.map(mapApiProduct)
}

export async function getStorefrontProduct(slug: string) {
  const product = await fetchApi<any | null>(`/products/${encodeURIComponent(slug)}`, null)
  return product ? mapApiProduct(product) : null
}

export async function getStorefrontVouchers() {
  const vouchers = await fetchApi<any[]>('/vouchers/public?limit=20', [])
  return vouchers.map((voucher) => ({
    id: voucher.id,
    code: voucher.code,
    discountType: voucher.discountType,
    discountValue: toNumber(voucher.discountValue),
    minPurchase: toNumber(voucher.minPurchase),
    maxDiscount: voucher.maxDiscount === null || voucher.maxDiscount === undefined ? null : toNumber(voucher.maxDiscount),
    expiresAt: voucher.expiresAt || null,
    productIds: Array.isArray(voucher.products) ? voucher.products.map((product: any) => product.id).filter(Boolean) : [],
  })) as StorefrontVoucher[]
}

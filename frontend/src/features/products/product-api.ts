import { cache } from 'react'
import type { Product } from '@/core/types'
import { resolvePublicApiBaseUrl, resolvePublicAssetUrl } from '@/core/lib/public-url'
import { mapStorefrontVoucher, type StorefrontVoucher } from './voucher-pricing'

const API_URL = resolvePublicApiBaseUrl()

export interface ProductDetail extends Product {
  images: string[]
  cert: string
  dimensions: string
  reviews: ProductReview[]
}

export interface ProductReview {
  id: string
  name: string
  rating: number
  comment: string
  imageUrl: string
  createdAt: string
}

export type { StorefrontVoucher }

interface StorefrontProductListOptions {
  limit?: number
  isActive?: boolean
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

export function resolveProductImageUrl(value: string) {
  return resolvePublicAssetUrl(value)
}

export function mapApiProduct(product: any): ProductDetail {
  const images = (product.images || [])
    .sort((left: any, right: any) => Number(left.sortOrder || 0) - Number(right.sortOrder || 0))
    .map((image: any) => resolveProductImageUrl(image.imageUrl))
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
    displayRating: Math.min(5, Math.max(0, toNumber(product.displayRating ?? product.rating ?? 5))),
    reviewCount: toNumber(product.reviewCount),
    soldCount: toNumber(product.soldCount),
    createdAt: product.createdAt || '',
    updatedAt: product.updatedAt || '',
    images,
    cert: 'LBMA Certified',
    dimensions: '-',
    reviews: Array.isArray(product.displayReviews)
      ? product.displayReviews.map((review: any) => ({
          id: review.id,
          name: review.reviewerName || 'Pelanggan',
          rating: Math.min(5, Math.max(0, toNumber(product.displayRating ?? 5))),
          comment: review.description || '',
          imageUrl: resolveProductImageUrl(review.imageUrl || ''),
          createdAt: review.createdAt || '',
        }))
      : [],
  }
}

function productListPath(options: StorefrontProductListOptions = {}) {
  const params = new URLSearchParams({
    limit: String(options.limit ?? 100),
  })

  if (options.isActive !== false) params.set('isActive', 'true')

  return `/products?${params.toString()}`
}

export const getStorefrontProducts = cache(async (options: StorefrontProductListOptions = {}) => {
  const products = await fetchApi<any[]>(productListPath(options), [])
  return products.map(mapApiProduct)
})

export const getStorefrontProduct = cache(async (slug: string) => {
  const product = await fetchApi<any | null>(`/products/${encodeURIComponent(slug)}`, null)
  return product ? mapApiProduct(product) : null
})

export const getRelatedStorefrontProducts = cache(async (currentProductId: string, limit = 4) => {
  const products = await getStorefrontProducts({ limit: limit + 1 })
  return products.filter((product) => product.id !== currentProductId).slice(0, limit)
})

export const getStorefrontVouchers = cache(async () => {
  const vouchers = await fetchApi<any[]>('/vouchers/public?limit=100', [])
  return vouchers.map(mapStorefrontVoucher)
})

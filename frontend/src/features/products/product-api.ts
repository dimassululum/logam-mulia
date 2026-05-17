import type { Product } from '@/core/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

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

function resolveApiOrigin() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, '') || API_URL
  try {
    const url = new URL(configuredUrl)
    if (url.pathname.endsWith('/api')) {
      url.pathname = url.pathname.slice(0, -4) || '/'
    }
    return url.origin + url.pathname.replace(/\/+$/, '')
  } catch {
    return ''
  }
}

export function resolveProductImageUrl(value: string) {
  if (!value) return ''

  const apiOrigin = resolveApiOrigin()
  if (value.startsWith('/uploads/')) return `${apiOrigin}${value}`

  try {
    const url = new URL(value)
    if (url.pathname.startsWith('/api/uploads/')) {
      url.pathname = url.pathname.replace(/^\/api\/uploads\//, '/uploads/')
    }
    return url.toString()
  } catch {
    return value
  }
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

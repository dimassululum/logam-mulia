import type { Product } from '@/core/types'
import { calculateVoucherDiscount } from '@/features/products/voucher-pricing'
import type { StorefrontVoucher } from '@/features/products/voucher-pricing'

export interface LocalCartItem {
  product: Product
  quantity: number
  checked: boolean
}

export interface ClaimedVoucher extends StorefrontVoucher {
  claimedAt: string
}

const CART_KEY = 'lm-cart-items'
const CHECKOUT_KEY = 'lm-checkout-items'
const CHECKOUT_VOUCHER_KEY = 'lm-checkout-voucher'
const CART_EVENT = 'lm-cart-updated'

function emitCartUpdated() {
  window.dispatchEvent(new Event(CART_EVENT))
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

function isLargeInlineAsset(value: unknown) {
  return typeof value === 'string' && value.startsWith('data:')
}

function sanitizeProductForStorage(product: Product): Product {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description || '',
    pricePerGram: product.pricePerGram,
    weightGram: product.weightGram,
    totalPrice: product.totalPrice,
    stock: product.stock,
    imageUrl: isLargeInlineAsset(product.imageUrl) ? '' : product.imageUrl || '',
    category: product.category || '',
    purity: product.purity || '',
    displayRating: product.displayRating,
    reviewCount: product.reviewCount,
    soldCount: product.soldCount,
    createdAt: product.createdAt || '',
    updatedAt: product.updatedAt || '',
  }
}

function sanitizeCartItemsForStorage(items: LocalCartItem[]) {
  return items.map((item) => ({
    ...item,
    product: sanitizeProductForStorage(item.product),
  }))
}

export function readCartItems() {
  return readJson<LocalCartItem[]>(CART_KEY, [])
}

export function saveCartItems(items: LocalCartItem[]) {
  writeJson(CART_KEY, sanitizeCartItemsForStorage(items))
  emitCartUpdated()
}

export function addProductToCart(product: Product, quantity = 1) {
  const items = readCartItems()
  const existing = items.find((item) => item.product.id === product.id)

  if (existing) {
    existing.quantity += quantity
  } else {
    items.push({ product: sanitizeProductForStorage(product), quantity, checked: true })
  }

  saveCartItems(items)
}

export function readCartCount() {
  return readCartItems().reduce((sum, item) => sum + item.quantity, 0)
}

export function onCartUpdated(listener: () => void) {
  window.addEventListener(CART_EVENT, listener)
  window.addEventListener('storage', listener)

  return () => {
    window.removeEventListener(CART_EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}

export function saveCheckoutItems(items: LocalCartItem[]) {
  writeJson(CHECKOUT_KEY, sanitizeCartItemsForStorage(items))
}

export function readCheckoutItems() {
  return readJson<LocalCartItem[]>(CHECKOUT_KEY, [])
}

export function saveCheckoutVoucher(voucher: ClaimedVoucher | null) {
  if (!voucher) {
    window.localStorage.removeItem(CHECKOUT_VOUCHER_KEY)
    return
  }

  writeJson(CHECKOUT_VOUCHER_KEY, voucher)
}

export function readCheckoutVoucher() {
  return readJson<ClaimedVoucher | null>(CHECKOUT_VOUCHER_KEY, null)
}
export { calculateVoucherDiscount }

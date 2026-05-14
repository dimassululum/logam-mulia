import type { Product } from '@/core/types'
import type { StorefrontVoucher } from '@/features/products/product-api'

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
const CLAIMED_VOUCHERS_KEY = 'lm-claimed-vouchers'
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

export function readCartItems() {
  return readJson<LocalCartItem[]>(CART_KEY, [])
}

export function saveCartItems(items: LocalCartItem[]) {
  writeJson(CART_KEY, items)
  emitCartUpdated()
}

export function addProductToCart(product: Product, quantity = 1) {
  const items = readCartItems()
  const existing = items.find((item) => item.product.id === product.id)

  if (existing) {
    existing.quantity += quantity
  } else {
    items.push({ product, quantity, checked: true })
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

export function readClaimedVouchers() {
  return readJson<ClaimedVoucher[]>(CLAIMED_VOUCHERS_KEY, [])
}

export function claimVoucher(voucher: StorefrontVoucher) {
  const claimed = readClaimedVouchers()
  if (!claimed.some((item) => item.id === voucher.id)) {
    writeJson(CLAIMED_VOUCHERS_KEY, [...claimed, { ...voucher, claimedAt: new Date().toISOString() }])
  }
}

export function saveCheckoutItems(items: LocalCartItem[]) {
  writeJson(CHECKOUT_KEY, items)
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

export function calculateVoucherDiscount(voucher: ClaimedVoucher | null, subtotal: number) {
  if (!voucher || subtotal < voucher.minPurchase) return 0

  if (voucher.discountType === 'PERCENTAGE') {
    const raw = subtotal * (voucher.discountValue / 100)
    return Math.min(raw, voucher.maxDiscount ?? raw, subtotal)
  }

  return Math.min(voucher.discountValue, subtotal)
}

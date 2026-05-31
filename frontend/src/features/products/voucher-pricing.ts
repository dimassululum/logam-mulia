import type { Product } from '@/core/types'

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

export interface VoucherLineItem {
  productId: string
  price: number
  quantity: number
}

export interface BestVoucherResult {
  voucher: StorefrontVoucher
  discountAmount: number
  eligibleSubtotal: number
  finalAmount: number
}

export interface VoucherSummary {
  appliedVouchers: BestVoucherResult[]
  discountAmount: number
  finalAmount: number
  subtotal: number
}

function toNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export function mapStorefrontVoucher(voucher: any): StorefrontVoucher {
  return {
    id: voucher.id,
    code: voucher.code,
    discountType: voucher.discountType,
    discountValue: toNumber(voucher.discountValue),
    minPurchase: toNumber(voucher.minPurchase),
    maxDiscount: voucher.maxDiscount === null || voucher.maxDiscount === undefined ? null : toNumber(voucher.maxDiscount),
    expiresAt: voucher.expiresAt || null,
    productIds: Array.isArray(voucher.products) ? voucher.products.map((product: any) => product.id).filter(Boolean) : [],
  }
}

export function calculateVoucherDiscount(voucher: StorefrontVoucher | null, subtotal: number) {
  if (!voucher || subtotal < voucher.minPurchase) return 0

  if (voucher.discountType === 'PERCENTAGE') {
    const raw = subtotal * (voucher.discountValue / 100)
    return Math.min(raw, voucher.maxDiscount ?? raw, subtotal)
  }

  return Math.min(voucher.discountValue, subtotal)
}

export function getVoucherEligibleSubtotal(voucher: StorefrontVoucher, items: VoucherLineItem[]) {
  const eligibleProductIds = new Set(voucher.productIds)
  return items.reduce((sum, item) => {
    if (eligibleProductIds.size > 0 && !eligibleProductIds.has(item.productId)) return sum
    return sum + item.price * item.quantity
  }, 0)
}

export function findBestVoucher(vouchers: StorefrontVoucher[], items: VoucherLineItem[]) {
  let best: BestVoucherResult | null = null

  vouchers.forEach((voucher) => {
    const eligibleSubtotal = getVoucherEligibleSubtotal(voucher, items)
    const discountAmount = calculateVoucherDiscount(voucher, eligibleSubtotal)
    if (discountAmount <= 0) return

    const result = {
      voucher,
      discountAmount,
      eligibleSubtotal,
      finalAmount: Math.max(0, eligibleSubtotal - discountAmount),
    }

    if (!best || result.discountAmount > best.discountAmount) {
      best = result
    }
  })

  return best
}

export function summarizeApplicableVouchers(vouchers: StorefrontVoucher[], items: VoucherLineItem[]): VoucherSummary {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const appliedVouchers = vouchers
    .map((voucher) => {
      const eligibleSubtotal = getVoucherEligibleSubtotal(voucher, items)
      const discountAmount = calculateVoucherDiscount(voucher, eligibleSubtotal)

      return {
        voucher,
        discountAmount,
        eligibleSubtotal,
        finalAmount: Math.max(0, eligibleSubtotal - discountAmount),
      }
    })
    .filter((result) => result.discountAmount > 0)

  const discountAmount = Math.min(
    subtotal,
    appliedVouchers.reduce((sum, result) => sum + result.discountAmount, 0),
  )

  return {
    appliedVouchers,
    discountAmount,
    finalAmount: Math.max(0, subtotal - discountAmount),
    subtotal,
  }
}

export function productToVoucherLineItem(product: Product): VoucherLineItem {
  return {
    productId: product.id,
    price: product.totalPrice,
    quantity: 1,
  }
}

export function getVoucherPreviewForProductAmount(productId: string, price: number, vouchers: StorefrontVoucher[]) {
  const best = findBestVoucher(vouchers, [{ productId, price, quantity: 1 }])
  return {
    voucher: best?.voucher ?? null,
    originalPrice: price,
    finalPrice: best ? Math.max(0, price - best.discountAmount) : price,
    discountAmount: best?.discountAmount ?? 0,
  }
}

export function getProductVoucherPreview(product: Product, vouchers: StorefrontVoucher[]) {
  return getVoucherPreviewForProductAmount(product.id, product.totalPrice, vouchers)
}

export function formatCompactDiscount(value: number) {
  if (value >= 1000000) {
    const compact = value / 1000000
    return `${compact % 1 === 0 ? compact.toFixed(0) : compact.toFixed(1).replace('.', ',')}jt`
  }

  if (value >= 1000) {
    const compact = value / 1000
    return `${compact % 1 === 0 ? compact.toFixed(0) : compact.toFixed(1).replace('.', ',')}rb`
  }

  return String(Math.round(value))
}

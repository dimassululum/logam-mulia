import Link from 'next/link'
import { Star } from 'lucide-react'
import { Product } from '@/core/types'
import { formatRupiah } from '@/core/lib/utils'
import { formatCompactDiscount, getProductVoucherPreview, type StorefrontVoucher } from './voucher-pricing'

interface ProductCardProps {
  product: Product
  vouchers?: StorefrontVoucher[]
}

function formatCount(value: number) {
  if (value >= 1000) {
    const compact = value / 1000
    return `${compact % 1 === 0 ? compact.toFixed(0) : compact.toFixed(1).replace('.', ',')}rb`
  }

  return String(value)
}

export default function ProductCard({ product, vouchers = [] }: ProductCardProps) {
  const isOutOfStock = product.stock === 0
  const voucherPreview = getProductVoucherPreview(product, vouchers)
  const hasVoucherPrice = voucherPreview.discountAmount > 0

  return (
    <article className="group overflow-hidden rounded-2xl border border-navy-100/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-navy-100/70">
      <Link href={`/products/${product.slug}`} aria-label={`Lihat detail ${product.name}`} className="block">
        <div className="relative aspect-square bg-navy-900 overflow-hidden">
          <img
            src={product.imageUrl || '/images/metal-gold.jpg'}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute right-3 top-3 max-w-[75%] truncate rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-navy-900 shadow-sm">
            {product.category}
          </div>
          {isOutOfStock && (
            <div className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center">
              <span className="text-sm font-semibold text-white bg-navy-900 px-3 py-1.5 rounded-full">
                Stok Habis
              </span>
            </div>
          )}
        </div>

        <div className="p-3.5 space-y-1.5">
          <div className="flex items-center justify-between w-full pb-1 pt-1">
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-gold-500 fill-gold-500 flex-shrink-0" />
              <span className="text-xs font-bold text-navy-900">{product.displayRating.toFixed(1)}</span>
              <span className="text-[11px] font-medium text-navy-500">({product.reviewCount})</span>
            </div>
            <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[11px] font-semibold text-navy-700">
              {formatCount(product.soldCount)} terjual
            </span>
          </div>

          <h3 className="font-heading font-semibold text-navy-900 text-sm leading-snug line-clamp-2">
            {product.name}
          </h3>

          <div className="pt-1 flex flex-col justify-end min-h-[40px]">
            {hasVoucherPrice ? (
              <p className="mb-0.5 text-[11px] font-semibold leading-tight text-[#888888] line-through">
                {formatRupiah(voucherPreview.originalPrice)}
              </p>
            ) : (
              <div className="h-[11px] mb-0.5" aria-hidden="true" />
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-[17px] font-bold text-gold-600 leading-tight">
                {formatRupiah(voucherPreview.finalPrice)}
              </p>
              {hasVoucherPrice ? (
                <span className="rounded-full bg-[#E8F5E9] px-2 py-0.5 text-[10px] font-bold leading-none text-[#2E7D32]">
                  -Rp {formatCompactDiscount(voucherPreview.discountAmount)}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </Link>

    </article>
  )
}

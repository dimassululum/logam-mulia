import Link from 'next/link'
import { BadgePercent, Star } from 'lucide-react'
import { Product } from '@/core/types'
import { cn, formatRupiah } from '@/core/lib/utils'
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
  const discountText = `Rp ${formatCompactDiscount(voucherPreview.discountAmount)}`

  return (
    <article
      className={cn(
        'group overflow-hidden rounded-2xl border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
        hasVoucherPrice
          ? 'border-2 border-gold-400 bg-[linear-gradient(180deg,#FFF1C2_0%,#FFFFFF_44%,#FFF9EA_100%)] shadow-[0_18px_42px_-18px_rgba(212,168,75,0.9)] ring-2 ring-gold-100/90 hover:shadow-[0_22px_52px_-18px_rgba(184,145,47,0.95)]'
          : 'border-navy-100/80 hover:shadow-navy-100/70',
      )}
    >
      <Link href={`/products/${product.slug}`} aria-label={`Lihat detail ${product.name}`} className="block">
        <div className="relative aspect-square bg-navy-900 overflow-hidden">
          <img
            src={product.imageUrl || '/images/metal-gold.jpg'}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div
            className={cn(
              'absolute right-3 top-3 truncate rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-navy-900 shadow-sm',
              hasVoucherPrice ? 'max-w-[58%]' : 'max-w-[75%]',
            )}
          >
            {product.category}
          </div>
          {hasVoucherPrice ? (
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-r from-gold-500 via-gold-400 to-gold-300 px-3 py-2 text-[11px] font-extrabold uppercase text-navy-900 shadow-lg shadow-navy-900/20">
              <span className="inline-flex items-center gap-1">
                <BadgePercent className="h-3.5 w-3.5" />
                Promo
              </span>
              <span className="shrink-0 rounded-full bg-white/90 px-2 py-0.5 text-[10px] text-[#2E7D32]">
                -{discountText}
              </span>
            </div>
          ) : null}
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

          <div
            className={cn(
              'pt-1 flex flex-col justify-end min-h-[40px]',
              hasVoucherPrice && 'px-0.5',
            )}
          >
            {hasVoucherPrice ? (
              <p className="mb-1 text-[11px] font-semibold leading-tight text-[#888888] line-through">
                {formatRupiah(voucherPreview.originalPrice)}
              </p>
            ) : (
              <div className="h-[11px] mb-0.5" aria-hidden="true" />
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-[18px] font-extrabold text-gold-700 leading-tight">
                {formatRupiah(voucherPreview.finalPrice)}
              </p>
            </div>
          </div>
        </div>
      </Link>

    </article>
  )
}

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Star } from 'lucide-react'
import { Product } from '@/core/types'
import { formatRupiah } from '@/core/lib/utils'

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
}

// Dummy rating/sold data until API returns it
const DUMMY_STATS: Record<string, { rating: number; sold: string; badge?: string; originalPrice?: number }> = {
  '1': { rating: 4.9, sold: '1.2rb+', badge: 'CERTIFIED', originalPrice: 1250000 },
  '2': { rating: 5.0, sold: '850+',   badge: 'BEST SELLER' },
  '3': { rating: 4.8, sold: '320+' },
  '4': { rating: 4.7, sold: '110+' },
  '5': { rating: 4.9, sold: '55+'  },
  '6': { rating: 4.8, sold: '28+'  },
  '7': { rating: 4.8, sold: '150+' },
  '8': { rating: 4.9, sold: '300+' },
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const isOutOfStock = product.stock === 0
  const stats = DUMMY_STATS[product.id] ?? { rating: 4.8, sold: '50+' }

  return (
    <article className="group bg-white rounded-2xl border border-navy-100/80 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-navy-100/70">
      <Link href={`/products/${product.slug}`} aria-label={`Lihat detail ${product.name}`} className="block">
        {/* Image */}
        <div className="relative aspect-square bg-navy-900 overflow-hidden">
          <Image
            src={product.imageUrl || '/images/placeholder-gold.png'}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Badge top-left */}
          {stats.badge && (
            <div className="absolute top-3 left-3 text-gold-400 text-[10px] font-bold uppercase tracking-widest drop-shadow-md">
              {stats.badge}
            </div>
          )}
          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center">
              <span className="text-sm font-semibold text-white bg-navy-900 px-3 py-1.5 rounded-full">
                Stok Habis
              </span>
            </div>
          )}
        </div>

        <div className="p-3.5 space-y-1.5">
          {/* Rating & Sold */}
          <div className="flex items-center justify-between w-full pb-1 pt-1">
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-gold-500 fill-gold-500 flex-shrink-0" />
              <span className="text-xs font-bold text-navy-900">{stats.rating.toFixed(1)}</span>
            </div>
            <span className="text-[11px] font-medium text-navy-400">{stats.sold} Terjual</span>
          </div>

          {/* Name */}
          <h3 className="font-heading font-semibold text-navy-900 text-sm leading-snug line-clamp-2">
            {product.name}
          </h3>

          {/* Price */}
          <div className="pt-1 flex flex-col justify-end min-h-[40px]">
            {stats.originalPrice ? (
              <p className="text-[11px] text-red-400/80 line-through leading-none mb-0.5">
                {formatRupiah(stats.originalPrice)}
              </p>
            ) : (
              <div className="h-[11px] mb-0.5" aria-hidden="true" />
            )}
            <p className="text-[17px] font-bold text-gold-600 leading-tight">
              {formatRupiah(product.totalPrice)}
            </p>
          </div>
        </div>
      </Link>

      <div className="px-3.5 pb-3.5">
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={() => onAddToCart?.(product)}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-navy-900 text-xs font-bold text-gold-400 transition-all hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-navy-100 disabled:text-navy-400"
        >
          <ShoppingCart className="h-4 w-4" />
          {isOutOfStock ? 'Stok Habis' : 'Keranjang'}
        </button>
      </div>
    </article>
  )
}

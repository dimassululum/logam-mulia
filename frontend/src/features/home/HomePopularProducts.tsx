'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight } from 'lucide-react'
import { productsApi } from '@/core/lib/api'
import { formatRupiah } from '@/core/lib/utils'

interface ApiProduct {
  id: string
  name: string
  slug: string
  price: number
  weight: number
  stock: number
  images?: { url: string; isPrimary: boolean }[]
  salesCount?: number
}

function GoldBarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2" />
    </svg>
  )
}

export default function HomePopularProducts() {
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    productsApi.list({ limit: 4, sortBy: 'salesCount', sortOrder: 'desc' })
      .then(({ data }) => {
        const raw: ApiProduct[] = data.products ?? data.data ?? []
        setProducts(raw.slice(0, 4))
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  const skeletons = Array.from({ length: 4 })

  return (
    <section className="section-full">
      <div className="container-main">
        <div className="flex justify-between items-end mb-stack-md">
          <h2 className="section-heading">Produk Terpopuler</h2>
          <Link
            href="/products"
            className="flex items-center gap-1 text-label-md text-gold-500 font-semibold hover:gap-2 transition-all"
            style={{ transitionDuration: 'var(--transition-base)' }}
          >
            Lihat Semua
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
          {loading
            ? skeletons.map((_, i) => (
                <div key={i} className="card-product p-4 animate-pulse">
                  <div className="product-img-wrap mb-stack-sm bg-navy-100 rounded-lg aspect-square" />
                  <div className="space-y-2">
                    <div className="h-3 bg-navy-100 rounded w-3/4" />
                    <div className="h-4 bg-gold-100 rounded w-1/2" />
                  </div>
                </div>
              ))
            : products.map((product) => {
                const primaryImage = product.images?.find((i) => i.isPrimary)?.url ?? product.images?.[0]?.url
                const isLowStock   = product.stock <= 5 && product.stock > 0
                const sold         = product.salesCount ? `${product.salesCount > 999 ? Math.floor(product.salesCount/1000)+'rb' : product.salesCount}+` : null

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="card-product p-4 relative overflow-hidden block"
                  >
                    <div className="product-img-wrap mb-stack-sm">
                      {primaryImage ? (
                        <Image
                          src={primaryImage}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      ) : (
                        <GoldBarIcon className="w-12 h-12 text-gold-400/40" />
                      )}
                    </div>
                    <div className="space-y-1">
                      {isLowStock && (
                        <span className="certified-stamp">Stok Terbatas</span>
                      )}
                      <h3 className="font-bold text-sm text-navy-900 truncate">{product.name}</h3>
                      <p className="text-gold-400 font-bold text-sm">{formatRupiah(Number(product.price))}</p>
                      {sold && (
                        <p className="text-[10px] text-navy-600/70 font-medium">Terjual {sold}</p>
                      )}
                    </div>
                  </Link>
                )
              })}
        </div>
      </div>
    </section>
  )
}

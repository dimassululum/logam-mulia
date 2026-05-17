import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatRupiah } from '@/core/lib/utils'
import { ChevronRight, ShieldCheck, Star, ShoppingCart } from 'lucide-react'
import {
  getStorefrontProduct,
  getStorefrontProducts,
  getStorefrontVouchers,
} from '@/features/products/product-api'
import ProductDetailActions from '@/features/products/ProductDetailActions'

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getStorefrontProduct(params.slug)
  if (!product) return { title: 'Produk tidak ditemukan' }

  return {
    title: `${product.name} | Logam Mulia Antam`,
    description: product.description,
  }
}

function ProductImageFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-navy-900 text-gold-400">
      <ShoppingCart className="h-14 w-14 opacity-50" />
    </div>
  )
}

function RatingStars({ rating, className = 'h-4 w-4' }: { rating: number; className?: string }) {
  const rounded = Math.round(rating)

  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating ${rating.toFixed(1)} dari 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`${className} ${index < rounded ? 'fill-gold-600 text-gold-600' : 'fill-navy-200 text-navy-200'}`}
        />
      ))}
    </div>
  )
}

function formatReviewDate(value: string) {
  if (!value) return ''

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value))
}

export default async function ProductDetailPage({ params }: PageProps) {
  const [product, products, vouchers] = await Promise.all([
    getStorefrontProduct(params.slug),
    getStorefrontProducts(),
    getStorefrontVouchers(),
  ])

  if (!product) notFound()

  const related = products.filter((item) => item.id !== product.id).slice(0, 4)
  const images = product.images.length > 0 ? product.images : product.imageUrl ? [product.imageUrl] : []
  const applicableVouchers = vouchers.filter((voucher) => (
    voucher.productIds.length === 0 || voucher.productIds.includes(product.id)
  ))

  return (
    <div className="bg-surface min-h-screen">
      <main className="container-main py-8 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
          <section className="space-y-4">
            <div className="aspect-square bg-white border border-navy-100 rounded-2xl overflow-hidden flex items-center justify-center p-8 shadow-sm relative">
              {images[0] ? (
                <img src={images[0]} alt={product.name} className="h-full w-full object-contain" />
              ) : (
                <ProductImageFallback />
              )}
            </div>

            {images.length > 1 ? (
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {images.map((img, idx) => (
                  <div
                    key={img}
                    className={`flex-shrink-0 w-20 h-20 bg-white border-2 rounded-xl p-2 relative overflow-hidden ${
                      idx === 0 ? 'border-gold-400 shadow-sm' : 'border-navy-100'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-contain" />
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section className="space-y-6">
            <div>
              <span className="inline-block px-3 py-1 bg-navy-900 text-gold-400 rounded-md text-[10px] font-bold mb-3 uppercase tracking-widest">
                {product.category}
              </span>
              <h1 className="font-heading text-3xl text-navy-900 leading-tight font-bold">{product.name}</h1>
              <p className="font-heading text-2xl font-bold text-gold-600 mt-3">{formatRupiah(product.totalPrice)}</p>
            </div>

            <ProductDetailActions product={product} vouchers={applicableVouchers} />

            <div className="grid grid-cols-3 gap-4 py-6 border-y border-navy-200">
              {[
                { label: 'Kadar', value: product.purity || '-' },
                { label: 'Berat', value: `${product.weightGram}g` },
                { label: 'Stok', value: product.stock > 0 ? `${product.stock} tersedia` : 'Habis', green: product.stock > 0 },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-navy-500 text-[10px] uppercase tracking-widest mb-1 font-semibold">{item.label}</p>
                  <p className={`font-bold text-sm ${item.green ? 'text-green-600' : 'text-navy-900'}`}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white border border-navy-200 p-4 rounded-xl flex items-center gap-4 shadow-sm">
              <ShieldCheck className="w-8 h-8 text-gold-500 flex-shrink-0" />
              <div>
                <p className="font-bold text-navy-900">{product.cert}</p>
                <p className="text-xs text-navy-600 mt-1">Jaminan keaslian dengan standar internasional.</p>
              </div>
            </div>

            <div>
              <h2 className="font-heading text-lg font-bold text-navy-900 mb-3 border-b border-navy-200 pb-2">Deskripsi</h2>
              <div className="text-navy-700 text-sm leading-relaxed space-y-4">
                <p>{product.description || 'Deskripsi produk belum tersedia.'}</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Kategori: {product.category}</li>
                  <li>Berat: {product.weightGram} gram</li>
                  <li>Kadar: {product.purity || '-'}</li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-navy-200">
              <div className="mb-6 flex flex-col gap-3 border-b border-navy-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-heading text-2xl font-bold text-navy-900">Ulasan Pelanggan</h2>
                <div className="flex items-center gap-3 text-navy-700">
                  <RatingStars rating={product.displayRating} className="h-4 w-4" />
                  <span className="text-sm font-semibold">{product.displayRating.toFixed(1)} · {product.reviewCount} ulasan</span>
                </div>
              </div>
              {product.reviews.length > 0 ? (
                <div className="space-y-4">
                  {product.reviews.map((review) => (
                    <article key={review.id} className="rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-navy-900">{review.name}</p>
                          <div className="mt-3">
                            <RatingStars rating={review.rating} className="h-4 w-4" />
                          </div>
                        </div>
                        {review.createdAt ? (
                          <time className="shrink-0 text-right text-sm text-navy-500" dateTime={review.createdAt}>
                            {formatReviewDate(review.createdAt)}
                          </time>
                        ) : null}
                      </div>
                      {review.comment ? <p className="mt-7 text-base leading-relaxed text-navy-600">{review.comment}</p> : null}
                      {review.imageUrl ? (
                        <img
                          src={review.imageUrl}
                          alt={`Foto ulasan ${review.name}`}
                          className="mt-5 aspect-[4/5] w-full max-w-[214px] rounded-lg border border-navy-100 object-cover"
                        />
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-navy-100 bg-white p-6 text-sm text-navy-500 shadow-sm">
                  Belum ada ulasan pelanggan yang ditampilkan.
                </div>
              )}
            </div>
          </section>
        </div>

        {related.length > 0 ? (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl font-bold text-navy-900">Produk Terkait</h2>
              <Link href="/products" className="text-gold-600 font-bold text-sm flex items-center gap-1 hover:text-gold-500 transition-colors">
                Lihat Semua <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/products/${item.slug}`}
                  className="w-[180px] shrink-0 bg-white border border-navy-200 rounded-2xl p-4 group hover:shadow-md transition-all duration-300"
                >
                  <div className="mb-4 aspect-square w-full overflow-hidden rounded-xl bg-surface flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <ProductImageFallback />
                    )}
                  </div>
                  <p className="text-sm text-navy-900 font-bold truncate">{item.name}</p>
                  <p className="text-gold-600 font-bold mt-1 text-sm">{formatRupiah(item.totalPrice)}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { formatRupiah } from '@/core/lib/utils'
import AppBar from '@/shared/ui/AppBar'
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

const REVIEWS = [
  { initials: 'BS', name: 'Budi S.', rating: 5, text: 'Barang sampai dengan aman. Certicard utuh dan bisa diverifikasi.' },
  { initials: 'AW', name: 'Andi W.', rating: 5, text: 'Pengiriman cepat dan packing rapi untuk investasi jangka panjang.' },
]

function ProductImageFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-navy-900 text-gold-400">
      <ShoppingCart className="h-14 w-14 opacity-50" />
    </div>
  )
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
      <AppBar
        title="Detail Produk"
        rightSlot={
          <Link
            href="/cart"
            className="relative text-gold-400 hover:text-gold-300 [transition-duration:var(--transition-fast)] transition-colors"
            aria-label="Keranjang Belanja"
          >
            <ShoppingCart className="w-6 h-6" />
          </Link>
        }
      />

      <main className="container-main py-8 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
          <section className="space-y-4">
            <div className="aspect-square bg-white border border-navy-100 rounded-2xl overflow-hidden flex items-center justify-center p-8 shadow-sm relative">
              {images[0] ? (
                <Image src={images[0]} alt={product.name} fill className="object-contain p-8" priority />
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
                    <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-contain p-2" />
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
              <h2 className="font-heading text-lg font-bold text-navy-900 mb-4 border-b border-navy-200 pb-2">Ulasan Pelanggan</h2>
              <div className="space-y-4">
                {REVIEWS.map((review) => (
                  <div key={review.name} className="bg-surface border border-navy-100 p-4 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-navy-100 flex-shrink-0 flex items-center justify-center text-gold-500 font-bold text-sm">
                        {review.initials}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-navy-900 leading-none mb-1">{review.name}</p>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-gold-500 text-gold-500' : 'fill-navy-200 text-navy-200'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-navy-700">{review.text}</p>
                  </div>
                ))}
              </div>
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
                  className="min-w-[180px] bg-white border border-navy-200 rounded-2xl p-4 group flex-shrink-0 hover:shadow-md transition-all duration-300"
                >
                  <div className="aspect-square mb-4 overflow-hidden rounded-xl bg-surface flex items-center justify-center relative">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-2 group-hover:scale-105 transition-transform duration-300" />
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

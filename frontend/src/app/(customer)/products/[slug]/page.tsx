import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { formatRupiah } from '@/core/lib/utils'
import AppBar from '@/shared/ui/AppBar'
import Button from '@/shared/ui/Button'
import { ChevronRight, ShieldCheck, Ticket, Star, ShoppingCart, Lock } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface PageProps {
  params: { slug: string }
}

// ── Mock product fetch ────────────────────────────────────────────────────────
async function getProduct(slug: string) {
  const MOCK: Record<string, any> = {
    'emas-antam-10g': {
      id: '3', name: 'Antam Logam Mulia 10 Gram - CertiCard', slug: 'emas-antam-10g',
      pricePerGram: 1098500, weightGram: 10, totalPrice: 10985000, stock: 20,
      purity: '24K - 99.99%', category: 'Emas Batangan',
      description: 'Logam Mulia Antam dengan kemasan CertiCard merupakan produk emas murni 24 karat yang dilengkapi dengan sertifikat keamanan tingkat tinggi. Setiap bar memiliki nomor seri unik yang dapat diverifikasi melalui aplikasi CertiEye.',
      dimensions: '15.2 x 25.3 x 1.47 mm',
      cert: 'LBMA Certified',
      images: [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDf0y0trDa-cUcllfPavfkZga6RZfEEkAEsXlEqGjljC8rOxNNWvlt7mu1DVGRdJTG9ptR77cS4qNkW5YbRc8Zwfuob-7vfsMJpKC5dKvA2bm8FVzQGiBxgblrasRalgkHAsKolkfS5hgUHeGUW7_q7CvqmDnYWPXVQbgatZDl46t29qQAN17Nt9JbZO4FJxidQpOtGGVLTO1eWVDwAzvO4SsKCYxY38Qfu8_UvfcinGjrgF2f_BIqLgnH00ePRGV5b_KySOhAM2KTh",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC6rZ-BirTVjfG7TO7RWxmd5CkLS2w7Odea6rXQduzzrYHUh0HTWqARuVfC_NbRkr1cMP3JnSaz3BmVPg837ktlHzmKusXm1sbNyICbsSi6naIdvLedwLPFW_lSnrb8phJYZw6QwWfq9Yt3-vItW9xEKll65vl5wYVu5bIvwYqG9KCjySxfSZf0gS1xZry_E0ZKxJPfQ-0nLkL1j45Gk-2TdegxoYarrL7tU_bwzdTOQSAnE3M4i_rauQbie2-RusMggRCJoPweJFua",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBjxQigcXfkGqTYPGz337Tp1sDXj_sHJpk_u4jlcO74cg7stprT3npapb2-5t-1RqrrRgs0XWuUcGlebmS6sLg_nxkyOPZ1Vd_VDXdMB2egIU7ntzRB50lYxiCVb6VAsQANagf8xCXO3m5hd29FpLXcfNE6_t8dVWcnG5RPp7_70gtDpR7PHXZIxWwd0KT_fZzNUmrHSkIT5FX0zBr9fnjxp_o3iHoxrv08UNSHRWvwj0ef9UvuHNvWjUF4HvjgxuVyN5UI5oVVES-c",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBalWES0SKhwr-XS9Dq1E9z4ns6Inr-0cBHXCt5Q_Gki81m3SIZbqEDxJ9bEUdsXCuAZK4tQ5Trs-cWgfwYdumZGxygmGQ1OZb3LwqV_h_eiZNXTNLlXuJ4wKM8n19RqF_sgAJhHMcY9ZFz0EYwbnjD2JIZdAaS3Ru0ko9p2mvUGoXyAArM6YwvJZQssNmIj7Z9J-1RJjNiclsy-X_TaQFu2MdWmgGfqwgKLZnHmN6LMpM-9VTL404zi1LXw7XLaNz0x4m-6W74mHpm"
      ]
    },
  }
  return MOCK[slug] ?? null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProduct(params.slug)
  if (!product) return { title: 'Produk tidak ditemukan' }
  return {
    title:       `${product.name} | Logam Mulia Antam`,
    description: product.description,
  }
}

const RELATED = [
  { id: '1', name: 'Antam LM 1g',  price: 1150000,  slug: 'emas-antam-1g', img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDt5T5RkBDf3gh20OsEPUJFlIuBihWw5vcr0uf53KIut7OC7H1n6UF_QTIX0peHljXKJY-U1QcNecYHyujkUyta4W1kEfxCvl82_2SQHtfl6ubF6YT2jnUR82x8pYM9LydL6JO4mFYpxmAzm3VztZ8rh-3b-8KpzDjHHUT95MRmHR-ZJxMIUxrZpZg2nMhP4nyCuur3wepBMFurNn5tAUrIngQnMyHFYy0urrXFjGzr28QlfWoBnscee4rjl-DjepJ_Wx_9klx2My_8" },
  { id: '2', name: 'Antam LM 5g',  price: 5545000,  slug: 'emas-antam-5g', img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCxsztJsujvvqXeDYOyy8FgAFjLVS9P1crPB7u7JBzAsvkQnfTAoskYKeZgN4giyn1lYV1X9KCzutD_KyJgFVoZU2ZhVX27iJb5cxQLmbBJaKmqStALJKm-qkKHiyYWf4TPDhKGPkkNoHfajQoK88Y5t9BRuL0AqamXjaRgeKlbNLRLc3_Uqa4pr5EzUtvu13A8VUpM_TkyO1yDny2C9stFLIqW4RPW6DaBaCdZ_DqSAtMDQ2VZxMQk8tzIIkT4ee923upBYWjbd13W" },
  { id: '4', name: 'Antam LM 25g', price: 27200000, slug: 'emas-antam-25g', img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBvBs8uFH8bW4Maed78jT_4cw7xc4G5TYmVOfBvr6VhWc5oiEcYBRPvVKKNZICWE1Nky_H0YyehvvI2h4MU-KFh9wUuyJ129U9dvrNOO0s_nD_eN1_PBkr0aY16SinLUdN_3ayX8o3ZbXTkSlnbiQqLvR3eesh6C9XwFrv5AXQ2HuKc1Fz2taXx9-us4Av3Vtkv08sd4Ak88p_E05HHuSafRlVNs0QHvfNu6KzqGe0Ae-QrDHLDk7pPYdqMz8uVkLdnko3bJnH9V8i7" },
  { id: '5', name: 'Antam LM 50g', price: 54100000, slug: 'emas-antam-50g', img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA2QuhT-9LwYBdEGMYh2dODArjMum7TAWVojLSgszcAJI14C1elbXTGXEDkTYcSkV93LBZzk-HyxYF3u_yR4lbFw5NKUtT2blNEjS3EgwqmhWUS5K2m0RRRnCj2Fk1gBi3MfZ_SK3RucSdPeryYo40as3Yik0_naf5rrqwgXbGsl3_OcNNVZEB35rCy4hvcxHMSTvw1Iv-RvEFYE8baCYnMZLL-iqxQjlEVKexbBQt1cZ1YX9tyx2smsLArTrYK9T_SAYYuj3W1mErw" },
]

const REVIEWS = [
  { initials: 'BS', name: 'Budi S.',  rating: 5, photo: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80', text: 'Barang sampai dengan aman. Certicard utuh dan bisa diverifikasi. Seller sangat responsif.' },
  { initials: 'AW', name: 'Andi W.', rating: 5, photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80', text: 'Pengiriman super cepat dan packing rapih, mantap untuk investasi jangka panjang.' },
  { initials: 'LN', name: 'Lina N.', rating: 4, photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80', text: 'Sesuai deskripsi. Hanya sedikit kendala pada kurir tapi dibantu follow up oleh seller.' },
]

export default async function ProductDetailPage({ params }: PageProps) {
  const product = await getProduct(params.slug)
  if (!product) notFound()

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
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-navy-900">
              0
            </span>
          </Link>
        }
      />
      <main className="container-main py-8 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
          {/* ── Photo Gallery ─────────────────────────────────────────── */}
          <section className="space-y-4">
            {/* Main image */}
            <div className="aspect-square bg-white border border-navy-100 rounded-2xl overflow-hidden flex items-center justify-center p-8 shadow-sm relative">
              <Image 
                src={product.images[0]} 
                alt={product.name} 
                fill 
                className="object-contain p-8"
                priority
              />
            </div>

            {/* Thumbnails */}
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {product.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  className={`flex-shrink-0 w-20 h-20 bg-white border-2 rounded-xl p-2 transition-all relative overflow-hidden ${
                    idx === 0 ? 'border-gold-400 shadow-sm' : 'border-navy-100 hover:border-gold-300'
                  }`}
                >
                  <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-contain p-2" />
                </button>
              ))}
            </div>
          </section>

          {/* ── Product Info ──────────────────────────────────────────── */}
          <section className="space-y-6">
            <div>
              <span className="inline-block px-3 py-1 bg-navy-900 text-gold-400 rounded-md text-[10px] font-bold mb-3 uppercase tracking-widest">
                {product.category}
              </span>
              <h1 className="font-heading text-3xl text-navy-900 leading-tight font-bold">
                {product.name}
              </h1>
              <p className="font-heading text-2xl font-bold text-gold-600 mt-3">
                {formatRupiah(product.totalPrice)}
              </p>
            </div>

            {/* Promo Voucher */}
            <div className="bg-gold-50 border-2 border-dashed border-gold-300 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-gold-100/50 transition-colors">
              <div className="flex items-start gap-3 w-full sm:w-auto">
                <Ticket className="w-5 h-5 text-gold-600 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-gold-600 uppercase tracking-widest mb-1">Voucher Promo</p>
                  <p className="text-sm font-bold text-navy-900">kode kupon - LM (10) GRAM ANTAM</p>
                </div>
              </div>
              <div className="flex items-center justify-between w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-dashed border-gold-300">
                <div className="text-right">
                  <p className="text-[10px] text-navy-500 uppercase tracking-widest mb-0.5">Potongan</p>
                  <p className="text-sm font-bold text-red-500">Rp 8.500.000</p>
                </div>
                <button className="bg-gold-500 text-navy-900 px-5 py-2 rounded-lg text-sm font-bold hover:brightness-105 transition-all shadow-sm">
                  Ambil
                </button>
              </div>
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-3 gap-4 py-6 border-y border-navy-200">
              {[
                { label: 'Kadar',   value: product.purity },
                { label: 'Berat',   value: `${product.weightGram}g` },
                { label: 'Stok',    value: product.stock > 0 ? 'Tersedia' : 'Habis', green: product.stock > 0 },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-navy-500 text-[10px] uppercase tracking-widest mb-1 font-semibold">{item.label}</p>
                  <p className={`font-bold text-sm ${item.green ? 'text-green-600' : 'text-navy-900'}`}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* LBMA cert */}
            <div className="bg-white border border-navy-200 p-4 rounded-xl flex items-center gap-4 shadow-sm">
              <ShieldCheck className="w-8 h-8 text-gold-500 flex-shrink-0" />
              <div>
                <p className="font-bold text-navy-900">{product.cert}</p>
                <p className="text-xs text-navy-600 mt-1">Jaminan keaslian dengan standar internasional London Bullion Market Association.</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="font-heading text-lg font-bold text-navy-900 mb-3 border-b border-navy-200 pb-2">Deskripsi</h2>
              <div className="text-navy-700 text-sm leading-relaxed space-y-4">
                <p>{product.description}</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Produsen: PT. Aneka Tambang Tbk.</li>
                  <li>Dimensi: {product.dimensions}</li>
                  <li>Teknologi: CertiCard (Keamanan tinggi)</li>
                </ul>
              </div>
            </div>
            
            {/* Reviews Hook */}
            <div className="pt-8 border-t border-navy-200">
              <h2 className="font-heading text-lg font-bold text-navy-900 mb-4 border-b border-navy-200 pb-2">Ulasan Pelanggan (124)</h2>
              <div className="space-y-4">
                {REVIEWS.map((r) => (
                  <div key={r.name} className="bg-surface border border-navy-100 p-4 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-navy-100 flex-shrink-0 relative">
                        {r.photo ? (
                          <Image src={r.photo} alt={r.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gold-500 font-bold text-sm bg-gold-50">{r.initials}</div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-navy-900 leading-none mb-1">{r.name}</p>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-gold-500 text-gold-500' : 'fill-navy-200 text-navy-200'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-navy-700">{r.text}</p>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-3 border border-navy-300 text-navy-700 font-bold text-sm rounded-xl hover:bg-navy-50 transition-colors">
                Lihat Semua Ulasan
              </button>
            </div>
          </section>
        </div>


        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold text-navy-900">Produk Terkait</h2>
            <Link href="/products" className="text-gold-600 font-bold text-sm flex items-center gap-1 hover:text-gold-500 transition-colors">
              Lihat Semua <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {RELATED.map((r) => (
              <Link
                key={r.id}
                href={`/products/${r.slug}`}
                className="min-w-[180px] bg-white border border-navy-200 rounded-2xl p-4 group flex-shrink-0 hover:shadow-md transition-all duration-300"
              >
                <div className="aspect-square mb-4 overflow-hidden rounded-xl bg-surface flex items-center justify-center relative">
                  <Image src={r.img} alt={r.name} fill className="object-contain p-2 group-hover:scale-105 transition-transform duration-300" />
                </div>
                <p className="text-sm text-navy-900 font-bold truncate">{r.name}</p>
                <p className="text-gold-600 font-bold mt-1 text-sm">{formatRupiah(r.price)}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* ── Sticky Bottom CTA (mobile-first) ─────────────────────────── */}
      <div className="fixed bottom-0 left-0 w-full z-50 bg-white border-t border-navy-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] flex h-20 items-stretch divide-x divide-navy-100">
        <button
          className="w-24 flex flex-col items-center justify-center text-navy-600 hover:bg-navy-50 [transition-duration:var(--transition-fast)] transition-colors"
          aria-label="Tambah ke keranjang"
        >
          <ShoppingCart className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Cart</span>
        </button>
        <Link
          href={`/checkout/email?product=${product.slug}`}
          className="flex-1 flex flex-col items-center justify-center"
        >
          <Button variant="primary" size="md" fullWidth className="h-full rounded-none flex-col gap-1">
            <Lock className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Beli Sekarang</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}

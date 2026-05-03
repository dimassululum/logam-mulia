import type { Metadata } from 'next'
import Link from 'next/link'
import Footer from '@/shared/layout/Footer'
import Button from '@/shared/ui/Button'
import BannerSlider from '@/features/home/BannerSlider'
import {
  ShieldCheck,
  TrendingUp,
  Package,
  Store,
  MapPin,
  ChevronRight,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Logam Mulia Antam - Digital Gold Vault | Investasi Emas Online Terpercaya',
  description: 'Beli emas batangan ANTAM murni 24K bersertifikat LBMA, harga kompetitif update real-time, pengiriman aman ke seluruh Indonesia.',
}

const features = [
  {
    icon: ShieldCheck,
    title: 'Terjamin Asli',
    desc:  'Sertifikasi LBMA standar global.',
  },
  {
    icon: TrendingUp,
    title: 'Harga Kompetitif',
    desc:  'Update harga real-time harian.',
  },
  {
    icon: Package,
    title: 'Pengiriman Aman',
    desc:  'Layanan penuh se-Indonesia.',
  },
  {
    icon: Store,
    title: 'Butik Fisik',
    desc:  'Fasilitas pengambilan di butik resmi.',
  },
]

const boutiques = [
  { city: 'Jakarta', address: 'Pulogadung, Jakarta Timur' },
  { city: 'Surabaya', address: 'Jl. Pemuda No. 1' },
  { city: 'Bandung', address: 'Jl. Braga, Sumur Bandung' },
  { city: 'Medan', address: 'Jl. S. Parman' },
]

const articles = [
  {
    id: 'mengapa-emas-safe-haven',
    tag: 'Panduan',
    title: 'Mengapa Emas Adalah "Safe Haven" Terbaik?',
    desc: 'Pelajari alasan utama mengapa investor profesional selalu menyisihkan portofolio dalam bentuk emas...',
  },
  {
    id: 'strategi-dollar-cost-averaging',
    tag: 'Strategi',
    title: 'Strategi Dollar Cost Averaging Pada Emas',
    desc: 'Cara cerdas menabung emas tanpa harus menunggu harga turun. Konsistensi adalah kunci...',
  },
  {
    id: 'verifikasi-sertifikat-antam',
    tag: 'Keamanan',
    title: 'Verifikasi Keaslian Sertifikat Antam',
    desc: 'Kenali ciri-ciri fisik dan fitur keamanan terbaru pada produk CertiCard investasi Anda...',
  },
]

const popularProducts = [
  { id: '1', slug: 'emas-antam-10g', name: 'Emas Antam 10g', price: 'Rp 11.420.000', badge: 'Terlaris', sold: '500+' },
  { id: '2', slug: 'emas-antam-1g', name: 'Emas Antam 1g', price: 'Rp 1.142.000', badge: 'Stok Terbatas', sold: '1rb+', originalPrice: 'Rp 1.202.000' },
  { id: '3', slug: 'emas-antam-100g', name: 'Emas Antam 100g', price: 'Rp 114.200.000', badge: '', sold: '100+' },
  { id: '4', slug: 'gift-series-0-5g', name: 'Gift Series 0.5g', price: 'Rp 650.000', badge: '', sold: '300+' },
]

function GoldBarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2" />
    </svg>
  )
}

export default function HomePage() {
  return (
    <>
      <section className="bg-navy-900 flex h-[calc(100svh-4rem)] max-h-[820px] min-h-[560px] flex-col items-center border-b border-gold-500/20 md:h-auto md:max-h-none md:min-h-0 md:pb-12">
        <div className="relative w-full min-h-0 flex-1 overflow-hidden bg-navy-950 md:aspect-[16/9] md:flex-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-[108%] w-full object-cover object-top md:h-full md:object-center"
          >
            <source src="/videos/home-hero-latest.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="container-main z-10 flex shrink-0 justify-center py-6 md:mt-8 md:py-0">
          <Link href="/products" className="inline-block w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto min-w-[240px] bg-gradient-to-r from-gold-400 to-gold-500 text-navy-900 shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_14px_34px_rgba(212,175,55,0.42)] active:translate-y-0 active:scale-95 border-none text-base font-bold py-4 px-10 transition-all [transition-duration:var(--transition-base)]">
              Beli Emas Disini
            </Button>
          </Link>
        </div>
      </section>

      <section className="container-main mt-12 mb-8 relative z-10">
        <BannerSlider />
      </section>

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
            {popularProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                id={`popular-product-${product.id}`}
                className="card-product p-4 relative overflow-hidden block"
              >
                <div className="product-img-wrap mb-stack-sm">
                  <GoldBarIcon className="w-12 h-12 text-gold-400/40" />
                </div>

                <div className="space-y-1">
                  {product.badge && <span className="certified-stamp">{product.badge}</span>}
                  <h3 className="font-bold text-sm text-navy-900 truncate">{product.name}</h3>
                  {product.originalPrice && (
                    <p className="text-[10px] text-navy-600/50 line-through">{product.originalPrice}</p>
                  )}
                  <p className="text-gold-400 font-bold text-sm">{product.price}</p>
                  <p className="text-[10px] text-navy-600/70 font-medium">Terjual {product.sold}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-navy-900 section-full">
        <div className="container-main">
          <div className="text-center mb-stack-md">
            <h2 className="text-display-md text-gold-400">Beli Emas Di Sini</h2>
            <p className="text-white/60 text-body-md mt-stack-sm">
              Standar keamanan tertinggi untuk masa depan Anda.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="card-dark p-5">
                  <div className="w-10 h-10 bg-gold-400/20 rounded-lg flex items-center justify-center mb-stack-sm text-gold-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-white font-bold text-sm mb-1">{feature.title}</h4>
                  <p className="text-white/50 text-[11px] leading-tight">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section-full">
        <div className="container-main">
          <div className="flex justify-between items-end mb-stack-md">
            <div>
              <h2 className="section-heading">Lokasi Butik</h2>
              <p className="text-navy-600 text-body-md mt-stack-sm">
                Kunjungi jaringan butik resmi kami di kota Anda.
              </p>
            </div>
            <Link
              href="/boutiques"
              className="flex items-center gap-1 text-label-md text-gold-500 font-semibold hover:gap-2 transition-all pb-1"
              style={{ transitionDuration: 'var(--transition-base)' }}
            >
              Lihat Semua
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {boutiques.map((boutique) => (
              <div
                key={boutique.city}
                className="card-surface p-4 flex flex-col hover:border-gold-400/50 transition-colors"
                style={{ transitionDuration: 'var(--transition-base)' }}
              >
                <MapPin className="w-5 h-5 text-gold-400 mb-stack-sm" />
                <h5 className="font-bold text-navy-900 text-sm">{boutique.city}</h5>
                <p className="text-[11px] text-navy-600">{boutique.address}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-stack-lg overflow-hidden">
        <div className="container-main">
          <h2 className="section-heading mb-stack-md">Wawasan Investasi</h2>
        </div>

        <div className="container-main">
          <div className="flex gap-gutter overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4">
            {articles.map((article) => (
              <article
                key={article.title}
                className="min-w-[85%] md:min-w-[30%] snap-center card-surface rounded-2xl overflow-hidden flex flex-col shadow-elevation-mid"
              >
                <div className="relative aspect-video bg-gradient-to-br from-navy-900 to-navy-800 flex items-center justify-center">
                  <GoldBarIcon className="w-12 h-12 text-gold-400/40" />
                  <div className="absolute top-4 left-4">
                    <span className="bg-navy-900/80 backdrop-blur-md text-gold-400 text-[8px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                      {article.tag}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-[17px] font-bold text-navy-900 mb-stack-sm leading-tight">{article.title}</h3>
                  <p className="text-navy-600 text-xs line-clamp-2 mb-stack-md flex-grow">{article.desc}</p>
                  <Link
                    href={`/articles/${article.id}`}
                    className="flex items-center gap-1 font-bold text-gold-500 text-xs group"
                    style={{ transition: 'gap var(--transition-base)' }}
                  >
                    Baca Selengkapnya
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}

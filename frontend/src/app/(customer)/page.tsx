import type { Metadata } from 'next'
import Link from 'next/link'
import Footer from '@/shared/layout/Footer'
import Button from '@/shared/ui/Button'
import BannerSlider from '@/features/home/BannerSlider'
import { getHomeData, type HomeProduct } from '@/features/home/home-api'
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatShortCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatLastUpdated(products: HomeProduct[]) {
  const latest = products
    .map((product) => new Date(product.updatedAt).getTime())
    .filter((time) => Number.isFinite(time))
    .sort((left, right) => right - left)[0]

  if (!latest) return 'Perubahan terakhir: belum tersedia dari database'

  return `Perubahan terakhir: ${new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(latest))}`
}

function getUnitPrice(product: HomeProduct) {
  if (!product.weightGram) return product.price
  return product.price / product.weightGram
}

function findMetalProduct(products: HomeProduct[], keywords: string[]) {
  return products.find((product) => {
    const searchable = `${product.name} ${product.categoryName}`.toLowerCase()
    return keywords.some((keyword) => searchable.includes(keyword))
  })
}

function buildPriceCards(products: HomeProduct[]) {
  if (products.length === 0) return []

  const goldProduct = findMetalProduct(products, ['emas', 'gold', 'antam']) || products[0]
  const silverProduct = findMetalProduct(products, ['perak', 'silver'])

  const cards = [
    {
      label: 'Emas',
      tone: 'gold',
      price: formatCurrency(getUnitPrice(goldProduct)),
      meta: `${goldProduct.name} tersedia ${goldProduct.stock} pcs`,
      movement: 'flat',
      movementLabel: 'Harga dari admin',
    },
  ]

  if (silverProduct) {
    cards.push({
      label: 'Perak',
      tone: 'silver',
      price: formatCurrency(getUnitPrice(silverProduct)),
      meta: `${silverProduct.name} tersedia ${silverProduct.stock} pcs`,
      movement: 'flat',
      movementLabel: 'Harga dari admin',
    })
  }

  return cards
}

function GoldBarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2" />
    </svg>
  )
}

export default async function HomePage() {
  const homeData = await getHomeData()
  const priceCards = buildPriceCards(homeData.products)

  const displayProducts = homeData.products
    .slice(0, 4)
    .map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        price: formatShortCurrency(p.price || 0),
        badge: p.stock < 10 && p.stock > 0 ? 'Stok Terbatas' : (p.stock === 0 ? 'Habis' : ''),
        sold: `${Math.max(0, p.stock)} stok`,
        originalPrice: '',
        imageUrl: p.imageUrl,
      }))

  const displayBoutiques = homeData.boutiques
    .slice(0, 4)
    .map((b) => ({
        id: b.id,
        city: b.city || b.name,
        address: b.address,
        googleMapsUrl: b.googleMapsUrl,
      }))

  const displayArticles = homeData.articles
    .slice(0, 3)
    .map((a) => ({
        id: a.slug,
        tag: 'Artikel',
        title: a.title,
        desc: a.excerpt,
        coverUrl: a.coverUrl,
      }))

  return (
    <>
      <section className="bg-navy-900 flex h-[calc(100svh-4rem)] max-h-[820px] min-h-[560px] flex-col items-center border-b border-gold-500/20 md:h-auto md:max-h-none md:min-h-0 md:pb-12">
        <div className="relative w-full min-h-0 flex-1 overflow-hidden bg-navy-950 md:aspect-[16/9] md:flex-none">
          {homeData.hero.status === 'active' ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-[108%] w-full object-cover object-top md:h-full md:object-center"
            >
              <source src={homeData.hero.videoUrl} type="video/mp4" />
            </video>
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.25),transparent_38%),linear-gradient(135deg,#061228,#152b4b)]" />
          )}
        </div>

        <div className="container-main z-10 flex shrink-0 justify-center py-6 md:mt-8 md:py-0">
          <Link href="/products" className="inline-block w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto min-w-[240px] bg-gradient-to-r from-gold-400 to-gold-500 text-navy-900 shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_14px_34px_rgba(212,175,55,0.42)] active:translate-y-0 active:scale-95 border-none text-base font-bold py-4 px-10 transition-all [transition-duration:var(--transition-base)]">
              {homeData.hero.buttonTitle}
            </Button>
          </Link>
        </div>
      </section>

      {/* Price Update Section */}
      <section className="container-main mt-12 relative z-10 flex justify-center">
        <div className="rounded-2xl overflow-hidden shadow-2xl w-full max-w-[380px]">
          {/* Top bar */}
          <div className="bg-[#2a4066] text-white py-3 px-4 flex items-center justify-start gap-2 text-[13px] font-medium">
            <svg className="w-[18px] h-[18px] text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatLastUpdated(homeData.products)}
          </div>

          {/* Stacked Content */}
          <div className="flex flex-col">
            {priceCards.length > 0 ? priceCards.map((card) => (
              <div key={card.label} className={`${card.tone === 'gold' ? 'bg-[#d4af37]' : 'bg-[#b0b5b9]'} p-6 text-white relative overflow-hidden`}>
                <div className="relative z-10">
                  <h3 className="font-serif text-[42px] font-bold mb-4 drop-shadow-sm leading-none">{card.label}</h3>
                  <p className="text-[15px] font-medium opacity-90 mb-1">Harga/gram</p>
                  <p className="text-[34px] font-bold mb-6 drop-shadow-sm leading-none tracking-tight">{card.price}</p>

                  <div className="flex flex-col gap-2">
                    <div className={`flex items-center gap-1.5 font-bold text-base ${card.movement === 'down' ? 'text-[#ff4d4d]' : card.movement === 'up' ? 'text-[#21c55e]' : 'text-white'}`}>
                      {card.movement === 'down' ? (
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 15a.75.75 0 01-.53-.22l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 011.5 0v9.44l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5A.75.75 0 0110 15z" clipRule="evenodd" /></svg>
                      ) : card.movement === 'up' ? (
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 5a.75.75 0 01.53.22l4.5 4.5a.75.75 0 11-1.06 1.06l-3.22-3.22v9.44a.75.75 0 01-1.5 0V7.56l-3.22 3.22a.75.75 0 01-1.06-1.06l4.5-4.5A.75.75 0 0110 5z" clipRule="evenodd" /></svg>
                      ) : null}
                      {card.movementLabel}
                    </div>
                    <p className="text-[14px] font-medium opacity-90">{card.meta}</p>
                  </div>
                </div>
                <div className="absolute -right-10 top-10 w-48 h-32 bg-white/10 rounded-2xl transform rotate-[15deg] pointer-events-none"></div>
              </div>
            )) : (
              <div className="bg-[#2a4066] p-6 text-white">
                <p className="text-sm font-semibold">Harga belum tersedia dari database.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="container-main mt-8 mb-8 relative z-10">
        <BannerSlider banners={homeData.banners} />
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

          {displayProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
              {displayProducts.map((product: any) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                id={`popular-product-${product.id}`}
                className="card-product p-4 relative overflow-hidden block"
              >
                <div className="product-img-wrap mb-stack-sm">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <GoldBarIcon className="w-12 h-12 text-gold-400/40" />
                  )}
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
          ) : (
            <p className="rounded-lg border border-navy-100 bg-white p-4 text-sm font-medium text-navy-600">
              Produk belum tersedia dari database.
            </p>
          )}
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

          {displayBoutiques.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {displayBoutiques.map((boutique: any) => (
              <a
                key={boutique.id || boutique.city}
                href={boutique.googleMapsUrl || '/boutiques'}
                target={boutique.googleMapsUrl ? '_blank' : undefined}
                rel={boutique.googleMapsUrl ? 'noreferrer' : undefined}
                className="card-surface p-4 flex flex-col hover:border-gold-400/50 transition-colors"
                style={{ transitionDuration: 'var(--transition-base)' }}
              >
                <MapPin className="w-5 h-5 text-gold-400 mb-stack-sm" />
                <h5 className="font-bold text-navy-900 text-sm">{boutique.city}</h5>
                <p className="text-[11px] text-navy-600">{boutique.address}</p>
              </a>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-navy-100 bg-white p-4 text-sm font-medium text-navy-600">
              Butik belum tersedia dari database.
            </p>
          )}
        </div>
      </section>

      <section className="pb-stack-lg overflow-hidden">
        <div className="container-main">
          <h2 className="section-heading mb-stack-md">Wawasan Investasi</h2>
        </div>

        <div className="container-main">
          {displayArticles.length > 0 ? (
            <div className="flex gap-gutter overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4">
              {displayArticles.map((article: any) => (
              <article
                key={article.title}
                className="min-w-[85%] md:min-w-[30%] snap-center card-surface rounded-2xl overflow-hidden flex flex-col shadow-elevation-mid"
              >
                <div className="relative aspect-video bg-gradient-to-br from-navy-900 to-navy-800 flex items-center justify-center overflow-hidden">
                  {article.coverUrl ? (
                    <img src={article.coverUrl} alt={article.title} className="h-full w-full object-cover" />
                  ) : (
                    <GoldBarIcon className="w-12 h-12 text-gold-400/40" />
                  )}
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
          ) : (
            <p className="rounded-lg border border-navy-100 bg-white p-4 text-sm font-medium text-navy-600">
              Artikel belum tersedia dari database.
            </p>
          )}
        </div>
      </section>

      <Footer profile={homeData.footer} />
    </>
  )
}

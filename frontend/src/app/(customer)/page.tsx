import type { Metadata } from 'next'
import Link from 'next/link'
import Footer from '@/shared/layout/Footer'
import BannerSlider from '@/features/home/BannerSlider'
import { getHomeData, type HomeMetalPrices, type HomeProduct } from '@/features/home/home-api'
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

const HERO_BACKGROUND_IMAGE =
  'https://images.pexels.com/photos/321452/pexels-photo-321452.jpeg?auto=compress&cs=tinysrgb&w=1800'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

function formatUpdateTime(products: HomeProduct[]) {
  const latest = products
    .map((product) => new Date(product.updatedAt).getTime())
    .filter((time) => Number.isFinite(time))
    .sort((left, right) => right - left)[0]

  if (!latest) return 'Terakhir diupdate: belum tersedia'

  return `Terakhir diupdate: ${new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(latest))} WIB`
}

function formatMetalUpdateTime(metalPrices: HomeMetalPrices, products: HomeProduct[]) {
  const metalTimes = [
    metalPrices.gold.current?.recordedAt,
    metalPrices.silver.current?.recordedAt,
  ]
    .map((value) => value ? new Date(value).getTime() : NaN)
    .filter((time) => Number.isFinite(time))

  if (metalTimes.length > 0) {
    const latest = metalTimes.sort((left, right) => right - left)[0]
    return `Terakhir diupdate: ${new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(latest))} WIB`
  }

  return formatUpdateTime(products)
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

function buildPriceCards(products: HomeProduct[], metalPrices: HomeMetalPrices) {
  const goldProduct = findMetalProduct(products, ['emas', 'gold', 'antam']) || products[0]
  const silverProduct = findMetalProduct(products, ['perak', 'silver'])

  function createCard(label: 'Emas' | 'Perak', tone: 'gold' | 'silver', product?: HomeProduct) {
    const summary = tone === 'gold' ? metalPrices.gold : metalPrices.silver
    const currentPrice = summary.current?.price ?? (product ? getUnitPrice(product) : null)
    const previousPrice = summary.previous?.price ?? null
    const changePercent = summary.changePercent
      ?? (currentPrice !== null && previousPrice ? ((currentPrice - previousPrice) / previousPrice) * 100 : null)
    const trend = changePercent === null ? 'flat' : changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'flat'

    return {
      label,
      tone,
      price: currentPrice !== null ? formatCurrency(currentPrice) : 'Belum tersedia',
      previousPrice: previousPrice !== null ? formatCurrency(previousPrice) : 'Belum tersedia',
      changeLabel: changePercent !== null ? `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2).replace('.', ',')}%` : '0,00%',
      trend,
      backgroundImage: tone === 'gold' ? '/images/metal-gold.jpg' : '/images/metal-silver.png',
    }
  }

  return [
    createCard('Emas', 'gold', goldProduct),
    createCard('Perak', 'silver', silverProduct),
  ]
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
  const priceCards = buildPriceCards(homeData.products, homeData.metalPrices)

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
      <section className="overflow-hidden border-b border-gold-500/20 bg-navy-900">
        <div className="relative min-h-[calc(100svh-4rem)] overflow-hidden md:hidden">
          {homeData.hero.status === 'active' ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover object-center"
            >
              <source src={homeData.hero.videoUrl} type="video/mp4" />
            </video>
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.25),transparent_38%),linear-gradient(135deg,#061228,#152b4b)]" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-navy-950/85 via-navy-950/25 to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-5 bottom-6">
            <Link href="/products" className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gold-400 to-gold-500 px-6 py-4 text-base font-bold text-navy-900 shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all active:scale-95">
              {homeData.hero.buttonTitle}
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <div className="relative isolate hidden overflow-hidden md:block">
          <img
            src={HERO_BACKGROUND_IMAGE}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 -z-30 h-full w-full object-cover object-center opacity-55"
          />
          <div className="absolute inset-0 -z-20 bg-navy-950/72" aria-hidden="true" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(15,27,45,0.98)_0%,rgba(15,27,45,0.88)_44%,rgba(15,27,45,0.46)_100%)]" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-navy-950/80 to-transparent" aria-hidden="true" />

          <div className="container-main relative z-10 flex min-h-[560px] items-center py-24 pb-32 md:max-w-6xl">
            <div className="max-w-2xl">
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-gold-400">Logam Mulia Bersertifikat</p>
              <h1 className="max-w-xl font-heading text-[52px] font-bold leading-[1.1] text-white">
                Investasi Emas Mulai dari <span className="text-gold-400">0.5 Gram</span>
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-navy-200">
                Aman, terpercaya, dan bersertifikat ANTAM. Mulai perjalanan investasi finansial kamu hari ini.
              </p>
              <Link href="/products" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-gold-500 px-7 py-4 text-base font-bold text-navy-950 shadow-[0_16px_34px_-22px_rgba(212,168,75,0.75)] transition-all hover:-translate-y-0.5 hover:bg-gold-400">
                {homeData.hero.buttonTitle}
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="harga-logam" className="container-main relative z-10 mt-8 md:-mt-16 md:mb-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-[0_18px_45px_-34px_rgba(15,27,45,0.5)]">
            <div className="flex items-center justify-between gap-4 border-b border-navy-100 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-600">Harga Logam Mulia</p>
                <h2 className="mt-1 font-body text-xl font-bold text-navy-900">Emas dan Perak Hari Ini</h2>
              </div>
              <svg className="h-5 w-5 shrink-0 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <div className="flex flex-1 flex-col p-5 sm:p-6">
              <div className="grid gap-3">
                {priceCards.map((card) => (
                  <div
                    key={card.label}
                    className={`relative overflow-hidden rounded-lg border p-5 shadow-sm ${
                      card.tone === 'gold'
                        ? 'border-gold-400/60 bg-[linear-gradient(135deg,#fff7db_0%,#f3c85f_42%,#8b650f_120%)]'
                        : 'border-slate-300 bg-[linear-gradient(135deg,#ffffff_0%,#dce1e8_48%,#748091_120%)]'
                    }`}
                  >
                    <img
                      src={card.backgroundImage}
                      alt=""
                      aria-hidden="true"
                      className={`pointer-events-none absolute right-0 top-1/2 h-[130%] max-w-none -translate-y-1/2 object-contain opacity-20 ${
                        card.tone === 'gold' ? 'w-[58%] rotate-6' : 'w-[48%]'
                      }`}
                    />
                    <div className="absolute inset-0 bg-white/10" aria-hidden="true" />
                    <div className="relative">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className={`text-sm font-bold ${card.tone === 'gold' ? 'text-gold-800' : 'text-navy-700'}`}>
                            {card.label}
                          </p>
                          <p className="mt-3 text-xs font-bold uppercase text-navy-600">Harga hari ini</p>
                          <h3 className="mt-1 font-body text-[28px] font-bold leading-none text-navy-900">
                            {card.price}
                          </h3>
                        </div>

                        <span
                          className={`inline-flex min-w-[76px] items-center justify-center rounded-full px-3 py-1.5 text-xs font-bold ${
                            card.trend === 'up'
                              ? 'bg-emerald-100 text-emerald-700'
                              : card.trend === 'down'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-white text-navy-600 ring-1 ring-navy-200'
                          }`}
                        >
                          {card.changeLabel}
                        </span>
                      </div>

                      <div className="mt-4 rounded-lg bg-white/80 p-3 ring-1 ring-black/5 backdrop-blur-sm">
                        <p className="text-xs font-bold uppercase text-navy-500">Harga kemarin</p>
                        <p className="mt-1 text-base font-bold text-navy-900">{card.previousPrice}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto flex flex-col gap-4 border-t border-navy-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold leading-5 text-navy-500">
                  {formatMetalUpdateTime(homeData.metalPrices, homeData.products)}
                </p>
                <Link href="/products" className="inline-flex items-center justify-center gap-1 rounded-lg border border-gold-300 px-4 py-2 text-sm font-bold text-gold-700 hover:bg-gold-50">
                  Lihat Produk
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-[0_18px_45px_-34px_rgba(15,27,45,0.5)]">
            <BannerSlider banners={homeData.banners} />
          </div>
        </div>
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

      <section id="artikel" className="pb-stack-lg overflow-hidden">
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

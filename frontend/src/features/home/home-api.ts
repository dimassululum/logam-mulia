const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export interface HomeProduct {
  id: string
  slug: string
  name: string
  price: number
  weightGram: number
  stock: number
  categoryName: string
  imageUrl: string
  updatedAt: string
}

export interface HomeBoutique {
  id: string
  name: string
  city: string
  address: string
  googleMapsUrl: string
}

export interface HomeArticle {
  id: string
  slug: string
  title: string
  excerpt: string
  coverUrl: string
  publishedAt: string
}

export interface HomeBanner {
  id: string
  title: string
  imageUrl: string
}

export interface HomeFooterSocial {
  id: string
  name: string
  status: 'active' | 'inactive'
  link: string
}

export interface HomeFooterProfile {
  companyName: string
  companyDescription: string
  companyLogoPreview: string
  address: string
  googleMapsLink: string
  whatsAppContact: string
  socialMedia: HomeFooterSocial[]
}

export interface HomeHeroProfile {
  status: 'active' | 'inactive'
  buttonTitle: string
  videoUrl: string
}

interface CompanyProfileItem {
  value?: string
  type?: string
}

type CompanyProfileMap = Record<string, CompanyProfileItem | undefined>

const emptyFooter: HomeFooterProfile = {
  companyName: '',
  companyDescription: '',
  companyLogoPreview: '',
  address: '',
  googleMapsLink: '',
  whatsAppContact: '',
  socialMedia: [],
}

async function fetchApi<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' })
    if (!res.ok) return fallback

    const json = await res.json()
    return (json.data ?? fallback) as T
  } catch (error) {
    console.error(`Error fetching home data from ${path}:`, error)
    return fallback
  }
}

function toNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function readProfileText(profile: CompanyProfileMap, key: string, fallback: string) {
  return profile[key]?.value || fallback
}

function readProfileJson<T>(profile: CompanyProfileMap, key: string, fallback: T): T {
  const value = profile[key]?.value
  if (!value) return fallback

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function isBannerVisible(banner: { status?: string; expiresAt?: string }) {
  if (banner.status !== 'active') return false
  if (!banner.expiresAt) return true

  const endOfExpiryDate = new Date(`${banner.expiresAt}T23:59:59`)
  return Number.isNaN(endOfExpiryDate.getTime()) || endOfExpiryDate >= new Date()
}

function mapProduct(product: any): HomeProduct {
  const primaryImage = product.images?.find((image: any) => image.isPrimary)?.imageUrl || product.images?.[0]?.imageUrl || ''

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: toNumber(product.price),
    weightGram: toNumber(product.weightGram),
    stock: toNumber(product.stock),
    categoryName: product.category?.name || 'Lainnya',
    imageUrl: primaryImage,
    updatedAt: product.updatedAt || product.createdAt || '',
  }
}

function mapBoutique(boutique: any): HomeBoutique {
  return {
    id: boutique.id,
    name: boutique.name,
    city: boutique.city,
    address: boutique.address,
    googleMapsUrl: boutique.googleMapsUrl || '',
  }
}

function mapArticle(article: any): HomeArticle {
  return {
    id: article.id,
    slug: article.slug || article.id,
    title: article.title,
    excerpt: article.excerpt || '',
    coverUrl: article.coverUrl || '',
    publishedAt: article.publishedAt || article.createdAt || '',
  }
}

export async function getHomeData() {
  const [products, boutiques, articles, companyProfile] = await Promise.all([
    fetchApi<any[]>('/products?limit=8&isActive=true', []),
    fetchApi<any[]>('/boutiques?isActive=true', []),
    fetchApi<any[]>('/articles?limit=6&isPublished=true', []),
    fetchApi<CompanyProfileMap>('/company-profile', {}),
  ])

  const profileBanners = readProfileJson<any[]>(companyProfile, 'homepage_banners', [])
  const visibleBanners = profileBanners
    .filter(isBannerVisible)
    .map((banner: any) => ({
      id: banner.id,
      title: banner.title,
      imageUrl: banner.thumbnailUrl,
    }))
    .filter((banner: HomeBanner) => banner.imageUrl)

  return {
    products: products.map(mapProduct),
    boutiques: boutiques.map(mapBoutique),
    articles: articles.map(mapArticle),
    banners: visibleBanners,
    hero: {
      status: readProfileText(companyProfile, 'hero_video_status', 'inactive') === 'active' ? 'active' : 'inactive',
      buttonTitle: readProfileText(companyProfile, 'hero_video_button_title', 'Beli Emas Disini'),
      videoUrl: readProfileText(companyProfile, 'hero_video_preview_url', ''),
    } satisfies HomeHeroProfile,
    footer: {
      companyName: readProfileText(companyProfile, 'footer_company_name', emptyFooter.companyName),
      companyDescription: readProfileText(companyProfile, 'footer_company_description', emptyFooter.companyDescription),
      companyLogoPreview: readProfileText(companyProfile, 'footer_company_logo_preview', emptyFooter.companyLogoPreview),
      address: readProfileText(companyProfile, 'footer_address', emptyFooter.address),
      googleMapsLink: readProfileText(companyProfile, 'footer_google_maps_link', emptyFooter.googleMapsLink),
      whatsAppContact: readProfileText(companyProfile, 'footer_whatsapp_contact', emptyFooter.whatsAppContact),
      socialMedia: readProfileJson(companyProfile, 'footer_social_media', emptyFooter.socialMedia),
    } satisfies HomeFooterProfile,
  }
}

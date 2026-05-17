import { Map, MapPin, MessageCircle } from 'lucide-react'
import { buildWhatsAppLink } from '@/core/lib/contact'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

interface BoutiqueRecord {
  id: string
  name: string
  city?: string
  address: string
  googleMapsUrl?: string
}

interface CompanyProfileItem {
  value?: string
}

async function fetchApi<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${path}`, { cache: 'no-store' })
    if (!response.ok) return fallback

    const json = await response.json()
    return (json.data ?? fallback) as T
  } catch (error) {
    console.error(`Error fetching ${path}:`, error)
    return fallback
  }
}

export default async function BoutiquesPage() {
  const [boutiques, companyProfile] = await Promise.all([
    fetchApi<BoutiqueRecord[]>('/boutiques?isActive=true', []),
    fetchApi<Record<string, CompanyProfileItem | undefined>>('/company-profile', {}),
  ])

  const whatsAppLink = buildWhatsAppLink(
    companyProfile.footer_whatsapp_contact?.value,
    'Halo admin, saya ingin bertanya tentang lokasi butik Logam Mulia.',
  )

  return (
    <div className="min-h-screen bg-surface">
      <main className="container-main py-stack-lg">
        <div className="mb-stack-md max-w-3xl">
          <h1 className="mb-2 text-display-md font-heading font-bold text-navy-900">Lokasi Butik</h1>
          <p className="text-body-lg text-navy-600">
            Pilih butik resmi terdekat untuk pengambilan atau konsultasi transaksi logam mulia.
          </p>
        </div>

        {boutiques.length > 0 ? (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {boutiques.map((boutique) => (
              <article key={boutique.id} className="card-surface flex min-h-[240px] flex-col p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-gold-100 text-gold-700">
                  <MapPin className="h-5 w-5" />
                </div>

                <div className="flex flex-1 flex-col">
                  <h2 className="font-heading text-xl font-bold leading-tight text-navy-900">
                    {boutique.name}
                  </h2>
                  <p className="mt-3 flex-1 text-sm leading-6 text-navy-600">
                    {boutique.address}
                  </p>

                  <a
                    href={boutique.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${boutique.name} ${boutique.address}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-gold-400 px-4 py-3 text-sm font-bold text-navy-900 transition-all hover:brightness-105 active:scale-[0.98]"
                  >
                    <Map className="h-4 w-4" />
                    Buka Google Maps
                  </a>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <p className="rounded-lg border border-navy-100 bg-white p-4 text-sm font-medium text-navy-600">
            Data butik belum tersedia.
          </p>
        )}

        <section className="mt-stack-lg rounded-xl bg-navy-900 p-8 text-center">
          <h2 className="mb-3 font-heading text-3xl font-bold text-gold-500">Butuh Bantuan?</h2>
          <p className="mx-auto mb-6 max-w-2xl text-sm leading-6 text-white/75 md:text-base">
            Hubungi admin untuk informasi lokasi butik, ketersediaan stok, atau prosedur transaksi.
          </p>
          <a
            href={whatsAppLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-6 py-3 text-sm font-bold text-white shadow-low transition-colors hover:brightness-110"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp Admin
          </a>
        </section>
      </main>
    </div>
  )
}

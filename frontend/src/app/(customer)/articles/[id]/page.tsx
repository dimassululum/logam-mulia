import Link from 'next/link'
import { CalendarDays, ChevronLeft, Share2 } from 'lucide-react'
import { resolvePublicApiBaseUrl, resolvePublicAssetUrl } from '@/core/lib/public-url'

const API_URL = resolvePublicApiBaseUrl()

interface ArticleDetail {
  id: string
  slug: string
  title: string
  excerpt?: string
  content?: string
  coverUrl?: string
  publishedAt?: string
  createdAt?: string
}

async function getArticle(id: string) {
  try {
    const response = await fetch(`${API_URL}/articles/${encodeURIComponent(id)}`, { cache: 'no-store' })
    if (!response.ok) return null

    const json = await response.json()
    const article = (json.data ?? null) as ArticleDetail | null
    return article ? { ...article, coverUrl: resolvePublicAssetUrl(article.coverUrl || '') } : null
  } catch (error) {
    console.error('Error fetching article detail:', error)
    return null
  }
}

function formatArticleDate(value?: string) {
  if (!value) return 'Tanggal belum tersedia'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Tanggal belum tersedia'

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function buildArticleHtml(article: ArticleDetail) {
  if (article.content) return article.content
  if (article.excerpt) return `<p>${article.excerpt}</p>`
  return '<p>Konten artikel belum tersedia.</p>'
}

export default async function ArticleDetailPage({ params }: { params: { id: string } }) {
  const article = await getArticle(params.id)

  if (!article) {
    return (
      <div className="container-main flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h1 className="mb-4 text-3xl font-heading font-bold text-navy-900">Artikel Tidak Ditemukan</h1>
        <Link href="/" className="btn-primary">
          Kembali ke Beranda
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <main className="container-main py-8 md:py-12">
        <div className="mx-auto max-w-4xl">
          <Link href="/#artikel" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-navy-600 hover:text-navy-900">
            <ChevronLeft className="h-4 w-4" />
            Kembali
          </Link>

          {article.coverUrl && (
            <div className="mb-8 aspect-video w-full overflow-hidden rounded-2xl bg-navy-100 shadow-elevation-low md:aspect-[21/9]">
              <img src={article.coverUrl} alt={article.title} className="h-full w-full object-cover" />
            </div>
          )}

          <div className="mb-8">
            <span className="mb-4 inline-block rounded-full border border-gold-500/20 bg-gold-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold-600">
              Artikel
            </span>
            <h1 className="mb-4 text-balance text-3xl font-heading font-bold leading-tight text-navy-900 md:text-5xl">
              {article.title}
            </h1>
            <div className="flex items-center gap-2 text-sm font-medium text-navy-500">
              <CalendarDays className="h-4 w-4 text-gold-500" />
              <span>{formatArticleDate(article.publishedAt || article.createdAt)}</span>
            </div>
          </div>

          <article className="leading-relaxed text-navy-700">
            <div
              className="[&>blockquote]:my-8 [&>blockquote]:rounded-r-xl [&>blockquote]:border-l-4 [&>blockquote]:border-gold-400 [&>blockquote]:bg-white [&>blockquote]:p-6 [&>blockquote]:font-heading [&>blockquote]:text-xl [&>blockquote]:italic [&>blockquote]:text-navy-900 [&>blockquote]:shadow-sm [&>h2]:mb-4 [&>h2]:mt-10 [&>h2]:font-heading [&>h2]:text-3xl [&>h2]:font-bold [&>h2]:text-navy-900 [&>h3]:mb-4 [&>h3]:mt-10 [&>h3]:font-heading [&>h3]:text-2xl [&>h3]:font-bold [&>h3]:text-navy-900 [&>ol]:mb-6 [&>ol]:list-decimal [&>ol]:space-y-2 [&>ol]:pl-6 [&>p]:mb-6 [&>ul]:mb-6 [&>ul]:list-disc [&>ul]:space-y-2 [&>ul]:pl-6"
              dangerouslySetInnerHTML={{ __html: buildArticleHtml(article) }}
            />

            <div className="mt-12 flex items-center justify-between border-t border-navy-200 pt-8">
              <button className="flex items-center gap-2 font-semibold text-navy-600 transition-colors hover:text-navy-900">
                <Share2 className="h-5 w-5" />
                Bagikan Artikel
              </button>
            </div>
          </article>
        </div>
      </main>
    </div>
  )
}

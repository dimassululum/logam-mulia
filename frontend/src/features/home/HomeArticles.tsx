'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight } from 'lucide-react'
import { contentsApi } from '@/core/lib/api'

interface Article {
  id: string
  slug: string
  title: string
  excerpt?: string
  type: string
  imageUrl?: string
  createdAt?: string
}

function GoldBarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2" />
    </svg>
  )
}

export default function HomeArticles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    contentsApi.listPublic({ limit: 3, type: 'post' })
      .then(({ data }) => {
        const raw: Article[] = data.contents ?? data.data ?? []
        setArticles(raw.slice(0, 3))
      })
      .catch(() => setArticles([]))
      .finally(() => setLoading(false))
  }, [])

  if (!loading && articles.length === 0) return null

  return (
    <section className="pb-stack-lg overflow-hidden">
      <div className="container-main">
        <h2 className="section-heading mb-stack-md">Wawasan Investasi</h2>
      </div>

      <div className="container-main">
        <div className="flex gap-gutter overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <article key={i} className="min-w-[85%] md:min-w-[30%] snap-center card-surface rounded-2xl overflow-hidden flex flex-col animate-pulse">
                  <div className="aspect-video bg-navy-100" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-navy-100 rounded w-3/4" />
                    <div className="h-3 bg-navy-100 rounded w-full" />
                    <div className="h-3 bg-navy-100 rounded w-2/3" />
                  </div>
                </article>
              ))
            : articles.map((article) => (
                <article
                  key={article.slug}
                  className="min-w-[85%] md:min-w-[30%] snap-center card-surface rounded-2xl overflow-hidden flex flex-col shadow-elevation-mid"
                >
                  <div className="relative aspect-video bg-gradient-to-br from-navy-900 to-navy-800 flex items-center justify-center overflow-hidden">
                    {article.imageUrl ? (
                      <Image
                        src={article.imageUrl}
                        alt={article.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 85vw, 30vw"
                      />
                    ) : (
                      <GoldBarIcon className="w-12 h-12 text-gold-400/40" />
                    )}
                    <div className="absolute top-4 left-4 z-10">
                      <span className="bg-navy-900/80 backdrop-blur-md text-gold-400 text-[8px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                        Artikel
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="text-[17px] font-bold text-navy-900 mb-stack-sm leading-tight">
                      {article.title}
                    </h3>
                    <p className="text-navy-600 text-xs line-clamp-2 mb-stack-md flex-grow">
                      {article.excerpt ?? ''}
                    </p>
                    <Link
                      href={`/articles/${article.slug}`}
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
  )
}

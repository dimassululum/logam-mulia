'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/core/lib/utils'
import { bannersApi } from '@/core/lib/api'

interface Banner {
  id: string
  title: string
  imageUrl: string
  linkUrl?: string
  isActive: boolean
  order: number
}

const FALLBACK_BANNERS = [
  { id: '1', title: 'Promo Beli Emas Online', imageUrl: '/images/banner-1.png', isActive: true, order: 1 },
  { id: '2', title: 'Gempita Hari Raya',      imageUrl: '/images/banner-2.png', isActive: true, order: 2 },
  { id: '3', title: 'Simfoni Ibu Pertiwi',    imageUrl: '/images/banner-3.jpg', isActive: true, order: 3 },
]

export default function BannerSlider() {
  const [banners,      setBanners]      = useState<Banner[]>(FALLBACK_BANNERS)
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bannersApi.listPublic()
      .then(({ data }) => {
        const raw: Banner[] = data.banners ?? data.data ?? []
        if (raw.length > 0) setBanners(raw)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (banners.length <= 1) return
    const interval = setInterval(() => {
      if (!scrollRef.current) return
      const nextIndex = (currentIndex + 1) % banners.length
      const child = scrollRef.current.children[nextIndex] as HTMLElement
      if (child) {
        scrollRef.current.scrollTo({ left: child.offsetLeft, behavior: 'smooth' })
        setCurrentIndex(nextIndex)
      }
    }, 4000)
    return () => clearInterval(interval)
  }, [currentIndex, banners.length])

  const handleScroll = () => {
    if (!scrollRef.current) return
    const newIndex = Math.round(scrollRef.current.scrollLeft / scrollRef.current.offsetWidth)
    if (newIndex !== currentIndex) setCurrentIndex(newIndex)
  }

  const goTo = (idx: number) => {
    if (!scrollRef.current) return
    const child = scrollRef.current.children[idx] as HTMLElement
    if (child) {
      scrollRef.current.scrollTo({ left: child.offsetLeft, behavior: 'smooth' })
      setCurrentIndex(idx)
    }
  }

  return (
    <div className="relative w-full group">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar rounded-2xl shadow-elevation-mid scroll-smooth"
      >
        {banners.map((banner) => (
          <div key={banner.id} className="w-full flex-none snap-center relative">
            {banner.linkUrl ? (
              <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-auto rounded-2xl shadow-elevation-mid"
                />
              </a>
            ) : (
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="w-full h-auto rounded-2xl shadow-elevation-mid"
              />
            )}
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10 bg-navy-900/60 backdrop-blur-md px-4 py-2 rounded-full shadow-elevation-low">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                idx === currentIndex ? 'w-6 bg-gold-400' : 'w-1.5 bg-white/50 hover:bg-white/80',
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

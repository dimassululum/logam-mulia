'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/core/lib/utils'
import type { HomeBanner } from '@/features/home/home-api'

export default function BannerSlider({ banners = [] }: { banners?: HomeBanner[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const visibleBanners = banners.filter((banner) => banner.imageUrl)

  if (visibleBanners.length === 0) return null

  useEffect(() => {
    const interval = setInterval(() => {
      if (!scrollRef.current) return

      const nextIndex = (currentIndex + 1) % visibleBanners.length
      const container = scrollRef.current
      const child = container.children[nextIndex] as HTMLElement

      if (child) {
        container.scrollTo({
          left: child.offsetLeft,
          behavior: 'smooth'
        })
        setCurrentIndex(nextIndex)
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [currentIndex, visibleBanners.length])

  const handleScroll = () => {
    if (!scrollRef.current) return
    const container = scrollRef.current
    const scrollPosition = container.scrollLeft
    const width = container.offsetWidth
    const newIndex = Math.round(scrollPosition / width)

    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex)
    }
  }

  return (
    <div className="relative w-full group">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar rounded-2xl shadow-elevation-mid scroll-smooth"
      >
        {visibleBanners.map((banner) => (
          <div key={banner.id} className="w-full flex-none snap-center relative">
            <img
              src={banner.imageUrl}
              alt={banner.title}
              className="w-full h-auto rounded-2xl shadow-elevation-mid"
            />
          </div>
        ))}
      </div>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10 bg-navy-900/60 backdrop-blur-md px-4 py-2 rounded-full shadow-elevation-low">
        {visibleBanners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (scrollRef.current) {
                const child = scrollRef.current.children[idx] as HTMLElement
                if (child) {
                  scrollRef.current.scrollTo({ left: child.offsetLeft, behavior: 'smooth' })
                  setCurrentIndex(idx)
                }
              }
            }}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              idx === currentIndex ? "w-6 bg-gold-400" : "w-1.5 bg-white/50 hover:bg-white/80"
            )}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

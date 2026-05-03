'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { cn } from '@/core/lib/utils'

const banners = [
  { id: 1, src: '/images/banner-1.png', alt: 'Promo Beli Emas Online' },
  { id: 2, src: '/images/banner-2.png', alt: 'Gempita Hari Raya' },
  { id: 3, src: '/images/banner-3.jpg', alt: 'Simfoni Ibu Pertiwi' },
]

export default function BannerSlider() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      if (!scrollRef.current) return
      
      const nextIndex = (currentIndex + 1) % banners.length
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
  }, [currentIndex])

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
        {banners.map((banner) => (
          <div key={banner.id} className="w-full flex-none snap-center relative">
            <img 
              src={banner.src} 
              alt={banner.alt}
              className="w-full h-auto rounded-2xl shadow-elevation-mid"
            />
          </div>
        ))}
      </div>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10 bg-navy-900/60 backdrop-blur-md px-4 py-2 rounded-full shadow-elevation-low">
        {banners.map((_, idx) => (
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

'use client'

import { useState, useRef, useEffect } from 'react'
import { Product } from '@/core/types'
import ProductCard from './ProductCard'
import { ProductCardSkeleton } from '@/shared/ui/Skeleton'
import { Search, ListFilter, Check } from 'lucide-react'
import { addProductToCart } from '@/features/cart/cart-storage'

interface ProductListProps {
  products: Product[]
  isLoading?: boolean
}

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Terbaru'         },
  { value: 'bestseller', label: 'Terlaris'         },
  { value: 'price-desc', label: 'Harga Tertinggi'  },
  { value: 'price-asc',  label: 'Harga Terendah'   },
]

export default function ProductList({ products, isLoading }: ProductListProps) {
  const [search,        setSearch]        = useState('')
  const [category,      setCategory]      = useState('all')
  const [sort,          setSort]          = useState('newest')
  const [sortOpen,      setSortOpen]      = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)
  const categories = [
    { value: 'all', label: 'Semua' },
    ...Array.from(new Set(products.map((product) => product.category).filter(Boolean))).map((name) => ({
      value: name,
      label: name,
    })),
  ]

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const filtered = products
    .filter((p) => category === 'all' || p.category === category)
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'price-asc')  return a.totalPrice - b.totalPrice
      if (sort === 'price-desc') return b.totalPrice - a.totalPrice
      // bestseller & newest use default order for now
      return 0
    })

  return (
    <section>
      {/* Search Bar */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400 pointer-events-none" />
        <input
          id="product-search"
          type="text"
          placeholder="Cari koleksi emas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-navy-200 rounded-2xl text-sm text-navy-900 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all shadow-sm"
        />
      </div>

      {/* Category Tabs */}
      <div className="mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar" role="tablist">
          {categories.map((cat) => (
            <button
              key={cat.value}
              role="tab"
              id={`tab-${cat.value}`}
              aria-selected={category === cat.value}
              onClick={() => setCategory(cat.value)}
              className={[
                'flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-full border transition-all duration-200',
                category === cat.value
                  ? 'bg-[#D4A84B] text-navy-900 border-[#D4A84B] shadow-sm'
                  : 'bg-white text-navy-600 border-navy-200 hover:border-[#D4A84B] hover:text-navy-900',
              ].join(' ')}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action Row: Sort Dropdown */}
      <div className="flex justify-end items-center mb-6 relative" ref={sortRef}>
        <button
          onClick={() => setSortOpen(prev => !prev)}
          className="flex items-center gap-2 text-sm font-medium text-navy-500 hover:text-navy-900 transition-colors"
          aria-haspopup="listbox"
          aria-expanded={sortOpen}
        >
          <ListFilter className="w-4 h-4" />
          Urutkan
        </button>

        {sortOpen && (
          <div className="absolute right-0 top-[calc(100%+8px)] z-30 bg-white border border-navy-200 rounded-xl shadow-lg overflow-hidden min-w-[180px] animate-in">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setSort(opt.value); setSortOpen(false) }}
                className={[
                  'w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors',
                  sort === opt.value
                    ? 'bg-gold-50 text-gold-700 font-semibold'
                    : 'text-navy-700 hover:bg-navy-50',
                ].join(' ')}
              >
                {opt.label}
                {sort === opt.value && <Check className="w-4 h-4 text-gold-500" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-navy-400">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-navy-600">Produk tidak ditemukan</p>
          <p className="text-sm mt-1">Coba kata kunci atau kategori yang berbeda</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={(p) => addProductToCart(p)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

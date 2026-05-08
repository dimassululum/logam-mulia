'use client'

import { useEffect, useState, useCallback } from 'react'
import ProductList from './ProductList'
import { productsApi } from '@/core/lib/api'
import type { Product } from '@/core/types'

interface ApiProduct {
  id: string
  name: string
  slug: string
  description?: string
  price: number
  weightGram: number
  stock: number
  images?: { imageUrl: string; isPrimary: boolean; url?: string }[]
  category?: { name: string; slug: string }
  kadar?: string
  createdAt: string
  updatedAt: string
}

function mapApiProduct(p: ApiProduct): Product {
  const primaryImage =
    p.images?.find((i) => i.isPrimary)?.imageUrl ??
    p.images?.find((i) => i.isPrimary)?.url ??
    p.images?.[0]?.imageUrl ??
    p.images?.[0]?.url ?? ''
  const weightGram   = Number(p.weightGram) || 1
  const totalPrice   = Number(p.price)
  const pricePerGram = weightGram > 0 ? totalPrice / weightGram : totalPrice

  const categorySlug = p.category?.slug ?? ''
  const categoryName = p.category?.name ?? ''
  const category: Product['category'] =
    (categorySlug.includes('perhiasan') || categoryName.toLowerCase().includes('perhiasan')) ? 'perhiasan' :
    (categorySlug.includes('koin')      || categoryName.toLowerCase().includes('koin'))      ? 'koin'      : 'batangan'

  return {
    id:           p.id,
    name:         p.name,
    slug:         p.slug,
    description:  p.description ?? '',
    pricePerGram,
    weightGram,
    totalPrice,
    stock:        p.stock,
    imageUrl:     primaryImage,
    category,
    purity:       p.kadar ?? '24K',
    createdAt:    p.createdAt,
    updatedAt:    p.updatedAt,
  }
}

export default function ProductsClientPage() {
  const [products,  setProducts]  = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data } = await productsApi.list({ limit: 100 })
      const raw: ApiProduct[] = data.products ?? data.data ?? []
      setProducts(raw.map(mapApiProduct))
    } catch {
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  return <ProductList products={products} isLoading={isLoading} />
}

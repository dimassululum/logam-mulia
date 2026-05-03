import type { Metadata } from 'next'
import ProductList from '@/features/products/ProductList'
import { Product } from '@/core/types'

export const metadata: Metadata = {
  title:       'Katalog Produk Emas | Logam Mulia Antam',
  description: 'Temukan emas batangan, perhiasan, dan koin emas bersertifikat ANTAM. Harga transparan dan terjamin keasliannya.',
}

// ── Mock data — replace with API fetch (React Query / server fetch) ───────────
const MOCK_PRODUCTS: Product[] = [
  {
    id: '1', name: 'Emas Antam 1g', slug: 'emas-antam-1g',
    description: 'Logam mulia Antam 1 gram kemurnian 24K dalam kemasan CertiCard.',
    pricePerGram: 1145000, weightGram: 1, totalPrice: 1145000, stock: 50,
    imageUrl: '', category: 'batangan', purity: '99.99%',
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  {
    id: '2', name: 'Emas Antam 5g', slug: 'emas-antam-5g',
    description: 'Logam mulia Antam 5 gram kemurnian 24K.',
    pricePerGram: 1097000, weightGram: 5, totalPrice: 5485000, stock: 30,
    imageUrl: '', category: 'batangan', purity: '99.99%',
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  {
    id: '3', name: 'Emas Antam 10g', slug: 'emas-antam-10g',
    description: 'Logam mulia Antam 10 gram kemurnian 24K dalam kemasan CertiCard premium.',
    pricePerGram: 1098500, weightGram: 10, totalPrice: 10985000, stock: 20,
    imageUrl: '', category: 'batangan', purity: '99.99%',
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  {
    id: '4', name: 'Emas Antam 25g', slug: 'emas-antam-25g',
    description: 'Logam mulia Antam 25 gram kemurnian 24K.',
    pricePerGram: 1088000, weightGram: 25, totalPrice: 27200000, stock: 10,
    imageUrl: '', category: 'batangan', purity: '99.99%',
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  {
    id: '5', name: 'Emas Antam 50g', slug: 'emas-antam-50g',
    description: 'Logam mulia Antam 50 gram kemurnian 24K.',
    pricePerGram: 1082000, weightGram: 50, totalPrice: 54100000, stock: 5,
    imageUrl: '', category: 'batangan', purity: '99.99%',
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  {
    id: '6', name: 'Emas Antam 100g', slug: 'emas-antam-100g',
    description: 'Logam mulia Antam 100 gram kemurnian 24K.',
    pricePerGram: 1079000, weightGram: 100, totalPrice: 107900000, stock: 3,
    imageUrl: '', category: 'batangan', purity: '99.99%',
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  {
    id: '7', name: 'Cincin Emas 18K', slug: 'cincin-emas-18k',
    description: 'Cincin emas 18K elegan untuk hadiah dan koleksi.',
    pricePerGram: 950000, weightGram: 3, totalPrice: 2850000, stock: 15,
    imageUrl: '', category: 'perhiasan', purity: '75%',
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  {
    id: '8', name: 'Gift Series 0.5g', slug: 'gift-series-0-5g',
    description: 'Emas seri hadiah 0.5 gram dalam kemasan gift box premium.',
    pricePerGram: 1300000, weightGram: 0.5, totalPrice: 650000, stock: 100,
    imageUrl: '', category: 'koin', purity: '99.99%',
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
]

export default function ProductsPage() {
  return (
    <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-md">
      <ProductList products={MOCK_PRODUCTS} />
    </div>
  )
}

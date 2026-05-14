
import type { Metadata } from 'next'
import ProductList from '@/features/products/ProductList'
import { getStorefrontProducts } from '@/features/products/product-api'

export const metadata: Metadata = {
  title:       'Katalog Produk Emas | Logam Mulia Antam',
  description: 'Temukan emas batangan, perhiasan, dan koin emas bersertifikat ANTAM. Harga transparan dan terjamin keasliannya.',
}

export default async function ProductsPage() {
  const products = await getStorefrontProducts()

  return (
    <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-md">
      {products.length === 0 ? (
        <div className="text-center py-20">Belum ada produk atau gagal memuat dari server.</div>
      ) : (
        <ProductList products={products} />
      )}
    </div>
  )
}

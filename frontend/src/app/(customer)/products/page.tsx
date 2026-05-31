
import type { Metadata } from 'next'
import ProductList from '@/features/products/ProductList'
import { getStorefrontProducts, getStorefrontVouchers } from '@/features/products/product-api'

export const metadata: Metadata = {
  title:       'Katalog Produk Emas | Logam Mulia Antam',
  description: 'Temukan emas batangan, perhiasan, dan koin emas bersertifikat ANTAM. Harga transparan dan terjamin keasliannya.',
}

export default async function ProductsPage() {
  const [products, vouchers] = await Promise.all([
    getStorefrontProducts(),
    getStorefrontVouchers(),
  ])

  return (
    <div className="mx-auto w-full max-w-7xl overflow-x-hidden px-margin-mobile py-stack-md md:px-margin-desktop">
      {products.length === 0 ? (
        <div className="text-center py-20">Belum ada produk atau gagal memuat dari server.</div>
      ) : (
        <ProductList products={products} vouchers={vouchers} />
      )}
    </div>
  )
}

import type { Metadata } from 'next'
import ProductsClientPage from '@/features/products/ProductsClientPage'

export const metadata: Metadata = {
  title:       'Katalog Produk Emas | Logam Mulia Antam',
  description: 'Temukan emas batangan, perhiasan, dan koin emas bersertifikat ANTAM. Harga transparan dan terjamin keasliannya.',
}

export default function ProductsPage() {
  return (
    <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-md">
      <ProductsClientPage />
    </div>
  )
}

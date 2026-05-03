import { notFound } from 'next/navigation'
import ProductFormScreen from '@/features/admin/ProductFormScreen'
import { adminProductRecords } from '@/features/admin/admin-management-data'

export default function AdminEditProductPage({ params }: { params: { id: string } }) {
  const product = adminProductRecords.find((item) => item.id === params.id)

  if (!product) {
    notFound()
  }

  return <ProductFormScreen productId={params.id} />
}

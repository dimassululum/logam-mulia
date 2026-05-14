import ProductFormScreen from '@/features/admin/ProductFormScreen'

export default function AdminEditProductPage({ params }: { params: { id: string } }) {
  return <ProductFormScreen productId={params.id} />
}

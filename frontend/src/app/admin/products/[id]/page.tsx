import ProductDetailScreen from '@/features/admin/ProductDetailScreen'

export default function AdminProductDetailPage({ params }: { params: { id: string } }) {
  return <ProductDetailScreen productId={params.id} />
}

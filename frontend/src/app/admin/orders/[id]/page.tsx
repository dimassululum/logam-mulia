import OrderDetailScreen from '@/features/admin/OrderDetailScreen'

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  return <OrderDetailScreen orderId={params.id} />
}

import OrderDetailLoader from '@/features/admin/OrderDetailLoader'

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  return <OrderDetailLoader orderId={params.id} />
}

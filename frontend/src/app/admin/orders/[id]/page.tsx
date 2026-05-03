import { notFound } from 'next/navigation'
import {
  getAdminOrderDetailRecord,
} from '@/features/admin/admin-management-data'
import OrderDetailScreen from '@/features/admin/OrderDetailScreen'

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const order = getAdminOrderDetailRecord(params.id)

  if (!order) {
    notFound()
  }

  return <OrderDetailScreen initialOrder={order} />
}

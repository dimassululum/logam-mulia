import { notFound } from 'next/navigation'
import VoucherFormScreen from '@/features/admin/VoucherFormScreen'
import { adminVoucherRecords } from '@/features/admin/admin-management-data'

export default function AdminVoucherDetailPage({ params }: { params: { id: string } }) {
  const voucher = adminVoucherRecords.find((item) => item.id === params.id)

  if (!voucher) {
    notFound()
  }

  return <VoucherFormScreen mode="detail" voucherId={params.id} />
}

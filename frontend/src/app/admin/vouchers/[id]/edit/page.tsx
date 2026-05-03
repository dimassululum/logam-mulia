import { notFound } from 'next/navigation'
import VoucherFormScreen from '@/features/admin/VoucherFormScreen'
import { adminVoucherRecords } from '@/features/admin/admin-management-data'

export default function AdminEditVoucherPage({ params }: { params: { id: string } }) {
  const voucher = adminVoucherRecords.find((item) => item.id === params.id)

  if (!voucher || voucher.status === 'active') {
    notFound()
  }

  return <VoucherFormScreen mode="edit" voucherId={params.id} />
}

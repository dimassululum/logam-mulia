import VoucherFormScreen from '@/features/admin/VoucherFormScreen'

export default function AdminVoucherDetailPage({ params }: { params: { id: string } }) {
  return <VoucherFormScreen mode="detail" voucherId={params.id} />
}

import VoucherFormScreen from '@/features/admin/VoucherFormScreen'

export default function AdminEditVoucherPage({ params }: { params: { id: string } }) {
  return <VoucherFormScreen mode="edit" voucherId={params.id} />
}

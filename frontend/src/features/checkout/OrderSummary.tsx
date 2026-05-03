import { CartItem } from '@/core/types'
import { formatRupiah } from '@/core/lib/utils'
import Image from 'next/image'

interface OrderSummaryProps {
  items: CartItem[]
  shippingCost?: number
  discount?: number
}

export default function OrderSummary({ items, shippingCost = 0, discount = 0 }: OrderSummaryProps) {
  const subtotal = items.reduce((acc, i) => acc + i.product.totalPrice * i.quantity, 0)
  const total    = subtotal + shippingCost - discount

  return (
    <div className="bg-white rounded-2xl border border-[#d2c5b1] overflow-hidden">
      {/* Header */}
      <div className="bg-navy-900 px-6 py-4">
        <h3 className="font-heading text-sm font-bold text-gold-400 uppercase tracking-widest">
          Ringkasan Pesanan
        </h3>
      </div>

      {/* Items */}
      <div className="divide-y divide-[#edeeef]">
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="flex gap-3 px-6 py-4 items-center">
            <div className="w-14 h-14 flex-shrink-0 bg-[#f3f4f5] rounded-lg overflow-hidden border border-[#d2c5b1]">
              <Image
                src={product.imageUrl || '/images/placeholder-gold.png'}
                alt={product.name}
                width={56}
                height={56}
                className="object-contain w-full h-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-navy-900 truncate">{product.name}</p>
              <p className="text-xs text-[#4e4637] mt-0.5">
                {product.weightGram}g · {product.purity}
              </p>
              <p className="text-xs text-[#4e4637]">Qty: {quantity}</p>
            </div>
            <p className="text-sm font-bold text-navy-900 flex-shrink-0">
              {formatRupiah(product.totalPrice * quantity)}
            </p>
          </div>
        ))}
      </div>

      {/* Pricing breakdown */}
      <div className="px-6 py-4 border-t border-[#edeeef] space-y-2">
        <div className="flex justify-between text-sm text-[#4e4637]">
          <span>Subtotal</span>
          <span>{formatRupiah(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-[#4e4637]">
          <span>Ongkos Kirim</span>
          <span>{shippingCost > 0 ? formatRupiah(shippingCost) : 'Dihitung saat checkout'}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Diskon</span>
            <span>- {formatRupiah(discount)}</span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="px-6 py-4 bg-[#f3f4f5] border-t border-[#d2c5b1]">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-navy-900 uppercase tracking-wide">Total</span>
          <span className="font-heading text-xl font-bold text-[#7a5900]">{formatRupiah(total)}</span>
        </div>
      </div>
    </div>
  )
}

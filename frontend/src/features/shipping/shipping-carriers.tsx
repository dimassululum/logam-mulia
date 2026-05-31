import Image from 'next/image'
import { cn } from '@/core/lib/utils'

export type ShippingCarrierCode = 'JNE' | 'JNT' | 'PAXEL'

export interface ShippingCarrier {
  code: ShippingCarrierCode
  label: string
  service: string
  price: number
  eta: string
  logoSrc: string
}

export const SHIPPING_CARRIERS: ShippingCarrier[] = [
  {
    code: 'JNE',
    label: 'JNE',
    service: 'Reguler',
    price: 15000,
    eta: '2-4 hari',
    logoSrc: '/images/shipping/jne.png',
  },
  {
    code: 'JNT',
    label: 'J&T Express',
    service: 'Reguler',
    price: 15000,
    eta: '2-4 hari',
    logoSrc: '/images/shipping/jnt.png',
  },
  {
    code: 'PAXEL',
    label: 'Paxel',
    service: 'Reguler',
    price: 50000,
    eta: '1-2 hari',
    logoSrc: '/images/shipping/paxel.png',
  },
]

export function normalizeShippingCarrierCode(value?: string | null): ShippingCarrierCode | null {
  const normalized = (value || '').trim().toUpperCase()
  if (!normalized) return null
  if (normalized.includes('J&T') || normalized === 'JNT') return 'JNT'
  if (normalized.includes('PAXEL')) return 'PAXEL'
  if (normalized.includes('JNE')) return 'JNE'
  return null
}

export function getShippingCarrier(value?: string | null) {
  const code = normalizeShippingCarrierCode(value)
  return SHIPPING_CARRIERS.find((carrier) => carrier.code === code) ?? null
}

export function ShippingCarrierLogo({
  carrier,
  className,
  showLabel = false,
}: {
  carrier?: string | null
  className?: string
  showLabel?: boolean
}) {
  const data = getShippingCarrier(carrier)
  if (!data) return null

  return (
    <span className={cn('inline-flex h-8 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-navy-100 bg-white p-1 shadow-sm', showLabel && 'gap-2 px-2', className)}>
      <Image src={data.logoSrc} alt={`${data.label} logo`} width={96} height={56} className="h-full w-full object-contain" />
      {showLabel ? <span className="shrink-0 text-xs font-bold text-navy-800">{data.label}</span> : null}
    </span>
  )
}

export function ShippingCarrierLabel({
  carrier,
  className,
}: {
  carrier?: string | null
  className?: string
}) {
  const data = getShippingCarrier(carrier)
  if (!data) return <span className={className}>{carrier || '-'}</span>

  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2', className)}>
      <ShippingCarrierLogo carrier={data.code} />
      <span className="min-w-0 truncate">{data.label}</span>
    </span>
  )
}

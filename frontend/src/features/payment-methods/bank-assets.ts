import type { StaticImageData } from 'next/image'
import bcaLogo from '@/app/admin/payment-methods/bca.png'
import bniLogo from '@/app/admin/payment-methods/bni.png'
import briLogo from '@/app/admin/payment-methods/bri.png'
import btnLogo from '@/app/admin/payment-methods/btn.png'
import mandiriLogo from '@/app/admin/payment-methods/mandiri.png'

export const BANK_OPTIONS = ['BRI', 'BNI', 'MANDIRI', 'BCA', 'BTN'] as const

export type BankOption = typeof BANK_OPTIONS[number]

const BANK_LOGOS: Record<BankOption, StaticImageData> = {
  BRI: briLogo,
  BNI: bniLogo,
  MANDIRI: mandiriLogo,
  BCA: bcaLogo,
  BTN: btnLogo,
}

export function normalizeBankName(bankName?: string | null): BankOption | null {
  const normalized = (bankName || '').trim().toUpperCase()
  return BANK_OPTIONS.includes(normalized as BankOption) ? (normalized as BankOption) : null
}

export function getBankLogo(bankName?: string | null) {
  const bank = normalizeBankName(bankName)
  return bank ? BANK_LOGOS[bank] : null
}

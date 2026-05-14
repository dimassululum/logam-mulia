export const DEFAULT_WHATSAPP_PHONE = '6281212345678'

export function normalizeWhatsAppPhone(value: string | null | undefined) {
  const raw = String(value || '').trim()
  if (!raw) return DEFAULT_WHATSAPP_PHONE

  const waMatch = raw.match(/(?:wa\.me\/|phone=)(\d+)/i)
  const numeric = (waMatch?.[1] || raw).replace(/[^\d+]/g, '')

  if (numeric.startsWith('+62')) return `62${numeric.slice(3)}`
  if (numeric.startsWith('62')) return numeric
  if (numeric.startsWith('0')) return `62${numeric.slice(1)}`

  return numeric || DEFAULT_WHATSAPP_PHONE
}

export function formatLocalWhatsAppPhone(value: string | null | undefined) {
  const normalized = normalizeWhatsAppPhone(value)
  if (normalized.startsWith('62')) return `0${normalized.slice(2)}`
  return normalized
}

export function buildWhatsAppLink(value: string | null | undefined, message?: string) {
  const phone = normalizeWhatsAppPhone(value)
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${phone}${text}`
}

export function isValidWhatsAppPhone(value: string) {
  const normalized = normalizeWhatsAppPhone(value)
  return /^62[1-9]\d{7,14}$/.test(normalized)
}

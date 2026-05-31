const DEFAULT_PUBLIC_API_URL = '/api'
const DEFAULT_INTERNAL_API_ORIGIN = 'http://backend:5000'

function normalizeApiBaseUrl(value: string) {
  const normalized = value.trim().replace(/\/+$/, '')
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`
}

function resolveInternalApiBaseUrl() {
  const internalOrigin = process.env.INTERNAL_API_ORIGIN?.trim().replace(/\/+$/, '') || DEFAULT_INTERNAL_API_ORIGIN
  return `${internalOrigin}/api`
}

export function resolvePublicApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_PUBLIC_API_URL

  if (configuredUrl.startsWith('/')) {
    return typeof window === 'undefined' ? resolveInternalApiBaseUrl() : normalizeApiBaseUrl(configuredUrl)
  }

  return normalizeApiBaseUrl(configuredUrl)
}

function getPublicApiAssetBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_PUBLIC_API_URL
  return normalizeApiBaseUrl(configuredUrl)
}

function getApiAssetOrigin() {
  const configuredUrl = getPublicApiAssetBaseUrl()

  try {
    const url = new URL(configuredUrl)
    if (url.pathname === '/api' || url.pathname.endsWith('/api')) {
      url.pathname = url.pathname.replace(/\/api$/, '') || '/'
    }

    return `${url.origin}${url.pathname.replace(/\/+$/, '')}`
  } catch {
    return ''
  }
}

function isLocalUploadUrl(url: URL) {
  return (url.hostname === 'localhost' || url.hostname === '127.0.0.1') && url.pathname.includes('/uploads/')
}

export function resolvePublicAssetUrl(value?: string | null) {
  const rawValue = value?.trim()
  if (!rawValue) return ''

  if (
    rawValue.startsWith('data:') ||
    rawValue.startsWith('blob:') ||
    rawValue.startsWith('/images/') ||
    rawValue.startsWith('/videos/')
  ) {
    return rawValue
  }

  const apiAssetOrigin = getApiAssetOrigin()
  if (rawValue.startsWith('/uploads/')) return `${apiAssetOrigin}${rawValue}`
  if (rawValue.startsWith('/api/uploads/')) return `${apiAssetOrigin}${rawValue.replace(/^\/api\/uploads\//, '/uploads/')}`

  try {
    const url = new URL(rawValue)
    if (url.pathname.startsWith('/api/uploads/')) {
      url.pathname = url.pathname.replace(/^\/api\/uploads\//, '/uploads/')
      return `${apiAssetOrigin}${url.pathname}`
    }

    if (isLocalUploadUrl(url)) {
      url.pathname = url.pathname.replace(/^\/api\/uploads\//, '/uploads/')
      return `${apiAssetOrigin}${url.pathname}`
    }

    return url.toString()
  } catch {
    return rawValue
  }
}

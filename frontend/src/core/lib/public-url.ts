const DEFAULT_API_URL = 'http://localhost:5000/api'

export function resolvePublicApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, '') || DEFAULT_API_URL
  return configuredUrl.endsWith('/api') ? configuredUrl : `${configuredUrl}/api`
}

function getApiAssetOrigin() {
  const configuredUrl = resolvePublicApiBaseUrl()

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
    }

    if (isLocalUploadUrl(url) && apiAssetOrigin) {
      const apiUrl = new URL(apiAssetOrigin)
      url.protocol = apiUrl.protocol
      url.host = apiUrl.host
      url.pathname = url.pathname.replace(/^\/api\/uploads\//, '/uploads/')
    }

    return url.toString()
  } catch {
    return rawValue
  }
}

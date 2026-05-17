'use client'

import { useEffect, useState } from 'react'
import { buildWhatsAppLink, DEFAULT_WHATSAPP_PHONE } from '@/core/lib/contact'
import { resolvePublicApiBaseUrl } from '@/core/lib/public-url'

const API_URL = resolvePublicApiBaseUrl()

export function useCompanyWhatsAppLink(message?: string) {
  const [phone, setPhone] = useState(DEFAULT_WHATSAPP_PHONE)

  useEffect(() => {
    let isMounted = true

    async function loadContact() {
      try {
        const res = await fetch(`${API_URL}/company-profile`)
        if (!res.ok) return

        const json = await res.json()
        const value = json.data?.footer_whatsapp_contact?.value
        if (isMounted && value) setPhone(value)
      } catch (error) {
        console.error('Error fetching company WhatsApp contact', error)
      }
    }

    loadContact()

    return () => {
      isMounted = false
    }
  }, [])

  return buildWhatsAppLink(phone, message)
}

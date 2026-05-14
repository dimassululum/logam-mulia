'use client'

import { useEffect, useState } from 'react'
import { buildWhatsAppLink, DEFAULT_WHATSAPP_PHONE } from '@/core/lib/contact'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

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

'use client'

import { MessageCircle } from 'lucide-react'
import Button from '@/shared/ui/Button'
import { useCompanyWhatsAppLink } from '@/features/company/useCompanyContact'

export default function OrderWhatsappButton({ orderId }: { orderId: string }) {
  const waLink = useCompanyWhatsAppLink(`Halo admin, saya ingin bertanya tentang pesanan ${orderId}.`)

  return (
    <a href={waLink} target="_blank" rel="noreferrer" className="block">
      <Button variant="primary" size="lg" fullWidth className="bg-[#25D366] hover:bg-[#128C7E] border-none text-white">
        <MessageCircle className="w-5 h-5" />
        Hubungi Admin
      </Button>
    </a>
  )
}

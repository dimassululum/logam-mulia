"use client"

import { useState } from 'react'
import Image from 'next/image'
import { MapPin } from 'lucide-react'
import HowToBuyModal from '@/shared/ui/HowToBuyModal'
import type { HomeFooterProfile } from '@/features/home/home-api'
import { buildWhatsAppLink } from '@/core/lib/contact'

const defaultFooterProfile: HomeFooterProfile = {
  companyName: '',
  companyDescription: '',
  companyLogoPreview: '',
  address: '',
  googleMapsLink: '',
  whatsAppContact: '',
  socialMedia: [],
}

export default function Footer({ profile = defaultFooterProfile }: { profile?: HomeFooterProfile }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const activeSocialMedia = profile.socialMedia.filter((item) => item.status === 'active' && item.link)
  const hasCustomLogo = profile.companyLogoPreview && profile.companyLogoPreview !== '/images/logo.png'

  return (
    <footer className="bg-[#2a4066] text-white border-t border-navy-800">
      <div className="container-main py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Brand & Desc */}
          <div className="lg:col-span-1">
            {hasCustomLogo ? (
              <div className="mb-4 flex h-14 w-32 items-center">
                <img src={profile.companyLogoPreview} alt={profile.companyName} className="max-h-14 max-w-32 object-contain" />
              </div>
            ) : null}
            <h2 className="text-[24px] font-heading font-bold text-gold-400 mb-4">
              {profile.companyName}
            </h2>
            <p className="text-sm text-gray-300 max-w-xl leading-relaxed">
              {profile.companyDescription}
            </p>
          </div>

          {/* Tautan Cepat */}
          <div>
            <h3 className="font-bold text-gold-400 mb-4 text-[16px]">Tautan Cepat</h3>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => setIsModalOpen(true)} 
                  className="text-sm text-gray-300 hover:text-white bg-transparent border-none p-0 cursor-pointer text-left [transition-duration:var(--transition-fast)] transition-colors"
                >
                  Cara Pembelian
                </button>
              </li>
              <li>
                <a href={buildWhatsAppLink(profile.whatsAppContact, 'Halo admin, saya ingin bertanya.')} target="_blank" rel="noreferrer" className="text-sm text-gray-300 hover:text-white [transition-duration:var(--transition-fast)] transition-colors">
                  Hubungi Kami
                </a>
              </li>
            </ul>
          </div>

          {/* Alamat */}
          <div>
            <h3 className="font-bold text-gold-400 mb-4 text-[16px]">Alamat</h3>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-white text-sm mb-1">{profile.companyName}</h4>
                <a
                  href={profile.googleMapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-gray-300 leading-relaxed hover:text-white [transition-duration:var(--transition-fast)] transition-colors"
                >
                  {profile.address}
                </a>
              </div>
            </div>
            {activeSocialMedia.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {activeSocialMedia.map((item) => (
                  <a
                    key={item.id}
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-gray-200 transition-colors [transition-duration:var(--transition-fast)] hover:border-gold-400 hover:text-white"
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          {/* Akreditasi & Keamanan */}
          <div>
            <div className="mb-6">
              <h3 className="font-bold text-gold-400 mb-3 text-[16px]">Akreditasi</h3>
              <div className="flex items-center gap-4">
                <Image src="/images/lbma.png" alt="LBMA" width={80} height={40} className="object-contain h-10 w-auto" />
                <Image src="/images/kan.png" alt="KAN" width={80} height={40} className="object-contain h-10 w-auto" />
                <Image src="/images/cert.png" alt="TUV" width={80} height={40} className="object-contain h-10 w-auto" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gold-400 mb-3 text-[16px]">Keamanan</h3>
              <div className="flex items-center gap-4">
                <Image src="/images/ssl.png" alt="SSL Secure Connection" width={100} height={40} className="object-contain h-10 w-auto" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Logos */}
        <div className="mt-12 pt-8 border-t border-[#3b5480] flex flex-col sm:flex-row justify-between items-center gap-6">
          <Image src="/images/lm.png" alt="Logam Mulia" width={200} height={50} className="object-contain h-12 w-auto" />
          <Image src="/images/antam.png" alt="Antam" width={150} height={40} className="object-contain h-10 w-auto" />
        </div>
      </div>
      <HowToBuyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </footer>
  )
}

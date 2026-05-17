"use client"

import { useState } from 'react'
import type { ComponentType } from 'react'
import Image from 'next/image'
import {
  ExternalLink,
  Globe2,
  MapPin,
  MessageCircle,
} from 'lucide-react'
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

type SocialIcon = ComponentType<{ className?: string }>

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="16.5" cy="7.5" r="1" fill="currentColor" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7h2.35l.35-2.72h-2.7V9.55c0-.79.22-1.33 1.35-1.33h1.44V5.79A19.22 19.22 0 0 0 14.2 5c-2.08 0-3.5 1.27-3.5 3.6v2.68H8.35V14h2.35v7h2.8Z" />
    </svg>
  )
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.58 7.2a2.73 2.73 0 0 0-1.92-1.94C17.96 4.8 12 4.8 12 4.8s-5.96 0-7.66.46A2.73 2.73 0 0 0 2.42 7.2 28.5 28.5 0 0 0 2 12a28.5 28.5 0 0 0 .42 4.8 2.73 2.73 0 0 0 1.92 1.94c1.7.46 7.66.46 7.66.46s5.96 0 7.66-.46a2.73 2.73 0 0 0 1.92-1.94A28.5 28.5 0 0 0 22 12a28.5 28.5 0 0 0-.42-4.8ZM10 15.2V8.8l5.2 3.2L10 15.2Z" />
    </svg>
  )
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.5 8.9H3.9V20h2.6V8.9ZM5.2 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM20.1 13.6c0-3-1.6-4.9-4.2-4.9a3.6 3.6 0 0 0-3.1 1.7V8.9h-2.5V20h2.6v-5.8c0-1.5.8-2.8 2.3-2.8 1.4 0 2.2.9 2.2 2.8V20h2.7v-6.4Z" />
    </svg>
  )
}

const socialIconRules: Array<{ keywords: string[]; icon: SocialIcon }> = [
  { keywords: ['instagram', 'ig'], icon: InstagramIcon },
  { keywords: ['facebook', 'fb'], icon: FacebookIcon },
  { keywords: ['youtube', 'yt'], icon: YoutubeIcon },
  { keywords: ['linkedin'], icon: LinkedinIcon },
  { keywords: ['whatsapp', 'wa'], icon: MessageCircle },
  { keywords: ['website', 'web', 'site'], icon: Globe2 },
]

function getSocialIcon(name: string) {
  const normalizedName = name.toLowerCase()
  return socialIconRules.find((rule) => rule.keywords.some((keyword) => normalizedName.includes(keyword)))?.icon ?? ExternalLink
}

export default function Footer({ profile = defaultFooterProfile }: { profile?: HomeFooterProfile }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const activeSocialMedia = profile.socialMedia.filter((item) => item.status === 'active' && item.link)
  const hasCustomLogo = profile.companyLogoPreview && profile.companyLogoPreview !== '/images/logo.png'

  return (
    <footer id="footer" className="bg-navy-900 text-white border-t border-gold-400/15">
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
            <p className="text-sm text-white/70 max-w-xl leading-relaxed">
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
                  className="text-sm text-white/70 hover:text-white bg-transparent border-none p-0 cursor-pointer text-left [transition-duration:var(--transition-fast)] transition-colors"
                >
                  Cara Pembelian
                </button>
              </li>
              <li>
                <a href={buildWhatsAppLink(profile.whatsAppContact, 'Halo admin, saya ingin bertanya.')} target="_blank" rel="noreferrer" className="text-sm text-white/70 hover:text-white [transition-duration:var(--transition-fast)] transition-colors">
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
                  className="text-sm text-white/70 leading-relaxed hover:text-white [transition-duration:var(--transition-fast)] transition-colors"
                >
                  {profile.address}
                </a>
              </div>
            </div>
            {activeSocialMedia.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2.5">
                {activeSocialMedia.map((item) => {
                  const SocialIcon = getSocialIcon(item.name)

                  return (
                    <a
                      key={item.id}
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={item.name}
                      title={item.name}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/75 transition-all [transition-duration:var(--transition-fast)] hover:border-gold-400 hover:bg-gold-400 hover:text-navy-900"
                    >
                      <SocialIcon className="h-4 w-4" />
                    </a>
                  )
                })}
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
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-8 sm:gap-6">
          <Image src="/images/lm.png" alt="Logam Mulia" width={600} height={129} className="h-auto w-[220px] max-w-[76vw] object-contain sm:w-[240px]" />
          <Image src="/images/antam.png" alt="Antam" width={600} height={174} className="h-auto w-[168px] max-w-[58vw] object-contain sm:w-[190px]" />
        </div>
      </div>
      <HowToBuyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </footer>
  )
}

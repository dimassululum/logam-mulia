"use client"

import { useState } from 'react'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import HowToBuyModal from '@/shared/ui/HowToBuyModal'

export default function Footer() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <footer className="bg-navy-100 text-navy-900 border-t border-navy-200">
      <div className="container-main py-12">
        <div className="flex flex-col gap-8">
          
          {/* Brand & Desc */}
          <div>
            <h2 className="text-[24px] font-heading font-bold text-gold-400 mb-4">
              Logam Mulia Antam
            </h2>
            <p className="text-sm text-navy-700 max-w-xl leading-relaxed">
              Distributor resmi logam mulia Antam, menyediakan solusi investasi emas yang aman dan transparan.
            </p>
          </div>

          {/* Tautan Cepat */}
          <div>
            <h3 className="font-bold text-navy-900 mb-4 text-[16px]">Tautan Cepat</h3>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => setIsModalOpen(true)} 
                  className="text-sm text-navy-700 hover:text-navy-900 bg-transparent border-none p-0 cursor-pointer text-left [transition-duration:var(--transition-fast)] transition-colors"
                >
                  Cara Pembelian
                </button>
              </li>
              <li>
                <Link href="/hubungi-kami" className="text-sm text-navy-700 hover:text-navy-900 [transition-duration:var(--transition-fast)] transition-colors">
                  Hubungi Kami
                </Link>
              </li>
            </ul>
          </div>

          {/* Alamat */}
          <div>
            <h3 className="font-bold text-navy-900 mb-4 text-[16px]">Alamat</h3>
            <div className="flex items-start gap-3 max-w-xl">
              <MapPin className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-navy-900 text-sm mb-1">PT ANTAM Tbk</h4>
                <p className="text-sm text-navy-700 leading-relaxed">
                  Unit Bisnis Pengolahan dan Pemurnian Logam Mulia Gedung Graha Dipta. Jalan Pemuda, No.1 Jatinegara Kaum, Pulo Gadung, Jakarta 13250
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
      <HowToBuyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </footer>
  )
}

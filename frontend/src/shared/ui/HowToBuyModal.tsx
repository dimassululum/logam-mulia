import { X } from 'lucide-react'
import Link from 'next/link'

interface HowToBuyModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function HowToBuyModal({ isOpen, onClose }: HowToBuyModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop Overlay */}
      <div 
        className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-[60] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Bottom Sheet Modal Container */}
      {/* z-[70] to appear above the bottom nav bar, pb-24 to avoid collision */}
      <div 
        className={`fixed bottom-0 left-0 w-full bg-white rounded-t-[24px] z-[70] shadow-[0_-8px_30px_rgba(15,27,45,0.15)] flex flex-col max-h-[85vh] transform transition-transform duration-300 ease-out translate-y-0`}
      >
        {/* Handle indicator for mobile feel */}
        <div className="w-full flex justify-center pt-3 pb-1 absolute top-0 z-10 cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1.5 bg-navy-200 rounded-full"></div>
        </div>

        {/* Modal Header */}
        <div className="bg-navy-900 pt-8 pb-5 px-6 rounded-t-[24px] flex justify-between items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-navy-900 to-[#1a2d4a] opacity-80 pointer-events-none"></div>
          <h2 className="font-heading text-2xl font-bold text-gold-400 relative z-10 m-0 leading-none tracking-wide">
            Cara Pembelian
          </h2>
          <button 
            onClick={onClose}
            aria-label="Close modal" 
            className="relative z-10 text-white hover:text-gold-400 transition-colors duration-200 p-1 -mr-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content (Steps) */}
        {/* pb-safe/pb-32 so the content isn't hidden behind the Bottom Navbar or the bottom of the screen */}
        <div className="p-6 overflow-y-auto pb-32 flex-1">
          <ol className="space-y-6 relative before:absolute before:inset-y-0 before:left-[15px] before:w-[1px] before:bg-navy-200 before:z-0">
            {/* Step 1 */}
            <li className="relative z-10 flex items-center gap-6">
              <div className="flex-shrink-0 bg-white py-1">
                <span className="font-heading text-3xl font-bold text-gold-500 leading-none block">1</span>
              </div>
              <div className="pt-0">
                <p className="text-base text-navy-900 font-medium m-0 leading-snug">Pilih produk emas yang diinginkan.</p>
              </div>
            </li>
            {/* Step 2 */}
            <li className="relative z-10 flex items-center gap-6">
              <div className="flex-shrink-0 bg-white py-1">
                <span className="font-heading text-3xl font-bold text-gold-500 leading-none block">2</span>
              </div>
              <div className="pt-0">
                <p className="text-base text-navy-900 font-medium m-0 leading-snug">Tambahkan ke keranjang & checkout.</p>
              </div>
            </li>
            {/* Step 3 */}
            <li className="relative z-10 flex items-center gap-6">
              <div className="flex-shrink-0 bg-white py-1">
                <span className="font-heading text-3xl font-bold text-gold-500 leading-none block">3</span>
              </div>
              <div className="pt-0">
                <p className="text-base text-navy-900 font-medium m-0 leading-snug">Lengkapi data pengiriman.</p>
              </div>
            </li>
            {/* Step 4 */}
            <li className="relative z-10 flex items-center gap-6">
              <div className="flex-shrink-0 bg-white py-1">
                <span className="font-heading text-3xl font-bold text-gold-500 leading-none block">4</span>
              </div>
              <div className="pt-0">
                <p className="text-base text-navy-900 font-medium m-0 leading-snug">Lakukan pembayaran via Virtual Account.</p>
              </div>
            </li>
            {/* Step 5 */}
            <li className="relative z-10 flex items-center gap-6">
              <div className="flex-shrink-0 bg-white py-1">
                <span className="font-heading text-3xl font-bold text-gold-500 leading-none block">5</span>
              </div>
              <div className="pt-0">
                <p className="text-base text-navy-900 font-medium m-0 leading-snug text-balance">Emas akan dikirim berasuransi ke alamat Anda.</p>
              </div>
            </li>
          </ol>

          <div className="mt-8 pt-6 border-t border-navy-100">
            <Link href="/products" onClick={onClose} className="block">
              <button className="w-full bg-gold-400 text-navy-900 font-semibold py-4 rounded-xl hover:brightness-105 active:scale-[0.98] shadow-low transition-all duration-200">
                Mulai Belanja
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

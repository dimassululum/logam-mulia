import Link from 'next/link'
import AppBar from '@/shared/ui/AppBar'
import Button from '@/shared/ui/Button'
import { MoreVertical, Camera, Settings } from 'lucide-react'

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-navy-50 flex flex-col font-body text-navy-900 selection:bg-gold-400 selection:text-navy-900">
      <AppBar 
        title="Profil Saya" 
        rightSlot={
          <button className="text-gold-400 hover:text-gold-300 transition-colors">
            <MoreVertical className="w-6 h-6" />
          </button>
        } 
      />
      
      <main className="flex-1 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-md md:py-stack-lg flex flex-col items-center">
        
        {/* Profile Avatar Section */}
        <section className="flex flex-col items-center w-full max-w-md mb-8">
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gold-400 text-navy-900 flex items-center justify-center text-display-md shadow-sm border border-navy-500/30 ring-4 ring-white mb-stack-sm relative">
            BS
            {/* Edit indicator */}
            <button className="absolute bottom-0 right-0 w-10 h-10 bg-gold-600 text-white rounded-full border-2 border-white shadow-sm flex items-center justify-center hover:-translate-y-0.5 transition-transform duration-300">
              <Camera className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-headline-sm text-navy-900 mt-2">Budi Santoso</h2>
        </section>

        {/* Personal Information Card */}
        <section className="w-full max-w-md bg-white border border-navy-300 rounded-xl shadow-elevation-low overflow-hidden">
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-navy-300 bg-navy-50/50">
            <h3 className="text-label-md text-navy-600 uppercase tracking-widest">Informasi Pribadi</h3>
          </div>
          
          {/* Details List */}
          <div className="flex flex-col">
            <div className="px-6 py-4 flex flex-col gap-1 border-b border-navy-300/50 last:border-0 hover:bg-navy-100/50 transition-colors duration-300">
              <span className="text-label-md text-navy-500">Nama Lengkap</span>
              <span className="text-body-lg text-navy-900 tracking-tight">Budi Santoso</span>
            </div>
            
            <div className="px-6 py-4 flex flex-col gap-1 border-b border-navy-300/50 last:border-0 hover:bg-navy-100/50 transition-colors duration-300">
              <span className="text-label-md text-navy-500">Alamat Email</span>
              <span className="text-body-lg text-navy-900 tracking-tight">budi.santoso@email.com</span>
            </div>
            
            <div className="px-6 py-4 flex flex-col gap-1 border-b border-navy-300/50 last:border-0 hover:bg-navy-100/50 transition-colors duration-300">
              <span className="text-label-md text-navy-500">No. Handphone</span>
              <span className="text-body-lg text-navy-900 tracking-tight">+62 812 3456 7890</span>
            </div>
          </div>
        </section>

        {/* Action Section */}
        <section className="w-full max-w-md mt-stack-lg">
          <Link href="/account/profile/edit" className="w-full">
            <Button variant="primary" size="lg" fullWidth className="uppercase tracking-wider">
              <Settings className="w-5 h-5 mr-2" />
              Ubah Profil
            </Button>
          </Link>
        </section>
        
      </main>
    </div>
  )
}

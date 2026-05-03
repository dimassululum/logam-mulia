import AppBar from '@/shared/ui/AppBar'
import Input from '@/shared/ui/Input'
import Button from '@/shared/ui/Button'

export default function EditProfilePage() {
  return (
    <div className="min-h-screen bg-navy-50 text-navy-900 flex flex-col items-center">
      <div className="w-full max-w-[480px] bg-white min-h-screen relative shadow-elevation-low flex flex-col">
        <AppBar 
          title="Edit Profil" 
          rightSlot={
            <button className="px-2 py-1 text-gold-400 hover:text-gold-300 transition-opacity font-semibold text-sm">
              Simpan
            </button>
          } 
        />
        
        <main className="flex-1 px-margin-mobile py-stack-lg flex flex-col gap-stack-lg">
          
          {/* Profile Avatar Section */}
          <section className="flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-navy-800 flex items-center justify-center border-2 border-white shadow-sm">
                <span className="text-display-md text-gold-400 tracking-tight">BS</span>
              </div>
            </div>
          </section>

          {/* Form Section */}
          <section className="bg-white rounded-xl border border-navy-300 p-6 shadow-elevation-low">
            <form className="flex flex-col gap-6">
              <Input 
                label="Nama Lengkap"
                id="nama_lengkap"
                type="text"
                defaultValue="Budi Santoso"
              />
              
              <Input 
                label="Alamat Email"
                id="alamat_email"
                type="email"
                defaultValue="budi.santoso@email.com"
                disabled
              />
              
              <Input 
                label="No. Handphone"
                id="no_handphone"
                type="tel"
                defaultValue="+62 812 3456 7890"
              />
            </form>
          </section>

          {/* Bottom CTA Section */}
          <section className="mt-auto pt-stack-md pb-stack-lg">
            <Button variant="primary" size="lg" fullWidth>
              Simpan Perubahan
            </Button>
          </section>

        </main>
      </div>
    </div>
  )
}

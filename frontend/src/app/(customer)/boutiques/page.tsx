import { Search, Filter, CheckCircle, MapPin, Clock, Map, XCircle, Phone, MessageCircle, TrendingUp } from 'lucide-react'
import Image from 'next/image'

export default function BoutiquesPage() {
  return (
    <div className="bg-surface min-h-screen">
      {/* Live Price Ticker */}
      <div className="bg-white border-b border-navy-200 py-2 overflow-hidden shadow-sm hidden md:block">
        <div className="container-main flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-gold-500 w-4 h-4" />
            <span className="text-xs font-semibold text-navy-600 uppercase">Harga Emas Live (1g)</span>
          </div>
          <div className="text-sm font-bold text-navy-900">Rp 1.142.000 <span className="text-xs text-navy-400 font-normal ml-1">/ g</span></div>
        </div>
      </div>

      <main className="container-main pt-stack-md pb-stack-lg">
        {/* Page Header */}
        <div className="mb-stack-md text-center md:text-left">
          <h2 className="text-display-md font-heading font-bold text-navy-900 mb-2">Lokasi Butik</h2>
          <p className="text-navy-600 text-body-lg">Temukan butik emas Antam terdekat untuk transaksi aman dan nyaman.</p>
        </div>

        {/* Search & Filter Section */}
        <section className="bg-white p-6 rounded-xl border border-navy-200 shadow-sm mb-stack-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 w-5 h-5" />
              <input 
                className="w-full pl-10 pr-4 py-3 bg-surface border border-navy-200 rounded-lg text-sm text-navy-900 focus:outline-none focus:border-navy-900 focus:ring-1 focus:ring-navy-900 transition-colors" 
                placeholder="Cari nama butik atau kota..." 
                type="text"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 w-5 h-5" />
              <select className="w-full pl-10 pr-8 py-3 bg-surface border border-navy-200 rounded-lg text-sm text-navy-900 appearance-none focus:outline-none focus:border-navy-900 focus:ring-1 focus:ring-navy-900 transition-colors">
                <option>Semua Kota</option>
                <option>Jakarta</option>
                <option>Bandung</option>
                <option>Surabaya</option>
                <option>Medan</option>
              </select>
            </div>
          </div>
        </section>

        {/* Boutique List */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <article className="card-surface overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
            <div className="h-48 bg-navy-100 relative">
              <div 
                className="w-full h-full bg-cover bg-center mix-blend-multiply opacity-90 group-hover:opacity-100 transition-opacity" 
                style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAhPmQiTLJcjFyZH7S67SkS8YEnF6RCND_wDB8XA-cLOvRARCFF17BhSi9c5q0T6Q0V4Gs36EyvDJEj8RyZkq72nZzyKeJrRVj18N-ivKDt8j2zqNS2JEsQyaEa4axiEHi2XJe_dE_lKwKxT6odx--gcL5JyVRWpOl6n0Jcyk4pNv4KEf4zXQl7H2qRnLBDI--OBKBaACOlu-HVgHXIsT1-m1VD275rk3jXiBaseZgK2cfswU6_vvs1ED9u14mDf5Uh7EC-_KFYcuG1')` }}
              />
              <div className="absolute top-3 right-3 bg-navy-900 text-gold-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-sm">
                <CheckCircle className="w-3.5 h-3.5" /> Buka
              </div>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <h3 className="font-heading text-xl font-bold text-navy-900 line-clamp-2">Butik Emas LM - Jakarta Pulo Gadung</h3>
              <div className="flex items-start gap-2">
                <MapPin className="text-navy-400 w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-sm text-navy-600 leading-relaxed">Gedung Graha Dipta, Jl. Pemuda Raya No.1, Pulo Gadung, Jakarta Timur 13210</p>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="text-navy-400 w-4 h-4 shrink-0 mt-0.5" />
                <div className="text-sm text-navy-600">
                  <p>Senin - Jumat: 08:30 - 15:00</p>
                  <p className="text-navy-400 text-xs mt-0.5">Sabtu & Minggu: Tutup</p>
                </div>
              </div>
              <button className="mt-2 w-full bg-gold-400 text-navy-900 font-semibold text-sm py-3 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all">
                <Map className="w-4 h-4" /> Lihat di Map
              </button>
            </div>
          </article>

          {/* Card 2 */}
          <article className="card-surface overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
            <div className="h-48 bg-navy-100 relative">
              <div 
                className="w-full h-full bg-cover bg-center mix-blend-multiply opacity-90 group-hover:opacity-100 transition-opacity" 
                style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBggKHY0ASxkMbgF53wGmDoiCkqY-FIdKOl8RXzCotuGqu-aw0-gKr9pFI6VrokubGSSfQWssBwyNeDs7wkI8jiQva-lRXUOdqNmkk_dMCx4ZqeiyXEbFZZ5w0iaxFK4SoItYOTsFNvS2xLdvetY50QCu-S3bayBE03sl-FrxaARzSMUEm398LwtHO7EEmsoS4gxgvrTNFeD-GE7230uggXUojCCl-Lxgj9tCGyMWTRBLoPm1-hQBnGv8gPE0Ksdc_P4C72suHq7Q1a')` }}
              />
              <div className="absolute top-3 right-3 bg-navy-100 text-navy-500 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-sm">
                <XCircle className="w-3.5 h-3.5" /> Tutup
              </div>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <h3 className="font-heading text-xl font-bold text-navy-900 line-clamp-2">Butik Emas LM - Bandung</h3>
              <div className="flex items-start gap-2">
                <MapPin className="text-navy-400 w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-sm text-navy-600 leading-relaxed">Jl. Ir. H. Juanda No.84, Lebakgede, Kecamatan Coblong, Kota Bandung 40132</p>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="text-navy-400 w-4 h-4 shrink-0 mt-0.5" />
                <div className="text-sm text-navy-600">
                  <p>Senin - Jumat: 08:30 - 15:00</p>
                  <p className="text-navy-400 text-xs mt-0.5">Sabtu & Minggu: Tutup</p>
                </div>
              </div>
              <button className="mt-2 w-full bg-gold-400 text-navy-900 font-semibold text-sm py-3 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all">
                <Map className="w-4 h-4" /> Lihat di Map
              </button>
            </div>
          </article>

          {/* Card 3 */}
          <article className="card-surface overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
            <div className="h-48 bg-navy-100 relative">
              <div 
                className="w-full h-full bg-cover bg-center mix-blend-multiply opacity-90 group-hover:opacity-100 transition-opacity" 
                style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAzOPZvN4myPfG-xGGLeOdhKJ0ssryR13MZQGCBepLRyB9-rLDUx4AcqciwwczimDcBo1kduItiMRwWAJdCpYN6h5H4_pLT0Lttvp6HEl3hgsuMIwYOrwS6mBeY9UxfTG958dMGGFUvwjpn4snw3Kkyr5t-43VTK2p5vq8L1TFKUjb4dpvUKOpdxzXSGu0x_0fSuMZs1k6XlbEIKnBq6hfjTqZ5rLqedajRP8gBzMyRbeyTNSaIQI-QUFoZsgVaA1HF_rjfHzEjl4QT')` }}
              />
              <div className="absolute top-3 right-3 bg-navy-900 text-gold-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-sm">
                <CheckCircle className="w-3.5 h-3.5" /> Buka
              </div>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <h3 className="font-heading text-xl font-bold text-navy-900 line-clamp-2">Butik Emas LM - Surabaya</h3>
              <div className="flex items-start gap-2">
                <MapPin className="text-navy-400 w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-sm text-navy-600 leading-relaxed">Jl. Darmo No.15, Keputran, Kec. Tegalsari, Kota SBY, Jawa Timur 60265</p>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="text-navy-400 w-4 h-4 shrink-0 mt-0.5" />
                <div className="text-sm text-navy-600">
                  <p>Senin - Jumat: 08:30 - 15:00</p>
                  <p className="text-navy-400 text-xs mt-0.5">Sabtu & Minggu: Tutup</p>
                </div>
              </div>
              <button className="mt-2 w-full bg-gold-400 text-navy-900 font-semibold text-sm py-3 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all">
                <Map className="w-4 h-4" /> Lihat di Map
              </button>
            </div>
          </article>
        </section>

        {/* Help Section */}
        <section className="mt-stack-lg bg-navy-900 rounded-xl p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-navy-900 to-[#1a2d4a] opacity-80 pointer-events-none"></div>
          <div className="relative z-10">
            <h2 className="font-heading text-3xl font-bold text-gold-500 mb-4">Butuh Bantuan?</h2>
            <p className="text-white/80 max-w-2xl mx-auto mb-8 text-sm md:text-base">
              Tim layanan pelanggan kami siap membantu Anda mengenai informasi lokasi butik, ketersediaan stok, atau prosedur transaksi logam mulia.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-white text-navy-900 font-semibold text-sm py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:bg-navy-50 transition-colors shadow-low">
                <Phone className="w-4 h-4" /> Call Center: 0804-1-888-888
              </button>
              <button className="bg-[#25D366] text-white font-semibold text-sm py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 transition-colors shadow-low">
                <MessageCircle className="w-4 h-4" /> WhatsApp CS
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

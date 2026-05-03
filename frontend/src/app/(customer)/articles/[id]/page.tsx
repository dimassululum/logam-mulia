import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, Share2, Clock, CalendarDays } from 'lucide-react'

// Dummy content based on the IDs
const getArticleData = (id: string) => {
  const base = {
    date: '24 April 2026',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKXOTvsJjJOCWjGdENXXjhRg8kAXZZhwt1GZM1p1J6pQFQvbR4SyvIYudpOvIYYoRpDWl62eOdJrOq0BopCDwzRHiNYlHoFbu1DoownMNMeMlVDbcWyMFgdzlVI5dOhJqRvOjXdj0bscSo3feya0FifujfZJlSQoR6xUsy79c8hKY6PNai664U2EDh4zbQjkGKxRwvBhI-iS4Th66I4ETiq9SJTLNBOcQWlKrWk82t_Ch3qLpOvMPnheLT4s7IQ_5CeG-GcsyKO2bZ',
  };

  switch (id) {
    case 'mengapa-emas-safe-haven':
      return {
        ...base,
        title: 'Mengapa Emas Adalah "Safe Haven" Terbaik?',
        tag: 'Panduan',
        content: `
          <p>Dalam dunia investasi yang dinamis dan penuh ketidakpastian, menemukan aset yang dapat menjaga nilai kekayaan Anda dari waktu ke waktu adalah prioritas utama setiap investor cerdas. Emas telah lama diakui sebagai salah satu instrumen investasi "safe haven" atau aset pelindung nilai yang paling kuat. Tapi apa sebenarnya yang membuat emas begitu istimewa?</p>
          
          <h3>1. Pelindung Terhadap Inflasi</h3>
          <p>Sejarah telah membuktikan bahwa harga emas cenderung naik seiring dengan meningkatnya biaya hidup. Ketika inflasi meningkat dan mata uang fiat kehilangan daya belinya, emas secara historis telah mempertahankan nilainya yang hakiki. Ini menjadikannya lindung nilai (hedge) yang sempurna terhadap inflasi yang menggerus kekayaan.</p>

          <h3>2. Nilai Intrinsik yang Tak Terbantahkan</h3>
          <p>Berbeda dengan mata uang kertas yang bisa dicetak tak terbatas oleh bank sentral, pasokan emas di bumi sangat terbatas dan membutuhkan proses penambangan yang rumit serta mahal. Keterbatasan fisik inilah yang memberikan nilai intrinsik abadi pada emas batangan yang Anda pegang.</p>

          <h3>3. Likuiditas Tinggi di Seluruh Dunia</h3>
          <p>Emas batangan bersertifikat LBMA (London Bullion Market Association) seperti Antam memiliki tingkat likuiditas universal. Di mana pun Anda berada, emas murni 24 karat dapat dicairkan atau diperjualbelikan dengan mudah sesuai dengan harga standar global.</p>

          <blockquote>
            "Portofolio yang seimbang selalu memiliki porsi untuk emas fisik. Bukan hanya untuk mencari keuntungan, melainkan untuk memberikan ketenangan pikiran saat pasar finansial sedang tidak menentu."
          </blockquote>

          <p>Memulai investasi emas kini lebih mudah dari sebelumnya. Dengan menyediakan emas batangan mulai dari 0.5 gram hingga 100 gram, kami berkomitmen untuk membantu masyarakat membangun fondasi finansial yang kokoh untuk masa depan mereka.</p>
        `
      }
    case 'strategi-dollar-cost-averaging':
      return {
        ...base,
        title: 'Strategi Dollar Cost Averaging Pada Emas',
        tag: 'Strategi',
        content: `
          <p>Dollar Cost Averaging (DCA) adalah strategi investasi di mana Anda membeli aset dengan jumlah uang yang sama secara rutin, terlepas dari harga aset tersebut di pasar. Menerapkan strategi ini pada investasi emas terbukti sangat efektif untuk mengurangi risiko fluktuasi harga jangka pendek.</p>
          
          <h3>Mengapa DCA Bekerja Sangat Baik Untuk Emas?</h3>
          <p>Dengan rutin membeli emas—misalnya, setiap bulan menyisihkan dana untuk membeli 1 gram emas—Anda akan membeli lebih banyak emas saat harga sedang turun, dan membeli lebih sedikit saat harga sedang naik. Seiring waktu, hal ini akan meratakan biaya pembelian rata-rata Anda.</p>
          
          <p>Konsistensi adalah kunci. Jangan biarkan emosi sesaat atau berita pasar harian mengganggu jadwal investasi rutin Anda. Disiplin finansial ini akan membuahkan hasil yang memuaskan di masa depan.</p>
        `
      }
    case 'verifikasi-sertifikat-antam':
      return {
        ...base,
        title: 'Verifikasi Keaslian Sertifikat Antam',
        tag: 'Keamanan',
        content: `
          <p>Keamanan dan keaslian produk adalah prioritas utama saat berinvestasi logam mulia. Emas batangan Antam dilengkapi dengan teknologi CertiCard yang memudahkan pelanggan untuk memverifikasi keaslian produk yang mereka beli.</p>
          
          <h3>Mengenal Fitur CertiCard</h3>
          <p>CertiCard menggabungkan kemasan dan sertifikat menjadi satu kesatuan yang aman. Jika kemasan dibuka secara paksa, CertiCard akan menunjukkan tanda kerusakan yang jelas, menjamin bahwa emas di dalamnya belum pernah disentuh sejak keluar dari pabrik.</p>
          
          <h3>Cara Mudah Verifikasi</h3>
          <p>Anda dapat menggunakan aplikasi CertiEye untuk memindai barcode yang terdapat pada bagian belakang kemasan CertiCard. Dalam hitungan detik, aplikasi akan mengonfirmasi apakah produk emas Antam tersebut asli dan terdaftar secara resmi.</p>
        `
      }
    default:
      return null;
  }
}

export default function ArticleDetailPage({ params }: { params: { id: string } }) {
  const article = getArticleData(params.id)

  if (!article) {
    return (
      <div className="container-main min-h-[50vh] flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-heading font-bold text-navy-900 mb-4">Artikel Tidak Ditemukan</h1>
        <Link href="/">
          <button className="btn-primary">Kembali ke Beranda</button>
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-surface min-h-screen">
      {/* Article Content Area */}
      <main className="container-main py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-12 max-w-6xl mx-auto">
          {/* Main Body */}
          <div className="flex-1">
            {/* Article Image - Moved to Top of Title */}
            <div className="w-full aspect-video md:aspect-[21/9] bg-navy-100 rounded-2xl overflow-hidden mb-8 shadow-md">
              <img 
                src={article.image} 
                alt={article.title}
                className="w-full h-full object-cover mix-blend-multiply opacity-90"
              />
            </div>

            <div className="mb-8">
              <span className="bg-gold-500/10 text-gold-600 border border-gold-500/20 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
                {article.tag}
              </span>
              <h1 className="text-3xl md:text-5xl font-heading font-bold text-navy-900 leading-tight mb-4 text-balance">
                {article.title}
              </h1>
              <div className="flex items-center gap-2 text-navy-500 text-sm font-medium">
                <CalendarDays className="w-4 h-4 text-gold-500" />
                <span>{article.date}</span>
              </div>
            </div>

            <article className="text-navy-700 leading-relaxed space-y-6">
              <div 
                className="[&>h3]:text-2xl [&>h3]:font-heading [&>h3]:font-bold [&>h3]:text-navy-900 [&>h3]:mt-10 [&>h3]:mb-4 [&>p]:mb-6 [&>blockquote]:border-l-4 [&>blockquote]:border-gold-400 [&>blockquote]:bg-white [&>blockquote]:p-6 [&>blockquote]:rounded-r-xl [&>blockquote]:text-navy-900 [&>blockquote]:font-heading [&>blockquote]:text-xl [&>blockquote]:shadow-sm [&>blockquote]:my-8 [&>blockquote]:italic"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            
            {/* Action Bar at Bottom of Article */}
            <div className="mt-12 pt-8 border-t border-navy-200 flex items-center justify-between">
              <button className="flex items-center gap-2 text-navy-600 hover:text-navy-900 font-semibold transition-colors">
                <Share2 className="w-5 h-5" />
                Bagikan Artikel
              </button>
            </div>
            </article>
          </div>
          
          {/* Sidebar */}
          <aside className="w-full lg:w-80 flex-shrink-0 space-y-8">
            <div className="bg-navy-900 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-10 h-10 bg-gold-400 rounded-full animate-pulse" />
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-2">Mulai Investasi Hari Ini</h3>
              <p className="text-white/70 text-sm mb-6">Dapatkan kemurnian emas 99.99% bersertifikat Antam.</p>
              <Link href="/products" className="block w-full">
                <button className="w-full bg-gold-400 text-navy-900 font-semibold py-3 rounded-lg hover:brightness-105 active:scale-[0.98] transition-all">
                  Lihat Katalog
                </button>
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

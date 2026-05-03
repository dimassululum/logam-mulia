import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title:       'Logam Mulia Antam - Digital Gold Vault',
  description: 'Distributor resmi logam mulia Antam. Investasi emas online terpercaya dengan sertifikat LBMA, pengiriman aman, dan pembayaran Midtrans.',
  keywords:    ['emas', 'antam', 'logam mulia', 'investasi emas', 'beli emas online', 'emas batangan'],
  authors:     [{ name: 'Logam Mulia Antam' }],
  openGraph: {
    title:       'Logam Mulia Antam - Digital Gold Vault',
    description: 'Investasi emas online terpercaya, bersertifikat ANTAM.',
    type:        'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-surface text-on-surface font-body-md antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}

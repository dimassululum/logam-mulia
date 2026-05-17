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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-on-surface font-body-md antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}

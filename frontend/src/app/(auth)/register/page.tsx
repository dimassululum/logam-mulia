import type { Metadata } from 'next'
import RegisterForm from '@/features/auth/RegisterForm'

export const metadata: Metadata = {
  title:       'Daftar | Logam Mulia Antam',
  description: 'Buat akun baru dan mulai perjalanan investasi emas Anda bersama Logam Mulia Antam.',
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#d4a84b] to-[#7a5900] rounded-xl mb-4 shadow-lg">
            <svg className="w-7 h-7 text-white" viewBox="0 0 20 20" fill="currentColor">
              <rect x="2" y="6" width="16" height="8" rx="2" />
            </svg>
          </div>
          <h1 className="font-heading text-2xl text-[#0F1B2D] font-bold">Buat Akun Baru</h1>
          <p className="text-sm text-[#4e4637] mt-1">Mulai investasi emas Anda hari ini</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-[#d2c5b1] shadow-sm p-8">
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}

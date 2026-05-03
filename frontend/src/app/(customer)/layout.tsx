import Navbar from '@/shared/layout/Navbar'

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen flex flex-col relative">
        {children}
      </main>
    </>
  )
}

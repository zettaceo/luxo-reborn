import type { Metadata } from 'next'
import Header from '@/components/store/Header'
import CartDrawer from '@/components/store/CartDrawer'
import { Footer } from '@/components/store/BannerStrip'
import ResetPasswordClient from './ResetPasswordClient'

export const metadata: Metadata = {
  title: 'Redefinir Senha',
  description: 'Defina uma nova senha para sua conta.',
}

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams

  return (
    <>
      <Header />
      <CartDrawer />
      <main className="min-h-screen bg-cream px-4 py-10">
        <ResetPasswordClient tokenFromQuery={token} />
      </main>
      <Footer />
    </>
  )
}

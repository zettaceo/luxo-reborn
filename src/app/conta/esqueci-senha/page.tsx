import type { Metadata } from 'next'
import Header from '@/components/store/Header'
import CartDrawer from '@/components/store/CartDrawer'
import { Footer } from '@/components/store/BannerStrip'
import ForgotPasswordClient from './ForgotPasswordClient'

export const metadata: Metadata = {
  title: 'Recuperar Senha',
  description: 'Solicite a redefinição da senha da sua conta.',
}

export default function ForgotPasswordPage() {
  return (
    <>
      <Header />
      <CartDrawer />
      <main className="min-h-screen bg-cream px-4 py-10">
        <ForgotPasswordClient />
      </main>
      <Footer />
    </>
  )
}

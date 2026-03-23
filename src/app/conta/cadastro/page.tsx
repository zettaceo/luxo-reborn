import type { Metadata } from 'next'
import Header from '@/components/store/Header'
import CartDrawer from '@/components/store/CartDrawer'
import { Footer } from '@/components/store/BannerStrip'
import RegisterClient from './RegisterClient'

export const metadata: Metadata = {
  title: 'Criar Conta',
  description: 'Crie sua conta para salvar seus dados e comprar com mais rapidez.',
}

export default function AccountRegisterPage() {
  return (
    <>
      <Header />
      <CartDrawer />
      <main className="min-h-screen bg-cream px-4 py-10">
        <RegisterClient />
      </main>
      <Footer />
    </>
  )
}

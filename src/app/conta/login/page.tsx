import type { Metadata } from 'next'
import Header from '@/components/store/Header'
import CartDrawer from '@/components/store/CartDrawer'
import { Footer } from '@/components/store/BannerStrip'
import LoginClient from './LoginClient'

export const metadata: Metadata = {
  title: 'Entrar na Conta',
  description: 'Acesse sua conta para acompanhar pedidos e atualizar seus dados.',
}

export default function AccountLoginPage() {
  return (
    <>
      <Header />
      <CartDrawer />
      <main className="min-h-screen bg-cream px-4 py-10">
        <LoginClient />
      </main>
      <Footer />
    </>
  )
}

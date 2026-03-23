import type { Metadata } from 'next'
import Header from '@/components/store/Header'
import CartDrawer from '@/components/store/CartDrawer'
import { Footer } from '@/components/store/BannerStrip'
import ContaClient from './ContaClient'

export const metadata: Metadata = {
  title: 'Minha Conta',
  description: 'Atualize seus dados, endereços, pagamentos e acompanhe seus pedidos.',
}

export const dynamic = 'force-dynamic'

export default function ContaPage() {
  return (
    <>
      <Header />
      <CartDrawer />
      <main className="min-h-screen bg-cream px-4 py-10">
        <ContaClient />
      </main>
      <Footer />
    </>
  )
}

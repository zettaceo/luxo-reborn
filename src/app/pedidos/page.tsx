import type { Metadata } from 'next'
import Header from '@/components/store/Header'
import CartDrawer from '@/components/store/CartDrawer'
import { Footer } from '@/components/store/BannerStrip'
import OrderLookupClient from './OrderLookupClient'

export const metadata: Metadata = {
  title: 'Acompanhar Pedido',
  description: 'Consulte o status e rastreio do seu pedido.',
}

export const dynamic = 'force-dynamic'

export default function OrdersPage() {
  return (
    <>
      <Header />
      <CartDrawer />
      <main className="min-h-screen bg-cream px-4 py-10">
        <OrderLookupClient />
      </main>
      <Footer />
    </>
  )
}

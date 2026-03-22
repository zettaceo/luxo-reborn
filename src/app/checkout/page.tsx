import type { Metadata } from 'next'
import Header from '@/components/store/Header'
import CartDrawer from '@/components/store/CartDrawer'
import CheckoutClient from './CheckoutClient'
import { checkoutEnabled } from '@/lib/config/store'

export const metadata: Metadata = {
  title: 'Finalizar Pedido',
}

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <CartDrawer />
      <main className="min-h-screen bg-cream py-10 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-2 mb-10 text-sm">
            {['Carrinho', 'Seus dados', 'Pagamento', 'Confirmação'].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 ${i <= 2 ? 'text-rose-deep font-semibold' : 'text-muted'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i <= 2 ? 'bg-gradient-to-br from-rose-deep to-rose text-white' : 'bg-rose-light text-muted'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="hidden sm:block">{step}</span>
                </div>
                {i < 3 && <span className="text-rose-light">──</span>}
              </div>
            ))}
          </div>

          <CheckoutClient checkoutEnabled={checkoutEnabled} />
        </div>
      </main>
    </>
  )
}

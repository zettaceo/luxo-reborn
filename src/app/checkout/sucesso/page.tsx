import Link from 'next/link'
import type { Metadata } from 'next'
import Header from '@/components/store/Header'
import CartDrawer from '@/components/store/CartDrawer'
import { Footer } from '@/components/store/BannerStrip'
import { WhatsAppIcon } from '@/components/icons/SocialIcons'
import SuccessTracking from './SuccessTracking'

export const metadata: Metadata = { title: 'Pedido Confirmado!' }

interface Props {
  searchParams: { order?: string }
}

export default function SuccessPage({ searchParams }: Props) {
  return (
    <>
      <Header />
      <CartDrawer />
      <SuccessTracking orderNumber={searchParams.order} />
      <main className="min-h-screen bg-cream flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full text-center">
          <div className="text-8xl mb-6 animate-bounce-slow">🎉</div>

          <h1 className="font-display text-4xl font-bold text-charcoal mb-3">
            Pedido confirmado!
          </h1>

          {searchParams.order && (
            <p className="text-muted mb-2">
              Número do pedido:{' '}
              <strong className="text-rose-deep font-bold text-lg">{searchParams.order}</strong>
            </p>
          )}

          <p className="text-muted text-base leading-relaxed mb-8">
            Obrigada pela sua compra! 🧸❤️<br />
            Você receberá um e-mail com os detalhes e o código de rastreio assim que seu pedido for enviado.
          </p>

          <div className="bg-white border border-rose-light rounded-2xl p-5 mb-7 text-left space-y-3">
            {[
              { icon: '📧', text: 'Confirmação enviada para seu e-mail' },
              { icon: '📦', text: 'Pedido sendo preparado com carinho' },
              { icon: '🚚', text: 'Código de rastreio enviado após o despacho' },
              { icon: '💬', text: 'Dúvidas? Fale no WhatsApp' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-charcoal">
                <span className="text-xl">{icon}</span>
                {text}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/" className="btn-primary w-full py-4">🛍️ Continuar comprando</Link>
            <a
              href="https://wa.me/5511965277902"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full py-4 inline-flex items-center justify-center gap-2"
            >
              <WhatsAppIcon className="w-5 h-5" />
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

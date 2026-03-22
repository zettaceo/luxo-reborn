import Link from 'next/link'

export function BannerStrip() {
  return (
    <section className="bg-gradient-to-br from-rose-deep to-rose-darker py-16 px-4 text-center relative overflow-hidden">
      <div className="absolute inset-x-0 top-3 text-xl opacity-20 tracking-[12px]">
        ✨🎀✨🎀✨🎀✨🎀✨🎀✨🎀✨
      </div>
      <div className="max-w-xl mx-auto relative z-10">
        <p className="text-gold-shine text-xs font-bold uppercase tracking-[3px] mb-3">✦ Oferta especial ✦</p>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
          Kit Bebê Reborn<br />
          <em className="text-gold-shine">artesanal completo</em>
        </h2>
        <p className="text-white/80 text-base mb-7 leading-relaxed">
          Bebê dormindo 55cm, enxoval completo e pode dar banho. O presente mais apaixonante do ano!
        </p>
        <Link
          href="/produtos?cat=bebes-reborn"
          className="inline-flex items-center gap-2 bg-white text-rose-deep font-bold text-base px-9 py-4 rounded-full shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all"
        >
          🛍️ Ver oferta
        </Link>
      </div>
    </section>
  )
}

export default BannerStrip

const REVIEWS = [
  {
    stars: 5,
    text: 'Amei demais o bebê reborn! Chegou super bem embalado, parece um bebê de verdade. Minha filha ficou apaixonada, chorou de emoção!',
    name: 'Mariana S.',
    product: 'Bebê Reborn Laura',
    emoji: '👩',
    date: '2 dias atrás',
  },
  {
    stars: 5,
    text: 'Produto de altíssima qualidade! A pelúcia é enorme e muito macia. Entrega super rápida, chegou em 3 dias. Com certeza vou comprar de novo!',
    name: 'Fernanda C.',
    product: 'Urso Pelúcia XG',
    emoji: '👩‍🦱',
    date: '5 dias atrás',
  },
  {
    stars: 5,
    text: 'Presente de aniversário perfeito! A embalagem já chega presenteável. Atendimento incrível, tiraram todas as minhas dúvidas pelo WhatsApp.',
    name: 'Camila R.',
    product: 'Kit Presente Mimos',
    emoji: '👧',
    date: '1 semana atrás',
  },
]

export function ReviewsSection() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {REVIEWS.map((r, i) => (
        <div
          key={i}
          className="bg-rose-pale border border-rose-light rounded-2xl p-6 hover:-translate-y-1 hover:shadow-rose transition-all duration-200"
        >
          <div className="text-lg mb-3">{'⭐'.repeat(r.stars)}</div>
          <p className="text-sm text-charcoal leading-relaxed mb-4 italic">
            <span className="text-2xl text-rose font-display leading-none align-bottom">"</span>
            {r.text}
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose to-rose-deep flex items-center justify-center text-xl">
              {r.emoji}
            </div>
            <div>
              <p className="text-sm font-semibold text-charcoal">{r.name}</p>
              <p className="text-xs text-muted">{r.product} · {r.date}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function TrustBar() {
  const items = [
    { icon: '🔒', title: 'Compra Segura', desc: 'Pix e cartão com confirmação automática e dados protegidos' },
    { icon: '🚚', title: 'Envio Rápido', desc: 'Calculamos o melhor frete pelos Correios e transportadoras' },
    { icon: '🎁', title: 'Embalagem Especial', desc: 'Cada produto embalado com carinho, pronto para presentear' },
    { icon: '💬', title: 'Suporte no WhatsApp', desc: 'Atendimento rápido e humanizado direto no seu celular' },
  ]

  return (
    <section className="py-12 px-4 bg-cream">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map(({ icon, title, desc }) => (
          <div key={title} className="bg-white border border-rose-light rounded-xl p-5 text-center">
            <span className="text-3xl block mb-2">{icon}</span>
            <p className="text-sm font-bold text-charcoal mb-1">{title}</p>
            <p className="text-xs text-muted leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="bg-charcoal text-white/70 pt-14 pb-8 px-4">
      <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-10 mb-10">
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose to-rose-deep flex items-center justify-center text-xl">🧸</div>
            <div>
              <span className="block font-script text-2xl text-white">Luxo Reborn</span>
              <span className="block text-[10px] font-semibold text-gold tracking-widest uppercase">✦ Brinquedos & Mimos ✦</span>
            </div>
          </div>
          <p className="text-xs text-white/50 leading-relaxed max-w-[220px] mb-5">
            Bebês Reborn, pelúcias e brinquedos que encantam corações e criam memórias para toda a vida.
          </p>
          <div className="flex gap-2">
            {[
              { label: '📸', href: 'https://www.instagram.com/luxo_reborn' },
              { label: '💬', href: 'https://wa.me/5511965277902' },
              { label: '🎵', href: '#' },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/8 hover:bg-rose flex items-center justify-center text-base transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Links */}
        {[
          {
            title: 'Produtos',
            links: [
              { label: 'Bebês Reborn', href: '/produtos?cat=bebes-reborn' },
              { label: 'Pelúcias',     href: '/produtos?cat=pelucias' },
              { label: 'Brinquedos',  href: '/produtos?cat=brinquedos' },
              { label: 'Cadernos',    href: '/produtos?cat=cadernos' },
              { label: 'Presentes',   href: '/produtos?cat=presentes' },
            ],
          },
          {
            title: 'Ajuda',
            links: [
              { label: 'Como comprar',       href: '#' },
              { label: 'Rastrear pedido',    href: '/pedidos' },
              { label: 'Trocas e devoluções',href: '#' },
              { label: 'Prazo de entrega',   href: '#' },
            ],
          },
          {
            title: 'Contato',
            links: [
              { label: '📱 WhatsApp',  href: 'https://wa.me/5511965277902' },
              { label: '📸 Instagram', href: 'https://www.instagram.com/luxo_reborn' },
            ],
          },
        ].map(({ title, links }) => (
          <div key={title}>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">{title}</h4>
            <ul className="space-y-2.5">
              {links.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="text-xs text-white/50 hover:text-rose transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
        <span>© {new Date().getFullYear()} Luxo Reborn. Todos os direitos reservados.</span>
        <div className="flex items-center gap-2 bg-white/6 rounded-full px-4 py-1.5">
          <span>💳</span>
          <span>Pix · Cartão de crédito/débito · 100% seguro</span>
        </div>
      </div>
    </footer>
  )
}

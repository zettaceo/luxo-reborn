import Link from 'next/link'
import { WhatsAppIcon } from '@/components/icons/SocialIcons'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-rose-pale via-[#fff0f9] to-rose-light py-20 px-4">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full bg-rose opacity-[0.12] blur-[80px] -top-24 -right-20 animate-float" />
        <div className="absolute w-72 h-72 rounded-full bg-gold opacity-[0.10] blur-[70px] -bottom-20 -left-16 animate-float [animation-delay:3s]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="max-w-2xl">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 bg-white/80 border border-rose-light rounded-full px-4 py-1.5 text-xs font-bold text-rose-deep uppercase tracking-widest mb-5 animate-fade-up">
            ⭐ Bebês Reborn em Alta Qualidade
          </div>

          {/* Title */}
          <h1 className="font-display text-5xl md:text-6xl font-bold text-charcoal leading-[1.1] mb-5 animate-fade-up [animation-delay:0.1s]">
            Mimos que{' '}
            <em className="text-rose-deep">encantam</em>
            <br />e <span className="text-gold">emocionam</span>
          </h1>

          {/* Description */}
          <p className="text-muted text-lg leading-relaxed max-w-lg mb-8 animate-fade-up [animation-delay:0.2s]">
            Bebês Reborn artesanais, pelúcias delicadas e brinquedos incríveis para todas as idades.
            Presentes únicos feitos com amor e qualidade.
          </p>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 mb-12 animate-fade-up [animation-delay:0.3s]">
            <Link href="#produtos" className="btn-primary text-base px-8 py-4">
              🛍️ Ver Produtos
            </Link>
            <a
              href="https://wa.me/5511965277902"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-base px-8 py-4 inline-flex items-center gap-2"
            >
              <WhatsAppIcon className="w-5 h-5" />
              Falar no WhatsApp
            </a>
          </div>

          {/* Stats */}
          <div className="flex gap-8 animate-fade-up [animation-delay:0.4s]">
            {[
              { num: '580+', label: 'Clientes felizes' },
              { num: '93',   label: 'Produtos' },
              { num: '5★',   label: 'Avaliações' },
            ].map(({ num, label }) => (
              <div key={label} className="text-center">
                <span className="block font-display text-3xl font-bold text-rose-deep">{num}</span>
                <span className="text-xs text-muted font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/hooks/useCart'

export default function Header() {
  const { itemCount, openCart } = useCart()
  const count = itemCount()

  return (
    <header className="bg-white border-b border-rose-light sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-[72px] flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/images/logo.png"
            alt="Luxo Reborn"
            width={160}
            height={60}
            className="h-12 w-auto object-contain"
            priority
          />
        </Link>

        {/* Nav — desktop */}
        <nav className="hidden md:flex items-center gap-7">
          {[
            { label: 'Início',        href: '/' },
            { label: 'Bebês Reborn',  href: '/produtos?cat=bebes-reborn' },
            { label: 'Pelúcias',      href: '/produtos?cat=pelucias' },
            { label: 'Brinquedos',    href: '/produtos?cat=brinquedos' },
            { label: 'Novidades',     href: '/produtos?badge=Novo' },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-charcoal hover:text-rose-deep transition-colors relative group"
            >
              {label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-rose rounded-full transition-all group-hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Busca */}
          <Link
            href="/produtos"
            className="w-10 h-10 rounded-full bg-rose-pale flex items-center justify-center text-lg hover:bg-rose-light transition-colors"
            aria-label="Buscar"
          >
            🔍
          </Link>

          {/* Favoritos */}
          <button
            className="w-10 h-10 rounded-full bg-rose-pale flex items-center justify-center text-lg hover:bg-rose-light transition-colors"
            aria-label="Favoritos"
          >
            🤍
          </button>

          {/* Carrinho */}
          <button
            onClick={openCart}
            className="relative w-10 h-10 rounded-full bg-rose-pale flex items-center justify-center text-lg hover:bg-rose-light transition-colors"
            aria-label="Carrinho"
          >
            🛒
            {count > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-charcoal text-[10px] font-bold rounded-full flex items-center justify-center">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

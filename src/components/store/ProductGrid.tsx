'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useCart } from '@/hooks/useCart'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/types'

export default function ProductGrid({ products }: { products: Product[] }) {
  if (!products?.length) {
    return (
      <div className="text-center py-20 text-muted">
        <span className="text-5xl block mb-4">🔍</span>
        <p>Nenhum produto encontrado.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  const [wished, setWished] = useState(false)
  const [adding, setAdding] = useState(false)

  const cover = product.images?.find(i => i.is_cover) ?? product.images?.[0]
  const hasDiscount = product.old_price && product.old_price > product.price
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.old_price!) * 100)
    : 0

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    if (product.stock <= 0) return
    setAdding(true)
    addItem(product)
    toast.success(`${product.name} adicionado!`)
    setTimeout(() => setAdding(false), 1200)
  }

  return (
    <Link href={`/produtos/${product.slug}`} className="group block">
      <article className="bg-white rounded-2xl overflow-hidden shadow-card transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-card-hover">
        {/* Image */}
        <div className="relative aspect-square bg-gradient-to-br from-rose-pale to-[#fff0f9] overflow-hidden">
          {cover ? (
            <Image
              src={cover.url}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl">🧸</div>
          )}

          {/* Badges */}
          {product.badge && (
            <span className={`absolute top-3 left-3 badge ${
              product.badge === 'Top' || product.badge === 'Popular'
                ? 'badge-gold'
                : 'badge-rose'
            }`}>
              {product.badge}
            </span>
          )}
          {discountPct > 0 && (
            <span className="absolute top-3 right-10 badge badge-green">
              -{discountPct}%
            </span>
          )}

          {/* Wishlist */}
          <button
            onClick={e => { e.preventDefault(); setWished(w => !w) }}
            className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10"
            aria-label="Favoritar"
          >
            {wished ? '❤️' : '🤍'}
          </button>

          {/* Out of stock overlay */}
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="badge badge-rose">Esgotado</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-xs text-muted font-semibold uppercase tracking-wider mb-1">
            {product.category?.name}
          </p>
          <h3 className="font-display text-base font-semibold text-charcoal leading-snug mb-1.5 line-clamp-2">
            {product.name}
          </h3>
          <div className="text-sm mb-3">⭐⭐⭐⭐⭐</div>

          <div className="flex items-end justify-between gap-2">
            <div>
              {hasDiscount && (
                <p className="text-xs text-muted line-through">
                  {formatCurrency(product.old_price!)}
                </p>
              )}
              <p className="font-display text-xl font-bold text-rose-deep">
                {formatCurrency(product.price)}
              </p>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0 || adding}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-base transition-all shrink-0 ${
                adding
                  ? 'bg-gradient-to-br from-green-500 to-emerald-400 scale-95'
                  : 'bg-gradient-to-br from-rose-deep to-rose shadow-[0_4px_14px_rgba(219,39,119,0.3)] hover:scale-110 hover:shadow-[0_6px_20px_rgba(219,39,119,0.45)]'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              aria-label="Adicionar ao carrinho"
            >
              {adding ? '✓' : '+'}
            </button>
          </div>

          {/* Pix price hint */}
          <p className="text-[11px] text-muted mt-1.5">
            💳 no Pix ou em até 12x no cartão
          </p>
        </div>
      </article>
    </Link>
  )
}

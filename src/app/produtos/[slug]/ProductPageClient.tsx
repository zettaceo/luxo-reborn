'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useCart } from '@/hooks/useCart'
import { WhatsAppIcon } from '@/components/icons/SocialIcons'
import { trackAddToCart, trackViewItem } from '@/lib/analytics'
import { formatCurrency } from '@/lib/utils'
import type { Product, Review } from '@/types'

interface Props {
  product: Product & { reviews?: Review[] }
}

export default function ProductPageClient({ product }: Props) {
  const router = useRouter()
  const { addItem } = useCart()
  const trackedProductRef = useRef<string | null>(null)
  const [qty,          setQty]          = useState(1)
  const [activeImg,    setActiveImg]    = useState(0)
  const [addingCart,   setAddingCart]   = useState(false)
  const [reviewForm,   setReviewForm]   = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewName,   setReviewName]   = useState('')
  const [reviewText,   setReviewText]   = useState('')
  const [submitting,   setSubmitting]   = useState(false)

  const cover     = product.images?.[activeImg] ?? product.images?.[0]
  const hasDiscount = product.old_price && product.old_price > product.price
  const reviews   = product.reviews?.filter(r => r.is_approved) ?? []
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  const installmentPrice = (product.price / 12).toFixed(2).replace('.', ',')

  useEffect(() => {
    if (trackedProductRef.current === product.id) return
    trackedProductRef.current = product.id
    trackViewItem(product)
  }, [product])

  function handleAddToCart() {
    setAddingCart(true)
    addItem(product, qty)
    trackAddToCart(product, qty)
    toast.success(`${qty}x ${product.name} adicionado!`)
    setTimeout(() => setAddingCart(false), 1200)
  }

  function handleBuyNow() {
    addItem(product, qty)
    trackAddToCart(product, qty)
    router.push('/checkout')
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reviewName.trim()) { toast.error('Digite seu nome'); return }
    setSubmitting(true)
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id:    product.id,
          customer_name: reviewName,
          rating:        reviewRating,
          comment:       reviewText,
        }),
      })
      toast.success('Avaliação enviada! Será publicada em breve. 🙏')
      setReviewForm(false)
      setReviewName('')
      setReviewText('')
      setReviewRating(5)
    } catch {
      toast.error('Erro ao enviar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* Breadcrumb */}
      <nav className="text-xs text-muted mb-7 flex items-center gap-1.5">
        <Link href="/" className="hover:text-rose-deep transition-colors">Início</Link>
        <span>›</span>
        <Link href="/produtos" className="hover:text-rose-deep transition-colors">Produtos</Link>
        <span>›</span>
        {product.category && (
          <>
            <Link href={`/produtos?cat=${product.category.slug}`} className="hover:text-rose-deep transition-colors">
              {product.category.name}
            </Link>
            <span>›</span>
          </>
        )}
        <span className="text-charcoal font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main Grid */}
      <div className="grid md:grid-cols-2 gap-10 mb-16">

        {/* ── IMAGE GALLERY ── */}
        <div>
          {/* Main image */}
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-rose-pale to-[#fff0f9] mb-3 shadow-card">
            {cover ? (
              <Image
                src={cover.url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[100px]">🧸</div>
            )}
            {product.badge && (
              <span className="absolute top-4 left-4 badge badge-rose">{product.badge}</span>
            )}
            {product.stock <= 0 && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <span className="badge badge-rose text-base px-6 py-2">Esgotado</span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImg(i)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    i === activeImg ? 'border-rose-deep shadow-rose' : 'border-transparent hover:border-rose-light'
                  }`}
                >
                  <Image src={img.url} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── PRODUCT INFO ── */}
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">
            {product.category?.emoji} {product.category?.name}
          </p>

          <h1 className="font-display text-3xl md:text-4xl font-bold text-charcoal leading-tight mb-3">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(n => (
                <span key={n} className={`text-lg ${n <= Math.round(avgRating) ? 'text-gold' : 'text-gray-200'}`}>★</span>
              ))}
            </div>
            <span className="text-sm text-muted">
              {reviews.length > 0
                ? `${avgRating.toFixed(1)} (${reviews.length} avaliação${reviews.length > 1 ? 'ões' : ''})`
                : 'Seja o primeiro a avaliar'}
            </span>
          </div>

          {/* Price */}
          <div className="mb-5">
            {hasDiscount && (
              <p className="text-sm text-muted line-through mb-0.5">
                De {formatCurrency(product.old_price!)}
              </p>
            )}
            <p className="font-display text-4xl font-bold text-rose-deep">
              {formatCurrency(product.price)}
            </p>
            <p className="text-sm text-muted mt-1">
              ou em até <strong className="text-charcoal">12x de R$ {installmentPrice}</strong> no cartão
            </p>
            <p className="text-sm text-green-600 font-semibold mt-0.5">
              💳 Pix sem taxa adicional
            </p>
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {product.stock > 0
                ? product.stock <= 5
                  ? `Últimas ${product.stock} unidades!`
                  : `${product.stock} em estoque`
                : 'Produto esgotado'}
            </span>
          </div>

          {/* Description */}
          <div className="text-sm text-muted leading-relaxed mb-7 border-t border-rose-light pt-5">
            {product.description}
          </div>

          {/* Quantity + Add to cart */}
          {product.stock > 0 && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="label">Quantidade</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-full border-2 border-rose-light text-rose-deep font-bold flex items-center justify-center hover:bg-rose-light transition-colors text-xl"
                  >
                    −
                  </button>
                  <span className="text-xl font-bold text-charcoal w-6 text-center">{qty}</span>
                  <button
                    onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    className="w-10 h-10 rounded-full border-2 border-rose-light text-rose-deep font-bold flex items-center justify-center hover:bg-rose-light transition-colors text-xl"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={addingCart}
                className={`btn-primary w-full py-4 text-base ${addingCart ? 'bg-green-500 from-green-500 to-emerald-400' : ''}`}
              >
                {addingCart ? '✓ Adicionado ao carrinho!' : '🛒 Adicionar ao Carrinho'}
              </button>

              <button
                onClick={handleBuyNow}
                className="btn-outline w-full py-4 text-base"
              >
                ⚡ Comprar agora
              </button>

              <a
                href="https://wa.me/5511965277902"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary w-full py-4 text-base text-center inline-flex items-center justify-center gap-2"
              >
                <WhatsAppIcon className="w-5 h-5" />
                Tirar dúvidas no WhatsApp
              </a>
            </div>
          )}

          {/* Trust mini badges */}
          <div className="grid grid-cols-3 gap-3 mt-6 text-center">
            {[
              { icon: '🔒', label: 'Pagamento\nseguro' },
              { icon: '🚚', label: 'Entrega\nrápida' },
              { icon: '🎁', label: 'Embalagem\nespecial' },
            ].map(({ icon, label }) => (
              <div key={label} className="bg-rose-pale rounded-xl py-3 px-2">
                <span className="text-2xl block mb-1">{icon}</span>
                <span className="text-[11px] text-muted font-medium whitespace-pre-line leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── REVIEWS ── */}
      <section className="border-t border-rose-light pt-12">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="section-title">Avaliações dos <span>clientes</span></h2>
          <button
            onClick={() => setReviewForm(f => !f)}
            className="btn-outline text-sm"
          >
            ✍️ Avaliar produto
          </button>
        </div>

        {/* Review form */}
        {reviewForm && (
          <form
            onSubmit={handleReviewSubmit}
            className="bg-rose-pale border border-rose-light rounded-2xl p-6 mb-8"
          >
            <h3 className="font-display text-lg font-bold text-charcoal mb-5">Sua avaliação</h3>

            {/* Stars */}
            <div className="mb-4">
              <label className="label">Nota</label>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setReviewRating(n)}
                    className={`text-3xl transition-transform hover:scale-110 ${n <= reviewRating ? 'text-gold' : 'text-gray-200'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Seu nome *</label>
                <input
                  className="input"
                  value={reviewName}
                  onChange={e => setReviewName(e.target.value)}
                  placeholder="Maria Silva"
                  required
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="label">Comentário (opcional)</label>
              <textarea
                className="input resize-none"
                rows={3}
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Conte sua experiência com o produto..."
              />
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Enviando...' : '📨 Enviar avaliação'}
              </button>
              <button type="button" onClick={() => setReviewForm(false)} className="btn-outline">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Review list */}
        {reviews.length === 0 ? (
          <div className="text-center py-14 text-muted">
            <span className="text-5xl block mb-3">⭐</span>
            <p>Nenhuma avaliação ainda. Seja o primeiro a avaliar!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {reviews.map(review => (
              <div key={review.id} className="bg-white border border-rose-light rounded-2xl p-5">
                <div className="flex gap-0.5 mb-2">
                  {[1,2,3,4,5].map(n => (
                    <span key={n} className={`text-base ${n <= review.rating ? 'text-gold' : 'text-gray-200'}`}>★</span>
                  ))}
                </div>
                {review.comment && (
                  <p className="text-sm text-charcoal leading-relaxed italic mb-3">"{review.comment}"</p>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose to-rose-deep flex items-center justify-center text-sm">
                    {review.customer_name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-charcoal">{review.customer_name}</p>
                    <p className="text-xs text-muted">
                      {new Date(review.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

'use client'

import { useCart } from '@/hooks/useCart'
import { formatCurrency } from '@/lib/utils'
import type { CartItem } from '@/types'
import Image from 'next/image'
import Link from 'next/link'

export default function CartDrawer() {
  const { items, isOpen, openCart, closeCart, updateQuantity, removeItem, total } = useCart()

  return (
    <>
      {/* Overlay */}
      <div
        onClick={closeCart}
        className={`fixed inset-0 bg-charcoal/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-full max-w-[420px] bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-rose-light">
          <h2 className="font-display text-xl font-bold text-charcoal">🛒 Meu Carrinho</h2>
          <button
            onClick={closeCart}
            className="w-9 h-9 rounded-full bg-rose-pale hover:bg-rose-light flex items-center justify-center text-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="text-center py-16 text-muted">
              <span className="text-6xl block mb-4">🛍️</span>
              <p className="text-base">Seu carrinho está vazio.<br />Adicione produtos para continuar!</p>
              <button onClick={closeCart} className="btn-primary mt-6 text-sm">
                Continuar comprando
              </button>
            </div>
          ) : (
            <ul className="space-y-1 divide-y divide-rose-light">
              {items.map((item: CartItem) => (
                <CartItemRow
                  key={item.product.id}
                  item={item}
                  onUpdate={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-rose-light bg-rose-pale">
            <div className="flex justify-between text-sm text-muted mb-1">
              <span>Subtotal</span>
              <span>{formatCurrency(total())}</span>
            </div>
            <div className="flex justify-between text-sm text-muted mb-3">
              <span>Frete</span>
              <span className="text-green-600 font-semibold">Calcular no checkout</span>
            </div>
            <div className="flex justify-between items-baseline mb-5 pt-3 border-t border-rose-light">
              <span className="font-semibold text-charcoal">Total</span>
              <span className="font-display text-2xl font-bold text-rose-deep">
                {formatCurrency(total())}
              </span>
            </div>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="btn-primary w-full text-base py-4"
            >
              💳 Finalizar Pedido
            </Link>
            <p className="text-center text-xs text-muted mt-3">
              🔒 Pix ou cartão · Pagamento 100% seguro
            </p>
          </div>
        )}
      </aside>

      {/* FAB flutuante no mobile */}
      {!isOpen && items.length > 0 && (
        <button
          onClick={openCart}
          className="fixed bottom-6 right-5 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-rose-deep to-rose text-white text-2xl flex items-center justify-center shadow-[0_6px_28px_rgba(219,39,119,0.4)] hover:scale-110 transition-transform"
        >
          🛒
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-charcoal text-[10px] font-bold rounded-full flex items-center justify-center">
            {items.reduce((s, i) => s + i.quantity, 0)}
          </span>
        </button>
      )}
    </>
  )
}

function CartItemRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: CartItem
  onUpdate: (id: string, qty: number) => void
  onRemove: (id: string) => void
}) {
  const cover = item.product.images?.find(i => i.is_cover) ?? item.product.images?.[0]

  return (
    <li className="py-4 flex gap-4 items-start">
      {/* Thumbnail */}
      <div className="w-[70px] h-[70px] rounded-xl bg-rose-pale flex items-center justify-center shrink-0 overflow-hidden">
        {cover ? (
          <Image src={cover.url} alt={item.product.name} width={70} height={70} className="object-cover w-full h-full" />
        ) : (
          <span className="text-3xl">🧸</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-charcoal truncate">{item.product.name}</p>
        <p className="text-sm font-bold text-rose-deep mt-0.5">
          {formatCurrency(item.product.price * item.quantity)}
        </p>

        {/* Quantity */}
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => onUpdate(item.product.id, item.quantity - 1)}
            className="w-7 h-7 rounded-full border-2 border-rose-light text-rose-deep font-bold flex items-center justify-center hover:bg-rose-light transition-colors text-sm"
          >
            −
          </button>
          <span className="text-sm font-bold text-charcoal w-4 text-center">{item.quantity}</span>
          <button
            onClick={() => onUpdate(item.product.id, item.quantity + 1)}
            className="w-7 h-7 rounded-full border-2 border-rose-light text-rose-deep font-bold flex items-center justify-center hover:bg-rose-light transition-colors text-sm"
          >
            +
          </button>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(item.product.id)}
        className="text-muted hover:text-rose-deep transition-colors text-lg mt-0.5"
        aria-label="Remover item"
      >
        🗑️
      </button>
    </li>
  )
}

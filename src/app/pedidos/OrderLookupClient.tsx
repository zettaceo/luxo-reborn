'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDateTime, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/utils'

interface LookupItem {
  id: string
  product_name: string
  quantity: number
  total_price: number
}

interface LookupOrder {
  id: string
  order_number: string
  status: string
  payment_status: string
  payment_method: string
  total: number
  shipping_service?: string | null
  tracking_code?: string | null
  created_at: string
  address_city: string
  address_state: string
  tracking_status?: string | null
  tracking_updated_at?: string | null
  tracking_delivered?: boolean
  items?: LookupItem[]
}

export default function OrderLookupClient() {
  const [email, setEmail] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<LookupOrder[]>([])
  const [searched, setSearched] = useState(false)

  async function handleLookup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, orderNumber }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao buscar pedidos')

      setOrders((data.data ?? []) as LookupOrder[])
      setSearched(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao buscar pedidos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white border border-rose-light rounded-3xl p-6 md:p-8 mb-6">
        <h1 className="font-display text-3xl font-bold text-charcoal mb-2">📦 Acompanhar pedido</h1>
        <p className="text-sm text-muted mb-6">
          Consulte seus pedidos com seu e-mail. Se quiser, informe também o número do pedido (ex: #LR-00001).
        </p>

        <form onSubmit={handleLookup} className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">E-mail da compra *</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label">Número do pedido (opcional)</label>
            <input
              type="text"
              className="input"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              placeholder="#LR-00001"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary sm:col-span-2 py-4">
            {loading ? '⏳ Consultando...' : '🔎 Consultar pedidos'}
          </button>
        </form>
      </div>

      {searched && orders.length === 0 && (
        <div className="bg-white border border-rose-light rounded-2xl p-8 text-center text-muted">
          <span className="text-5xl block mb-2">🔍</span>
          <p>Nenhum pedido encontrado para os dados informados.</p>
        </div>
      )}

      {orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = ORDER_STATUS_LABELS[order.status] ?? { label: order.status, color: 'text-muted bg-gray-50' }
            const trackingUrl = order.tracking_code
              ? `https://rastreamento.correios.com.br/app/index.php?objetos=${order.tracking_code}`
              : null

            return (
              <article key={order.id} className="bg-white border border-rose-light rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                  <div>
                    <p className="text-sm text-muted">Pedido</p>
                    <h2 className="text-lg font-bold text-rose-deep">{order.order_number}</h2>
                    <p className="text-xs text-muted">{formatDateTime(order.created_at)}</p>
                  </div>
                  <span className={`badge ${statusInfo.color}`}>{statusInfo.label}</span>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 mb-4 text-sm">
                  <div>
                    <p className="text-xs text-muted">Pagamento</p>
                    <p className="font-semibold text-charcoal">
                      {order.payment_method === 'pix' ? '💠 Pix' : '💳 Cartão'} · {PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Destino</p>
                    <p className="font-semibold text-charcoal">{order.address_city}/{order.address_state}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Total</p>
                    <p className="font-semibold text-charcoal">{formatCurrency(Number(order.total))}</p>
                  </div>
                </div>

                {order.items && order.items.length > 0 && (
                  <div className="border-t border-rose-light pt-3 mb-4">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Itens</p>
                    <ul className="space-y-1 text-sm text-charcoal">
                      {order.items.map((item) => (
                        <li key={item.id} className="flex justify-between gap-2">
                          <span>{item.quantity}x {item.product_name}</span>
                          <span className="font-semibold">{formatCurrency(Number(item.total_price))}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {order.tracking_code ? (
                    <div className="text-sm text-charcoal">
                      <span className="text-muted">Rastreio:</span> <strong className="font-mono">{order.tracking_code}</strong>
                      {order.tracking_status && (
                        <p className="text-xs text-muted mt-1">
                          Status automático: {order.tracking_status}
                          {order.tracking_updated_at ? ` · ${formatDateTime(order.tracking_updated_at)}` : ''}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted">Código de rastreio ainda não disponível.</div>
                  )}

                  {trackingUrl && (
                    <a
                      href={trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline text-sm"
                    >
                      🔍 Rastrear pedido
                    </a>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

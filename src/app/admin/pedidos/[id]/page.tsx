import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/db'
import { formatCurrency, formatDateTime, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/utils'
import type { Metadata } from 'next'
import OrderActions from './OrderActions'

export const metadata: Metadata = { title: 'Detalhes do Pedido' }
export const revalidate = 0

interface OrderItem {
  id: string
  product_name: string
  product_image?: string
  quantity: number
  unit_price: number
  total_price: number
}

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_cpf: string
  address_street: string
  address_number: string
  address_complement?: string
  address_neighborhood: string
  address_city: string
  address_state: string
  address_zip: string
  subtotal: number
  shipping_cost: number
  total: number
  payment_method: string
  payment_status: string
  status: string
  tracking_code?: string
  shipping_service?: string
  created_at: string
  items: OrderItem[]
}

async function getOrder(id: string): Promise<Order | null> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', id)
    .single()
  if (error) return null
  return data as Order
}

interface Props {
  params: { id: string }
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const order = await getOrder(params.id)
  if (!order) notFound()

  const statusInfo = ORDER_STATUS_LABELS[order.status] ?? { label: order.status, color: 'text-muted bg-gray-50' }

  return (
    <div className="p-6 md:p-8 mt-14 md:mt-0 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-display text-3xl font-bold text-charcoal">{order.order_number}</h1>
            <span className={`badge ${statusInfo.color}`}>{statusInfo.label}</span>
          </div>
          <p className="text-muted text-sm">{formatDateTime(order.created_at)}</p>
        </div>
        <a
          href={`https://wa.me/55${order.customer_phone?.replace(/\D/g,'')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-sm"
        >
          💬 WhatsApp cliente
        </a>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-6">
        <div className="bg-white rounded-2xl border border-rose-light p-5">
          <h2 className="font-display text-base font-bold text-charcoal mb-3">👤 Cliente</h2>
          <dl className="space-y-1.5 text-sm">
            <Row label="Nome"     value={order.customer_name} />
            <Row label="E-mail"   value={order.customer_email} />
            <Row label="Telefone" value={order.customer_phone} />
            <Row label="CPF"      value={order.customer_cpf} />
          </dl>
        </div>

        <div className="bg-white rounded-2xl border border-rose-light p-5">
          <h2 className="font-display text-base font-bold text-charcoal mb-3">📍 Endereço de entrega</h2>
          <p className="text-sm text-charcoal">
            {order.address_street}, {order.address_number}
            {order.address_complement ? `, ${order.address_complement}` : ''}<br />
            {order.address_neighborhood} — {order.address_city}/{order.address_state}<br />
            CEP: {order.address_zip}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-rose-light p-5">
          <h2 className="font-display text-base font-bold text-charcoal mb-3">💳 Pagamento</h2>
          <dl className="space-y-1.5 text-sm">
            <Row label="Método"   value={order.payment_method === 'pix' ? '💠 Pix' : '💳 Cartão'} />
            <Row label="Status"   value={PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status} />
            <Row label="Subtotal" value={formatCurrency(Number(order.subtotal))} />
            <Row label="Frete"    value={formatCurrency(Number(order.shipping_cost))} />
            <Row label="Total"    value={formatCurrency(Number(order.total))} bold />
          </dl>
        </div>

        <div className="bg-white rounded-2xl border border-rose-light p-5">
          <h2 className="font-display text-base font-bold text-charcoal mb-3">🚚 Envio e Rastreio</h2>
          {order.tracking_code ? (
            <div>
              <p className="text-sm text-muted mb-0.5">Serviço: <strong className="text-charcoal">{order.shipping_service}</strong></p>
              <p className="text-sm text-muted mb-3">Código: <strong className="text-rose-deep font-mono">{order.tracking_code}</strong></p>
              <a
                href={`https://rastreamento.correios.com.br/app/index.php?objetos=${order.tracking_code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline text-xs"
              >
                🔍 Rastrear nos Correios
              </a>
            </div>
          ) : (
            <p className="text-sm text-muted">Ainda não enviado.</p>
          )}
        </div>
      </div>

      {/* Itens */}
      <div className="bg-white rounded-2xl border border-rose-light overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-rose-light">
          <h2 className="font-display text-base font-bold text-charcoal">🛒 Itens do pedido</h2>
        </div>
        <div className="divide-y divide-rose-light">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="w-12 h-12 rounded-xl bg-rose-pale flex items-center justify-center shrink-0 overflow-hidden">
                {item.product_image
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                  : <span className="text-2xl">🧸</span>}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-charcoal">{item.product_name}</p>
                <p className="text-xs text-muted">Qtd: {item.quantity} × {formatCurrency(Number(item.unit_price))}</p>
              </div>
              <p className="font-bold text-charcoal">{formatCurrency(Number(item.total_price))}</p>
            </div>
          ))}
        </div>
      </div>

      <OrderActions order={order} />
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted">{label}</span>
      <span className={`text-right ${bold ? 'font-bold text-rose-deep' : 'text-charcoal font-medium'}`}>{value}</span>
    </div>
  )
}

import { supabaseAdmin } from '@/lib/db'
import { formatCurrency, formatDateTime, ORDER_STATUS_LABELS } from '@/lib/utils'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Pedidos' }
export const revalidate = 0
export const dynamic = 'force-dynamic'

interface OrderRow {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  total: number
  status: string
  payment_status: string
  payment_method: string
  created_at: string
}

const STATUS_TABS = [
  { value: '',          label: 'Todos' },
  { value: 'pending',   label: '⏳ Pendente' },
  { value: 'paid',      label: '✅ Pago' },
  { value: 'shipped',   label: '🚚 Enviado' },
  { value: 'delivered', label: '📦 Entregue' },
  { value: 'cancelled', label: '❌ Cancelado' },
]

async function getOrders(status?: string) {
  let query = supabaseAdmin
    .from('orders')
    .select('id, order_number, customer_name, customer_email, total, status, payment_status, payment_method, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (status) query = query.eq('status', status)
  const { data } = await query
  return (data ?? []) as OrderRow[]
}

interface Props {
  searchParams: { status?: string }
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const activeStatus = searchParams.status ?? ''
  const orders = await getOrders(activeStatus || undefined)

  return (
    <div className="p-6 md:p-8 mt-14 md:mt-0">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-charcoal">📦 Pedidos</h1>
        <p className="text-muted text-sm mt-1">{orders.length} pedido{orders.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {STATUS_TABS.map(tab => (
          <Link
            key={tab.value}
            href={tab.value ? `/admin/pedidos?status=${tab.value}` : '/admin/pedidos'}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeStatus === tab.value
                ? 'bg-gradient-to-br from-rose-deep to-rose text-white shadow-rose'
                : 'bg-white border border-rose-light text-charcoal hover:border-rose'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-rose-light overflow-hidden">
        {orders.length === 0 ? (
          <div className="text-center py-20 text-muted">
            <span className="text-5xl block mb-3">📦</span>
            <p>Nenhum pedido encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-rose-light bg-rose-pale/50">
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted uppercase tracking-wide">Pedido</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted uppercase tracking-wide hidden md:table-cell">Cliente</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted uppercase tracking-wide hidden lg:table-cell">Data</th>
                  <th className="text-center px-5 py-3 text-xs font-bold text-muted uppercase tracking-wide">Status</th>
                  <th className="text-center px-5 py-3 text-xs font-bold text-muted uppercase tracking-wide hidden sm:table-cell">Pagamento</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-muted uppercase tracking-wide">Total</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-light">
                {orders.map((order) => {
                  const statusInfo = ORDER_STATUS_LABELS[order.status] ?? { label: order.status, color: 'text-muted bg-gray-50' }
                  return (
                    <tr key={order.id} className="hover:bg-rose-pale/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-bold text-rose-deep">{order.order_number}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <p className="text-sm font-medium text-charcoal">{order.customer_name}</p>
                        <p className="text-xs text-muted">{order.customer_email}</p>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className="text-xs text-muted">{formatDateTime(order.created_at)}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`badge text-[10px] ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center hidden sm:table-cell">
                        <span className="text-xs text-muted">
                          {order.payment_method === 'pix' ? '💠 Pix' : '💳 Cartão'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-sm font-bold text-charcoal">{formatCurrency(Number(order.total))}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link href={`/admin/pedidos/${order.id}`} className="text-xs font-semibold text-rose-deep hover:underline">
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

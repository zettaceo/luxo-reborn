import { db } from '@/lib/db'
import { supabaseAdmin } from '@/lib/db'
import { formatCurrency, formatDateTime, ORDER_STATUS_LABELS } from '@/lib/utils'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }
export const revalidate = 60

interface RecentOrder {
  id: string
  order_number: string
  customer_name: string
  total: number
  status: string
  payment_status: string
  created_at: string
}

interface LowStockProduct {
  id: string
  name: string
  stock: number
}

async function getRecentOrders(): Promise<RecentOrder[]> {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, customer_name, total, status, payment_status, created_at')
    .order('created_at', { ascending: false })
    .limit(8)
  return (data ?? []) as RecentOrder[]
}

async function getLowStockProducts(): Promise<LowStockProduct[]> {
  const { data } = await supabaseAdmin
    .from('products')
    .select('id, name, stock')
    .lt('stock', 5)
    .eq('is_active', true)
    .order('stock')
    .limit(5)
  return (data ?? []) as LowStockProduct[]
}

export default async function AdminDashboard() {
  const [stats, recentOrders, lowStock] = await Promise.all([
    db.dashboard.getStats(),
    getRecentOrders(),
    getLowStockProducts(),
  ])

  return (
    <div className="p-6 md:p-8 mt-14 md:mt-0">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-charcoal">Olá! 👋</h1>
        <p className="text-muted text-sm mt-1">Aqui está o resumo da sua loja hoje.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: '💰', label: 'Receita hoje',        value: formatCurrency(stats.revenue_today),  sub: `${stats.total_orders_today} pedido${stats.total_orders_today !== 1 ? 's' : ''}`, color: 'from-rose-deep to-rose' },
          { icon: '📅', label: 'Receita do mês',      value: formatCurrency(stats.revenue_month),  sub: `${stats.total_orders_month} pedidos`,    color: 'from-purple-500 to-purple-400' },
          { icon: '⏳', label: 'Aguardando envio',    value: String(stats.orders_pending),          sub: 'pedidos pagos',                          color: 'from-amber-500 to-amber-400' },
          { icon: '⚠️', label: 'Estoque baixo',       value: String(stats.low_stock_products),      sub: 'produtos < 5 un.',                       color: 'from-red-500 to-red-400' },
        ].map(({ icon, label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-rose-light p-5 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full bg-gradient-to-br ${color} opacity-10 translate-x-6 -translate-y-6`} />
            <span className="text-2xl block mb-2">{icon}</span>
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">{label}</p>
            <p className="font-display text-2xl font-bold text-charcoal">{value}</p>
            <p className="text-xs text-muted mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-rose-light overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-rose-light">
            <h2 className="font-display text-lg font-bold text-charcoal">📦 Pedidos recentes</h2>
            <Link href="/admin/pedidos" className="text-xs font-semibold text-rose-deep hover:underline">Ver todos →</Link>
          </div>
          <div className="divide-y divide-rose-light">
            {recentOrders.length === 0 ? (
              <div className="text-center py-10 text-muted text-sm">Nenhum pedido ainda.</div>
            ) : recentOrders.map((order) => {
              const statusInfo = ORDER_STATUS_LABELS[order.status] ?? { label: order.status, color: 'text-muted bg-gray-50' }
              return (
                <Link key={order.id} href={`/admin/pedidos/${order.id}`} className="flex items-center gap-4 px-6 py-3.5 hover:bg-rose-pale/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-rose-deep">{order.order_number}</span>
                      <span className={`badge text-[10px] px-2 py-0.5 ${statusInfo.color}`}>{statusInfo.label}</span>
                    </div>
                    <p className="text-sm text-charcoal font-medium truncate">{order.customer_name}</p>
                    <p className="text-xs text-muted">{formatDateTime(order.created_at)}</p>
                  </div>
                  <p className="font-display font-bold text-charcoal text-base shrink-0">{formatCurrency(Number(order.total))}</p>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-2xl border border-rose-light overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-rose-light">
            <h2 className="font-display text-lg font-bold text-charcoal">⚠️ Estoque baixo</h2>
            <Link href="/admin/produtos" className="text-xs font-semibold text-rose-deep hover:underline">Gerenciar →</Link>
          </div>
          <div className="divide-y divide-rose-light">
            {lowStock.length === 0 ? (
              <div className="text-center py-10 text-muted text-sm">✅ Estoque OK!</div>
            ) : lowStock.map((p) => (
              <Link key={p.id} href={`/admin/produtos/${p.id}`} className="flex items-center gap-3 px-6 py-3 hover:bg-rose-pale/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-rose-pale flex items-center justify-center text-xl shrink-0">🧸</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charcoal truncate">{p.name}</p>
                  <p className={`text-xs font-bold ${p.stock === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                    {p.stock === 0 ? '❌ Esgotado' : `⚠️ ${p.stock} restante${p.stock !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/admin/produtos/novo',       icon: '➕', label: 'Novo produto' },
          { href: '/admin/pedidos?status=paid', icon: '📦', label: 'Embalar pedidos' },
          { href: '/admin/avaliacoes',          icon: '⭐', label: 'Aprovar avaliações' },
          { href: '/',                          icon: '🛍️', label: 'Ver loja' },
        ].map(({ href, icon, label }) => (
          <Link key={label} href={href} target={href === '/' ? '_blank' : undefined}
            className="bg-white border border-rose-light rounded-xl p-4 text-center hover:border-rose hover:shadow-rose hover:-translate-y-0.5 transition-all">
            <span className="text-2xl block mb-1">{icon}</span>
            <span className="text-xs font-semibold text-charcoal">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

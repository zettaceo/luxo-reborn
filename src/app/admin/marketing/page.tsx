import { supabaseAdmin } from '@/lib/db'
import type { Metadata } from 'next'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Marketing & Conversão' }
export const dynamic = 'force-dynamic'

interface EventRow {
  event_name: string
  session_id?: string | null
  page_path?: string | null
  event_params?: Record<string, unknown>
  created_at: string
}

interface OrderRow {
  id: string
  total: number
  created_at: string
}

function toNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function toRate(current: number, total: number) {
  if (!total) return '0%'
  return `${((current / total) * 100).toFixed(1)}%`
}

async function getMarketingData(days: number) {
  const sinceDate = new Date()
  sinceDate.setDate(sinceDate.getDate() - days)
  const sinceIso = sinceDate.toISOString()

  const [eventsResult, ordersResult] = await Promise.all([
    supabaseAdmin
      .from('analytics_events')
      .select('event_name, session_id, page_path, event_params, created_at')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('orders')
      .select('id, total, created_at')
      .eq('payment_status', 'approved')
      .gte('created_at', sinceIso),
  ])

  const orders = ((ordersResult.data ?? []) as OrderRow[])
  const revenue = orders.reduce((sum, order) => sum + toNumber(order.total), 0)

  if (eventsResult.error) {
    return {
      days,
      eventsTableReady: false,
      errorMessage: eventsResult.error.message,
      sessions: 0,
      viewItem: 0,
      addToCart: 0,
      beginCheckout: 0,
      addShipping: 0,
      addPayment: 0,
      purchase: orders.length,
      checkoutAbandonment: '0%',
      conversionRate: '0%',
      revenue,
      ticketAverage: orders.length ? revenue / orders.length : 0,
      topChannels: [] as Array<{ label: string; purchases: number; revenue: number }>,
      topCampaigns: [] as Array<{ label: string; purchases: number; revenue: number }>,
      topPages: [] as Array<{ label: string; views: number }>,
    }
  }

  const events = (eventsResult.data ?? []) as EventRow[]
  const count = (name: string) => events.filter((event) => event.event_name === name).length

  const sessions = new Set(
    events
      .map((event) => event.session_id)
      .filter((sessionId): sessionId is string => Boolean(sessionId))
  ).size

  const viewItem = count('view_item')
  const addToCart = count('add_to_cart')
  const beginCheckout = count('begin_checkout')
  const addShipping = count('add_shipping_info')
  const addPayment = count('add_payment_info')
  const purchase = orders.length

  const rawPurchaseEvents = events.filter((event) => event.event_name === 'purchase')
  const purchaseMap = new Map<string, EventRow>()
  for (const event of rawPurchaseEvents) {
    const transactionId = String(event.event_params?.transaction_id ?? '')
    if (!transactionId) continue

    const existing = purchaseMap.get(transactionId)
    if (!existing) {
      purchaseMap.set(transactionId, event)
      continue
    }

    const existingSource = String(existing.event_params?.source ?? '')
    const currentSource = String(event.event_params?.source ?? '')
    if (existingSource === 'server_webhook' && currentSource !== 'server_webhook') {
      purchaseMap.set(transactionId, event)
    }
  }
  const purchaseEvents = [...purchaseMap.values()]
  const channelMap = new Map<string, { purchases: number; revenue: number }>()
  const campaignMap = new Map<string, { purchases: number; revenue: number }>()

  for (const purchaseEvent of purchaseEvents) {
    const params = purchaseEvent.event_params ?? {}
    const source = String(params.source ?? '(direct)')
    const medium = String(params.medium ?? '(none)')
    const campaign = String(params.campaign ?? '(not set)')
    const value = toNumber(params.value)

    const channelKey = `${source} / ${medium}`
    const channelCurrent = channelMap.get(channelKey) ?? { purchases: 0, revenue: 0 }
    channelCurrent.purchases += 1
    channelCurrent.revenue += value
    channelMap.set(channelKey, channelCurrent)

    const campaignCurrent = campaignMap.get(campaign) ?? { purchases: 0, revenue: 0 }
    campaignCurrent.purchases += 1
    campaignCurrent.revenue += value
    campaignMap.set(campaign, campaignCurrent)
  }

  const topChannels = [...channelMap.entries()]
    .map(([label, stats]) => ({ label, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const topCampaigns = [...campaignMap.entries()]
    .map(([label, stats]) => ({ label, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const topPagesMap = new Map<string, number>()
  for (const event of events) {
    if (event.event_name !== 'view_item') continue
    const path = event.page_path || '/'
    topPagesMap.set(path, (topPagesMap.get(path) ?? 0) + 1)
  }

  const topPages = [...topPagesMap.entries()]
    .map(([label, views]) => ({ label, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)

  return {
    days,
    eventsTableReady: true,
    errorMessage: '',
    sessions,
    viewItem,
    addToCart,
    beginCheckout,
    addShipping,
    addPayment,
    purchase,
    checkoutAbandonment: beginCheckout ? `${(100 - (purchase / beginCheckout) * 100).toFixed(1)}%` : '0%',
    conversionRate: toRate(purchase, sessions),
    revenue,
    ticketAverage: purchase ? revenue / purchase : 0,
    topChannels,
    topCampaigns,
    topPages,
  }
}

interface Props {
  searchParams: { days?: string }
}

export default async function AdminMarketingPage({ searchParams }: Props) {
  const days = [7, 14, 30, 60].includes(Number(searchParams.days)) ? Number(searchParams.days) : 30
  const data = await getMarketingData(days)

  const cards = [
    { label: 'Sessões', value: String(data.sessions), helper: `Últimos ${days} dias` },
    { label: 'Visualizou produto', value: String(data.viewItem), helper: toRate(data.viewItem, data.sessions) },
    { label: 'Adicionou ao carrinho', value: String(data.addToCart), helper: toRate(data.addToCart, data.viewItem) },
    { label: 'Iniciou checkout', value: String(data.beginCheckout), helper: toRate(data.beginCheckout, data.addToCart) },
    { label: 'Informou frete', value: String(data.addShipping), helper: toRate(data.addShipping, data.beginCheckout) },
    { label: 'Informou pagamento', value: String(data.addPayment), helper: toRate(data.addPayment, data.beginCheckout) },
    { label: 'Compras', value: String(data.purchase), helper: data.conversionRate },
    { label: 'Abandono checkout', value: data.checkoutAbandonment, helper: 'Menor é melhor' },
  ]

  return (
    <div className="p-6 md:p-8 mt-14 md:mt-0">
      <div className="mb-8 flex flex-wrap gap-3 items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-charcoal">📈 Marketing & Conversão</h1>
          <p className="text-muted text-sm mt-1">Painel de aquisição, funil e resultado financeiro.</p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30, 60].map((period) => (
            <a
              key={period}
              href={`/admin/marketing?days=${period}`}
              className={`px-3 py-2 rounded-full text-xs font-semibold transition-all ${
                days === period
                  ? 'bg-gradient-to-br from-rose-deep to-rose text-white shadow-rose'
                  : 'bg-white border border-rose-light text-charcoal hover:border-rose'
              }`}
            >
              {period} dias
            </a>
          ))}
        </div>
      </div>

      {!data.eventsTableReady && (
        <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 text-sm">
          <p className="font-semibold mb-1">Tabela de analytics ainda não criada no Supabase.</p>
          <p>
            Execute o SQL em <code>supabase/analytics.sql</code> para habilitar o painel completo.
            {data.errorMessage ? ` (${data.errorMessage})` : ''}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-rose-light p-5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">{card.label}</p>
            <p className="font-display text-2xl font-bold text-charcoal">{card.value}</p>
            <p className="text-xs text-muted mt-1">{card.helper}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-rose-light p-5">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">Receita</p>
          <p className="font-display text-3xl font-bold text-charcoal">{formatCurrency(data.revenue)}</p>
          <p className="text-xs text-muted mt-2">Compras aprovadas no período selecionado.</p>
        </div>

        <div className="bg-white rounded-2xl border border-rose-light p-5">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">Ticket médio</p>
          <p className="font-display text-3xl font-bold text-charcoal">{formatCurrency(data.ticketAverage)}</p>
          <p className="text-xs text-muted mt-2">Valor médio por pedido aprovado.</p>
        </div>

        <div className="bg-white rounded-2xl border border-rose-light p-5">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">Taxa de conversão</p>
          <p className="font-display text-3xl font-bold text-charcoal">{data.conversionRate}</p>
          <p className="text-xs text-muted mt-2">Compras / sessões.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-rose-light overflow-hidden">
          <div className="px-5 py-4 border-b border-rose-light">
            <h2 className="font-display text-base font-bold text-charcoal">Canais por receita</h2>
          </div>
          <div className="divide-y divide-rose-light">
            {data.topChannels.length === 0 ? (
              <div className="p-5 text-sm text-muted">Sem dados ainda.</div>
            ) : data.topChannels.map((row) => (
              <div key={row.label} className="px-5 py-3.5 text-sm flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-charcoal">{row.label}</p>
                  <p className="text-xs text-muted">{row.purchases} compra(s)</p>
                </div>
                <p className="font-bold text-rose-deep">{formatCurrency(row.revenue)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-rose-light overflow-hidden">
          <div className="px-5 py-4 border-b border-rose-light">
            <h2 className="font-display text-base font-bold text-charcoal">Campanhas por receita</h2>
          </div>
          <div className="divide-y divide-rose-light">
            {data.topCampaigns.length === 0 ? (
              <div className="p-5 text-sm text-muted">Sem dados ainda.</div>
            ) : data.topCampaigns.map((row) => (
              <div key={row.label} className="px-5 py-3.5 text-sm flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-charcoal">{row.label}</p>
                  <p className="text-xs text-muted">{row.purchases} compra(s)</p>
                </div>
                <p className="font-bold text-rose-deep">{formatCurrency(row.revenue)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-rose-light overflow-hidden">
          <div className="px-5 py-4 border-b border-rose-light">
            <h2 className="font-display text-base font-bold text-charcoal">Páginas de produto mais vistas</h2>
          </div>
          <div className="divide-y divide-rose-light">
            {data.topPages.length === 0 ? (
              <div className="p-5 text-sm text-muted">Sem dados ainda.</div>
            ) : data.topPages.map((row) => (
              <div key={row.label} className="px-5 py-3.5 text-sm flex items-center justify-between gap-3">
                <p className="font-medium text-charcoal truncate">{row.label}</p>
                <p className="font-bold text-rose-deep">{row.views}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

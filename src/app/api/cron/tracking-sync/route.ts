import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { getTrackingInfo } from '@/lib/shipping/tracking'

function isAuthorized(req: NextRequest) {
  const secret = process.env.TRACKING_SYNC_SECRET
  if (!secret) return false

  const auth = req.headers.get('authorization') ?? ''
  if (!auth.startsWith('Bearer ')) return false
  return auth.slice(7) === secret
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('id, status, tracking_code, notes')
      .eq('status', 'shipped')
      .not('tracking_code', 'is', null)
      .limit(100)

    if (error) throw error

    let checked = 0
    let delivered = 0

    for (const order of orders ?? []) {
      if (!order.tracking_code) continue
      checked += 1

      const tracking = await getTrackingInfo(order.tracking_code)
      if (!tracking?.delivered) continue

      const notePrefix = order.notes ? `${order.notes}\n` : ''
      const note = `[rastreamento automático] Pedido marcado como entregue (${tracking.description})`

      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'delivered',
          notes: `${notePrefix}${note}`.slice(-2000),
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id)

      if (!updateError) delivered += 1
    }

    return NextResponse.json({ ok: true, checked, delivered })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao sincronizar rastreios'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

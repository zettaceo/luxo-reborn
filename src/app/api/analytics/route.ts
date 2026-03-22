import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

const ALLOWED_EVENTS = new Set([
  'session_start',
  'view_item',
  'select_item',
  'add_to_cart',
  'begin_checkout',
  'add_shipping_info',
  'add_payment_info',
  'purchase',
  'payment_failed',
  'purchase_confirmation_view',
])

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const eventName = typeof body?.event_name === 'string' ? body.event_name : ''

    if (!ALLOWED_EVENTS.has(eventName)) {
      return NextResponse.json({ ok: true })
    }

    const sessionId = typeof body?.session_id === 'string' ? body.session_id.slice(0, 64) : null
    const pagePath = typeof body?.page_path === 'string' ? body.page_path.slice(0, 255) : null
    const referrer = typeof body?.referrer === 'string' ? body.referrer.slice(0, 255) : null
    const params = typeof body?.event_params === 'object' && body.event_params !== null
      ? body.event_params
      : {}

    const { error } = await supabaseAdmin
      .from('analytics_events')
      .insert({
        event_name: eventName,
        event_params: params,
        session_id: sessionId,
        page_path: pagePath,
        referrer,
        user_agent: req.headers.get('user-agent'),
      })

    if (error) {
      // Tabela pode não existir em ambientes não migrados; não quebrar jornada de compra.
      console.warn('analytics insert warning:', error.message)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}

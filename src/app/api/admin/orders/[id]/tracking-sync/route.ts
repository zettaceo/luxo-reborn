import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { isAdminRequest } from '@/lib/auth/admin'
import { getTrackingInfo } from '@/lib/shipping/tracking'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('id, status, tracking_code, notes')
      .eq('id', params.id)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })
    }

    if (!order.tracking_code) {
      return NextResponse.json({ error: 'Pedido sem código de rastreio.' }, { status: 400 })
    }

    const tracking = await getTrackingInfo(order.tracking_code)
    if (!tracking) {
      return NextResponse.json({ error: 'Não foi possível consultar o rastreio agora.' }, { status: 502 })
    }

    const notesPrefix = order.notes ? `${order.notes}\n` : ''
    const trackingNote = `[rastreamento automático] ${tracking.description}${tracking.updated_at ? ` (${tracking.updated_at})` : ''}`
    const nextStatus = tracking.delivered
      ? 'delivered'
      : order.status === 'paid'
        ? 'shipped'
        : order.status

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: nextStatus,
        notes: `${notesPrefix}${trackingNote}`.slice(-2000),
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    if (updateError) throw updateError

    return NextResponse.json({ ok: true, tracking, status: nextStatus })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao sincronizar rastreio.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

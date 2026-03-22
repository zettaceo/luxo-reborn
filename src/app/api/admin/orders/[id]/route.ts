import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status, tracking_code, shipping_service } = await req.json()

    const { error } = await supabaseAdmin
      .from('orders')
      .update({
        status,
        tracking_code:    tracking_code || null,
        shipping_service: shipping_service || null,
        updated_at:       new Date().toISOString(),
      })
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar pedido' }, { status: 500 })
  }
}

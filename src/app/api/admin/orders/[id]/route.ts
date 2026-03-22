import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status, tracking_code, shipping_service } = await req.json()
    const updates: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
    }

    if (typeof status === 'string' && status) {
      updates.status = status
    }

    if (tracking_code !== undefined) {
      updates.tracking_code = tracking_code || null
    }

    if (shipping_service !== undefined) {
      updates.shipping_service = shipping_service || null
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update(updates)
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar pedido' }, { status: 500 })
  }
}

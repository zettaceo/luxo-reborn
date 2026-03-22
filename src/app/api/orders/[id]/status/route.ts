import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

// GET /api/orders/[id]/status — verifica status do pedido (usado pelo polling do Pix)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, status, payment_status')
      .eq('id', params.id)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }
}

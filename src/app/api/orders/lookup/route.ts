import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { getTrackingInfo } from '@/lib/shipping/tracking'

interface LookupBody {
  email?: string
  orderNumber?: string
  cpfPartial?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LookupBody
    const email = (body.email ?? '').trim().toLowerCase()
    const orderNumber = (body.orderNumber ?? '').trim().toUpperCase()
    const cpfPartial = (body.cpfPartial ?? '').replace(/\D/g, '')

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 })
    }
    if (!orderNumber) {
      return NextResponse.json({ error: 'Informe o número do pedido.' }, { status: 400 })
    }
    if (cpfPartial.length !== 4) {
      return NextResponse.json({ error: 'Informe os 4 últimos dígitos do CPF.' }, { status: 400 })
    }

    const query = supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        payment_status,
        payment_method,
        total,
        shipping_service,
        tracking_code,
        created_at,
        address_city,
        address_state,
        customer_cpf,
        items:order_items(
          id,
          product_name,
          quantity,
          total_price
        )
      `)
      .ilike('customer_email', email)
      .eq('order_number', orderNumber)
      .like('customer_cpf', `%${cpfPartial}`)
      .order('created_at', { ascending: false })
      .limit(1)

    const { data, error } = await query
    if (error) throw error

    const enriched = await Promise.all(
      (data ?? []).map(async (order) => {
        const { customer_cpf: _ignoredCpf, ...safeOrder } = order
        if (!safeOrder.tracking_code) return safeOrder
        const tracking = await getTrackingInfo(safeOrder.tracking_code)
        if (!tracking) return safeOrder
        return {
          ...safeOrder,
          tracking_status: tracking.description,
          tracking_updated_at: tracking.updated_at ?? null,
          tracking_delivered: tracking.delivered,
        }
      })
    )

    return NextResponse.json({ data: enriched })
  } catch {
    return NextResponse.json({ error: 'Não foi possível consultar os pedidos.' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

interface LookupBody {
  email?: string
  orderNumber?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LookupBody
    const email = (body.email ?? '').trim().toLowerCase()
    const orderNumber = (body.orderNumber ?? '').trim().toUpperCase()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 })
    }

    let query = supabaseAdmin
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
        items:order_items(
          id,
          product_name,
          quantity,
          total_price
        )
      `)
      .ilike('customer_email', email)
      .order('created_at', { ascending: false })
      .limit(10)

    if (orderNumber) query = query.eq('order_number', orderNumber)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Não foi possível consultar os pedidos.' }, { status: 500 })
  }
}

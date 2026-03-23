import { NextRequest, NextResponse } from 'next/server'
import { getCustomerSessionFromRequest } from '@/lib/auth/customer'
import { getTrackingInfo } from '@/lib/shipping/tracking'
import { supabaseAdmin } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getCustomerSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const safeEmail = session.email.replace(/,/g, '')

    const { data, error } = await supabaseAdmin
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
      .or(`customer_id.eq.${session.customerId},customer_email.ilike.${safeEmail}`)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) throw error

    const enriched = await Promise.all(
      (data ?? []).map(async (order) => {
        if (!order.tracking_code) return order
        const tracking = await getTrackingInfo(order.tracking_code)
        if (!tracking) return order
        return {
          ...order,
          tracking_status: tracking.description,
          tracking_updated_at: tracking.updated_at ?? null,
          tracking_delivered: tracking.delivered,
        }
      })
    )

    return NextResponse.json({ data: enriched })
  } catch (error) {
    console.error('Erro ao listar pedidos da conta:', error)
    return NextResponse.json({ error: 'Não foi possível carregar seus pedidos.' }, { status: 500 })
  }
}

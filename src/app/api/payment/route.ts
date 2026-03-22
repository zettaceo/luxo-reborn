import { NextRequest, NextResponse } from 'next/server'
import { createPixPayment, createCardPayment } from '@/lib/mercadopago'
import { db } from '@/lib/db'
import { supabaseAdmin } from '@/lib/db'

// POST /api/payment — cria pagamento e pedido
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { order, payment_method, card_token, card_installments } = body

    // 1. Cria o pedido no banco (status pending)
    const newOrder = await db.orders.create({
      customer_name:        order.customer_name,
      customer_email:       order.customer_email,
      customer_phone:       order.customer_phone,
      customer_cpf:         order.customer_cpf,
      address_zip:          order.address_zip,
      address_street:       order.address_street,
      address_number:       order.address_number,
      address_complement:   order.address_complement,
      address_neighborhood: order.address_neighborhood,
      address_city:         order.address_city,
      address_state:        order.address_state,
      subtotal:             order.subtotal,
      shipping_cost:        order.shipping_cost,
      shipping_service:     order.shipping_service ?? null,
      total:                order.total,
      payment_method,
      payment_status: 'pending',
      status: 'pending',
    })

    // 2. Salva os itens do pedido
    const items = order.items.map((item: {
      product: { id: string; name: string; images?: { url: string }[]; price: number }
      quantity: number
    }) => ({
      order_id:      newOrder.id,
      product_id:    item.product.id,
      product_name:  item.product.name,
      product_image: item.product.images?.[0]?.url,
      quantity:      item.quantity,
      unit_price:    item.product.price,
      total_price:   item.product.price * item.quantity,
    }))

    await supabaseAdmin.from('order_items').insert(items)

    // 3. Processa o pagamento
    if (payment_method === 'pix') {
      const pix = await createPixPayment({
        orderId:       newOrder.id,
        orderNumber:   newOrder.order_number,
        total:         newOrder.total,
        customerName:  order.customer_name,
        customerEmail: order.customer_email,
        customerCpf:   order.customer_cpf,
        items:         order.items,
      })

      // Salva dados do Pix no pedido
      await supabaseAdmin.from('orders').update({
        payment_id:         pix.paymentId,
        pix_qr_code:        pix.qrCode,
        pix_qr_code_base64: pix.qrCodeBase64,
        pix_expiration:     pix.expiresAt,
      }).eq('id', newOrder.id)

      return NextResponse.json({
        order_id:           newOrder.id,
        order_number:       newOrder.order_number,
        payment_method:     'pix',
        pix_qr_code:        pix.qrCode,
        pix_qr_code_base64: pix.qrCodeBase64,
        pix_expiration:     pix.expiresAt,
        total:              newOrder.total,
      })
    }

    if (payment_method === 'credit_card' || payment_method === 'debit_card') {
      const card = await createCardPayment({
        orderId:       newOrder.id,
        orderNumber:   newOrder.order_number,
        total:         newOrder.total,
        installments:  card_installments ?? 1,
        token:         card_token,
        customerName:  order.customer_name,
        customerEmail: order.customer_email,
        customerCpf:   order.customer_cpf,
        items:         order.items,
      })

      const isPaid = card.status === 'approved'

      await supabaseAdmin.from('orders').update({
        payment_id:     card.paymentId,
        payment_status: card.status ?? 'pending',
        status:         isPaid ? 'paid' : 'pending',
      }).eq('id', newOrder.id)

      return NextResponse.json({
        order_id:      newOrder.id,
        order_number:  newOrder.order_number,
        payment_method,
        status:        card.status,
        status_detail: card.statusDetail,
        approved:      isPaid,
      })
    }

    return NextResponse.json({ error: 'Método de pagamento inválido' }, { status: 400 })

  } catch (error) {
    console.error('Erro no pagamento:', error)
    return NextResponse.json({ error: 'Erro ao processar pagamento' }, { status: 500 })
  }
}

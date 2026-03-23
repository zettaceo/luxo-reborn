import { NextRequest, NextResponse } from 'next/server'
import { createPixPayment, createCardPayment } from '@/lib/mercadopago'
import { db } from '@/lib/db'
import { supabaseAdmin } from '@/lib/db'
import { calculateShippingQuotes } from '@/lib/shipping/quote'

type CheckoutItemInput = {
  product?: { id?: string }
  quantity?: number
}

function normalizeItems(items: unknown): Array<{ productId: string; quantity: number }> {
  if (!Array.isArray(items) || items.length === 0) return []

  return items
    .map((raw) => raw as CheckoutItemInput)
    .map((item) => ({
      productId: item.product?.id?.trim() ?? '',
      quantity: Number(item.quantity ?? 0),
    }))
    .filter((item) => item.productId && Number.isInteger(item.quantity) && item.quantity > 0)
}

function sanitizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

// POST /api/payment — cria pagamento e pedido
export async function POST(req: NextRequest) {
  try {
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN || !process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY) {
      return NextResponse.json(
        { error: 'Checkout temporariamente indisponível. Loja em modo catálogo.' },
        { status: 503 }
      )
    }

    const body = await req.json()
    const { order, payment_method, card_token, card_installments } = body
    const paymentMethod = sanitizeText(payment_method)

    const customerName = sanitizeText(order?.customer_name)
    const customerEmail = sanitizeText(order?.customer_email).toLowerCase()
    const customerPhone = sanitizeText(order?.customer_phone)
    const customerCpf = sanitizeText(order?.customer_cpf).replace(/\D/g, '')
    const addressZip = sanitizeText(order?.address_zip).replace(/\D/g, '')
    const addressStreet = sanitizeText(order?.address_street)
    const addressNumber = sanitizeText(order?.address_number)
    const addressComplement = sanitizeText(order?.address_complement)
    const addressNeighborhood = sanitizeText(order?.address_neighborhood)
    const addressCity = sanitizeText(order?.address_city)
    const addressState = sanitizeText(order?.address_state).toUpperCase()
    const shippingService = sanitizeText(order?.shipping_service)

    if (!customerName || !customerEmail || !customerPhone || customerCpf.length !== 11) {
      return NextResponse.json({ error: 'Dados do cliente inválidos.' }, { status: 400 })
    }

    if (!addressZip || !addressStreet || !addressNumber || !addressNeighborhood || !addressCity || !addressState) {
      return NextResponse.json({ error: 'Dados de entrega inválidos.' }, { status: 400 })
    }

    const normalizedItems = normalizeItems(order?.items)
    if (normalizedItems.length === 0) {
      return NextResponse.json({ error: 'Carrinho inválido.' }, { status: 400 })
    }
    if (!Array.isArray(order?.items) || normalizedItems.length !== order.items.length) {
      return NextResponse.json({ error: 'Itens inválidos no carrinho.' }, { status: 400 })
    }

    if (!['pix', 'credit_card', 'debit_card'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Método de pagamento inválido.' }, { status: 400 })
    }

    const productIds = Array.from(new Set(normalizedItems.map((item) => item.productId)))
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, price, stock, is_active, weight_grams, images:product_images(url, is_cover, position)')
      .in('id', productIds)

    if (productsError) throw productsError
    if (!products || products.length !== productIds.length) {
      return NextResponse.json({ error: 'Um ou mais produtos não foram encontrados.' }, { status: 400 })
    }

    const productsById = new Map(products.map((product) => [product.id, product]))

    const trustedItems = normalizedItems.map((item) => {
      const product = productsById.get(item.productId)
      if (!product) throw new Error('Produto não encontrado')
      if (!product.is_active) throw new Error(`Produto "${product.name}" está inativo.`)
      if (Number(product.stock) < item.quantity) throw new Error(`Estoque insuficiente para "${product.name}".`)

      const unitPrice = Number(product.price)
      const coverImage = Array.isArray(product.images)
        ? product.images.find((img: { is_cover?: boolean; url?: string }) => img.is_cover)?.url ?? product.images[0]?.url
        : undefined

      return {
        product_id: product.id,
        product_name: product.name,
        unit_price: unitPrice,
        quantity: item.quantity,
        total_price: unitPrice * item.quantity,
        product_image: coverImage,
        weight_grams: Number(product.weight_grams ?? 500),
      }
    })

    const shippingQuotes = await calculateShippingQuotes({
      destinationZip: addressZip,
      items: trustedItems.map((item) => ({
        id: item.product_id,
        name: item.product_name,
        quantity: item.quantity,
        weight_grams: item.weight_grams,
        price: item.unit_price,
      })),
    })

    const selectedShipping = shippingQuotes.find(
      (option) => option.service === shippingService || option.name === shippingService
    )
    if (!selectedShipping) {
      return NextResponse.json({ error: 'Frete inválido ou expirado. Recalcule o frete.' }, { status: 400 })
    }

    const subtotal = trustedItems.reduce((sum, item) => sum + item.total_price, 0)
    const total = subtotal + selectedShipping.price

    const cardToken = sanitizeText(card_token)
    if ((paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && !cardToken) {
      return NextResponse.json({ error: 'Token do cartão inválido.' }, { status: 400 })
    }

    // 1. Cria o pedido no banco (status pending)
    const newOrder = await db.orders.create({
      customer_name:        customerName,
      customer_email:       customerEmail,
      customer_phone:       customerPhone,
      customer_cpf:         customerCpf,
      address_zip:          addressZip,
      address_street:       addressStreet,
      address_number:       addressNumber,
      address_complement:   addressComplement || null,
      address_neighborhood: addressNeighborhood,
      address_city:         addressCity,
      address_state:        addressState,
      subtotal,
      shipping_cost:        selectedShipping.price,
      shipping_service:     selectedShipping.name,
      total,
      payment_method: paymentMethod,
      payment_status: 'pending',
      status: 'pending',
    })

    // 2. Salva os itens do pedido
    const items = trustedItems.map((item) => ({
      order_id:      newOrder.id,
      product_id:    item.product_id,
      product_name:  item.product_name,
      product_image: item.product_image,
      quantity:      item.quantity,
      unit_price:    item.unit_price,
      total_price:   item.total_price,
    }))

    const { error: itemsError } = await supabaseAdmin.from('order_items').insert(items)
    if (itemsError) throw itemsError

    // 3. Processa o pagamento
    if (paymentMethod === 'pix') {
      const pix = await createPixPayment({
        orderId:       newOrder.id,
        orderNumber:   newOrder.order_number,
        total:         total,
        customerName:  customerName,
        customerEmail: customerEmail,
        customerCpf:   customerCpf,
        items:         trustedItems.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          unit_price: item.unit_price,
          quantity: item.quantity,
        })),
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
        total,
      })
    }

    if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
      const installments = Number(card_installments)
      const card = await createCardPayment({
        orderId:       newOrder.id,
        orderNumber:   newOrder.order_number,
        total,
        installments:  Number.isInteger(installments) && installments > 0 ? installments : 1,
        token:         cardToken,
        customerName:  customerName,
        customerEmail: customerEmail,
        customerCpf:   customerCpf,
        items:         trustedItems.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          unit_price: item.unit_price,
          quantity: item.quantity,
        })),
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
        payment_method: paymentMethod,
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

// ══════════════════════════════════════════════
// WEBHOOK — Mercado Pago
// Confirma pagamento automaticamente
// ══════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPaymentStatus, isValidWebhook } from '@/lib/mercadopago'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-signature') ?? ''

    // Valida a assinatura do webhook
    if (!isValidWebhook(signature, body)) {
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
    }

    const data = JSON.parse(body)

    // Mercado Pago envia vários tipos de notificação
    if (data.type !== 'payment') {
      return NextResponse.json({ ok: true }) // ignora outros tipos
    }

    const paymentId = data.data?.id?.toString()
    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID não encontrado' }, { status: 400 })
    }

    // Busca o status real no Mercado Pago
    const { status, externalReference } = await getPaymentStatus(paymentId)

    if (!externalReference) {
      return NextResponse.json({ error: 'Order ID não encontrado' }, { status: 400 })
    }

    // Atualiza o pedido no banco
    await db.orders.updatePaymentStatus(paymentId, status ?? 'pending', externalReference)

    console.log(`✅ Webhook: Pedido ${externalReference} → ${status}`)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro no webhook:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

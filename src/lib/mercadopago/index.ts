// ══════════════════════════════════════════════
// MERCADO PAGO — Pix + Cartão de Crédito
// ══════════════════════════════════════════════

import MercadoPagoConfig, { Payment } from 'mercadopago'

interface PaymentItem {
  product_id: string
  product_name: string
  unit_price: number
  quantity: number
}

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: { timeout: 5000 },
})

const payment = new Payment(client)

// ── CRIAR PAGAMENTO PIX ──────────────────────
export async function createPixPayment(order: {
  orderId: string
  orderNumber: string
  total: number
  customerName: string
  customerEmail: string
  customerCpf: string
  items: PaymentItem[]
}) {
  const result = await payment.create({
    body: {
      transaction_amount: order.total,
      description: `Pedido ${order.orderNumber} — Luxo Reborn`,
      payment_method_id: 'pix',
      payer: {
        email: order.customerEmail,
        first_name: order.customerName.split(' ')[0],
        last_name: order.customerName.split(' ').slice(1).join(' '),
        identification: {
          type: 'CPF',
          number: order.customerCpf.replace(/\D/g,''),
        },
      },
      date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
      external_reference: order.orderId,
      metadata: {
        order_id: order.orderId,
        order_number: order.orderNumber,
      },
    }
  })

  const pixData = result.point_of_interaction?.transaction_data

  return {
    paymentId: result.id!.toString(),
    status: result.status,
    qrCode: pixData?.qr_code ?? '',
    qrCodeBase64: pixData?.qr_code_base64 ?? '',
    expiresAt: result.date_of_expiration,
  }
}

// ── CRIAR PAGAMENTO CARTÃO ───────────────────
export async function createCardPayment(order: {
  orderId: string
  orderNumber: string
  total: number
  installments: number
  token: string                // token gerado pelo SDK JS do MP no frontend
  customerName: string
  customerEmail: string
  customerCpf: string
  items: PaymentItem[]
}) {
  const result = await payment.create({
    body: {
      transaction_amount: order.total,
      description: `Pedido ${order.orderNumber} — Luxo Reborn`,
      installments: order.installments,
      token: order.token,
      payment_method_id: 'visa', // será sobrescrito pelo token
      payer: {
        email: order.customerEmail,
        identification: {
          type: 'CPF',
          number: order.customerCpf.replace(/\D/g,''),
        },
      },
      external_reference: order.orderId,
      metadata: {
        order_id: order.orderId,
        order_number: order.orderNumber,
      },
    }
  })

  return {
    paymentId: result.id!.toString(),
    status: result.status,
    statusDetail: result.status_detail,
  }
}

// ── VERIFICAR STATUS ─────────────────────────
export async function getPaymentStatus(paymentId: string) {
  const result = await payment.get({ id: paymentId })
  return {
    status: result.status,
    statusDetail: result.status_detail,
    externalReference: result.external_reference,
  }
}

// ── CALCULAR PARCELAS ────────────────────────
// Sem juros até 3x, com juros de 1,99% ao mês acima
export function calculateInstallments(total: number) {
  return Array.from({ length: 12 }, (_, i) => {
    const n = i + 1
    let installmentValue: number
    let label: string

    if (n <= 3) {
      installmentValue = total / n
      label = `${n}x de R$ ${installmentValue.toFixed(2).replace('.',',')} sem juros`
    } else {
      const rate = 0.0199
      installmentValue = (total * rate * Math.pow(1+rate, n)) / (Math.pow(1+rate,n) - 1)
      label = `${n}x de R$ ${installmentValue.toFixed(2).replace('.',',')} com juros`
    }

    return {
      installments: n,
      installment_amount: installmentValue,
      total_amount: installmentValue * n,
      label,
    }
  })
}

// ── VALIDAR WEBHOOK ──────────────────────────
export function isValidWebhook(signature: string, body: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) return false

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require('crypto') as typeof import('crypto')
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
  const normalizedSignature = signature
    .split(',')
    .map((part) => part.trim())
    .find((part) => part.startsWith('v1='))
    ?.replace('v1=', '') ?? signature.trim()

  const incoming = Buffer.from(normalizedSignature)
  const local = Buffer.from(expected)
  if (incoming.length !== local.length) return false
  return crypto.timingSafeEqual(incoming, local)
}

import { NextRequest, NextResponse } from 'next/server'
import { getCustomerSessionFromRequest } from '@/lib/auth/customer'
import { supabaseAdmin } from '@/lib/db'

const ALLOWED_TYPES = new Set(['pix', 'credit_card', 'debit_card', 'boleto', 'wallet'])

function sanitizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function GET(req: NextRequest) {
  try {
    const session = await getCustomerSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from('customer_payment_methods')
      .select('id, type, label, holder_name, brand, last4, token_reference, is_default, created_at, updated_at')
      .eq('customer_id', session.customerId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ data: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Não foi possível carregar as formas de pagamento.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCustomerSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const body = await req.json()
    const type = sanitizeText(body?.type)
    const label = sanitizeText(body?.label)
    const holderName = sanitizeText(body?.holder_name)
    const brand = sanitizeText(body?.brand)
    const last4 = sanitizeText(body?.last4).replace(/\D/g, '').slice(0, 4)
    const tokenReference = sanitizeText(body?.token_reference)
    const requestedDefault = Boolean(body?.is_default)

    if (!ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: 'Tipo de pagamento inválido.' }, { status: 400 })
    }
    if (!label) {
      return NextResponse.json({ error: 'Informe um apelido para esta forma de pagamento.' }, { status: 400 })
    }

    const { count, error: countError } = await supabaseAdmin
      .from('customer_payment_methods')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', session.customerId)
    if (countError) throw countError

    const shouldBeDefault = requestedDefault || (count ?? 0) === 0
    if (shouldBeDefault) {
      await supabaseAdmin
        .from('customer_payment_methods')
        .update({ is_default: false })
        .eq('customer_id', session.customerId)
    }

    const { data, error } = await supabaseAdmin
      .from('customer_payment_methods')
      .insert({
        customer_id: session.customerId,
        type,
        label,
        holder_name: holderName || null,
        brand: brand || null,
        last4: last4 || null,
        token_reference: tokenReference || null,
        is_default: shouldBeDefault,
      })
      .select('id, type, label, holder_name, brand, last4, token_reference, is_default, created_at, updated_at')
      .single()

    if (error) throw error
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Erro ao salvar forma de pagamento:', error)
    return NextResponse.json({ error: 'Não foi possível salvar a forma de pagamento.' }, { status: 500 })
  }
}

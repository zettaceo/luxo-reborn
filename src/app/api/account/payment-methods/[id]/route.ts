import { NextRequest, NextResponse } from 'next/server'
import { getCustomerSessionFromRequest } from '@/lib/auth/customer'
import { supabaseAdmin } from '@/lib/db'

const ALLOWED_TYPES = new Set(['pix', 'credit_card', 'debit_card', 'boleto', 'wallet'])

function sanitizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

interface Params {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getCustomerSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const type = sanitizeText(body?.type)
    const label = sanitizeText(body?.label)
    const holderName = sanitizeText(body?.holder_name)
    const brand = sanitizeText(body?.brand)
    const last4 = sanitizeText(body?.last4).replace(/\D/g, '').slice(0, 4)
    const tokenReference = sanitizeText(body?.token_reference)
    const shouldBeDefault = Boolean(body?.is_default)

    if (!ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: 'Tipo de pagamento inválido.' }, { status: 400 })
    }
    if (!label) {
      return NextResponse.json({ error: 'Informe um apelido para esta forma de pagamento.' }, { status: 400 })
    }

    if (shouldBeDefault) {
      await supabaseAdmin
        .from('customer_payment_methods')
        .update({ is_default: false })
        .eq('customer_id', session.customerId)
    }

    const { data, error } = await supabaseAdmin
      .from('customer_payment_methods')
      .update({
        type,
        label,
        holder_name: holderName || null,
        brand: brand || null,
        last4: last4 || null,
        token_reference: tokenReference || null,
        is_default: shouldBeDefault,
      })
      .eq('id', id)
      .eq('customer_id', session.customerId)
      .select('id, type, label, holder_name, brand, last4, token_reference, is_default, created_at, updated_at')
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Erro ao atualizar forma de pagamento:', error)
    return NextResponse.json({ error: 'Não foi possível atualizar a forma de pagamento.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getCustomerSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { id } = await params

    const { data: target, error: targetError } = await supabaseAdmin
      .from('customer_payment_methods')
      .select('id, is_default')
      .eq('id', id)
      .eq('customer_id', session.customerId)
      .single()

    if (targetError || !target) {
      return NextResponse.json({ error: 'Forma de pagamento não encontrada.' }, { status: 404 })
    }

    const { error: deleteError } = await supabaseAdmin
      .from('customer_payment_methods')
      .delete()
      .eq('id', id)
      .eq('customer_id', session.customerId)
    if (deleteError) throw deleteError

    if (target.is_default) {
      const { data: fallback } = await supabaseAdmin
        .from('customer_payment_methods')
        .select('id')
        .eq('customer_id', session.customerId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (fallback?.id) {
        await supabaseAdmin
          .from('customer_payment_methods')
          .update({ is_default: true })
          .eq('id', fallback.id)
          .eq('customer_id', session.customerId)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao excluir forma de pagamento:', error)
    return NextResponse.json({ error: 'Não foi possível excluir a forma de pagamento.' }, { status: 500 })
  }
}

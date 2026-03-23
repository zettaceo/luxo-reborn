import { NextRequest, NextResponse } from 'next/server'
import { getCustomerSessionFromRequest } from '@/lib/auth/customer'
import { supabaseAdmin } from '@/lib/db'

function sanitizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeState(value: string) {
  return value.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()
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
    const label = sanitizeText(body?.label) || 'Endereço'
    const recipientName = sanitizeText(body?.recipient_name)
    const phone = sanitizeText(body?.phone)
    const zip = sanitizeText(body?.zip).replace(/\D/g, '')
    const street = sanitizeText(body?.street)
    const number = sanitizeText(body?.number)
    const complement = sanitizeText(body?.complement)
    const neighborhood = sanitizeText(body?.neighborhood)
    const city = sanitizeText(body?.city)
    const state = normalizeState(sanitizeText(body?.state))
    const shouldBeDefault = Boolean(body?.is_default)

    if (!recipientName || !zip || !street || !number || !neighborhood || !city || state.length !== 2) {
      return NextResponse.json({ error: 'Preencha os campos obrigatórios do endereço.' }, { status: 400 })
    }

    if (shouldBeDefault) {
      await supabaseAdmin
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', session.customerId)
    }

    const { data, error } = await supabaseAdmin
      .from('customer_addresses')
      .update({
        label,
        recipient_name: recipientName,
        phone: phone || null,
        zip,
        street,
        number,
        complement: complement || null,
        neighborhood,
        city,
        state,
        is_default: shouldBeDefault,
      })
      .eq('id', id)
      .eq('customer_id', session.customerId)
      .select('id, label, recipient_name, phone, zip, street, number, complement, neighborhood, city, state, is_default, created_at, updated_at')
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Erro ao atualizar endereço:', error)
    return NextResponse.json({ error: 'Não foi possível atualizar o endereço.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getCustomerSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { id } = await params

    const { data: target, error: targetError } = await supabaseAdmin
      .from('customer_addresses')
      .select('id, is_default')
      .eq('id', id)
      .eq('customer_id', session.customerId)
      .single()

    if (targetError || !target) {
      return NextResponse.json({ error: 'Endereço não encontrado.' }, { status: 404 })
    }

    const { error: deleteError } = await supabaseAdmin
      .from('customer_addresses')
      .delete()
      .eq('id', id)
      .eq('customer_id', session.customerId)

    if (deleteError) throw deleteError

    if (target.is_default) {
      const { data: fallback } = await supabaseAdmin
        .from('customer_addresses')
        .select('id')
        .eq('customer_id', session.customerId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (fallback?.id) {
        await supabaseAdmin
          .from('customer_addresses')
          .update({ is_default: true })
          .eq('id', fallback.id)
          .eq('customer_id', session.customerId)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao excluir endereço:', error)
    return NextResponse.json({ error: 'Não foi possível excluir o endereço.' }, { status: 500 })
  }
}

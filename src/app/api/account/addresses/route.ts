import { NextRequest, NextResponse } from 'next/server'
import { getCustomerSessionFromRequest } from '@/lib/auth/customer'
import { supabaseAdmin } from '@/lib/db'

function sanitizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeState(value: string) {
  return value.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()
}

export async function GET(req: NextRequest) {
  try {
    const session = await getCustomerSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from('customer_addresses')
      .select('id, label, recipient_name, phone, zip, street, number, complement, neighborhood, city, state, is_default, created_at, updated_at')
      .eq('customer_id', session.customerId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ data: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Não foi possível carregar os endereços.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCustomerSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

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
    const requestedDefault = Boolean(body?.is_default)

    if (!recipientName || !zip || !street || !number || !neighborhood || !city || state.length !== 2) {
      return NextResponse.json({ error: 'Preencha os campos obrigatórios do endereço.' }, { status: 400 })
    }

    const { count, error: countError } = await supabaseAdmin
      .from('customer_addresses')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', session.customerId)

    if (countError) throw countError

    const shouldBeDefault = requestedDefault || (count ?? 0) === 0
    if (shouldBeDefault) {
      await supabaseAdmin
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', session.customerId)
    }

    const { data, error } = await supabaseAdmin
      .from('customer_addresses')
      .insert({
        customer_id: session.customerId,
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
      .select('id, label, recipient_name, phone, zip, street, number, complement, neighborhood, city, state, is_default, created_at, updated_at')
      .single()

    if (error) throw error
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar endereço:', error)
    return NextResponse.json({ error: 'Não foi possível salvar o endereço.' }, { status: 500 })
  }
}

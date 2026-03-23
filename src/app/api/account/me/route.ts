import { NextRequest, NextResponse } from 'next/server'
import { getCustomerSessionFromRequest, setCustomerSessionCookie } from '@/lib/auth/customer'
import { supabaseAdmin } from '@/lib/db'
import { isValidCpf, isValidEmail } from '@/lib/utils'

function sanitizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function GET(req: NextRequest) {
  try {
    const session = await getCustomerSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('id, name, email, phone, cpf, created_at, updated_at, last_login_at')
      .eq('id', session.customerId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Conta não encontrada.' }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Não foi possível carregar sua conta.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getCustomerSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const body = await req.json()
    const name = sanitizeText(body?.name)
    const email = sanitizeText(body?.email).toLowerCase()
    const phone = sanitizeText(body?.phone)
    const cpfDigits = sanitizeText(body?.cpf).replace(/\D/g, '')

    if (!name || name.length < 3) {
      return NextResponse.json({ error: 'Informe seu nome completo.' }, { status: 400 })
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 })
    }
    if (cpfDigits && !isValidCpf(cpfDigits)) {
      return NextResponse.json({ error: 'CPF inválido.' }, { status: 400 })
    }

    const { data: updated, error } = await supabaseAdmin
      .from('customers')
      .update({
        name,
        email,
        phone: phone || null,
        cpf: cpfDigits || null,
      })
      .eq('id', session.customerId)
      .select('id, name, email, phone, cpf, created_at, updated_at, last_login_at')
      .single()

    if (error) throw error

    const res = NextResponse.json({ data: updated })
    if (email !== session.email) {
      setCustomerSessionCookie(res, { customerId: session.customerId, email })
    }
    return res
  } catch (error) {
    console.error('Erro ao atualizar conta:', error)
    return NextResponse.json({ error: 'Não foi possível atualizar sua conta.' }, { status: 500 })
  }
}

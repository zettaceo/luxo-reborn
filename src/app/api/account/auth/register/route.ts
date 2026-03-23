import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { hashCustomerPassword, setCustomerSessionCookie } from '@/lib/auth/customer'
import { isValidCpf, isValidEmail } from '@/lib/utils'

function sanitizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = sanitizeText(body?.name)
    const email = sanitizeText(body?.email).toLowerCase()
    const phone = sanitizeText(body?.phone)
    const cpfDigits = sanitizeText(body?.cpf).replace(/\D/g, '')
    const password = sanitizeText(body?.password)

    if (!name || name.length < 3) {
      return NextResponse.json({ error: 'Informe seu nome completo.' }, { status: 400 })
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 8 caracteres.' }, { status: 400 })
    }
    if (cpfDigits && !isValidCpf(cpfDigits)) {
      return NextResponse.json({ error: 'CPF inválido.' }, { status: 400 })
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('customers')
      .select('id, password_hash')
      .eq('email', email)
      .maybeSingle()

    if (existingError) throw existingError
    if (existing?.password_hash) {
      return NextResponse.json({ error: 'Já existe uma conta com este e-mail.' }, { status: 409 })
    }

    const passwordHash = await hashCustomerPassword(password)

    let customerId = existing?.id
    if (customerId) {
      const { error: updateError } = await supabaseAdmin
        .from('customers')
        .update({
          name,
          phone: phone || null,
          cpf: cpfDigits || null,
          password_hash: passwordHash,
          last_login_at: new Date().toISOString(),
        })
        .eq('id', customerId)

      if (updateError) throw updateError
    } else {
      const { data: created, error: createError } = await supabaseAdmin
        .from('customers')
        .insert({
          name,
          email,
          phone: phone || null,
          cpf: cpfDigits || null,
          password_hash: passwordHash,
          last_login_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (createError) throw createError
      customerId = created.id
    }

    if (!customerId) {
      return NextResponse.json({ error: 'Não foi possível criar a conta.' }, { status: 500 })
    }

    const res = NextResponse.json({
      data: { id: customerId, name, email, phone: phone || null, cpf: cpfDigits || null },
    })
    setCustomerSessionCookie(res, { customerId, email })
    return res
  } catch (error) {
    console.error('Erro no cadastro de cliente:', error)
    return NextResponse.json({ error: 'Não foi possível criar sua conta agora.' }, { status: 500 })
  }
}

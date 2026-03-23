import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { setCustomerSessionCookie, verifyCustomerPassword } from '@/lib/auth/customer'
import { isValidEmail } from '@/lib/utils'

function sanitizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = sanitizeText(body?.email).toLowerCase()
    const password = sanitizeText(body?.password)

    if (!isValidEmail(email) || !password) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 400 })
    }

    const { data: customer, error } = await supabaseAdmin
      .from('customers')
      .select('id, email, name, phone, cpf, password_hash')
      .eq('email', email)
      .maybeSingle()

    if (error) throw error
    if (!customer || !(await verifyCustomerPassword(password, customer.password_hash))) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 })
    }

    await supabaseAdmin
      .from('customers')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', customer.id)

    const res = NextResponse.json({
      data: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        cpf: customer.cpf,
      },
    })
    setCustomerSessionCookie(res, { customerId: customer.id, email: customer.email })
    return res
  } catch (error) {
    console.error('Erro no login de cliente:', error)
    return NextResponse.json({ error: 'Não foi possível realizar login agora.' }, { status: 500 })
  }
}

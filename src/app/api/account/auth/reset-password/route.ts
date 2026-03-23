import { NextRequest, NextResponse } from 'next/server'
import { hashCustomerPassword, hashPasswordResetToken } from '@/lib/auth/customer'
import { supabaseAdmin } from '@/lib/db'

function sanitizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const token = sanitizeText(body?.token)
    const password = typeof body?.password === 'string' ? body.password : ''

    if (!token || token.length < 20) {
      return NextResponse.json({ error: 'Token de recuperação inválido.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 8 caracteres.' }, { status: 400 })
    }

    const tokenHash = hashPasswordResetToken(token)
    const nowIso = new Date().toISOString()

    const { data: customer, error: findError } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('reset_password_token_hash', tokenHash)
      .gt('reset_password_expires_at', nowIso)
      .maybeSingle()

    if (findError) throw findError
    if (!customer?.id) {
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 400 })
    }

    const passwordHash = await hashCustomerPassword(password)
    const { error: updateError } = await supabaseAdmin
      .from('customers')
      .update({
        password_hash: passwordHash,
        reset_password_token_hash: null,
        reset_password_expires_at: null,
      })
      .eq('id', customer.id)

    if (updateError) throw updateError

    return NextResponse.json({ ok: true, message: 'Senha redefinida com sucesso.' })
  } catch (error) {
    console.error('Erro ao redefinir senha:', error)
    return NextResponse.json({ error: 'Não foi possível redefinir sua senha agora.' }, { status: 500 })
  }
}

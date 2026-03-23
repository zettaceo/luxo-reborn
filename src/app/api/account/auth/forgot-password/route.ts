import { NextRequest, NextResponse } from 'next/server'
import { createPasswordResetToken } from '@/lib/auth/customer'
import { supabaseAdmin } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/notifications/email'
import { isValidEmail } from '@/lib/utils'

function sanitizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function genericSuccessResponse() {
  return NextResponse.json({
    ok: true,
    message: 'Se existir uma conta com este e-mail, enviaremos as instruções de recuperação.',
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = sanitizeText(body?.email).toLowerCase()

    if (!isValidEmail(email)) return genericSuccessResponse()

    const { data: customer, error } = await supabaseAdmin
      .from('customers')
      .select('id, name, email, password_hash, reset_password_requested_at')
      .eq('email', email)
      .maybeSingle()

    if (error) throw error
    if (!customer?.id || !customer.password_hash) return genericSuccessResponse()

    const lastRequestedAt = customer.reset_password_requested_at
      ? new Date(customer.reset_password_requested_at).getTime()
      : 0

    // Evita spam de e-mail em rajada.
    if (lastRequestedAt && Date.now() - lastRequestedAt < 60 * 1000) {
      return genericSuccessResponse()
    }

    const { token, tokenHash, expiresAtIso } = createPasswordResetToken()
    const { error: updateError } = await supabaseAdmin
      .from('customers')
      .update({
        reset_password_token_hash: tokenHash,
        reset_password_expires_at: expiresAtIso,
        reset_password_requested_at: new Date().toISOString(),
      })
      .eq('id', customer.id)

    if (updateError) throw updateError

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || new URL(req.url).origin
    const resetUrl = `${appUrl}/conta/redefinir-senha?token=${encodeURIComponent(token)}`

    const emailResult = await sendPasswordResetEmail({
      to: customer.email,
      name: customer.name,
      resetUrl,
    })

    if (!emailResult.sent) {
      console.warn('Recuperação de senha: provedor de e-mail não configurado ou falhou.', emailResult.reason)
      if (process.env.NODE_ENV !== 'production') {
        console.info(`Link de recuperação (dev): ${resetUrl}`)
      }
    }

    return genericSuccessResponse()
  } catch (error) {
    console.error('Erro ao solicitar recuperação de senha:', error)
    return NextResponse.json(
      { error: 'Não foi possível processar sua solicitação agora.' },
      { status: 500 }
    )
  }
}

type SendPasswordResetEmailInput = {
  to: string
  name?: string | null
  resetUrl: string
}

function isEmailProviderConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL)
}

export async function sendPasswordResetEmail({ to, name, resetUrl }: SendPasswordResetEmailInput) {
  if (!isEmailProviderConfigured()) {
    return { sent: false, reason: 'provider_not_configured' as const }
  }

  const payload = {
    from: process.env.RESEND_FROM_EMAIL,
    to: [to],
    subject: 'Recuperação de senha - Luxo Reborn',
    html: `
      <div style="font-family: Arial, sans-serif; line-height:1.6; color:#222;">
        <h2 style="margin-bottom: 8px;">Recuperação de senha</h2>
        <p>Olá ${name?.trim() || 'cliente'},</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#db2777;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
            Redefinir minha senha
          </a>
        </p>
        <p>Se o botão não abrir, copie e cole este link no navegador:</p>
        <p style="word-break:break-all;"><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Este link expira em 30 minutos.</p>
        <p>Se você não solicitou essa recuperação, ignore este e-mail.</p>
      </div>
    `,
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    return { sent: false, reason: errorText || 'provider_error' }
  }

  return { sent: true as const }
}

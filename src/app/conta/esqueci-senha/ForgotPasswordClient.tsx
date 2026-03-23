'use client'

import Link from 'next/link'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/account/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Não foi possível solicitar a recuperação.')

      setDone(true)
      toast.success('Se existir conta com esse e-mail, enviaremos as instruções.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao solicitar recuperação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-3xl border border-rose-light p-7 md:p-8 shadow-card">
      <h1 className="font-display text-2xl font-bold text-charcoal mb-2">🔑 Recuperar senha</h1>
      <p className="text-sm text-muted mb-6">
        Informe o e-mail da sua conta. Se ele existir, enviaremos um link para redefinir sua senha.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">E-mail</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            required
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
          {loading ? '⏳ Enviando...' : 'Enviar link de recuperação'}
        </button>
      </form>

      {done && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3 mt-4">
          Solicitação recebida! Verifique sua caixa de entrada e spam.
        </p>
      )}

      <p className="text-sm text-muted mt-5 text-center">
        Lembrou sua senha?{' '}
        <Link href="/conta/login" className="text-rose-deep font-semibold hover:underline">
          Voltar ao login
        </Link>
      </p>
    </div>
  )
}

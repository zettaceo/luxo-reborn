'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface ResetPasswordClientProps {
  tokenFromQuery?: string
}

export default function ResetPasswordClient({ tokenFromQuery }: ResetPasswordClientProps) {
  const router = useRouter()
  const token = tokenFromQuery?.trim() || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!token) {
      toast.error('Token de recuperação ausente.')
      return
    }
    if (password.length < 8) {
      toast.error('A senha precisa ter pelo menos 8 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não conferem.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/account/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Não foi possível redefinir a senha.')

      toast.success('Senha redefinida com sucesso!')
      router.push('/conta/login')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao redefinir senha.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl border border-rose-light p-7 md:p-8 shadow-card text-center">
        <h1 className="font-display text-2xl font-bold text-charcoal mb-2">Token inválido</h1>
        <p className="text-sm text-muted mb-5">
          O link de recuperação está incompleto ou inválido.
        </p>
        <Link href="/conta/esqueci-senha" className="btn-primary">
          Solicitar novo link
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-3xl border border-rose-light p-7 md:p-8 shadow-card">
      <h1 className="font-display text-2xl font-bold text-charcoal mb-2">🔒 Definir nova senha</h1>
      <p className="text-sm text-muted mb-6">
        Escolha uma nova senha para entrar na sua conta.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Nova senha</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            required
            minLength={8}
          />
        </div>

        <div>
          <label className="label">Confirmar nova senha</label>
          <input
            type="password"
            className="input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a nova senha"
            required
            minLength={8}
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
          {loading ? '⏳ Atualizando...' : 'Salvar nova senha'}
        </button>
      </form>

      <p className="text-sm text-muted mt-5 text-center">
        <Link href="/conta/login" className="text-rose-deep font-semibold hover:underline">
          Voltar para o login
        </Link>
      </p>
    </div>
  )
}

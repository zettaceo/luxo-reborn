'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function LoginClient() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/account/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Não foi possível entrar na conta.')

      toast.success('Login realizado com sucesso!')
      router.push('/conta')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao entrar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-3xl border border-rose-light p-7 md:p-8 shadow-card">
      <h1 className="font-display text-2xl font-bold text-charcoal mb-2">🔐 Entrar na sua conta</h1>
      <p className="text-sm text-muted mb-6">
        Gerencie seus dados, endereços, formas de pagamento e acompanhe seus pedidos.
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

        <div>
          <label className="label">Senha</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            required
            minLength={8}
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
          {loading ? '⏳ Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="text-sm text-muted mt-5 text-center">
        Ainda não tem conta?{' '}
        <Link href="/conta/cadastro" className="text-rose-deep font-semibold hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  )
}

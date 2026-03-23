'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'

function maskCpf(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function maskPhone(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

export default function RegisterClient() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      toast.error('As senhas não conferem.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/account/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Não foi possível criar a conta.')

      toast.success('Conta criada com sucesso!')
      router.push('/conta')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar conta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto bg-white rounded-3xl border border-rose-light p-7 md:p-8 shadow-card">
      <h1 className="font-display text-2xl font-bold text-charcoal mb-2">✨ Criar sua conta</h1>
      <p className="text-sm text-muted mb-6">
        Com sua conta você salva dados e compra mais rápido nas próximas vezes.
      </p>

      <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Nome completo</label>
          <input
            type="text"
            className="input"
            value={form.name}
            onChange={(e) => setForm((old) => ({ ...old, name: e.target.value }))}
            placeholder="Seu nome"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label">E-mail</label>
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm((old) => ({ ...old, email: e.target.value }))}
            placeholder="voce@email.com"
            required
          />
        </div>

        <div>
          <label className="label">Telefone</label>
          <input
            type="text"
            className="input"
            value={form.phone}
            onChange={(e) => setForm((old) => ({ ...old, phone: maskPhone(e.target.value) }))}
            placeholder="(11) 99999-9999"
          />
        </div>

        <div>
          <label className="label">CPF</label>
          <input
            type="text"
            className="input"
            value={form.cpf}
            onChange={(e) => setForm((old) => ({ ...old, cpf: maskCpf(e.target.value) }))}
            placeholder="000.000.000-00"
          />
        </div>

        <div>
          <label className="label">Senha</label>
          <input
            type="password"
            className="input"
            value={form.password}
            onChange={(e) => setForm((old) => ({ ...old, password: e.target.value }))}
            placeholder="Mínimo 8 caracteres"
            minLength={8}
            required
          />
        </div>

        <div>
          <label className="label">Confirmar senha</label>
          <input
            type="password"
            className="input"
            value={form.confirmPassword}
            onChange={(e) => setForm((old) => ({ ...old, confirmPassword: e.target.value }))}
            placeholder="Repita sua senha"
            minLength={8}
            required
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary sm:col-span-2 py-3.5">
          {loading ? '⏳ Criando conta...' : 'Criar conta'}
        </button>
      </form>

      <p className="text-sm text-muted mt-5 text-center">
        Já possui conta?{' '}
        <Link href="/conta/login" className="text-rose-deep font-semibold hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}

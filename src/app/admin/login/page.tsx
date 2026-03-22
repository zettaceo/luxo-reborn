'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.push('/admin')
        router.refresh()
      } else {
        setError('Senha incorreta. Tente novamente.')
      }
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-pale via-cream to-rose-light flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose to-rose-deep flex items-center justify-center text-3xl mx-auto mb-4 shadow-rose">
            🧸
          </div>
          <h1 className="font-script text-4xl text-rose-deep">Luxo Reborn</h1>
          <p className="text-muted text-sm mt-1 font-medium">Painel Administrativo</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-rose-light p-8 shadow-card">
          <h2 className="font-display text-xl font-bold text-charcoal mb-6 text-center">
            🔐 Entrar no painel
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Senha de acesso</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••••••"
                autoFocus
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="btn-primary w-full py-3.5"
            >
              {loading ? '⏳ Entrando...' : '🔓 Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          Luxo Reborn © {new Date().getFullYear()} · Área restrita
        </p>
      </div>
    </div>
  )
}

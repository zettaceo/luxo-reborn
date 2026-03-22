import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl mb-6">🧸</div>
        <h1 className="font-display text-4xl font-bold text-charcoal mb-3">Página não encontrada</h1>
        <p className="text-muted mb-8">Ops! Esta página não existe ou foi removida.</p>
        <Link href="/" className="btn-primary">← Voltar à loja</Link>
      </div>
    </div>
  )
}

'use client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Category } from '@/types'

export default function CategoryBar({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = searchParams.get('cat')

  return (
    <section className="bg-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="section-title">Explore as <span>categorias</span></h2>
          <Link href="/produtos" className="text-sm font-semibold text-rose-deep border-b border-rose-light hover:border-rose-deep transition-colors">
            Ver todas →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => router.push(`/produtos?cat=${cat.slug}`)}
              className={`rounded-2xl p-6 text-center border-2 transition-all duration-200 hover:-translate-y-1 hover:shadow-rose ${
                active === cat.slug
                  ? 'bg-gradient-to-br from-rose-deep to-rose text-white border-transparent shadow-rose'
                  : 'bg-rose-pale border-transparent hover:border-rose text-charcoal'
              }`}
            >
              <span className="text-4xl block mb-2">{cat.emoji}</span>
              <div className="text-sm font-semibold">{cat.name}</div>
              {cat.product_count !== undefined && (
                <div className={`text-xs mt-1 ${active === cat.slug ? 'text-white/70' : 'text-muted'}`}>
                  {cat.product_count} produtos
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ProductCard } from '@/components/store/ProductGrid'
import type { Category, Product } from '@/types'

interface Props {
  categories: Category[]
}

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Mais recentes' },
  { value: 'price_asc',  label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'featured',   label: 'Destaques' },
]

const BADGE_OPTIONS = ['Novo', 'Top', 'Popular', 'Promoção']

const PER_PAGE = 12

export default function CatalogClient({ categories }: Props) {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<Product[]>([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState(searchParams.get('q') ?? '')
  const [sort,     setSort]     = useState('newest')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const activeCategory = searchParams.get('cat') ?? ''
  const activeBadge    = searchParams.get('badge') ?? ''
  const page           = parseInt(searchParams.get('page') ?? '1')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: String(PER_PAGE),
        page:  String(page),
      })
      if (activeCategory) params.set('category', activeCategory)
      if (search)         params.set('q', search)
      if (activeBadge)    params.set('badge', activeBadge)
      if (sort === 'featured') params.set('featured', 'true')

      const res  = await fetch(`/api/products?${params}`)
      const json = await res.json()

      let data: Product[] = json.data ?? []

      if (sort === 'price_asc')  data = [...data].sort((a, b) => a.price - b.price)
      if (sort === 'price_desc') data = [...data].sort((a, b) => b.price - a.price)

      setProducts(data)
      setTotal(json.total ?? 0)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [activeCategory, activeBadge, search, sort, page])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  function setCategory(slug: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (slug) params.set('cat', slug)
    else      params.delete('cat')
    params.delete('page')
    router.push(`/produtos?${params}`)
  }

  function setPage(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`/produtos?${params}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Title */}
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-charcoal mb-1">
          {activeCategory
            ? (categories.find(c => c.slug === activeCategory)?.name ?? 'Produtos')
            : activeBadge ? activeBadge
            : 'Todos os Produtos'}
        </h1>
        {!loading && (
          <p className="text-muted text-sm">{total} produto{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</p>
        )}
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2 flex-1 bg-white border border-rose-light rounded-xl px-4 py-2.5 focus-within:border-rose transition-colors">
          <span className="text-muted">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchProducts()}
            placeholder="Buscar produtos..."
            className="flex-1 outline-none text-sm text-charcoal placeholder:text-muted font-body bg-transparent"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-muted hover:text-rose-deep text-sm">✕</button>
          )}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} className="input w-full sm:w-48 text-sm">
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={() => setSidebarOpen(s => !s)} className="sm:hidden btn-outline flex items-center gap-2">
          🎛️ Filtros
        </button>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className={`w-56 shrink-0 ${sidebarOpen ? 'block' : 'hidden'} sm:block`}>
          <div className="bg-white rounded-2xl border border-rose-light p-5 sticky top-24">
            <h3 className="font-display text-base font-bold text-charcoal mb-4">Categorias</h3>
            <ul className="space-y-1">
              <li>
                <button onClick={() => setCategory('')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    !activeCategory ? 'bg-gradient-to-br from-rose-deep to-rose text-white' : 'text-charcoal hover:bg-rose-pale'
                  }`}>
                  🏠 Todos os produtos
                </button>
              </li>
              {categories.map(cat => (
                <li key={cat.id}>
                  <button onClick={() => setCategory(cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                      activeCategory === cat.slug ? 'bg-gradient-to-br from-rose-deep to-rose text-white' : 'text-charcoal hover:bg-rose-pale'
                    }`}>
                    <span>{cat.emoji}</span>
                    <span className="flex-1">{cat.name}</span>
                  </button>
                </li>
              ))}
            </ul>

            <h3 className="font-display text-base font-bold text-charcoal mt-6 mb-4">Destaques</h3>
            <ul className="space-y-1">
              {BADGE_OPTIONS.map(badge => (
                <li key={badge}>
                  <button
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString())
                      if (activeBadge === badge) params.delete('badge')
                      else params.set('badge', badge)
                      params.delete('page')
                      router.push(`/produtos?${params}`)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      activeBadge === badge ? 'bg-gradient-to-br from-rose-deep to-rose text-white' : 'text-charcoal hover:bg-rose-pale'
                    }`}>
                    {badge}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-square bg-rose-light" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-rose-light rounded w-1/3" />
                    <div className="h-4 bg-rose-light rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-muted">
              <span className="text-6xl block mb-4">🔍</span>
              <p className="text-lg font-medium mb-2">Nenhum produto encontrado</p>
              <button onClick={() => router.push('/produtos')} className="btn-primary mt-6">Ver todos os produtos</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn-outline disabled:opacity-40 disabled:cursor-not-allowed">← Anterior</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${
                        p === page ? 'bg-gradient-to-br from-rose-deep to-rose text-white shadow-rose' : 'bg-white border border-rose-light text-charcoal hover:border-rose'
                      }`}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="btn-outline disabled:opacity-40 disabled:cursor-not-allowed">Próxima →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

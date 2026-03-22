import { supabaseAdmin } from '@/lib/db'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Produtos' }
export const revalidate = 0
export const dynamic = 'force-dynamic'

interface ProductRow {
  id: string
  name: string
  price: number
  stock: number
  is_active: boolean
  is_featured: boolean
  badge?: string | null
  category?: { name: string; emoji: string }[] | null
  images?: { url: string; is_cover: boolean }[]
}

async function getProducts(): Promise<ProductRow[]> {
  const { data } = await supabaseAdmin
    .from('products')
    .select('id, name, price, stock, is_active, is_featured, badge, category:categories(name, emoji), images:product_images(url, is_cover)')
    .order('created_at', { ascending: false })
  return (data ?? []) as ProductRow[]
}

export default async function AdminProductsPage() {
  const products = await getProducts()

  return (
    <div className="p-6 md:p-8 mt-14 md:mt-0">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-charcoal">🧸 Produtos</h1>
          <p className="text-muted text-sm mt-1">{products.length} produto{products.length !== 1 ? 's' : ''} cadastrado{products.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/admin/produtos/novo" className="btn-primary">➕ Novo produto</Link>
      </div>

      <div className="bg-white rounded-2xl border border-rose-light overflow-hidden">
        {products.length === 0 ? (
          <div className="text-center py-20 text-muted">
            <span className="text-6xl block mb-4">🧸</span>
            <p className="font-medium mb-2">Nenhum produto cadastrado</p>
            <Link href="/admin/produtos/novo" className="btn-primary mt-4 inline-block">Cadastrar primeiro produto</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-rose-light bg-rose-pale/50">
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted uppercase tracking-wide">Produto</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted uppercase tracking-wide hidden sm:table-cell">Categoria</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-muted uppercase tracking-wide">Preço</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-muted uppercase tracking-wide">Estoque</th>
                  <th className="text-center px-5 py-3 text-xs font-bold text-muted uppercase tracking-wide hidden md:table-cell">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-light">
                {products.map((p) => {
                  const cover = p.images?.find(i => i.is_cover) ?? p.images?.[0]
                  const category = p.category?.[0]
                  return (
                    <tr key={p.id} className="hover:bg-rose-pale/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-rose-pale flex items-center justify-center shrink-0 overflow-hidden">
                            {cover
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={cover.url} alt={p.name} className="w-full h-full object-cover" />
                              : <span className="text-2xl">🧸</span>}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-charcoal line-clamp-1">{p.name}</p>
                            <div className="flex gap-1 mt-0.5">
                              {p.badge && <span className="badge badge-rose text-[10px]">{p.badge}</span>}
                              {p.is_featured && <span className="badge badge-gold text-[10px]">Destaque</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span className="text-sm text-muted">{category?.emoji} {category?.name}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-sm font-bold text-rose-deep">{formatCurrency(Number(p.price))}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-sm font-bold ${p.stock === 0 ? 'text-red-500' : p.stock < 5 ? 'text-amber-500' : 'text-green-600'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell text-center">
                        <span className={`badge text-[10px] ${p.is_active ? 'badge-green' : 'bg-gray-100 text-gray-500'}`}>
                          {p.is_active ? '✅ Ativo' : '⏸ Inativo'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/admin/produtos/${p.id}`} className="text-xs font-semibold text-rose-deep hover:underline">Editar →</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

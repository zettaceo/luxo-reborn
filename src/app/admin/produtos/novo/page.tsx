import { db } from '@/lib/db'
import type { Metadata } from 'next'
import ProductForm from '@/components/admin/ProductForm'

export const metadata: Metadata = { title: 'Novo Produto' }

export default async function NewProductPage() {
  const categories = await db.categories.findAll()
  return (
    <div className="p-6 md:p-8 mt-14 md:mt-0 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-charcoal">➕ Novo Produto</h1>
        <p className="text-muted text-sm mt-1">Preencha os dados e faça o upload das fotos.</p>
      </div>
      <ProductForm categories={categories} />
    </div>
  )
}

import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import type { Metadata } from 'next'
import ProductForm from '@/components/admin/ProductForm'

interface Props {
  params: { id: string }
}

export const metadata: Metadata = { title: 'Editar Produto' }

export default async function EditProductPage({ params }: Props) {
  const categories = await db.categories.findAll()

  let product
  try {
    product = await db.products.findById(params.id)
  } catch {
    notFound()
  }

  return (
    <div className="p-6 md:p-8 mt-14 md:mt-0 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-charcoal">✏️ Editar Produto</h1>
        <p className="text-muted text-sm mt-1 line-clamp-1">{product.name}</p>
      </div>
      <ProductForm categories={categories} product={product} />
    </div>
  )
}

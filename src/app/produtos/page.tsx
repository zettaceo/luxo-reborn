import { Suspense } from 'react'
import type { Metadata } from 'next'
import Header from '@/components/store/Header'
import CartDrawer from '@/components/store/CartDrawer'
import { Footer } from '@/components/store/BannerStrip'
import CatalogClient from './CatalogClient'
import { db } from '@/lib/db'

export const metadata: Metadata = {
  title: 'Produtos',
  description: 'Explore nossa coleção completa de Bebês Reborn, Pelúcias e Brinquedos.',
}
export const dynamic = 'force-dynamic'

export default async function ProdutosPage() {
  const categories = await db.categories.findAll()

  return (
    <>
      <Header />
      <CartDrawer />
      <main className="min-h-screen bg-cream">
        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogClient categories={categories} />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}

function CatalogSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="h-8 w-48 bg-rose-light rounded-lg animate-pulse mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
            <div className="aspect-square bg-rose-light" />
            <div className="p-4 space-y-2">
              <div className="h-3 bg-rose-light rounded w-1/3" />
              <div className="h-4 bg-rose-light rounded w-3/4" />
              <div className="h-5 bg-rose-light rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

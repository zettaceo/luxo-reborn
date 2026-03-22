import { Suspense } from 'react'
import { db } from '@/lib/db'
import Header from '@/components/store/Header'
import CartDrawer from '@/components/store/CartDrawer'
import Hero from '@/components/store/Hero'
import CategoryBar from '@/components/store/CategoryBar'
import ProductGrid from '@/components/store/ProductGrid'
import BannerStrip from '@/components/store/BannerStrip'
import ReviewsSection from '@/components/store/ReviewsSection'
import TrustBar from '@/components/store/TrustBar'
import Footer from '@/components/store/Footer'
import { checkoutEnabled } from '@/lib/config/store'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [categories, featuredProducts] = await Promise.all([
    db.categories.findAll(),
    db.products.findMany({ featured: true, limit: 8 }),
  ])

  return (
    <>
      <Header />
      <CartDrawer />

      <main>
        <Hero />

        <CategoryBar categories={categories} />

        <section className="py-16 px-4 bg-cream" id="produtos">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-baseline justify-between mb-9">
              <h2 className="section-title">Produtos em <span>destaque</span></h2>
              <a href="/produtos" className="text-sm font-semibold text-rose-deep border-b border-rose-light hover:border-rose-deep transition-colors">
                Ver todos →
              </a>
            </div>
            <Suspense fallback={<ProductGridSkeleton />}>
              <ProductGrid products={featuredProducts} checkoutEnabled={checkoutEnabled} />
            </Suspense>
          </div>
        </section>

        <BannerStrip />

        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-baseline justify-between mb-9">
              <h2 className="section-title">O que dizem as <span>clientes</span></h2>
            </div>
            <ReviewsSection />
          </div>
        </section>

        <TrustBar />
      </main>

      <Footer />
    </>
  )
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
          <div className="aspect-square bg-rose-light" />
          <div className="p-4 space-y-2">
            <div className="h-3 bg-rose-light rounded w-1/3" />
            <div className="h-4 bg-rose-light rounded w-3/4" />
            <div className="h-4 bg-rose-light rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

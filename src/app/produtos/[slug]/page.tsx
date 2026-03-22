import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { checkoutEnabled } from '@/lib/config/store'
import Header from '@/components/store/Header'
import CartDrawer from '@/components/store/CartDrawer'
import { Footer } from '@/components/store/BannerStrip'
import ProductPageClient from './ProductPageClient'

interface Props {
  params: { slug: string }
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const product = await db.products.findBySlug(params.slug)
    return {
      title: product.name,
      description: product.description.slice(0, 160),
      openGraph: {
        images: product.images?.[0]?.url ? [product.images[0].url] : [],
      },
    }
  } catch {
    return { title: 'Produto não encontrado' }
  }
}

export default async function ProductPage({ params }: Props) {
  let product
  try {
    product = await db.products.findBySlug(params.slug)
  } catch {
    notFound()
  }

  return (
    <>
      <Header />
      <CartDrawer />
      <main className="min-h-screen bg-cream">
        <ProductPageClient product={product} checkoutEnabled={checkoutEnabled} />
      </main>
      <Footer />
    </>
  )
}

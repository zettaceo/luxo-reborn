import { supabaseAdmin } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'
import ReviewActions from './ReviewActions'

export const metadata: Metadata = { title: 'Avaliações' }
export const revalidate = 0
export const dynamic = 'force-dynamic'

interface ReviewRow {
  id: string
  customer_name: string
  rating: number
  comment?: string | null
  created_at: string
  is_approved: boolean
  product?: { name: string }[] | null
}

async function getReviews(): Promise<ReviewRow[]> {
  const { data } = await supabaseAdmin
    .from('reviews')
    .select('id, customer_name, rating, comment, created_at, is_approved, product:products(name)')
    .order('created_at', { ascending: false })
  return (data ?? []) as ReviewRow[]
}

export default async function AdminReviewsPage() {
  const reviews = await getReviews()
  const pending  = reviews.filter(r => !r.is_approved)
  const approved = reviews.filter(r => r.is_approved)

  return (
    <div className="p-6 md:p-8 mt-14 md:mt-0">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-charcoal">⭐ Avaliações</h1>
        <p className="text-muted text-sm mt-1">{pending.length} aguardando aprovação · {approved.length} publicadas</p>
      </div>

      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-lg font-bold text-charcoal mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Aguardando aprovação ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map(r => (
              <div key={r.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <ReviewCard review={r} />
                <ReviewActions reviewId={r.id} approved={false} />
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center mb-8">
          <span className="text-3xl block mb-2">✅</span>
          <p className="text-sm font-semibold text-green-700">Todas as avaliações foram revisadas!</p>
        </div>
      )}

      {approved.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-bold text-charcoal mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            Publicadas ({approved.length})
          </h2>
          <div className="space-y-3">
            {approved.map(r => (
              <div key={r.id} className="bg-white border border-rose-light rounded-2xl p-5">
                <ReviewCard review={r} />
                <ReviewActions reviewId={r.id} approved={true} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ReviewCard({ review }: { review: ReviewRow }) {
  const productName = review.product?.[0]?.name

  return (
    <div className="mb-4">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <p className="font-semibold text-charcoal text-sm">{review.customer_name}</p>
          {productName && <p className="text-xs text-muted">Produto: {productName}</p>}
          <p className="text-xs text-muted">{formatDate(review.created_at)}</p>
        </div>
        <div className="flex gap-0.5 shrink-0">
          {[1,2,3,4,5].map(n => (
            <span key={n} className={`text-base ${n <= review.rating ? 'text-gold' : 'text-gray-200'}`}>★</span>
          ))}
        </div>
      </div>
      {review.comment && (
        <p className="text-sm text-charcoal italic bg-white/60 rounded-xl p-3">&quot;{review.comment}&quot;</p>
      )}
    </div>
  )
}

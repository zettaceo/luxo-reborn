'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function ReviewActions({ reviewId, approved }: { reviewId: string; approved: boolean }) {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleApprove() {
    setLoading(true)
    try {
      await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_approved: true }),
      })
      toast.success('Avaliação publicada! ✅')
      router.refresh()
    } finally { setLoading(false) }
  }

  async function handleDelete() {
    if (!confirm('Excluir esta avaliação?')) return
    setLoading(true)
    try {
      await fetch(`/api/admin/reviews/${reviewId}`, { method: 'DELETE' })
      toast.success('Avaliação excluída')
      router.refresh()
    } finally { setLoading(false) }
  }

  return (
    <div className="flex gap-2">
      {!approved && (
        <button onClick={handleApprove} disabled={loading} className="btn-primary text-xs py-2 px-4">
          ✅ Aprovar e publicar
        </button>
      )}
      <button onClick={handleDelete} disabled={loading} className="btn-outline text-xs py-2 px-3 border-red-200 text-red-500 hover:bg-red-50">
        🗑️ Excluir
      </button>
    </div>
  )
}

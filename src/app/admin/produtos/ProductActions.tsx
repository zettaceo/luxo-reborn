'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface Props {
  productId: string
  productName: string
  compact?: boolean
}

export default function ProductActions({ productId, productName, compact = false }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    const confirmed = window.confirm(`Tem certeza que deseja excluir "${productName}"?`)
    if (!confirmed) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Erro ao excluir produto')

      toast.success('Produto excluído com sucesso.')
      router.refresh()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir produto')
    } finally {
      setDeleting(false)
    }
  }

  if (compact) {
    return (
      <div className="flex items-center justify-end gap-2">
        <Link href={`/admin/produtos/${productId}`} className="text-xs font-semibold text-rose-deep hover:underline">
          Editar
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs font-semibold text-red-500 hover:underline disabled:opacity-60"
        >
          {deleting ? 'Excluindo...' : 'Excluir'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={`/admin/produtos/${productId}`} className="btn-outline text-xs py-2 px-3">
        ✏️ Editar
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="btn-outline text-xs py-2 px-3 border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-60"
      >
        {deleting ? '⏳ Excluindo...' : '🗑️ Excluir'}
      </button>
    </div>
  )
}

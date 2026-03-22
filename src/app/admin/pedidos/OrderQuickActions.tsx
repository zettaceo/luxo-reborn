'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface Props {
  orderId: string
  orderStatus: string
}

export default function OrderQuickActions({ orderId, orderStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function updateStatus(status: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) throw new Error('Falha ao atualizar pedido')

      toast.success('Status atualizado com sucesso!')
      router.refresh()
    } catch {
      toast.error('Não foi possível atualizar o pedido.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {orderStatus === 'paid' && (
        <button
          onClick={() => updateStatus('shipped')}
          disabled={loading}
          className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors disabled:opacity-50"
        >
          🚚 Marcar enviado
        </button>
      )}

      {orderStatus === 'shipped' && (
        <button
          onClick={() => updateStatus('delivered')}
          disabled={loading}
          className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full hover:bg-purple-100 transition-colors disabled:opacity-50"
        >
          📦 Marcar entregue
        </button>
      )}
    </div>
  )
}

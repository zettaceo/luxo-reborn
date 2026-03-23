'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { WhatsAppIcon } from '@/components/icons/SocialIcons'

interface Order {
  id: string
  order_number: string
  status: string
  tracking_code?: string
  shipping_service?: string
  customer_name: string
  customer_phone: string
}

const STATUS_OPTIONS = [
  { value: 'pending',   label: '⏳ Aguardando pagamento' },
  { value: 'paid',      label: '✅ Pago — preparando' },
  { value: 'shipped',   label: '🚚 Enviado' },
  { value: 'delivered', label: '📦 Entregue' },
  { value: 'cancelled', label: '❌ Cancelado' },
]

const SHIPPING_SERVICES = ['PAC', 'SEDEX', 'Mini Envios', 'Transportadora', 'Retirada']

export default function OrderActions({ order }: { order: Order }) {
  const router = useRouter()
  const [status,          setStatus]          = useState(order.status)
  const [trackingCode,    setTrackingCode]    = useState(order.tracking_code ?? '')
  const [shippingService, setShippingService] = useState(order.shipping_service ?? 'PAC')
  const [saving,          setSaving]          = useState(false)
  const [syncing,         setSyncing]         = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, tracking_code: trackingCode, shipping_service: shippingService }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar pedido')
      toast.success('Pedido atualizado! ✅')
      router.refresh()
    } catch {
      toast.error('Erro ao atualizar pedido')
    } finally {
      setSaving(false)
    }
  }

  function handleWhatsAppNotify() {
    const msg = trackingCode
      ? `Olá ${order.customer_name}! 🎀 Seu pedido ${order.order_number} foi enviado pelo ${shippingService}! Rastreie pelo código: *${trackingCode}* 📦`
      : `Olá ${order.customer_name}! 🎀 Seu pedido ${order.order_number} está sendo preparado com carinho!`
    window.open(`https://wa.me/55${order.customer_phone?.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  async function handleTrackingSync() {
    if (!trackingCode) {
      toast.error('Informe o código de rastreio antes de sincronizar.')
      return
    }

    setSyncing(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/tracking-sync`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao sincronizar rastreio')

      toast.success('Rastreio sincronizado com sucesso!')
      router.refresh()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erro ao sincronizar rastreio')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-rose-light p-6">
      <h2 className="font-display text-base font-bold text-charcoal mb-5">⚙️ Atualizar pedido</h2>

      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="label">Status do pedido</label>
          <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Transportadora</label>
          <select className="input" value={shippingService} onChange={e => setShippingService(e.target.value)}>
            {SHIPPING_SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="label">Código de rastreio</label>
          <input
            className="input font-mono"
            value={trackingCode}
            onChange={e => setTrackingCode(e.target.value.toUpperCase())}
            placeholder="Ex: BR123456789BR"
          />
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? '⏳ Salvando...' : '💾 Salvar'}
        </button>
        <button onClick={handleTrackingSync} disabled={syncing} className="btn-outline text-sm">
          {syncing ? '⏳ Sincronizando...' : '🔄 Atualizar rastreio automático'}
        </button>
        <button onClick={handleWhatsAppNotify} className="btn-secondary text-sm inline-flex items-center gap-2">
          <WhatsAppIcon className="w-4 h-4" />
          Notificar no WhatsApp
        </button>
      </div>
    </div>
  )
}

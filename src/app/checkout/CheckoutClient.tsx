'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { useCart } from '@/hooks/useCart'
import { trackAddPaymentInfo, trackAddShippingInfo, trackBeginCheckout, trackEvent, trackPurchase } from '@/lib/analytics'
import { formatCurrency, fetchAddressByZip, formatZip, isValidCpf, calculateInstallments } from '@/lib/utils'
import type { ShippingOption } from '@/types'

// ─── Helpers ────────────────────────────────────────────
function maskCpf(v: string) {
  return v.replace(/\D/g,'').slice(0,11)
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d{1,2})$/,'$1-$2')
}
function maskPhone(v: string) {
  return v.replace(/\D/g,'').slice(0,11)
    .replace(/(\d{2})(\d)/,'($1) $2')
    .replace(/(\d{5})(\d)/,'$1-$2')
}
function maskCard(v: string) {
  return v.replace(/\D/g,'').slice(0,16).replace(/(\d{4})/g,'$1 ').trim()
}
function maskExpiry(v: string) {
  return v.replace(/\D/g,'').slice(0,4).replace(/(\d{2})(\d)/,'$1/$2')
}

// ─── Step types ──────────────────────────────────────────
type Step = 'address' | 'shipping' | 'payment' | 'pix'

export default function CheckoutClient() {
  const router = useRouter()
  const { items, total, clearCart } = useCart()
  const cartTotal = total()
  const checkoutTrackedRef = useRef(false)
  const pixPurchaseTrackedRef = useRef(false)

  const [step,     setStep]     = useState<Step>('address')
  const [loading,  setLoading]  = useState(false)

  // Address form
  const [form, setForm] = useState({
    name: '', email: '', phone: '', cpf: '',
    zip: '', street: '', number: '', complement: '',
    neighborhood: '', city: '', state: '',
  })
  const [zipLoading, setZipLoading] = useState(false)
  const [errors,     setErrors]     = useState<Record<string, string>>({})

  // Shipping
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null)

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix')
  const [installments,  setInstallments]  = useState(1)
  const [cardNumber,    setCardNumber]    = useState('')
  const [cardName,      setCardName]      = useState('')
  const [cardExpiry,    setCardExpiry]    = useState('')
  const [cardCvv,       setCardCvv]       = useState('')

  // Pix result
  const [pixData, setPixData] = useState<{
    qrCode: string; qrCodeBase64: string; expiresAt: string; orderNumber: string; orderId: string
  } | null>(null)
  const [pixCopied, setPixCopied] = useState(false)
  const [pixPaid,   setPixPaid]   = useState(false)

  const orderTotal = cartTotal + (selectedShipping?.price ?? 0)
  const installmentOptions = calculateInstallments(orderTotal)

  // Redirect if cart empty
  useEffect(() => {
    if (items.length === 0 && step !== 'pix') router.push('/')
  }, [items, step, router])

  useEffect(() => {
    if (items.length === 0 || checkoutTrackedRef.current) return
    checkoutTrackedRef.current = true
    trackBeginCheckout(items, cartTotal)
  }, [items, cartTotal])

  // ── CEP auto-fill ──
  async function handleZipBlur() {
    const digits = form.zip.replace(/\D/g,'')
    if (digits.length !== 8) return
    setZipLoading(true)
    try {
      const addr = await fetchAddressByZip(digits)
      setForm(f => ({
        ...f,
        street:       addr.street,
        neighborhood: addr.neighborhood,
        city:         addr.city,
        state:        addr.state,
      }))
    } catch {
      toast.error('CEP não encontrado. Preencha o endereço manualmente.')
    } finally {
      setZipLoading(false)
    }
  }

  // ── Validate address ──
  function validateAddress() {
    const e: Record<string,string> = {}
    if (!form.name.trim())        e.name   = 'Nome obrigatório'
    if (!form.email.includes('@')) e.email  = 'E-mail inválido'
    if (form.phone.replace(/\D/g,'').length < 10) e.phone = 'Telefone inválido'
    if (!isValidCpf(form.cpf))    e.cpf    = 'CPF inválido'
    if (form.zip.replace(/\D/g,'').length < 8) e.zip = 'CEP obrigatório'
    if (!form.street.trim())      e.street = 'Endereço obrigatório'
    if (!form.number.trim())      e.number = 'Número obrigatório'
    if (!form.city.trim())        e.city   = 'Cidade obrigatória'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Proceed to shipping ──
  async function handleAddressNext() {
    if (!validateAddress()) { toast.error('Corrija os campos destacados'); return }
    setLoading(true)
    try {
      // Simula cálculo de frete (integrar Melhor Envio aqui)
      await new Promise(r => setTimeout(r, 800))
      setShippingOptions([
        { service: 'PAC',   name: 'PAC — Correios',    price: 18.50, estimated_days: 7 },
        { service: 'SEDEX', name: 'SEDEX — Correios',  price: 32.00, estimated_days: 3 },
        { service: 'MINI',  name: 'Mini Envios',       price: 14.90, estimated_days: 10 },
      ])
      setStep('shipping')
    } finally {
      setLoading(false)
    }
  }

  // ── Process payment ──
  async function handlePayment() {
    if (!selectedShipping) { toast.error('Selecione o frete'); return }
    setLoading(true)
    try {
      const payload = {
        order: {
          customer_name:        form.name,
          customer_email:       form.email,
          customer_phone:       form.phone,
          customer_cpf:         form.cpf.replace(/\D/g,''),
          address_zip:          form.zip.replace(/\D/g,''),
          address_street:       form.street,
          address_number:       form.number,
          address_complement:   form.complement,
          address_neighborhood: form.neighborhood,
          address_city:         form.city,
          address_state:        form.state,
          subtotal:             cartTotal,
          shipping_cost:        selectedShipping.price,
          shipping_service:     selectedShipping.service,
          total:                orderTotal,
          items,
        },
        payment_method:     paymentMethod,
        card_installments:  installments,
        card_token:         paymentMethod === 'credit_card' ? 'CARD_TOKEN_FROM_MP_SDK' : undefined,
      }

      const res  = await fetch('/api/payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Erro no pagamento')

      trackAddPaymentInfo(items, orderTotal, paymentMethod === 'pix' ? 'pix' : 'credit_card')

      if (paymentMethod === 'pix') {
        setPixData({
          qrCode:        data.pix_qr_code,
          qrCodeBase64:  data.pix_qr_code_base64,
          expiresAt:     data.pix_expiration,
          orderNumber:   data.order_number,
          orderId:       data.order_id,
        })
        clearCart()
        setStep('pix')
        // Poll for payment confirmation
        pollPixStatus(data.order_id, data.order_number, selectedShipping.service)
      } else {
        if (data.approved) {
          trackPurchase({
            orderNumber: data.order_number,
            items,
            value: orderTotal,
            paymentType: 'credit_card',
            shippingTier: selectedShipping.service,
          })
          clearCart()
          router.push(`/checkout/sucesso?order=${data.order_number}`)
        } else {
          trackEvent('payment_failed', { payment_method: 'credit_card', reason: data.status_detail ?? 'rejected' })
          toast.error('Pagamento recusado. Verifique os dados do cartão.')
        }
      }
    } catch (err: unknown) {
      trackEvent('payment_failed', { payment_method: paymentMethod, reason: 'request_error' })
      toast.error(err instanceof Error ? err.message : 'Erro no pagamento')
    } finally {
      setLoading(false)
    }
  }

  // ── Poll Pix status every 5s for 30 min ──
  function pollPixStatus(orderId: string, orderNumber: string, shippingService: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`)
        const { payment_status } = await res.json()
        if (payment_status === 'approved') {
          if (!pixPurchaseTrackedRef.current) {
            pixPurchaseTrackedRef.current = true
            trackPurchase({
              orderNumber,
              items,
              value: orderTotal,
              paymentType: 'pix',
              shippingTier: shippingService,
            })
          }
          setPixPaid(true)
          clearInterval(interval)
        }
      } catch { /* keep polling */ }
    }, 5000)
    setTimeout(() => clearInterval(interval), 30 * 60 * 1000)
  }

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">

      {/* ── LEFT: FORM ── */}
      <div>

        {/* ===== STEP: ADDRESS ===== */}
        {step === 'address' && (
          <div className="bg-white rounded-3xl border border-rose-light p-7">
            <h2 className="font-display text-2xl font-bold text-charcoal mb-6">📦 Dados de entrega</h2>

            <div className="space-y-4">
              {/* Personal */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Nome completo *" error={errors.name}>
                  <input className="input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Maria Silva" />
                </Field>
                <Field label="E-mail *" error={errors.email}>
                  <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="maria@email.com" />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Telefone / WhatsApp *" error={errors.phone}>
                  <input className="input" value={form.phone} onChange={e => setForm(f => ({...f, phone: maskPhone(e.target.value)}))} placeholder="(11) 99999-9999" maxLength={15} />
                </Field>
                <Field label="CPF *" error={errors.cpf}>
                  <input className="input" value={form.cpf} onChange={e => setForm(f => ({...f, cpf: maskCpf(e.target.value)}))} placeholder="000.000.000-00" maxLength={14} />
                </Field>
              </div>

              <hr className="border-rose-light my-2" />

              {/* Address */}
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="CEP *" error={errors.zip}>
                  <input
                    className="input"
                    value={form.zip}
                    onChange={e => setForm(f => ({...f, zip: formatZip(e.target.value)}))}
                    onBlur={handleZipBlur}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  {zipLoading && <p className="text-xs text-muted mt-1">🔍 Buscando endereço...</p>}
                </Field>
                <Field label="Rua / Logradouro *" error={errors.street} className="sm:col-span-2">
                  <input className="input" value={form.street} onChange={e => setForm(f => ({...f, street: e.target.value}))} placeholder="Rua das Flores" />
                </Field>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="Número *" error={errors.number}>
                  <input className="input" value={form.number} onChange={e => setForm(f => ({...f, number: e.target.value}))} placeholder="123" />
                </Field>
                <Field label="Complemento" className="sm:col-span-2">
                  <input className="input" value={form.complement} onChange={e => setForm(f => ({...f, complement: e.target.value}))} placeholder="Apto 4, bloco B..." />
                </Field>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="Bairro">
                  <input className="input" value={form.neighborhood} onChange={e => setForm(f => ({...f, neighborhood: e.target.value}))} placeholder="Centro" />
                </Field>
                <Field label="Cidade *" error={errors.city}>
                  <input className="input" value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} placeholder="São Paulo" />
                </Field>
                <Field label="Estado">
                  <input className="input" value={form.state} onChange={e => setForm(f => ({...f, state: e.target.value.toUpperCase().slice(0,2)}))} placeholder="SP" maxLength={2} />
                </Field>
              </div>
            </div>

            <button onClick={handleAddressNext} disabled={loading} className="btn-primary w-full mt-7 py-4">
              {loading ? '⏳ Calculando frete...' : 'Continuar → Escolher frete'}
            </button>
          </div>
        )}

        {/* ===== STEP: SHIPPING ===== */}
        {step === 'shipping' && (
          <div className="bg-white rounded-3xl border border-rose-light p-7">
            <button onClick={() => setStep('address')} className="text-sm text-muted hover:text-rose-deep mb-5 flex items-center gap-1">
              ← Voltar
            </button>
            <h2 className="font-display text-2xl font-bold text-charcoal mb-6">🚚 Escolha o frete</h2>

            <div className="space-y-3">
              {shippingOptions.map(opt => (
                <label
                  key={opt.service}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedShipping?.service === opt.service
                      ? 'border-rose-deep bg-rose-pale'
                      : 'border-rose-light hover:border-rose'
                  }`}
                >
                  <input
                    type="radio"
                    name="shipping"
                    value={opt.service}
                    checked={selectedShipping?.service === opt.service}
                    onChange={() => setSelectedShipping(opt)}
                    className="accent-rose-deep"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-charcoal text-sm">{opt.name}</p>
                    <p className="text-xs text-muted">Prazo: até {opt.estimated_days} dias úteis</p>
                  </div>
                  <p className="font-bold text-rose-deep">{formatCurrency(opt.price)}</p>
                </label>
              ))}
            </div>

            <button
              onClick={() => {
                if (!selectedShipping) { toast.error('Selecione o frete'); return }
                trackAddShippingInfo(items, cartTotal + selectedShipping.price, selectedShipping.service)
                setStep('payment')
              }}
              className="btn-primary w-full mt-7 py-4"
            >
              Continuar → Pagamento
            </button>
          </div>
        )}

        {/* ===== STEP: PAYMENT ===== */}
        {step === 'payment' && (
          <div className="bg-white rounded-3xl border border-rose-light p-7">
            <button onClick={() => setStep('shipping')} className="text-sm text-muted hover:text-rose-deep mb-5 flex items-center gap-1">
              ← Voltar
            </button>
            <h2 className="font-display text-2xl font-bold text-charcoal mb-6">💳 Forma de pagamento</h2>

            {/* Method tabs */}
            <div className="grid grid-cols-2 gap-3 mb-7">
              {[
                { id: 'pix',         label: '💠 Pix',         sub: 'Aprovação na hora · Sem taxa' },
                { id: 'credit_card', label: '💳 Cartão',      sub: 'Crédito em até 12x' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id as 'pix' | 'credit_card')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    paymentMethod === m.id
                      ? 'border-rose-deep bg-rose-pale'
                      : 'border-rose-light hover:border-rose'
                  }`}
                >
                  <p className="font-bold text-charcoal text-sm">{m.label}</p>
                  <p className="text-xs text-muted mt-0.5">{m.sub}</p>
                </button>
              ))}
            </div>

            {/* PIX info */}
            {paymentMethod === 'pix' && (
              <div className="bg-rose-pale rounded-2xl p-5 text-center">
                <span className="text-5xl block mb-3">💠</span>
                <p className="font-semibold text-charcoal mb-1">Pague com Pix</p>
                <p className="text-sm text-muted">Após confirmar o pedido, você receberá um QR Code para pagar. O pagamento é confirmado em segundos!</p>
                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-green-600 font-semibold">
                  <span>✅</span> Sem taxa adicional · Confirma em segundos
                </div>
              </div>
            )}

            {/* CARD form */}
            {paymentMethod === 'credit_card' && (
              <div className="space-y-4">
                <Field label="Número do cartão">
                  <input className="input" value={cardNumber} onChange={e => setCardNumber(maskCard(e.target.value))} placeholder="0000 0000 0000 0000" maxLength={19} />
                </Field>
                <Field label="Nome no cartão">
                  <input className="input" value={cardName} onChange={e => setCardName(e.target.value.toUpperCase())} placeholder="MARIA SILVA" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Validade">
                    <input className="input" value={cardExpiry} onChange={e => setCardExpiry(maskExpiry(e.target.value))} placeholder="MM/AA" maxLength={5} />
                  </Field>
                  <Field label="CVV">
                    <input className="input" value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="123" maxLength={4} />
                  </Field>
                </div>

                {/* Installments */}
                <Field label="Parcelamento">
                  <select className="input" value={installments} onChange={e => setInstallments(Number(e.target.value))}>
                    {installmentOptions.map(opt => (
                      <option key={opt.installments} value={opt.installments}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="bg-rose-pale rounded-xl p-3 text-xs text-muted flex items-center gap-2">
                  🔒 Dados do cartão processados com segurança pelo Mercado Pago. Não armazenamos dados do cartão.
                </div>
              </div>
            )}

            <button onClick={handlePayment} disabled={loading} className="btn-primary w-full mt-7 py-4 text-base">
              {loading
                ? '⏳ Processando...'
                : paymentMethod === 'pix'
                  ? `💠 Gerar QR Code Pix — ${formatCurrency(orderTotal)}`
                  : `💳 Pagar ${formatCurrency(orderTotal)}`}
            </button>

            <p className="text-center text-xs text-muted mt-3">
              🔒 Pagamento 100% seguro via Mercado Pago
            </p>
          </div>
        )}

        {/* ===== STEP: PIX QR CODE ===== */}
        {step === 'pix' && pixData && (
          <div className="bg-white rounded-3xl border border-rose-light p-7 text-center">
            {pixPaid ? (
              <>
                <div className="text-7xl mb-4">🎉</div>
                <h2 className="font-display text-3xl font-bold text-charcoal mb-2">Pagamento confirmado!</h2>
                <p className="text-muted mb-2">Pedido <strong className="text-rose-deep">{pixData.orderNumber}</strong></p>
                <p className="text-sm text-muted mb-6">Você receberá um e-mail com os detalhes. Assim que seu pedido for enviado, você receberá o código de rastreio!</p>
                <button onClick={() => router.push('/')} className="btn-primary">
                  🛍️ Continuar comprando
                </button>
              </>
            ) : (
              <>
                <h2 className="font-display text-2xl font-bold text-charcoal mb-1">Pague com Pix</h2>
                <p className="text-muted text-sm mb-6">
                  Pedido <strong className="text-rose-deep">{pixData.orderNumber}</strong> ·{' '}
                  <strong>{formatCurrency(orderTotal)}</strong>
                </p>

                {/* QR Code */}
                <div className="inline-block bg-white border-4 border-rose-light rounded-2xl p-4 mb-5 shadow-rose">
                  {pixData.qrCodeBase64 ? (
                    <Image src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR Code Pix" width={200} height={200} />
                  ) : (
                    <div className="w-[200px] h-[200px] bg-rose-pale rounded-xl flex items-center justify-center text-5xl">
                      💠
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted mb-3">Ou copie o código Pix:</p>
                <div className="flex gap-2 mb-6">
                  <input
                    readOnly
                    value={pixData.qrCode}
                    className="input text-xs"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pixData.qrCode)
                      setPixCopied(true)
                      toast.success('Código copiado!')
                      setTimeout(() => setPixCopied(false), 2000)
                    }}
                    className="btn-primary shrink-0 px-4"
                  >
                    {pixCopied ? '✓' : '📋'}
                  </button>
                </div>

                <div className="bg-rose-pale rounded-2xl p-4 text-sm text-muted">
                  <div className="flex items-center gap-2 animate-pulse text-rose-deep font-semibold justify-center mb-1">
                    ⏳ Aguardando pagamento...
                  </div>
                  <p>A página atualiza automaticamente quando o Pix for pago.</p>
                  {pixData.expiresAt && (
                    <p className="text-xs mt-1">
                      Expira em: {new Date(pixData.expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── RIGHT: ORDER SUMMARY ── */}
      {step !== 'pix' && (
        <div className="bg-white rounded-3xl border border-rose-light p-6 sticky top-24">
          <h3 className="font-display text-lg font-bold text-charcoal mb-5">Resumo do pedido</h3>

          {/* Items */}
          <ul className="space-y-3 mb-5 max-h-64 overflow-y-auto pr-1">
            {items.map(item => {
              const cover = item.product.images?.find(i => i.is_cover) ?? item.product.images?.[0]
              return (
                <li key={item.product.id} className="flex gap-3 items-center">
                  <div className="w-12 h-12 rounded-xl bg-rose-pale flex items-center justify-center shrink-0 overflow-hidden relative">
                    {cover
                      ? <Image src={cover.url} alt={item.product.name} fill className="object-cover" sizes="48px" />
                      : <span className="text-2xl">🧸</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-charcoal truncate">{item.product.name}</p>
                    <p className="text-xs text-muted">Qtd: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-rose-deep shrink-0">
                    {formatCurrency(item.product.price * item.quantity)}
                  </p>
                </li>
              )
            })}
          </ul>

          <hr className="border-rose-light mb-4" />

          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Frete</span>
              <span>{selectedShipping ? formatCurrency(selectedShipping.price) : '—'}</span>
            </div>
          </div>

          <div className="flex justify-between items-baseline border-t border-rose-light pt-4">
            <span className="font-semibold text-charcoal">Total</span>
            <span className="font-display text-2xl font-bold text-rose-deep">
              {formatCurrency(orderTotal)}
            </span>
          </div>

          <div className="mt-4 text-xs text-muted text-center space-y-1">
            <p>🔒 Pagamento seguro via Mercado Pago</p>
            <p>🚚 Enviamos para todo o Brasil</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Field wrapper component ──
function Field({
  label, error, children, className = '',
}: {
  label: string; error?: string; children: React.ReactNode; className?: string
}) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

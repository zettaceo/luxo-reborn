'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import type { CustomerAddress, CustomerPaymentMethod } from '@/types'
import { formatCurrency, formatDateTime, formatZip, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/utils'

type AccountTab = 'dados' | 'enderecos' | 'pagamentos' | 'pedidos'

type AccountCustomer = {
  id: string
  name: string
  email: string
  phone?: string | null
  cpf?: string | null
  created_at: string
}

type AccountOrderItem = {
  id: string
  product_name: string
  quantity: number
  total_price: number
}

type AccountOrder = {
  id: string
  order_number: string
  status: string
  payment_status: string
  payment_method: string
  total: number
  shipping_service?: string | null
  tracking_code?: string | null
  created_at: string
  address_city: string
  address_state: string
  tracking_status?: string | null
  tracking_updated_at?: string | null
  tracking_delivered?: boolean
  items?: AccountOrderItem[]
}

function sanitizeState(value: string) {
  return value.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()
}

function maskCpf(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function maskPhone(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

function maskZip(value: string) {
  return value.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')
}

const EMPTY_ADDRESS_FORM = {
  label: 'Principal',
  recipient_name: '',
  phone: '',
  zip: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  is_default: false,
}

const EMPTY_PAYMENT_FORM = {
  type: 'pix' as CustomerPaymentMethod['type'],
  label: '',
  holder_name: '',
  brand: '',
  last4: '',
  token_reference: '',
  is_default: false,
}

export default function ContaClient() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [activeTab, setActiveTab] = useState<AccountTab>('dados')

  const [customer, setCustomer] = useState<AccountCustomer | null>(null)
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '', cpf: '' })

  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS_FORM)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)

  const [paymentMethods, setPaymentMethods] = useState<CustomerPaymentMethod[]>([])
  const [paymentForm, setPaymentForm] = useState(EMPTY_PAYMENT_FORM)
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)

  const [orders, setOrders] = useState<AccountOrder[]>([])

  const tabItems = useMemo<Array<{ key: AccountTab; label: string }>>(
    () => [
      { key: 'dados', label: 'Dados pessoais' },
      { key: 'enderecos', label: 'Endereços' },
      { key: 'pagamentos', label: 'Pagamentos' },
      { key: 'pedidos', label: 'Pedidos' },
    ],
    []
  )

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const meRes = await fetch('/api/account/me')
      const meData = await meRes.json()

      if (meRes.status === 401) {
        setUnauthorized(true)
        setCustomer(null)
        return
      }
      if (!meRes.ok) throw new Error(meData.error ?? 'Não foi possível carregar sua conta.')

      const me = meData.data as AccountCustomer
      setUnauthorized(false)
      setCustomer(me)
      setProfileForm({
        name: me.name ?? '',
        email: me.email ?? '',
        phone: me.phone ?? '',
        cpf: me.cpf ? maskCpf(me.cpf) : '',
      })

      const [addrRes, payRes, ordersRes] = await Promise.all([
        fetch('/api/account/addresses'),
        fetch('/api/account/payment-methods'),
        fetch('/api/account/orders'),
      ])

      const [addrData, payData, ordersData] = await Promise.all([addrRes.json(), payRes.json(), ordersRes.json()])
      if (addrRes.ok) setAddresses((addrData.data ?? []) as CustomerAddress[])
      if (payRes.ok) setPaymentMethods((payData.data ?? []) as CustomerPaymentMethod[])
      if (ordersRes.ok) setOrders((ordersData.data ?? []) as AccountOrder[])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Falha ao carregar sua conta.')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/account/auth/logout', { method: 'POST' })
      toast.success('Você saiu da conta.')
      router.push('/conta/login')
      router.refresh()
    } catch {
      toast.error('Não foi possível sair agora.')
    }
  }

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    try {
      const res = await fetch('/api/account/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Não foi possível atualizar seu perfil.')

      setCustomer(data.data as AccountCustomer)
      setProfileForm((old) => ({ ...old, cpf: old.cpf ? maskCpf(old.cpf) : '' }))
      toast.success('Dados atualizados com sucesso!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar dados.')
    }
  }

  function startEditAddress(address: CustomerAddress) {
    setEditingAddressId(address.id)
    setAddressForm({
      label: address.label,
      recipient_name: address.recipient_name,
      phone: address.phone ?? '',
      zip: formatZip(address.zip),
      street: address.street,
      number: address.number,
      complement: address.complement ?? '',
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      is_default: address.is_default,
    })
    setActiveTab('enderecos')
  }

  function resetAddressForm() {
    setEditingAddressId(null)
    setAddressForm(EMPTY_ADDRESS_FORM)
  }

  async function saveAddress(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    try {
      const endpoint = editingAddressId
        ? `/api/account/addresses/${editingAddressId}`
        : '/api/account/addresses'
      const method = editingAddressId ? 'PATCH' : 'POST'

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addressForm,
          state: sanitizeState(addressForm.state),
          zip: addressForm.zip,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Não foi possível salvar o endereço.')

      await loadAll()
      resetAddressForm()
      toast.success(editingAddressId ? 'Endereço atualizado!' : 'Endereço adicionado!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar endereço.')
    }
  }

  async function deleteAddress(id: string) {
    if (!confirm('Deseja remover este endereço?')) return
    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Não foi possível remover o endereço.')

      await loadAll()
      if (editingAddressId === id) resetAddressForm()
      toast.success('Endereço removido.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover endereço.')
    }
  }

  async function setDefaultAddress(address: CustomerAddress) {
    if (address.is_default) return
    try {
      const res = await fetch(`/api/account/addresses/${address.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: address.label,
          recipient_name: address.recipient_name,
          phone: address.phone,
          zip: address.zip,
          street: address.street,
          number: address.number,
          complement: address.complement,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
          is_default: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Não foi possível definir endereço principal.')

      await loadAll()
      toast.success('Endereço principal atualizado.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar endereço principal.')
    }
  }

  function startEditPayment(method: CustomerPaymentMethod) {
    setEditingPaymentId(method.id)
    setPaymentForm({
      type: method.type,
      label: method.label,
      holder_name: method.holder_name ?? '',
      brand: method.brand ?? '',
      last4: method.last4 ?? '',
      token_reference: method.token_reference ?? '',
      is_default: method.is_default,
    })
    setActiveTab('pagamentos')
  }

  function resetPaymentForm() {
    setEditingPaymentId(null)
    setPaymentForm(EMPTY_PAYMENT_FORM)
  }

  async function savePaymentMethod(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    try {
      const endpoint = editingPaymentId
        ? `/api/account/payment-methods/${editingPaymentId}`
        : '/api/account/payment-methods'
      const method = editingPaymentId ? 'PATCH' : 'POST'
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentForm,
          last4: paymentForm.last4.replace(/\D/g, '').slice(0, 4),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Não foi possível salvar a forma de pagamento.')

      await loadAll()
      resetPaymentForm()
      toast.success(editingPaymentId ? 'Forma de pagamento atualizada!' : 'Forma de pagamento adicionada!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar forma de pagamento.')
    }
  }

  async function deletePaymentMethod(id: string) {
    if (!confirm('Deseja remover esta forma de pagamento?')) return
    try {
      const res = await fetch(`/api/account/payment-methods/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Não foi possível remover esta forma de pagamento.')

      await loadAll()
      if (editingPaymentId === id) resetPaymentForm()
      toast.success('Forma de pagamento removida.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover forma de pagamento.')
    }
  }

  async function setDefaultPayment(method: CustomerPaymentMethod) {
    if (method.is_default) return
    try {
      const res = await fetch(`/api/account/payment-methods/${method.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: method.type,
          label: method.label,
          holder_name: method.holder_name,
          brand: method.brand,
          last4: method.last4,
          token_reference: method.token_reference,
          is_default: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Não foi possível definir forma de pagamento principal.')

      await loadAll()
      toast.success('Forma de pagamento principal atualizada.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar forma principal.')
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto bg-white border border-rose-light rounded-3xl p-8 animate-pulse">
        <div className="h-7 w-56 bg-rose-light rounded mb-3" />
        <div className="h-4 w-80 bg-rose-light rounded mb-7" />
        <div className="h-10 w-full bg-rose-light rounded-xl mb-4" />
        <div className="h-40 w-full bg-rose-light rounded-2xl" />
      </div>
    )
  }

  if (unauthorized) {
    return (
      <div className="max-w-xl mx-auto bg-white border border-rose-light rounded-3xl p-8 text-center">
        <h1 className="font-display text-2xl font-bold text-charcoal mb-2">Sua conta da loja</h1>
        <p className="text-muted mb-6">
          Entre para acessar seus dados, endereços, pagamentos e pedidos.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/conta/login" className="btn-primary">
            Entrar
          </Link>
          <Link href="/conta/cadastro" className="btn-secondary">
            Criar conta
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <section className="bg-white border border-rose-light rounded-3xl p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-charcoal">👤 Minha conta</h1>
            <p className="text-sm text-muted mt-1">
              Bem-vinda, {customer?.name}. Cadastro desde {customer ? formatDateTime(customer.created_at) : '-'}.
            </p>
          </div>
          <button onClick={handleLogout} className="btn-outline" type="button">
            Sair da conta
          </button>
        </div>
      </section>

      <section className="bg-white border border-rose-light rounded-3xl p-3">
        <div className="grid sm:grid-cols-4 gap-2">
          {tabItems.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                activeTab === tab.key ? 'bg-rose-deep text-white' : 'bg-rose-pale text-charcoal hover:bg-rose-light'
              }`}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === 'dados' && (
        <section className="bg-white border border-rose-light rounded-3xl p-6 md:p-8">
          <h2 className="font-display text-xl font-bold text-charcoal mb-4">Dados pessoais</h2>
          <form onSubmit={saveProfile} className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Nome completo</label>
              <input
                className="input"
                value={profileForm.name}
                onChange={(e) => setProfileForm((old) => ({ ...old, name: e.target.value }))}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">E-mail</label>
              <input
                type="email"
                className="input"
                value={profileForm.email}
                onChange={(e) => setProfileForm((old) => ({ ...old, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input
                className="input"
                value={profileForm.phone}
                onChange={(e) => setProfileForm((old) => ({ ...old, phone: maskPhone(e.target.value) }))}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <label className="label">CPF</label>
              <input
                className="input"
                value={profileForm.cpf}
                onChange={(e) => setProfileForm((old) => ({ ...old, cpf: maskCpf(e.target.value) }))}
                placeholder="000.000.000-00"
              />
            </div>
            <button className="btn-primary sm:col-span-2 py-3.5" type="submit">
              Salvar dados
            </button>
          </form>
        </section>
      )}

      {activeTab === 'enderecos' && (
        <section className="bg-white border border-rose-light rounded-3xl p-6 md:p-8 space-y-6">
          <div>
            <h2 className="font-display text-xl font-bold text-charcoal">Endereços</h2>
            <p className="text-sm text-muted mt-1">Cadastre e edite seus endereços para agilizar checkout.</p>
          </div>

          <form onSubmit={saveAddress} className="grid sm:grid-cols-2 gap-4 border border-rose-light rounded-2xl p-4">
            <div>
              <label className="label">Apelido do endereço</label>
              <input
                className="input"
                value={addressForm.label}
                onChange={(e) => setAddressForm((old) => ({ ...old, label: e.target.value }))}
                placeholder="Casa, Trabalho..."
              />
            </div>
            <div>
              <label className="label">Destinatário</label>
              <input
                className="input"
                value={addressForm.recipient_name}
                onChange={(e) => setAddressForm((old) => ({ ...old, recipient_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input
                className="input"
                value={addressForm.phone}
                onChange={(e) => setAddressForm((old) => ({ ...old, phone: maskPhone(e.target.value) }))}
              />
            </div>
            <div>
              <label className="label">CEP</label>
              <input
                className="input"
                value={addressForm.zip}
                onChange={(e) => setAddressForm((old) => ({ ...old, zip: maskZip(e.target.value) }))}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Rua</label>
              <input
                className="input"
                value={addressForm.street}
                onChange={(e) => setAddressForm((old) => ({ ...old, street: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Número</label>
              <input
                className="input"
                value={addressForm.number}
                onChange={(e) => setAddressForm((old) => ({ ...old, number: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Complemento</label>
              <input
                className="input"
                value={addressForm.complement}
                onChange={(e) => setAddressForm((old) => ({ ...old, complement: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Bairro</label>
              <input
                className="input"
                value={addressForm.neighborhood}
                onChange={(e) => setAddressForm((old) => ({ ...old, neighborhood: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Cidade</label>
              <input
                className="input"
                value={addressForm.city}
                onChange={(e) => setAddressForm((old) => ({ ...old, city: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">UF</label>
              <input
                className="input"
                value={addressForm.state}
                onChange={(e) => setAddressForm((old) => ({ ...old, state: sanitizeState(e.target.value) }))}
                required
                maxLength={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="address-default"
                type="checkbox"
                checked={addressForm.is_default}
                onChange={(e) => setAddressForm((old) => ({ ...old, is_default: e.target.checked }))}
              />
              <label htmlFor="address-default" className="text-sm text-charcoal">
                Definir como principal
              </label>
            </div>
            <div className="sm:col-span-2 flex flex-wrap gap-2">
              <button type="submit" className="btn-primary">
                {editingAddressId ? 'Salvar edição' : 'Adicionar endereço'}
              </button>
              {editingAddressId && (
                <button type="button" className="btn-outline" onClick={resetAddressForm}>
                  Cancelar edição
                </button>
              )}
            </div>
          </form>

          <div className="space-y-3">
            {addresses.length === 0 ? (
              <p className="text-sm text-muted">Você ainda não possui endereços cadastrados.</p>
            ) : (
              addresses.map((address) => (
                <article key={address.id} className="border border-rose-light rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-charcoal">{address.label}</p>
                      <p className="text-sm text-muted">
                        {address.recipient_name}
                        {address.is_default ? ' · Principal' : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!address.is_default && (
                        <button className="btn-outline text-xs" onClick={() => setDefaultAddress(address)} type="button">
                          Tornar principal
                        </button>
                      )}
                      <button className="btn-outline text-xs" onClick={() => startEditAddress(address)} type="button">
                        Editar
                      </button>
                      <button className="btn-outline text-xs" onClick={() => deleteAddress(address.id)} type="button">
                        Excluir
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-charcoal mt-2">
                    {address.street}, {address.number}
                    {address.complement ? `, ${address.complement}` : ''} - {address.neighborhood}
                  </p>
                  <p className="text-sm text-charcoal">
                    {address.city}/{address.state} · CEP {formatZip(address.zip)}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>
      )}

      {activeTab === 'pagamentos' && (
        <section className="bg-white border border-rose-light rounded-3xl p-6 md:p-8 space-y-6">
          <div>
            <h2 className="font-display text-xl font-bold text-charcoal">Formas de pagamento</h2>
            <p className="text-sm text-muted mt-1">
              Salve apenas referência segura (ex.: últimos 4 dígitos/token). Nunca informe número completo ou CVV.
            </p>
          </div>

          <form onSubmit={savePaymentMethod} className="grid sm:grid-cols-2 gap-4 border border-rose-light rounded-2xl p-4">
            <div>
              <label className="label">Tipo</label>
              <select
                className="input"
                value={paymentForm.type}
                onChange={(e) =>
                  setPaymentForm((old) => ({ ...old, type: e.target.value as CustomerPaymentMethod['type'] }))
                }
              >
                <option value="pix">Pix</option>
                <option value="credit_card">Cartão de crédito</option>
                <option value="debit_card">Cartão de débito</option>
                <option value="boleto">Boleto</option>
                <option value="wallet">Carteira digital</option>
              </select>
            </div>
            <div>
              <label className="label">Apelido</label>
              <input
                className="input"
                value={paymentForm.label}
                onChange={(e) => setPaymentForm((old) => ({ ...old, label: e.target.value }))}
                placeholder="Meu cartão principal"
                required
              />
            </div>
            <div>
              <label className="label">Nome do titular</label>
              <input
                className="input"
                value={paymentForm.holder_name}
                onChange={(e) => setPaymentForm((old) => ({ ...old, holder_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Bandeira/Provedor</label>
              <input
                className="input"
                value={paymentForm.brand}
                onChange={(e) => setPaymentForm((old) => ({ ...old, brand: e.target.value }))}
                placeholder="Visa, Mastercard, Mercado Pago..."
              />
            </div>
            <div>
              <label className="label">Últimos 4 dígitos</label>
              <input
                className="input"
                value={paymentForm.last4}
                onChange={(e) =>
                  setPaymentForm((old) => ({ ...old, last4: e.target.value.replace(/\D/g, '').slice(0, 4) }))
                }
                placeholder="1234"
              />
            </div>
            <div>
              <label className="label">Referência do token</label>
              <input
                className="input"
                value={paymentForm.token_reference}
                onChange={(e) => setPaymentForm((old) => ({ ...old, token_reference: e.target.value }))}
                placeholder="tok_xxx (opcional)"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="payment-default"
                type="checkbox"
                checked={paymentForm.is_default}
                onChange={(e) => setPaymentForm((old) => ({ ...old, is_default: e.target.checked }))}
              />
              <label htmlFor="payment-default" className="text-sm text-charcoal">
                Definir como principal
              </label>
            </div>
            <div className="sm:col-span-2 flex flex-wrap gap-2">
              <button type="submit" className="btn-primary">
                {editingPaymentId ? 'Salvar edição' : 'Adicionar forma'}
              </button>
              {editingPaymentId && (
                <button type="button" className="btn-outline" onClick={resetPaymentForm}>
                  Cancelar edição
                </button>
              )}
            </div>
          </form>

          <div className="space-y-3">
            {paymentMethods.length === 0 ? (
              <p className="text-sm text-muted">Nenhuma forma de pagamento cadastrada.</p>
            ) : (
              paymentMethods.map((method) => (
                <article key={method.id} className="border border-rose-light rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-charcoal">
                        {method.label}
                        {method.is_default ? ' · Principal' : ''}
                      </p>
                      <p className="text-sm text-muted">
                        {method.type.replace('_', ' ')}
                        {method.brand ? ` · ${method.brand}` : ''}
                        {method.last4 ? ` · final ${method.last4}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!method.is_default && (
                        <button className="btn-outline text-xs" onClick={() => setDefaultPayment(method)} type="button">
                          Tornar principal
                        </button>
                      )}
                      <button className="btn-outline text-xs" onClick={() => startEditPayment(method)} type="button">
                        Editar
                      </button>
                      <button className="btn-outline text-xs" onClick={() => deletePaymentMethod(method.id)} type="button">
                        Excluir
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      )}

      {activeTab === 'pedidos' && (
        <section className="bg-white border border-rose-light rounded-3xl p-6 md:p-8 space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold text-charcoal">Meus pedidos</h2>
            <p className="text-sm text-muted mt-1">Acompanhe status, pagamento e rastreio.</p>
          </div>

          {orders.length === 0 ? (
            <p className="text-sm text-muted">Você ainda não tem pedidos vinculados à conta.</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const statusInfo = ORDER_STATUS_LABELS[order.status] ?? { label: order.status, color: 'text-muted bg-gray-50' }
                const trackingUrl = order.tracking_code
                  ? `https://rastreamento.correios.com.br/app/index.php?objetos=${order.tracking_code}`
                  : null

                return (
                  <article key={order.id} className="border border-rose-light rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                      <div>
                        <p className="text-sm text-muted">Pedido</p>
                        <h3 className="text-lg font-bold text-rose-deep">{order.order_number}</h3>
                        <p className="text-xs text-muted">{formatDateTime(order.created_at)}</p>
                      </div>
                      <span className={`badge ${statusInfo.color}`}>{statusInfo.label}</span>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3 mb-4 text-sm">
                      <div>
                        <p className="text-xs text-muted">Pagamento</p>
                        <p className="font-semibold text-charcoal">
                          {order.payment_method === 'pix' ? 'Pix' : 'Cartão'} ·{' '}
                          {PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Destino</p>
                        <p className="font-semibold text-charcoal">
                          {order.address_city}/{order.address_state}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Total</p>
                        <p className="font-semibold text-charcoal">{formatCurrency(Number(order.total))}</p>
                      </div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div className="border-t border-rose-light pt-3 mb-4">
                        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Itens</p>
                        <ul className="space-y-1 text-sm text-charcoal">
                          {order.items.map((item) => (
                            <li key={item.id} className="flex justify-between gap-2">
                              <span>
                                {item.quantity}x {item.product_name}
                              </span>
                              <span className="font-semibold">{formatCurrency(Number(item.total_price))}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {order.tracking_code ? (
                        <div className="text-sm text-charcoal">
                          <span className="text-muted">Rastreio:</span> <strong className="font-mono">{order.tracking_code}</strong>
                          {order.tracking_status && (
                            <p className="text-xs text-muted mt-1">
                              Status automático: {order.tracking_status}
                              {order.tracking_updated_at ? ` · ${formatDateTime(order.tracking_updated_at)}` : ''}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-muted">Código de rastreio ainda não disponível.</div>
                      )}

                      {trackingUrl && (
                        <a
                          href={trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-outline text-sm"
                        >
                          Rastrear pedido
                        </a>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

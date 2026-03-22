// ══════════════════════════════════════════════
// UTILS — Funções utilitárias
// ══════════════════════════════════════════════

import slugify from 'slugify'

// ── FORMATAÇÃO ───────────────────────────────
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date))
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
  }
  return phone
}

export function formatCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '')
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatZip(zip: string): string {
  return zip.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2')
}

// ── SLUG ─────────────────────────────────────
export function createSlug(text: string): string {
  return slugify(text, { lower: true, strict: true, locale: 'pt' })
}

// ── CEP — busca endereço via ViaCEP ──────────
export async function fetchAddressByZip(zip: string) {
  const digits = zip.replace(/\D/g, '')
  if (digits.length !== 8) throw new Error('CEP inválido')

  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
  const data = await res.json()

  if (data.erro) throw new Error('CEP não encontrado')

  return {
    street:       data.logradouro,
    neighborhood: data.bairro,
    city:         data.localidade,
    state:        data.uf,
    zip:          digits,
  }
}

// ── VALIDAÇÕES ───────────────────────────────
export function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i)
  let rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  if (rest !== parseInt(digits[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i)
  rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  return rest === parseInt(digits[10])
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ── STATUS LABELS ─────────────────────────────
export const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: '⏳ Aguardando pagamento', color: 'text-yellow-600 bg-yellow-50' },
  paid:      { label: '✅ Pago — preparando',    color: 'text-green-600 bg-green-50' },
  shipped:   { label: '🚚 Enviado',              color: 'text-blue-600 bg-blue-50' },
  delivered: { label: '📦 Entregue',             color: 'text-purple-600 bg-purple-50' },
  cancelled: { label: '❌ Cancelado',            color: 'text-red-600 bg-red-50' },
  refunded:  { label: '↩️ Estornado',            color: 'text-gray-600 bg-gray-50' },
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending:   '⏳ Pendente',
  approved:  '✅ Aprovado',
  rejected:  '❌ Recusado',
  cancelled: '🚫 Cancelado',
}

// ── CLASS NAMES ───────────────────────────────
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// ── INSTALLMENTS (re-export from MP lib for client use) ──
export function calculateInstallments(total: number) {
  return Array.from({ length: 12 }, (_, i) => {
    const n = i + 1
    let installmentValue: number
    let label: string
    if (n <= 3) {
      installmentValue = total / n
      label = `${n}x de R$ ${installmentValue.toFixed(2).replace('.',',')} sem juros`
    } else {
      const rate = 0.0199
      installmentValue = (total * rate * Math.pow(1+rate, n)) / (Math.pow(1+rate,n) - 1)
      label = `${n}x de R$ ${installmentValue.toFixed(2).replace('.',',')} com juros`
    }
    return { installments: n, installment_amount: installmentValue, total_amount: installmentValue * n, label }
  })
}

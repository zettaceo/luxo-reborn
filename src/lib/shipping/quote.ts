import type { ShippingOption } from '@/types'

interface ShippingQuoteItem {
  id: string
  name: string
  quantity: number
  weight_grams?: number | null
  price: number
}

function zipDigits(value: string) {
  return value.replace(/\D/g, '')
}

function fallbackQuotes(items: ShippingQuoteItem[]): ShippingOption[] {
  const totalWeightGrams = items.reduce((sum, item) => {
    const itemWeight = Number(item.weight_grams ?? 500)
    return sum + Math.max(itemWeight, 100) * item.quantity
  }, 0)

  const weightExtraKg = Math.max(0, totalWeightGrams - 500) / 1000

  return [
    {
      service: 'PAC',
      name: 'PAC — Correios',
      price: Number((18.5 + weightExtraKg * 2.2).toFixed(2)),
      estimated_days: 7,
      provider: 'fallback',
    },
    {
      service: 'SEDEX',
      name: 'SEDEX — Correios',
      price: Number((32 + weightExtraKg * 3.4).toFixed(2)),
      estimated_days: 3,
      provider: 'fallback',
    },
    {
      service: 'MINI',
      name: 'Mini Envios',
      price: Number((14.9 + weightExtraKg * 1.7).toFixed(2)),
      estimated_days: 10,
      provider: 'fallback',
    },
  ]
}

async function quoteWithMelhorEnvio(destinationZip: string, items: ShippingQuoteItem[]): Promise<ShippingOption[]> {
  const token = process.env.MELHOR_ENVIO_ACCESS_TOKEN
  const fromPostalCode = process.env.MELHOR_ENVIO_FROM_POSTAL_CODE
  if (!token || !fromPostalCode) return []

  const baseUrl = (process.env.MELHOR_ENVIO_BASE_URL ?? 'https://www.melhorenvio.com.br').replace(/\/$/, '')
  const services = process.env.MELHOR_ENVIO_SERVICES ?? '1,2'
  const defaultWidth = Number(process.env.MELHOR_ENVIO_DEFAULT_WIDTH_CM ?? 16)
  const defaultHeight = Number(process.env.MELHOR_ENVIO_DEFAULT_HEIGHT_CM ?? 6)
  const defaultLength = Number(process.env.MELHOR_ENVIO_DEFAULT_LENGTH_CM ?? 22)

  const payload = {
    from: { postal_code: fromPostalCode },
    to: { postal_code: destinationZip },
    products: items.map((item) => ({
      id: item.id,
      width: defaultWidth,
      height: defaultHeight,
      length: defaultLength,
      weight: Math.max(0.1, Number(item.weight_grams ?? 500) / 1000),
      insurance_value: Number(item.price),
      quantity: item.quantity,
    })),
    options: {
      receipt: false,
      own_hand: false,
    },
    services,
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)

  try {
    const res = await fetch(`${baseUrl}/api/v2/me/shipment/calculate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store',
    })

    if (!res.ok) {
      return []
    }

    const data = await res.json()
    if (!Array.isArray(data)) return []

    const options = data
      .filter((item) => !item.error)
      .map((item) => {
        const rawPrice = Number(item.custom_price ?? item.price ?? item.delivery_price)
        if (!Number.isFinite(rawPrice)) return null

        const deliveryTime = Number(item.custom_delivery_time ?? item.delivery_time ?? item.delivery_range?.max)
        const companyName = item.company?.name ? `${item.company.name} — ` : ''
        const name = `${companyName}${item.name ?? 'Frete'}`
        const service = String(item.id ?? item.service ?? item.name ?? 'FRETE')

        return {
          service,
          name,
          price: rawPrice,
          estimated_days: Number.isFinite(deliveryTime) ? deliveryTime : 7,
          provider: 'melhor_envio',
        } satisfies ShippingOption
      })
      .filter((item): item is {
        service: string
        name: string
        price: number
        estimated_days: number
        provider: string
      } => item !== null)
      .sort((a, b) => a.price - b.price)

    return options
  } finally {
    clearTimeout(timeout)
  }
}

export async function calculateShippingQuotes({
  destinationZip,
  items,
}: {
  destinationZip: string
  items: ShippingQuoteItem[]
}): Promise<ShippingOption[]> {
  const zip = zipDigits(destinationZip)
  if (zip.length !== 8 || items.length === 0) return []

  const realQuotes = await quoteWithMelhorEnvio(zip, items)
  if (realQuotes.length > 0) return realQuotes

  return fallbackQuotes(items)
}

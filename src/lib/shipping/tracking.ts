export interface TrackingInfo {
  tracking_code: string
  status: string
  description: string
  updated_at?: string
  delivered: boolean
  source: 'brasilapi'
}

function normalizeTrackingCode(code: string) {
  return code.replace(/\s/g, '').toUpperCase()
}

function parseEventDate(rawDate: unknown, rawTime: unknown) {
  if (typeof rawDate !== 'string') return undefined
  const cleanDate = rawDate.trim()
  const cleanTime = typeof rawTime === 'string' ? rawTime.trim() : '00:00'

  const dateMatch = cleanDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (dateMatch) {
    const [, dd, mm, yyyy] = dateMatch
    const iso = `${yyyy}-${mm}-${dd}T${cleanTime}:00`
    const parsed = new Date(iso)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
  }

  const parsed = new Date(cleanDate)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
}

export async function getTrackingInfo(trackingCode: string): Promise<TrackingInfo | null> {
  const code = normalizeTrackingCode(trackingCode)
  if (!code) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(`https://brasilapi.com.br/api/correios/v1/${code}`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    })

    if (!res.ok) return null
    const data = await res.json()

    const events = Array.isArray(data.eventos)
      ? data.eventos
      : Array.isArray(data.events)
        ? data.events
        : []

    const latest = events[0] ?? null
    const statusText = String(
      latest?.status ??
      latest?.descricao ??
      latest?.description ??
      data.message ??
      data.status ??
      'Em transporte'
    )

    const place = String(latest?.local ?? latest?.location ?? '').trim()
    const description = place ? `${statusText} — ${place}` : statusText
    const delivered = /(entregue|delivered)/i.test(description)

    return {
      tracking_code: code,
      status: statusText,
      description,
      updated_at: parseEventDate(latest?.data ?? latest?.date, latest?.hora ?? latest?.time),
      delivered,
      source: 'brasilapi',
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

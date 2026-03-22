'use client'

import type { CartItem, Product } from '@/types'

type AnalyticsParams = Record<string, unknown>
type AttributionData = {
  source: string
  medium: string
  campaign: string
  content: string
  term: string
}

const SESSION_KEY = 'luxo-reborn-session-id'
const FIRST_ATTR_KEY = 'luxo-reborn-attribution-first'
const LAST_ATTR_KEY = 'luxo-reborn-attribution-last'
const DEFAULT_ATTRIBUTION: AttributionData = {
  source: '(direct)',
  medium: '(none)',
  campaign: '(not set)',
  content: '',
  term: '',
}

function isBrowser() {
  return typeof window !== 'undefined'
}

function getSessionId() {
  if (!isBrowser()) return 'server'

  const fromStorage = window.localStorage.getItem(SESSION_KEY)
  if (fromStorage) return fromStorage

  const generated = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : `session-${Date.now()}-${Math.random().toString(36).slice(2)}`

  window.localStorage.setItem(SESSION_KEY, generated)
  return generated
}

function parseAttributionFromUrl(): AttributionData {
  if (!isBrowser()) return DEFAULT_ATTRIBUTION

  const params = new URLSearchParams(window.location.search)
  const hasUtm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].some((key) => params.has(key))

  if (params.get('gclid')) {
    return {
      source: params.get('utm_source') ?? 'google',
      medium: params.get('utm_medium') ?? 'cpc',
      campaign: params.get('utm_campaign') ?? '(google ads)',
      content: params.get('utm_content') ?? '',
      term: params.get('utm_term') ?? '',
    }
  }

  if (params.get('fbclid')) {
    return {
      source: params.get('utm_source') ?? 'facebook',
      medium: params.get('utm_medium') ?? 'paid_social',
      campaign: params.get('utm_campaign') ?? '(meta ads)',
      content: params.get('utm_content') ?? '',
      term: params.get('utm_term') ?? '',
    }
  }

  if (!hasUtm) return DEFAULT_ATTRIBUTION

  return {
    source: params.get('utm_source') ?? DEFAULT_ATTRIBUTION.source,
    medium: params.get('utm_medium') ?? DEFAULT_ATTRIBUTION.medium,
    campaign: params.get('utm_campaign') ?? DEFAULT_ATTRIBUTION.campaign,
    content: params.get('utm_content') ?? '',
    term: params.get('utm_term') ?? '',
  }
}

function readStoredAttribution(key: string): AttributionData | null {
  if (!isBrowser()) return null
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as AttributionData) : null
  } catch {
    return null
  }
}

function saveAttribution(key: string, data: AttributionData) {
  if (!isBrowser()) return
  window.localStorage.setItem(key, JSON.stringify(data))
}

function getAttribution() {
  const last = readStoredAttribution(LAST_ATTR_KEY) ?? DEFAULT_ATTRIBUTION
  const first = readStoredAttribution(FIRST_ATTR_KEY) ?? DEFAULT_ATTRIBUTION
  return { last, first }
}

function enrichParams(params: AnalyticsParams = {}): AnalyticsParams {
  const { last, first } = getAttribution()
  return {
    ...params,
    session_id: getSessionId(),
    source: last.source,
    medium: last.medium,
    campaign: last.campaign,
    content: last.content,
    term: last.term,
    first_source: first.source,
    first_medium: first.medium,
    first_campaign: first.campaign,
  }
}

function sendServerEvent(eventName: string, params: AnalyticsParams) {
  if (!isBrowser()) return

  const payload = JSON.stringify({
    event_name: eventName,
    event_params: params,
    session_id: params.session_id,
    page_path: window.location.pathname,
    referrer: document.referrer || null,
  })

  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' })
    navigator.sendBeacon('/api/analytics', blob)
    return
  }

  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => null)
}

export function initAttribution() {
  if (!isBrowser()) return

  const urlAttr = parseAttributionFromUrl()
  const first = readStoredAttribution(FIRST_ATTR_KEY)

  if (!first && urlAttr.source !== DEFAULT_ATTRIBUTION.source) {
    saveAttribution(FIRST_ATTR_KEY, urlAttr)
  }

  if (urlAttr.source !== DEFAULT_ATTRIBUTION.source) {
    saveAttribution(LAST_ATTR_KEY, urlAttr)
  } else if (!readStoredAttribution(LAST_ATTR_KEY)) {
    saveAttribution(LAST_ATTR_KEY, DEFAULT_ATTRIBUTION)
  }

  if (!first) {
    saveAttribution(FIRST_ATTR_KEY, readStoredAttribution(LAST_ATTR_KEY) ?? DEFAULT_ATTRIBUTION)
  }

  if (!window.sessionStorage.getItem('luxo-reborn-session-started')) {
    window.sessionStorage.setItem('luxo-reborn-session-started', '1')
    trackEvent('session_start')
  }
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  if (!isBrowser()) return
  const enriched = enrichParams(params)

  window.dataLayer?.push({ event: eventName, ...enriched })
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, enriched)
  }

  sendServerEvent(eventName, enriched)
}

export function trackMetaEvent(eventName: string, params: AnalyticsParams = {}) {
  if (!isBrowser()) return
  if (typeof window.fbq === 'function') {
    window.fbq('track', eventName, params)
  }
}

function toGaItem(product: Product, quantity = 1) {
  return {
    item_id: product.id,
    item_name: product.name,
    item_category: product.category?.name,
    item_variant: product.badge ?? undefined,
    price: Number(product.price),
    quantity,
  }
}

function toGaItems(items: CartItem[]) {
  return items.map(({ product, quantity }) => toGaItem(product, quantity))
}

export function trackViewItem(product: Product) {
  trackEvent('view_item', {
    currency: 'BRL',
    value: Number(product.price),
    items: [toGaItem(product, 1)],
  })

  trackMetaEvent('ViewContent', {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    value: Number(product.price),
    currency: 'BRL',
  })
}

export function trackAddToCart(product: Product, quantity = 1) {
  const value = Number(product.price) * quantity

  trackEvent('add_to_cart', {
    currency: 'BRL',
    value,
    items: [toGaItem(product, quantity)],
  })

  trackMetaEvent('AddToCart', {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    value,
    currency: 'BRL',
  })
}

export function trackBeginCheckout(items: CartItem[], value: number) {
  trackEvent('begin_checkout', {
    currency: 'BRL',
    value,
    items: toGaItems(items),
  })

  trackMetaEvent('InitiateCheckout', {
    value,
    currency: 'BRL',
    num_items: items.reduce((sum, item) => sum + item.quantity, 0),
  })
}

export function trackAddShippingInfo(items: CartItem[], value: number, shippingTier: string) {
  trackEvent('add_shipping_info', {
    currency: 'BRL',
    value,
    shipping_tier: shippingTier,
    items: toGaItems(items),
  })
}

export function trackAddPaymentInfo(items: CartItem[], value: number, paymentType: string) {
  trackEvent('add_payment_info', {
    currency: 'BRL',
    value,
    payment_type: paymentType,
    items: toGaItems(items),
  })
}

export function trackPurchase({
  orderNumber,
  items,
  value,
  paymentType,
  shippingTier,
}: {
  orderNumber: string
  items: CartItem[]
  value: number
  paymentType: string
  shippingTier?: string
}) {
  trackEvent('purchase', {
    transaction_id: orderNumber,
    currency: 'BRL',
    value,
    payment_type: paymentType,
    shipping_tier: shippingTier,
    items: toGaItems(items),
  })

  trackMetaEvent('Purchase', {
    value,
    currency: 'BRL',
    content_type: 'product',
    num_items: items.reduce((sum, item) => sum + item.quantity, 0),
  })
}

'use client'

import type { CartItem, Product } from '@/types'

type AnalyticsParams = Record<string, unknown>

function isBrowser() {
  return typeof window !== 'undefined'
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  if (!isBrowser()) return

  window.dataLayer?.push({ event: eventName, ...params })
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params)
  }
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

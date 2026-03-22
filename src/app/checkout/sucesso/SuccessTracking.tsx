'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'

export default function SuccessTracking({ orderNumber }: { orderNumber?: string }) {
  useEffect(() => {
    trackEvent('purchase_confirmation_view', {
      order_number: orderNumber ?? 'unknown',
    })
  }, [orderNumber])

  return null
}

'use client'

import { useEffect } from 'react'
import { initAttribution } from '@/lib/analytics'

export default function AnalyticsBootstrap() {
  useEffect(() => {
    initAttribution()
  }, [])

  return null
}

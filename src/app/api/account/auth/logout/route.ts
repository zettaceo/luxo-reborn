import { NextResponse } from 'next/server'
import { clearCustomerSessionCookie } from '@/lib/auth/customer'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  clearCustomerSessionCookie(res)
  return res
}

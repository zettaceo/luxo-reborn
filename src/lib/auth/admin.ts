import type { NextRequest } from 'next/server'

function getAdminSecret() {
  const secret = process.env.ADMIN_SECRET_KEY
  if (!secret) throw new Error('ADMIN_SECRET_KEY is required.')
  return secret
}

export async function createAdminSessionToken() {
  return getAdminSecret()
}

export async function verifyAdminSessionToken(token: string | undefined | null) {
  if (!token) return false
  return token === getAdminSecret()
}

export async function isAdminRequest(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  return verifyAdminSessionToken(token)
}

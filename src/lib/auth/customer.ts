import { createHmac, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'crypto'
import { promisify } from 'util'
import type { NextRequest, NextResponse } from 'next/server'

const scrypt = promisify(nodeScrypt)

export const CUSTOMER_AUTH_COOKIE = 'customer_token'
const CUSTOMER_SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 dias
const PASSWORD_RESET_TOKEN_TTL_SECONDS = 60 * 30 // 30 minutos

type CustomerTokenPayload = {
  customerId: string
  email: string
  exp: number
}

export type CustomerSession = {
  customerId: string
  email: string
}

function getCustomerAuthSecret() {
  const secret = process.env.CUSTOMER_AUTH_SECRET || process.env.ADMIN_SECRET_KEY
  if (!secret) throw new Error('CUSTOMER_AUTH_SECRET ou ADMIN_SECRET_KEY é obrigatório.')
  return secret
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)
  if (aBuffer.length !== bBuffer.length) return false
  return timingSafeEqual(aBuffer, bBuffer)
}

export async function hashCustomerPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const derived = (await scrypt(password, salt, 64)) as Buffer
  return `v1$${salt}$${derived.toString('hex')}`
}

export async function verifyCustomerPassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash) return false
  const [version, salt, hash] = storedHash.split('$')
  if (version !== 'v1' || !salt || !hash) return false

  const derived = (await scrypt(password, salt, 64)) as Buffer
  return safeEqual(hash, derived.toString('hex'))
}

function signToken(payloadBase64: string) {
  return createHmac('sha256', getCustomerAuthSecret()).update(payloadBase64).digest('base64url')
}

function getResetTokenSecret() {
  return `${getCustomerAuthSecret()}:password-reset`
}

export function createCustomerSessionToken(session: CustomerSession) {
  const payload: CustomerTokenPayload = {
    customerId: session.customerId,
    email: session.email,
    exp: Math.floor(Date.now() / 1000) + CUSTOMER_SESSION_MAX_AGE,
  }

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = signToken(payloadBase64)
  return `${payloadBase64}.${signature}`
}

export function verifyCustomerSessionToken(token: string | undefined | null): CustomerSession | null {
  if (!token) return null
  const [payloadBase64, signature] = token.split('.')
  if (!payloadBase64 || !signature) return null

  const expectedSignature = signToken(payloadBase64)
  if (!safeEqual(signature, expectedSignature)) return null

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString()) as CustomerTokenPayload
    if (!payload?.customerId || !payload?.email || !payload?.exp) return null
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return { customerId: payload.customerId, email: payload.email }
  } catch {
    return null
  }
}

export function setCustomerSessionCookie(res: NextResponse, session: CustomerSession) {
  res.cookies.set(CUSTOMER_AUTH_COOKIE, createCustomerSessionToken(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: CUSTOMER_SESSION_MAX_AGE,
    path: '/',
  })
}

export function clearCustomerSessionCookie(res: NextResponse) {
  res.cookies.delete(CUSTOMER_AUTH_COOKIE)
}

export async function getCustomerSessionFromRequest(req: NextRequest) {
  const token = req.cookies.get(CUSTOMER_AUTH_COOKIE)?.value
  return verifyCustomerSessionToken(token)
}

export function hashPasswordResetToken(token: string) {
  return createHmac('sha256', getResetTokenSecret()).update(token).digest('hex')
}

export function createPasswordResetToken() {
  const token = randomBytes(32).toString('base64url')
  return {
    token,
    tokenHash: hashPasswordResetToken(token),
    expiresAtIso: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_SECONDS * 1000).toISOString(),
  }
}

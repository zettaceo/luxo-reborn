import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSessionToken } from '@/lib/auth/admin'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Protege todas as rotas /admin exceto /admin/login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = req.cookies.get('admin_token')?.value
    if (!(await verifyAdminSessionToken(token))) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}

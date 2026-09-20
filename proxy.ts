import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Protect all /admin/* except the login page itself and the auth API
  if (
    pathname.startsWith('/admin') &&
    pathname !== '/admin/login' &&
    !pathname.startsWith('/api/admin/auth')
  ) {
    const token = req.cookies.get('admin_token')?.value
    if (!verifyAdminToken(token)) {
      const loginUrl = new URL('/admin/login', req.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}

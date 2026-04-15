import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('sb-cnhafquczeoxarliruvg-auth-token')
  const token2 = req.cookies.get('sb-cnhafquczeoxarliruvg-auth-token.0')
  const token3 = req.cookies.get('sb-cnhafquczeoxarliruvg-auth-token.1')

  if (!token && !token2 && !token3) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|login|reset-password|update-password).*)'],
}

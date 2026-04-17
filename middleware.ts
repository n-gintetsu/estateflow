import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ログインページはスキップ
  if (pathname === '/login' || pathname === '/reset-password') {
    return NextResponse.next()
  }

  // セッションCookieの存在チェック（簡易チェック）
  const hasCookie = req.cookies.getAll().some(c => 
    c.name.includes('supabase') || c.name.includes('sb-')
  )

  if (!hasCookie) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/login', '/reset-password', '/update-password']

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  
  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Supabaseのクッキーをチェック（複数パターン対応）
  const cookies = req.cookies.getAll()
  const hasSession = cookies.some(c => 
    c.name.includes('supabase') || 
    c.name.includes('sb-') || 
    c.name === 'supabase-auth-token'
  )

  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}

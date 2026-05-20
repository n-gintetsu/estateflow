import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'

export async function POST(req: NextRequest) {
  const { id, password } = await req.json()

  const validId = 'gintetsu'
  const validPassword = process.env.ADMIN_PASSWORD || 'gintetsu2024'

  if (id !== validId || password !== validPassword) {
    return NextResponse.json({ error: 'IDまたはパスワードが正しくありません' }, { status: 401 })
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
  const token = await new SignJWT({ id })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret)

  const response = NextResponse.json({ success: true })
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8,
    path: '/',
  })

  return response
}

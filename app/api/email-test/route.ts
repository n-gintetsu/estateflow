import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { to } = await request.json()
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'APIキー未設定' }, { status: 500 })

    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)

    await resend.emails.send({
      from: 'noreply@gintetsu-fudosan.co.jp',
      to,
      subject: '【GINTETSU不動産】メール通知テスト',
      html: '<p>これはEstateFlowからのテストメールです。正常に送信されています。</p><p>GINTETSU不動産株式会社</p>',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

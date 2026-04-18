import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, company_name, contact_name, agent_code } = body

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'no api key' }, { status: 500 })

    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)

    await resend.emails.send({
      from: 'noreply@gintetsu-fudosan.co.jp',
      to: email,
      subject: 'GINTETSU不動産 仲介業者アカウント承認のお知らせ',
      html: '<div style="font-family:sans-serif;max-width:600px;margin:0 auto">'
        + '<div style="background:#1a3a5c;padding:24px;text-align:center">'
        + '<h1 style="color:white;font-size:20px;margin:0">GINTETSU不動産</h1>'
        + '</div>'
        + '<div style="padding:32px;background:white">'
        + '<p>' + contact_name + ' 様</p>'
        + '<p>' + company_name + ' 様のアカウントが承認されました。</p>'
        + '<p>以下の情報でログインしてください。</p>'
        + '<div style="background:#f8f6f2;border-left:4px solid #c9a84c;padding:16px;margin:24px 0;border-radius:4px">'
        + '<p style="margin:4px 0">業者ID: <strong>' + agent_code + '</strong></p>'
        + '<p style="margin:4px 0">パスワード: ご登録時にご自身で設定されたパスワード</p>'
        + '</div>'
        + '<p>ログインURL: <a href="https://gintetsu-fudosan.co.jp/agent">https://gintetsu-fudosan.co.jp/agent</a></p>'
        + '<p style="color:#666;font-size:13px">パスワードをお忘れの場合は、お手数ですが弊社までご連絡ください。</p>'
        + '<p style="color:#1a3a5c;font-weight:bold">GINTETSU不動産株式会社<br>TEL: 048-606-4317</p>'
        + '</div></div>',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

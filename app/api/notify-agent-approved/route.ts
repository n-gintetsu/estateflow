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
      subject: '[GINTETSU] agent account approved',
      html: '<div style="font-family:sans-serif;max-width:600px;margin:0 auto">'
        + '<div style="background:#1a3a5c;padding:24px;text-align:center">'
        + '<h1 style="color:white;font-size:20px;margin:0">GINTETSU</h1>'
        + '</div>'
        + '<div style="padding:32px;background:white">'
        + '<p>' + contact_name + ' </p>'
        + '<p>GINTETSU agent account has been approved.</p>'
        + '<div style="background:#f8f6f2;border-left:4px solid #c9a84c;padding:16px;margin:24px 0;border-radius:4px">'
        + '<p style="margin:4px 0">ID: <strong>' + agent_code + '</strong></p>'
        + '<p style="margin:4px 0">Password: <strong>Gintetsu2024!</strong></p>'
        + '</div>'
        + '<p>Login: <a href="https://gintetsu-fudosan.co.jp/agent">https://gintetsu-fudosan.co.jp/agent</a></p>'
        + '<p style="color:#666;font-size:13px">Please change your password after login.</p>'
        + '<p style="color:#1a3a5c;font-weight:bold">GINTETSU<br>TEL: 048-606-4317</p>'
        + '</div></div>',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

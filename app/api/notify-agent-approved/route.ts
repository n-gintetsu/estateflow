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
      from: 'GINTETSU不動産 <info@gintetsu-fudosan.co.jp>',
      to: email,
      subject: '【GINTETSU不動産】仲介業者アカウントが承認されました',
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#1a3a5c,#2c5282);padding:24px;border-radius:8px 8px 0 0;text-align:center;">
          <h1 style="color:#c9a84c;font-size:22px;margin:0;">GINTETSU不動産</h1>
          <p style="color:#ffffff;font-size:13px;margin:6px 0 0;">仲介業者ポータル</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;padding:32px 24px;">
          <h2 style="color:#1a3a5c;font-size:18px;margin:0 0 16px;">✅ アカウントが承認されました</h2>
          <p style="color:#4a5568;font-size:14px;line-height:1.8;margin:0 0 24px;">
            ${contact_name} 様<br><br>
            ${company_name} のアカウントが承認されました。<br>
            以下のログイン情報でポータルにアクセスできます。
          </p>
          <div style="background:#f8fafc;border:2px solid #c9a84c;border-radius:8px;padding:20px;margin-bottom:24px;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="color:#6b7280;padding:8px 0;width:120px;">業者ID</td><td style="color:#1a3a5c;font-weight:bold;font-size:16px;">${agent_code}</td></tr>
              <tr><td style="color:#6b7280;padding:8px 0;">パスワード</td><td style="color:#1f2937;">ご登録時にご自身で設定されたパスワード</td></tr>
            </table>
          </div>
          <div style="text-align:center;margin-bottom:24px;">
            <a href="https://gintetsu-fudosan.co.jp/agent" style="display:inline-block;background:linear-gradient(135deg,#1a3a5c,#2c5282);color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">ポータルにログインする →</a>
          </div>
          <div style="background:#fef9ec;border:1px solid #f6d860;border-radius:8px;padding:16px;margin-bottom:24px;">
            <p style="color:#92400e;font-size:13px;margin:0;">⚠️ パスワードはご登録時に設定されたものです。お忘れの場合はログイン画面の「パスワードを忘れた方」からリセットできます。</p>
          </div>
          <p style="color:#6b7280;font-size:12px;border-top:1px solid #e2e8f0;padding-top:16px;margin:0;">
            GINTETSU不動産株式会社　TEL: 048-606-4317<br>
            このメールはGINTETSU不動産システムから自動送信されています。
          </p>
        </div>
      </div>`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

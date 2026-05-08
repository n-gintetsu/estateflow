import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { title, body, target_type, target_partner_id } = await req.json()

    if (!title || !body || !target_type) {
      return NextResponse.json({ error: 'title, body, target_typeは必須です' }, { status: 400 })
    }

    type PartnerUser = { id: string; email: string; company_name: string }
    let targets: PartnerUser[] = []
    let targetLabel = ''

    if (target_type === 'all') {
      const { data } = await supabase
        .from('partner_users')
        .select('id, email, company_name')
        .eq('is_active', true)
        .is('deleted_at', null)
      targets = data || []
      targetLabel = '全パートナー'
    } else if (target_type === 'specific' && target_partner_id) {
      const { data } = await supabase
        .from('partner_users')
        .select('id, email, company_name')
        .eq('id', target_partner_id)
        .maybeSingle()
      if (data) {
        targets = [data]
        targetLabel = data.company_name
      }
    }

    const { error: insertErr } = await supabase
      .from('partner_notifications')
      .insert({
        title,
        body,
        target_type,
        target_partner_id: target_partner_id || null,
        target_label: targetLabel,
      })

    if (insertErr) {
      console.error(insertErr)
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const dashboardUrl = 'https://gintetsu-fudosan.co.jp/partner-dashboard'

    for (const target of targets) {
      const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8f6f2;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8f6f2;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <!-- ヘッダー -->
        <tr>
          <td style="background-color:#1a3a5c;padding:28px 32px;border-radius:12px 12px 0 0;">
            <p style="margin:0;color:#c9a84c;font-size:11px;font-family:sans-serif;letter-spacing:0.15em;font-weight:700;">PARTNER PORTAL</p>
            <p style="margin:6px 0 0;color:#ffffff;font-size:22px;font-family:sans-serif;font-weight:800;letter-spacing:0.05em;">GINTETSU不動産</p>
          </td>
        </tr>

        <!-- 本文エリア -->
        <tr>
          <td style="background-color:#ffffff;padding:36px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">

            <p style="margin:0 0 8px;font-family:sans-serif;font-size:15px;color:#1a3a5c;font-weight:700;">
              ${target.company_name} ご担当者様
            </p>

            <p style="margin:0 0 24px;font-family:sans-serif;font-size:14px;color:#475569;line-height:1.8;">
              平素よりGINTETSU不動産をご利用いただき、誠にありがとうございます。
            </p>

            <!-- タイトル -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8f6f2;border-left:4px solid #c9a84c;margin-bottom:24px;border-radius:0 8px 8px 0;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-family:sans-serif;font-size:15px;font-weight:700;color:#1a3a5c;">${title}</p>
                </td>
              </tr>
            </table>

            <!-- 本文 -->
            <p style="margin:0 0 32px;font-family:sans-serif;font-size:14px;color:#374151;line-height:1.9;white-space:pre-wrap;">${body}</p>

            <!-- CTAボタン -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
              <tr>
                <td align="center">
                  <a href="${dashboardUrl}"
                     style="display:inline-block;background-color:#c9a84c;color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:8px;">
                    ダッシュボードを確認する
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-family:sans-serif;font-size:12px;color:#94a3b8;line-height:1.7;border-top:1px solid #e2e8f0;padding-top:20px;">
              本メールは自動送信にてお届けしております。ご不明点は下記までお問い合わせください。
            </p>

          </td>
        </tr>

        <!-- フッター -->
        <tr>
          <td style="background-color:#1a3a5c;padding:24px 32px;border-radius:0 0 12px 12px;">
            <p style="margin:0 0 6px;font-family:sans-serif;font-size:13px;color:#ffffff;font-weight:700;">GINTETSU不動産株式会社</p>
            <p style="margin:0;font-family:sans-serif;font-size:12px;color:rgba(255,255,255,0.65);line-height:1.8;">
              TEL：048-606-4317（平日9:00〜18:00）<br>
              MAIL：info@gintetsu-fudosan.co.jp<br>
              URL：https://gintetsu-fudosan.co.jp
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`

      try {
        await resend.emails.send({
          from: 'GINTETSU不動産 <info@gintetsu-fudosan.co.jp>',
          to: [target.email],
          subject: `【GINTETSU不動産】${title}`,
          html,
        })
      } catch (mailErr) {
        console.error(`mail failed for ${target.id}:`, mailErr)
      }
    }

    return NextResponse.json({ success: true, sent: targets.length })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

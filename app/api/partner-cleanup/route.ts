import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const now = new Date()

    const warn83 = new Date(now)
    warn83.setDate(warn83.getDate() - 83)

    const delete90 = new Date(now)
    delete90.setDate(delete90.getDate() - 90)

    // 処理A：83日〜89日経過（残り7日以内）で未警告のユーザーに警告メール
    const { data: toWarn, error: warnFetchErr } = await supabase
      .from('partner_users')
      .select('id, email, company_name, deleted_at')
      .not('deleted_at', 'is', null)
      .lte('deleted_at', warn83.toISOString())
      .gt('deleted_at', delete90.toISOString())
      .is('deletion_warned_at', null)

    if (warnFetchErr) {
      console.error('warn fetch error:', warnFetchErr)
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const warnedIds: string[] = []

    for (const user of toWarn || []) {
      const deletionDate = new Date(user.deleted_at)
      deletionDate.setDate(deletionDate.getDate() + 90)
      const deletionDateStr = deletionDate.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>パートナーアカウント完全削除のお知らせ（7日前）</title>
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
              ${user.company_name} ご担当者様
            </p>

            <p style="margin:0 0 20px;font-family:sans-serif;font-size:14px;color:#475569;line-height:1.8;">
              平素よりGINTETSU不動産をご利用いただき、誠にありがとうございます。
            </p>

            <!-- 警告ボックス -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fff5f5;border-left:4px solid #dc2626;margin-bottom:28px;border-radius:0 8px 8px 0;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 12px;font-family:sans-serif;font-size:14px;font-weight:700;color:#dc2626;">
                    ■ パートナーアカウント完全削除のお知らせ
                  </p>
                  <p style="margin:0 0 12px;font-family:sans-serif;font-size:14px;color:#374151;line-height:1.8;">
                    貴社のパートナーアカウントは削除処理中です。<strong>7日後に完全削除されます。</strong>
                  </p>
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="font-family:sans-serif;font-size:13px;color:#64748b;padding:4px 16px 4px 0;white-space:nowrap;">完全削除予定日</td>
                      <td style="font-family:sans-serif;font-size:14px;color:#dc2626;font-weight:700;">${deletionDateStr}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 28px;font-family:sans-serif;font-size:14px;color:#475569;line-height:1.8;">
              アカウントを継続してご利用の場合は、完全削除前に弊社までご連絡ください。担当者がご対応いたします。
            </p>

            <!-- 連絡先ボックス -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8f6f2;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 8px;font-family:sans-serif;font-size:13px;font-weight:700;color:#1a3a5c;">お問い合わせ先</p>
                  <p style="margin:0;font-family:sans-serif;font-size:13px;color:#475569;line-height:1.9;">
                    TEL：048-606-4317（平日9:00〜18:00）<br>
                    MAIL：info@gintetsu-fudosan.co.jp
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-family:sans-serif;font-size:12px;color:#94a3b8;line-height:1.7;border-top:1px solid #e2e8f0;padding-top:20px;">
              本メールは自動送信にてお届けしております。心当たりのない場合や、ご不明な点がございましたら上記までご連絡ください。
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
          to: [user.email],
          subject: '【GINTETSU不動産】パートナーアカウント完全削除のお知らせ（7日前）',
          html,
        })
        warnedIds.push(user.id)
      } catch (mailErr) {
        console.error(`warning email failed for ${user.id}:`, mailErr)
      }
    }

    if (warnedIds.length > 0) {
      await supabase
        .from('partner_users')
        .update({ deletion_warned_at: now.toISOString() })
        .in('id', warnedIds)
    }

    // 処理B：90日経過で完全削除
    const { error: deleteErr } = await supabase
      .from('partner_users')
      .delete()
      .not('deleted_at', 'is', null)
      .lt('deleted_at', delete90.toISOString())

    if (deleteErr) {
      console.error('permanent delete error:', deleteErr)
    }

    return NextResponse.json({
      success: true,
      warned: warnedIds.length,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

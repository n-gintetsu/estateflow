import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import crypto from 'crypto'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generateTempPassword(): string {
  const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const digits = '0123456789'
  const all = letters + digits
  const bytes = crypto.randomBytes(8)
  let pw = ''
  pw += letters[bytes[0] % letters.length]
  pw += letters[bytes[1] % letters.length]
  pw += digits[bytes[2] % digits.length]
  pw += digits[bytes[3] % digits.length]
  for (let i = 4; i < 8; i++) {
    pw += all[bytes[i] % all.length]
  }
  return pw.split('').sort(() => Math.random() - 0.5).join('')
}

export async function POST(req: NextRequest) {
  try {
    const { company_inquiry_id } = await req.json()

    if (!company_inquiry_id) {
      return NextResponse.json({ error: 'company_inquiry_id が必要です' }, { status: 400 })
    }

    // company_inquiriesから取得
    const { data: inquiry, error: inquiryErr } = await supabase
      .from('company_inquiries')
      .select('email, company_name')
      .eq('id', company_inquiry_id)
      .maybeSingle()

    if (inquiryErr) {
      console.error(inquiryErr)
      return NextResponse.json({ error: 'データベースエラー' }, { status: 500 })
    }
    if (!inquiry) {
      return NextResponse.json({ error: '該当する申請が見つかりません' }, { status: 404 })
    }

    const { email, company_name } = inquiry

    // 重複チェック
    const { data: existing } = await supabase
      .from('partner_users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'このメールアドレスはすでに登録済みです' },
        { status: 409 }
      )
    }

    const tempPassword = generateTempPassword()

    // partner_usersに挿入
    const { error: insertErr } = await supabase
      .from('partner_users')
      .insert({
        email,
        password: tempPassword,
        company_name,
        company_inquiry_id,
        is_active: true,
        must_change_password: true,
      })

    if (insertErr) {
      console.error(insertErr)
      return NextResponse.json({ error: 'アカウント作成に失敗しました' }, { status: 500 })
    }

    // company_inquiriesのstatusをapprovedに更新
    const { error: updateErr } = await supabase
      .from('company_inquiries')
      .update({ status: 'approved' })
      .eq('id', company_inquiry_id)

    if (updateErr) {
      console.error(updateErr)
    }

    // メール送信
    const resend = new Resend(process.env.RESEND_API_KEY)
    const loginUrl = 'https://gintetsu-fudosan.co.jp/partner-login'

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>パートナー会員登録のご承認について</title>
</head>
<body style="margin:0;padding:0;background-color:#f8f6f2;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8f6f2;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <!-- ヘッダー -->
        <tr>
          <td style="background-color:#1a3a5c;padding:28px 32px;border-radius:12px 12px 0 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <p style="margin:0;color:#c9a84c;font-size:11px;font-family:sans-serif;letter-spacing:0.15em;font-weight:700;">PARTNER PORTAL</p>
                  <p style="margin:6px 0 0;color:#ffffff;font-size:22px;font-family:sans-serif;font-weight:800;letter-spacing:0.05em;">GINTETSU不動産</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- 本文エリア -->
        <tr>
          <td style="background-color:#ffffff;padding:36px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">

            <p style="margin:0 0 8px;font-family:sans-serif;font-size:15px;color:#1a3a5c;font-weight:700;">
              ${company_name} ご担当者様
            </p>

            <p style="margin:0 0 20px;font-family:sans-serif;font-size:14px;color:#475569;line-height:1.8;">
              平素より格別のご高配を賜り、厚く御礼申し上げます。GINTETSU不動産株式会社でございます。
            </p>

            <p style="margin:0 0 28px;font-family:sans-serif;font-size:14px;color:#475569;line-height:1.8;">
              この度は、弊社パートナー会員へのご登録をいただき、誠にありがとうございます。審査の結果、貴社のご登録を承認させていただきましたことをお知らせいたします。
            </p>

            <!-- ログイン情報ボックス -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-left:4px solid #c9a84c;margin-bottom:28px;border-radius:0 8px 8px 0;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 16px;font-family:sans-serif;font-size:13px;font-weight:700;color:#1a3a5c;">■ ログイン情報</p>
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="font-family:sans-serif;font-size:13px;color:#64748b;padding:5px 16px 5px 0;white-space:nowrap;">ログインURL</td>
                      <td style="font-family:sans-serif;font-size:13px;color:#1a3a5c;">
                        <a href="${loginUrl}" style="color:#1a3a5c;">${loginUrl}</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="font-family:sans-serif;font-size:13px;color:#64748b;padding:5px 16px 5px 0;white-space:nowrap;">メールアドレス</td>
                      <td style="font-family:sans-serif;font-size:13px;color:#1a3a5c;">${email}</td>
                    </tr>
                    <tr>
                      <td style="font-family:sans-serif;font-size:13px;color:#64748b;padding:5px 16px 5px 0;white-space:nowrap;">仮パスワード</td>
                      <td style="font-family:sans-serif;font-size:15px;color:#1a3a5c;font-weight:700;letter-spacing:0.1em;">${tempPassword}</td>
                    </tr>
                  </table>
                  <p style="margin:14px 0 0;font-family:sans-serif;font-size:12px;color:#94a3b8;">
                    ※初回ログイン時にパスワードの変更をお願いいたします。
                  </p>
                </td>
              </tr>
            </table>

            <!-- ログインボタン -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
              <tr>
                <td align="center">
                  <a href="${loginUrl}"
                     style="display:inline-block;background-color:#c9a84c;color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:8px;">
                    ダッシュボードへログインする
                  </a>
                </td>
              </tr>
            </table>

            <!-- パートナーダッシュボードについて -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8f6f2;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 12px;font-family:sans-serif;font-size:13px;font-weight:700;color:#1a3a5c;">パートナーダッシュボードについて</p>
                  <p style="margin:0 0 12px;font-family:sans-serif;font-size:13px;color:#475569;line-height:1.8;">
                    今後は貴社専用ダッシュボードを通じて、弊社よりご依頼・ご連絡をさせていただきます。
                  </p>
                  <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
                    <tr>
                      <td style="font-family:sans-serif;font-size:13px;color:#475569;line-height:1.9;padding-left:4px;">
                        1. お見積もり依頼・案件のご依頼<br>
                        2. お客様のご紹介<br>
                        3. 案件に関するご相談
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0 0 6px;font-family:sans-serif;font-size:12px;color:#94a3b8;line-height:1.7;">
                    ※本会員登録およびダッシュボードのご利用に関する費用は一切発生いたしません（完全無料）。
                  </p>
                  <p style="margin:0;font-family:sans-serif;font-size:12px;color:#94a3b8;line-height:1.7;">
                    ※案件のご依頼・お客様のご紹介等につきましては、案件ごとに双方合意のうえ、紹介料等が発生する場合がございます。予めご了承ください。
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-family:sans-serif;font-size:12px;color:#94a3b8;line-height:1.7;border-top:1px solid #e2e8f0;padding-top:20px;">
              本メールは自動送信にてお届けしております。行き違いの際はご容赦ください。ご不明点は下記までお問い合わせください。
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

    await resend.emails.send({
      from: 'GINTETSU不動産 <info@gintetsu-fudosan.co.jp>',
      to: [email],
      subject: '【GINTETSU不動産】パートナー会員登録のご承認について',
      html,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

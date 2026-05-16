import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  const { inquiryId, reportUrl } = await req.json()

  const { data: inquiry } = await supabase.from('sale_inquiries').select('*').eq('id', inquiryId).single()
  if (!inquiry || !inquiry.email) return NextResponse.json({ error: 'メールなし' }, { status: 400 })

  try {
    await resend.emails.send({
      from: 'GINTETSU不動産 <info@gintetsu-fudosan.co.jp>',
      to: inquiry.email,
      subject: '【GINTETSU不動産】戸建買取査定書のご案内',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <div style="background:#1a3a5c;padding:20px 24px;border-radius:8px 8px 0 0;">
            <h1 style="color:white;font-size:18px;margin:0;">戸建買取査定書のご案内</h1>
          </div>
          <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
            <p style="color:#374151;">${inquiry.name} 様</p>
            <p style="color:#374151;line-height:1.8;">
              この度は、GINTETSU不動産へ戸建買取査定のお申込みをいただきありがとうございます。<br>
              以下のリンクより、AI査定書をご確認いただけます。
            </p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${reportUrl}" style="background:#c9a84c;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">
                査定書を確認する →
              </a>
            </div>
            <p style="color:#9ca3af;font-size:12px;line-height:1.8;">
              ※本査定書のAI査定額は参考価格です。将来の価格を保証するものではありません。<br>
              ご不明な点はお電話にてお問い合わせください。<br>
              <strong>048-606-4317</strong>（平日 9:00〜18:00）
            </p>
          </div>
          <p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:16px;">
            GINTETSU不動産株式会社｜埼玉県さいたま市大宮区桜木町1-366-9
          </p>
        </div>
      `,
    })

    await supabase.from('sale_inquiries').update({ status: 'contacted' }).eq('id', inquiryId)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'メール送信失敗' }, { status: 500 })
  }
}

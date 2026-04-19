import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { schedule_id } = body

    if (!schedule_id) {
      return NextResponse.json({ error: 'schedule_id is required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'supabase env not set' }, { status: 500 })
    }
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. スケジュール取得
    const { data: schedule, error: schErr } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', schedule_id)
      .single()

    if (schErr || !schedule) {
      return NextResponse.json({ error: 'schedule not found' }, { status: 404 })
    }

    if (!schedule.customer_email) {
      return NextResponse.json({ error: 'customer_email is missing in this schedule' }, { status: 400 })
    }
    if (!schedule.property_id || !schedule.property_type) {
      return NextResponse.json({ error: 'property_id / property_type is missing in this schedule' }, { status: 400 })
    }

    // 2. 公開可能な書類取得
    const { data: docs, error: docsErr } = await supabase
      .from('property_documents')
      .select('*')
      .eq('property_type', schedule.property_type)
      .eq('property_id', schedule.property_id)
      .eq('visible_to_public', true)
      .eq('is_active', true)

    if (docsErr) {
      return NextResponse.json({ error: 'failed to fetch documents' }, { status: 500 })
    }

    if (!docs || docs.length === 0) {
      return NextResponse.json({ error: '公開可能な書類がこの物件にはありません' }, { status: 404 })
    }

    // 3. ファイルをダウンロードして base64 化
    const attachments: { filename: string; content: string }[] = []
    for (const doc of docs) {
      try {
        const fileRes = await fetch(doc.file_url)
        if (!fileRes.ok) continue
        const arrayBuf = await fileRes.arrayBuffer()
        const base64 = Buffer.from(arrayBuf).toString('base64')
        // URLからファイル名(拡張子含む)を推測
        const urlPath = new URL(doc.file_url).pathname
        const urlFileName = urlPath.substring(urlPath.lastIndexOf('/') + 1)
        const ext = urlFileName.includes('.') ? urlFileName.substring(urlFileName.lastIndexOf('.')) : ''
        const safeTitle = doc.title.replace(/[\\/:*?"<>|]/g, '_')
        const filename = safeTitle + ext
        attachments.push({ filename, content: base64 })
      } catch (e) {
        console.error('file fetch failed:', doc.file_url, e)
      }
    }

    if (attachments.length === 0) {
      return NextResponse.json({ error: 'ファイルのダウンロードに失敗しました' }, { status: 500 })
    }

    // 4. Resend で送信
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'no api key' }, { status: 500 })
    }
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)

    const propertyDisplay = schedule.property_name || '物件'
    const customerName = schedule.customer_name || 'お客様'

    await resend.emails.send({
      from: 'noreply@gintetsu-fudosan.co.jp',
      to: schedule.customer_email,
      subject: 'GINTETSU不動産 資料送付のお知らせ（' + propertyDisplay + '）',
      html: '<div style="font-family:sans-serif;max-width:600px;margin:0 auto">'
        + '<div style="background:#1a3a5c;padding:24px;text-align:center">'
        + '<h1 style="color:white;font-size:20px;margin:0">GINTETSU不動産</h1>'
        + '</div>'
        + '<div style="padding:32px;background:white">'
        + '<p>' + customerName + ' 様</p>'
        + '<p>この度は資料請求をいただき、誠にありがとうございます。</p>'
        + '<p>ご請求いただいた物件「<strong>' + propertyDisplay + '</strong>」の資料を添付にてお送りいたします。</p>'
        + '<div style="background:#f8f6f2;border-left:4px solid #c9a84c;padding:16px;margin:24px 0;border-radius:4px">'
        + '<p style="margin:4px 0"><strong>添付書類:</strong> ' + attachments.length + '点</p>'
        + '</div>'
        + '<p>ご不明な点やご質問等ございましたら、お気軽にお問い合わせください。</p>'
        + '<p style="color:#666;font-size:13px">※本メールは送信専用のため、直接返信いただいてもお答えできません。お問い合わせは下記までお願いいたします。</p>'
        + '<p style="color:#1a3a5c;font-weight:bold">GINTETSU不動産株式会社<br>〒330-0854 埼玉県さいたま市大宮区桜木町1-366-9<br>TEL: 048-606-4317<br>Email: info@gintetsu-fudosan.co.jp</p>'
        + '</div></div>',
      attachments,
    })

    // 5. documents_sent_at を更新
    const sentAt = new Date().toISOString()
    await supabase
      .from('schedules')
      .update({ documents_sent_at: sentAt })
      .eq('id', schedule_id)

    return NextResponse.json({
      success: true,
      documents_count: attachments.length,
      sent_at: sentAt,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

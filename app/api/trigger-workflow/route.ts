import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trigger_type, to_email, variables } = body as {
      trigger_type: string
      to_email: string
      variables?: Record<string, string>
    }

    if (!trigger_type || !to_email) {
      return NextResponse.json({ error: 'trigger_type and to_email are required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'supabase env not set' }, { status: 500 })
    }
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. 該当するアクティブなワークフローを取得
    const { data: workflows, error: wfErr } = await supabase
      .from('email_workflows')
      .select('*')
      .eq('trigger_type', trigger_type)
      .eq('is_active', true)

    if (wfErr) {
      console.error('workflow fetch error:', wfErr)
      return NextResponse.json({ error: 'failed to fetch workflows' }, { status: 500 })
    }

    if (!workflows || workflows.length === 0) {
      // ワークフローが登録されていない場合はスキップ（エラーにはしない）
      return NextResponse.json({ success: true, skipped: true, reason: 'no active workflow for this trigger' })
    }

    // 2. Resend準備
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'no api key' }, { status: 500 })
    }
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)

    // 3. プレースホルダ置換関数
    const replaceVars = (text: string, vars?: Record<string, string>) => {
      if (!vars) return text
      let result = text
      for (const [key, value] of Object.entries(vars)) {
        const pattern = new RegExp('\\{\\{\\s*' + key + '\\s*\\}\\}', 'g')
        result = result.replace(pattern, value || '')
      }
      return result
    }

    const results: any[] = []

    // 4. 各ワークフロー毎に送信
    for (const wf of workflows) {
      const subject = replaceVars(wf.subject || '', variables)
      const bodyText = replaceVars(wf.body || '', variables)

      // テキスト本文を HTML に変換（改行を <br> に）
      const bodyHtml = '<div style="font-family:sans-serif;max-width:600px;margin:0 auto">'
        + '<div style="background:#1a3a5c;padding:24px;text-align:center">'
        + '<h1 style="color:white;font-size:20px;margin:0">GINTETSU不動産</h1>'
        + '</div>'
        + '<div style="padding:32px;background:white;white-space:pre-wrap;line-height:1.8">'
        + bodyText
        + '</div>'
        + '<div style="padding:16px 32px;background:#f8f6f2;border-top:1px solid #e5e7eb">'
        + '<p style="color:#666;font-size:12px;margin:4px 0">※本メールは送信専用のため、直接返信いただいてもお答えできません。</p>'
        + '<p style="color:#1a3a5c;font-weight:bold;font-size:12px;margin:4px 0">GINTETSU不動産株式会社<br>TEL: 048-606-4317 / Email: info@gintetsu-fudosan.co.jp</p>'
        + '</div></div>'

      try {
        await resend.emails.send({
          from: 'noreply@gintetsu-fudosan.co.jp',
          to: to_email,
          subject,
          html: bodyHtml,
        })

        // sent_count を +1
        await supabase
          .from('email_workflows')
          .update({ sent_count: (wf.sent_count || 0) + 1 })
          .eq('id', wf.id)

        results.push({ workflow_id: wf.id, workflow_name: wf.name, success: true })
      } catch (e: any) {
        console.error('send error for workflow', wf.id, e)
        results.push({ workflow_id: wf.id, workflow_name: wf.name, success: false, error: String(e) })
      }
    }

    return NextResponse.json({
      success: true,
      triggered_count: workflows.length,
      results,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

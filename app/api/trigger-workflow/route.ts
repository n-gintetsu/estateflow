import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

const buildHtml = (bodyText: string) => `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f4;padding:24px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;">
      <!-- ヘッダー -->
      <tr>
        <td style="background:#1a3a5c;padding:24px 32px;text-align:center;">
          <h1 style="color:#ffffff;font-size:20px;margin:0;font-weight:bold;">GINTETSU不動産</h1>
        </td>
      </tr>
      <!-- 本文 -->
      <tr>
        <td style="padding:32px;background:#ffffff;color:#333333;font-size:14px;line-height:1.8;">
          ${bodyText.replace(/\n/g, '<br>')}
        </td>
      </tr>
      <!-- ゴールドライン -->
      <tr>
        <td style="background:#c9a84c;height:4px;font-size:0;line-height:0;">&nbsp;</td>
      </tr>
      <!-- フッター -->
      <tr>
        <td style="background:#f8f6f2;padding:16px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="color:#666666;font-size:11px;padding-bottom:6px;">
                ※本メールは送信専用のため、直接返信いただいてもお答えできません。
              </td>
            </tr>
            <tr>
              <td style="color:#1a3a5c;font-size:12px;font-weight:bold;">
                GINTETSU不動産株式会社<br>
                TEL: 048-606-4317 / Email: info@gintetsu-fudosan.co.jp
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trigger_type, to_email, staff_notification_email, variables } = body as {
      trigger_type: string
      to_email: string
      staff_notification_email?: string
      variables?: Record<string, string>
    }

    if (!trigger_type || !to_email) {
      return NextResponse.json({ error: 'trigger_type and to_email are required' }, { status: 400, headers: CORS_HEADERS })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'supabase env not set' }, { status: 500, headers: CORS_HEADERS })
    }
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. 該当するアクティブなワークフローを取得（お客様宛）
    const { data: workflows, error: wfErr } = await supabase
      .from('email_workflows')
      .select('*')
      .eq('trigger_type', trigger_type)
      .eq('is_active', true)

    if (wfErr) {
      console.error('workflow fetch error:', wfErr)
      return NextResponse.json({ error: 'failed to fetch workflows' }, { status: 500, headers: CORS_HEADERS })
    }

    if (!workflows || workflows.length === 0) {
      return NextResponse.json({ success: true, skipped: true, reason: 'no active workflow for this trigger' }, { headers: CORS_HEADERS })
    }

    // 2. スタッフ宛ワークフローを取得
    const staffTriggerType = trigger_type + '_staff'
    const { data: staffWorkflows } = await supabase
      .from('email_workflows')
      .select('*')
      .eq('trigger_type', staffTriggerType)
      .eq('is_active', true)

    // 3. Resend準備
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'no api key' }, { status: 500, headers: CORS_HEADERS })
    }
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)

    // 4. プレースホルダ置換関数
    const replaceVars = (text: string, vars?: Record<string, string>) => {
      if (!vars) return text
      let result = text
      for (const [key, value] of Object.entries(vars)) {
        const pattern = new RegExp('\\{\\{\\s*' + key + '\\s*\\}\\}', 'g')
        result = result.replace(pattern, value || '')
      }
      // 現地対応キーボックス情報の自動差し込み
      if (vars.viewing_method === '現地対応' && vars.keybox_code) {
        result = result.replace(/\{\{\s*keybox_info\s*\}\}/g,
          `■ キーボックス番号：${vars.keybox_code}\n■ キーボックス設置場所：${vars.keybox_location || ''}`)
      } else {
        result = result.replace(/\{\{\s*keybox_info\s*\}\}/g, '')
      }
      return result
    }

    const results: any[] = []

    // 5. お客様宛メール送信
    for (const wf of workflows) {
      const subject = replaceVars(wf.subject || '', variables)
      const bodyText = replaceVars(wf.body || '', variables)
      try {
        await resend.emails.send({
          from: 'noreply@gintetsu-fudosan.co.jp',
          to: to_email,
          subject,
          html: buildHtml(bodyText),
        })
        await supabase.from('email_workflows').update({ sent_count: (wf.sent_count || 0) + 1 }).eq('id', wf.id)
        results.push({ workflow_id: wf.id, workflow_name: wf.name, success: true, type: 'customer' })
      } catch (e: any) {
        console.error('send error for workflow', wf.id, e)
        results.push({ workflow_id: wf.id, workflow_name: wf.name, success: false, error: String(e) })
      }
    }

    // 6. スタッフ宛メール送信
    const staffEmail = staff_notification_email || variables?.staff_email || 'info@gintetsu-fudosan.co.jp'
    if (staffWorkflows && staffWorkflows.length > 0) {
      for (const wf of staffWorkflows) {
        const subject = replaceVars(wf.subject || '', variables)
        const bodyText = replaceVars(wf.body || '', variables)
        try {
          await resend.emails.send({
            from: 'noreply@gintetsu-fudosan.co.jp',
            to: staffEmail,
            subject,
            html: buildHtml(bodyText),
          })
          await supabase.from('email_workflows').update({ sent_count: (wf.sent_count || 0) + 1 }).eq('id', wf.id)
          results.push({ workflow_id: wf.id, workflow_name: wf.name, success: true, type: 'staff' })
        } catch (e: any) {
          console.error('send error for staff workflow', wf.id, e)
          results.push({ workflow_id: wf.id, workflow_name: wf.name, success: false, error: String(e) })
        }
      }
    }

    return NextResponse.json({
      success: true,
      triggered_count: workflows.length,
      results,
    }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: String(error) }, { status: 500, headers: CORS_HEADERS })
  }
}

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
    const { trigger_type, to_email, staff_notification_email, variables, agent_id, agent_code } = body as {
      trigger_type: string
      to_email: string
      staff_notification_email?: string
      variables?: Record<string, string>
      agent_id?: string
      agent_code?: string
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

    // agent_doc_request: property_documents から物件PDFを取得して doc_links / has_docs を注入
    const enrichedVars: Record<string, string> = { ...(variables || {}) }
    if (trigger_type === 'agent_doc_request') {
      const isAgent = String((variables as any)?.is_agent) === 'true'
      const propertyId = variables?.property_id
      const propertyType = variables?.property_type
      const visibilityCol = isAgent ? 'visible_to_agent' : 'visible_to_public'
      if (propertyId && propertyType) {
        const { data: propDocs } = await supabase
          .from('property_documents')
          .select('title, file_url')
          .eq('property_id', propertyId)
          .eq('property_type', propertyType)
          .eq(visibilityCol, true)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
        enrichedVars.doc_links = propDocs && propDocs.length > 0
          ? propDocs.map(d => `・${d.title || '資料'}：${d.file_url}`).join('\n')
          : ''
        enrichedVars.has_docs = propDocs && propDocs.length > 0 ? 'true' : 'false'
      } else {
        enrichedVars.doc_links = ''
        enrichedVars.has_docs = 'false'
      }
    }

    // 5. お客様宛メール送信
    for (const wf of workflows) {
      const subject = replaceVars(wf.subject || '', enrichedVars)
      const bodyText = replaceVars(wf.body || '', enrichedVars)
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
        const subject = replaceVars(wf.subject || '', enrichedVars)
        const bodyText = replaceVars(wf.body || '', enrichedVars)
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

    // 7. agent_activity_logs への記録
    if (trigger_type.startsWith('agent_')) {
      const activityTypeMap: Record<string, string> = {
        agent_viewing: '🏠 内見依頼',
        agent_ad_placement: '📢 広告掲載依頼',
        agent_doc_request: '📄 資料請求',
        agent_application: '📝 購入・入居申込',
        agent_other: '💬 その他',
      }
      const actionLabel = activityTypeMap[trigger_type] || '💬 その他'
      const propertyName = variables?.property_name || ''
      const detail = `[${actionLabel}] ${propertyName}`
      try {
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (serviceKey && supabaseUrl) {
          const adminClient = createClient(supabaseUrl, serviceKey)
          await adminClient.from('agent_activity_logs').insert({
            agent_id: agent_id || null,
            agent_code: agent_code || null,
            company_name: variables?.company_name || null,
            action_type: 'お問い合わせ送信',
            property_id: variables?.property_id || null,
            property_name: propertyName || null,
            detail,
          })
        }
      } catch (logErr) {
        console.error('activity log insert error:', logErr)
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

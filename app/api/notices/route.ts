import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('notices')
    .select('id, target_type, agent_id, title, body, priority, status, created_at, published_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const payload = await request.json()

  if (!payload.title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const base = {
    title: payload.title,
    body: payload.body || '',
    target_type: payload.target_type || 'agent',
    priority: payload.priority || 'normal',
    status: payload.status || 'published',
    published_at: payload.status === 'published' ? new Date().toISOString() : null,
  }

  // agent_id カラムが存在する場合のみ含める（存在しなければ除外して再試行）
  let { data, error } = await supabase
    .from('notices')
    .insert([{ ...base, agent_id: payload.agent_id ?? null }])
    .select()
    .single()

  if (error && error.message.includes('agent_id')) {
    console.warn('[notices POST] agent_id column not found, retrying without it')
    ;({ data, error } = await supabase
      .from('notices')
      .insert([base])
      .select()
      .single())
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

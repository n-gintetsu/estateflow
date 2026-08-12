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
    .select('id, target_type, target_user_ids, title, body, priority, status, created_at, published_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const payload = await request.json()

  if (!payload.title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  // 宛先は target_user_ids に保存する。
  //   全業者   … null（既存データも null のため、表示側は「null なら全業者」で統一できる）
  //   特定業者 … 業者IDの配列
  const rawTargets = payload.target_user_ids
  if (rawTargets != null && !Array.isArray(rawTargets)) {
    return NextResponse.json({ error: 'target_user_ids must be an array or null' }, { status: 400 })
  }
  const targetUserIds =
    Array.isArray(rawTargets) && rawTargets.length > 0 ? rawTargets.map(String) : null

  const { data, error } = await supabase
    .from('notices')
    .insert([{
      title: payload.title,
      body: payload.body || '',
      target_type: payload.target_type || 'agent',
      target_user_ids: targetUserIds,
      priority: payload.priority || 'normal',
      status: payload.status || 'published',
      published_at: payload.status === 'published' ? new Date().toISOString() : null,
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// service_role で RLS をバイパス（内部CRMから sale_inquiries を安全に読み書き）
// 氏名・電話・自宅住所を含むため、ブラウザからの anon 直読みを廃止するための受け皿。
// proxy.ts の認証ガード対象パス（PUBLIC_PATHS には入れないこと）。
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 更新を許可するカラム（ボディをそのまま展開しない）
const UPDATABLE_COLUMNS = ['status', 'ai_assessment', 'our_price'] as const

// 一覧取得 or 単体取得（内部CRMなので全カラム返す。proxy.tsで認証済み）
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (id) {
    const { data, error } = await supabase
      .from('sale_inquiries')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data, error } = await supabase
    .from('sale_inquiries')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// 更新（ステータス / AI査定結果 / 弊社査定額 のみ）
export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id } = body
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  for (const column of UPDATABLE_COLUMNS) {
    if (column in body) updates[column] = body[column]
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: `one of ${UPDATABLE_COLUMNS.join(', ')} is required` },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('sale_inquiries')
    .update(updates)
    .eq('id', id)
    .select('id')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

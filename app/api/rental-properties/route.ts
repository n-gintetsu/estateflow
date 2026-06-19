import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// service_role で RLS をバイパス（内部CRMから rental_properties を安全に読み書き）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 一覧 or 単体取得（内部CRMなので keybox/staff 含む全カラム返す。proxy.tsで認証済み）
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  // 件数だけ欲しい場合（analytics等）
  if (searchParams.get('count')) {
    const { count, error } = await supabase
      .from('rental_properties')
      .select('*', { count: 'exact', head: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ count: count ?? 0 })
  }

  if (id) {
    const { data, error } = await supabase
      .from('rental_properties')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data, error } = await supabase
    .from('rental_properties')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// 新規作成
export async function POST(request: NextRequest) {
  const payload = await request.json()
  const { data, error } = await supabase
    .from('rental_properties')
    .insert(payload)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// 既存 UPDATE（変更なし）
export async function PUT(request: NextRequest) {
  const { id, ...payload } = await request.json()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const { data, error } = await supabase
    .from('rental_properties')
    .update(payload)
    .eq('id', id)
    .select('id')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// 削除（rental/page.tsx の delete を見て、ソフト削除ならPUT側に寄せる。一旦ハード削除で用意）
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const { error } = await supabase
    .from('rental_properties')
    .delete()
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

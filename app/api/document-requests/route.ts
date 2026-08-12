import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// service_role で RLS をバイパス（内部CRMから document_requests を安全に読み書き）
// 氏名・メール・電話を含むため、ブラウザからの anon 直読みを廃止するための受け皿。
// proxy.ts の認証ガード対象パス（PUBLIC_PATHS には入れないこと）。
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 一覧取得（内部CRMなので全カラム返す。proxy.tsで認証済み）
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // 件数だけ欲しい場合（ダッシュボードの資料請求数）
  if (searchParams.get('count')) {
    const { count, error } = await supabase
      .from('document_requests')
      .select('*', { count: 'exact', head: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ count: count ?? 0 })
  }

  // limit 指定あり：一覧の表示件数、ダッシュボードの最新5件の両方をこれで賄う
  // limit 指定なし：全件（問い合わせ管理の ?all=true 相当）
  const limitParam = searchParams.get('limit')

  let query = supabase
    .from('document_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (limitParam) {
    const limit = Number(limitParam)
    if (!Number.isInteger(limit) || limit < 1) {
      return NextResponse.json({ error: 'limit must be a positive integer' }, { status: 400 })
    }
    query = query.limit(limit)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// ステータス更新（未対応 / 対応中 / 対応済み / キャンセル）
export async function PATCH(request: NextRequest) {
  const { id, status } = await request.json()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  if (!status) return NextResponse.json({ error: 'status is required' }, { status: 400 })
  const { data, error } = await supabase
    .from('document_requests')
    .update({ status })
    .eq('id', id)
    .select('id')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

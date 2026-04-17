import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { email, name, role, password } = await req.json()

    if (!email || !name || !password) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
    }

    // Service Role KeyでAdmin権限のクライアントを作成
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Supabase AuthにユーザーをAdmin権限で作成
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // メール確認不要で即時有効化
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // staff_usersテーブルにも登録
    const { error: dbError } = await supabaseAdmin.from('staff_users').insert({
      email,
      name,
      role: role || 'staff',
    })

    if (dbError) {
      // Authユーザーは作成済みなので削除してロールバック
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'スタッフを追加しました' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

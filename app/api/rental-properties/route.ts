import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// service_role で RLS をバイパス（rental_properties に UPDATE ポリシーが未設定のため）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

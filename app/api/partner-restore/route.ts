import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { partner_user_id } = await req.json()
    if (!partner_user_id) {
      return NextResponse.json({ error: 'partner_user_id が必要です' }, { status: 400 })
    }
    const { error } = await supabase
      .from('partner_users')
      .update({ deleted_at: null, deletion_warned_at: null })
      .eq('id', partner_user_id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET!
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!

function validateSignature(body: string, signature: string): boolean {
  const hash = crypto.createHmac('SHA256', LINE_CHANNEL_SECRET).update(body).digest('base64')
  return hash === signature
}

async function replyMessage(replyToken: string, text: string) {
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` },
    body: JSON.stringify({ replyToken, messages: [{ type: 'text', text }] }),
  })
}

async function getDisplayName(userId: string): Promise<string> {
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` },
    })
    const data = await res.json()
    return data.displayName || '名前なし'
  } catch { return '名前なし' }
}


// VIPユーザーチェック
async function checkVipUser(userId: string) {
  const { data } = await supabase
    .from('line_vip_users')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data
}

// 会話履歴を取得（直近10件）
async function getConversationHistory(userId: string) {
  const { data } = await supabase
    .from('line_conversations')
    .select('role, content')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(10)
  return data || []
}

// 会話履歴を保存
async function saveConversation(userId: string, role: string, content: string) {
  await supabase.from('line_conversations').insert({ user_id: userId, role, content })
}

async function generateAIReply(userId: string, userMessage: string): Promise<{ text: string, needsHuman: boolean }> {
  try {
    const history = await getConversationHistory(userId)
    const messages = [
      ...history.map((h: any) => ({ role: h.role, content: h.content })),
      { role: 'user', content: userMessage }
    ]

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 500,
        system: `あなたはGINTETSU不動産（さいたま市大宮区、電話048-606-4317）の優秀なAI不動産コンシェルジュです。

【あなたの役割】
- お客様の不動産のお悩みを丁寧にヒアリングする
- 売買・賃貸・空家対策・リースバック・相続など幅広く対応
- 段階的に質問して、お客様のニーズを具体化する
- 最終的に無料相談・査定のご予約や電話（048-606-4317）へ自然に誘導する

【会話のスタイル】
- 親しみやすく、警戒心を与えない自然な日本語
- 一度に聞くことは1〜2つまで
- マークダウン記号（**や##）は使わない
- 絵文字を適度に使う
- 200文字以内で簡潔に

【人間対応が必要な場面】
以下の場合は返答の最後に「#要人間対応」と付けてください：
- 具体的な価格交渉や契約の話になった時
- お客様が「直接話したい」「担当者と話したい」と言った時
- 法的なトラブルや複雑な相続問題
- お客様が強い感情（怒り・悲しみ）を示している時

【電話番号について】
048-606-4317 を積極的に案内してください。`,
        messages,
      }),
    })
    const data = await res.json()
    const text = data.content?.[0]?.text || 'ありがとうございます。担当者よりご連絡いたします。'
    const needsHuman = text.includes('#要人間対応')
    const cleanText = text.replace('#要人間対応', '').trim()
    return { text: cleanText, needsHuman }
  } catch {
    return { text: 'ありがとうございます。担当者よりご連絡いたします。', needsHuman: false }
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-line-signature') || ''
  if (!validateSignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const data = JSON.parse(body)
  const events = data.events || []

  for (const event of events) {
    if (event.type !== 'message') continue

    const userId = event.source.userId
    const replyToken = event.replyToken
    const receivedAt = new Date().toISOString()
    const messageType = event.message.type
    const displayName = await getDisplayName(userId)

    // PDF・画像・ファイルは人間対応
    if (messageType !== 'text') {
      let fileTypeLabel = 'ファイル'
      if (messageType === 'image') fileTypeLabel = '画像・写真'
      else if (messageType === 'file') fileTypeLabel = '書類・PDF'
      else if (messageType === 'video') fileTypeLabel = '動画'

      await supabase.from('line_messages').insert({
        user_id: userId,
        display_name: displayName,
        message_text: `【${fileTypeLabel}が送信されました】`,
        reply_text: '担当スタッフへ引き継ぎます。',
        is_auto_reply: false,
        needs_human: true,
        status: 'pending',
        replied_at: receivedAt,
      })
      await replyMessage(replyToken, `${fileTypeLabel}を受け取りました📎\n担当スタッフが確認の上、折り返しご連絡いたします。\nお急ぎの場合はお電話ください📞 048-606-4317`)
      continue
    }

    const userMessage = event.message.text

    // VIPユーザーチェック（既存顧客は直接人間対応）
    const vipUser = await checkVipUser(userId)
    if (vipUser) {
      await supabase.from('line_messages').insert({
        user_id: userId,
        display_name: displayName,
        message_text: userMessage,
        reply_text: `${vipUser.assigned_staff || '担当者'}へおつなぎします。`,
        is_auto_reply: false,
        needs_human: true,
        status: 'pending',
        replied_at: receivedAt,
      })
      await replyMessage(replyToken, `${displayName}様、いつもありがとうございます😊\n${vipUser.assigned_staff || '担当者'}へおつなぎします。少々お待ちください。\nお急ぎの場合は 048-606-4317 までお電話ください。`)
      continue
    }

    // キーワードマッチング（優先）
    const { data: keywords } = await supabase.from('line_keywords').select('*')
    let matched = null
    if (keywords) {
      for (const kw of keywords) {
        if (userMessage.includes(kw.keyword)) { matched = kw; break }
      }
    }

    let replyText = ''
    let needsHuman = false

    if (matched && matched.response_type === 'human') {
      replyText = matched.reply_message
      needsHuman = true
    } else if (matched && matched.response_type === 'ai') {
      replyText = matched.reply_message
    } else {
      // 会話履歴付きAI返答
      const aiResult = await generateAIReply(userId, userMessage)
      replyText = aiResult.text
      needsHuman = aiResult.needsHuman
    }

    // 会話履歴を保存
    await saveConversation(userId, 'user', userMessage)
    await saveConversation(userId, 'assistant', replyText)

    // Supabaseにメッセージを保存
    await supabase.from('line_messages').insert({
      user_id: userId,
      display_name: displayName,
      message_text: userMessage,
      reply_text: replyText,
      is_auto_reply: !needsHuman,
      needs_human: needsHuman,
      status: needsHuman ? 'pending' : 'replied',
      replied_at: receivedAt,
    })

    if (needsHuman) {
      await replyMessage(replyToken, replyText + '\n\n担当スタッフへおつなぎします。少々お待ちください🙏')
    } else {
      await replyMessage(replyToken, replyText)
    }
  }

  return NextResponse.json({ ok: true })
}

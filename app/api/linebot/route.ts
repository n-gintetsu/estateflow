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
  const hash = crypto
    .createHmac('SHA256', LINE_CHANNEL_SECRET)
    .update(body)
    .digest('base64')
  return hash === signature
}

async function replyMessage(replyToken: string, text: string) {
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: 'text', text }],
    }),
  })
}

// LINEユーザーの表示名を取得
async function getDisplayName(userId: string): Promise<string> {
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` },
    })
    const data = await res.json()
    return data.displayName || '名前なし'
  } catch {
    return '名前なし'
  }
}

async function generateAIReply(userMessage: string): Promise<string> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 300,
        messages: [{ role: 'user', content: userMessage }],
        system: `あなたはGINTETSU不動産（さいたま市大宮区、電話048-606-4317）のLINE対応スタッフです。
不動産売買・賃貸・空家対策・リースバック・相続のご相談に対応しています。
返答は150文字以内で、丁寧かつ親しみやすい日本語でお答えください。
詳しい相談は「無料相談を予約する」か「048-606-4317」への電話をご案内ください。
積極的に無料相談や査定のご予約を促してください。`,
      }),
    })
    const data = await res.json()
    return data.content?.[0]?.text || 'ありがとうございます。担当者よりご連絡いたします。'
  } catch {
    return 'ありがとうございます。担当者よりご連絡いたします。'
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

    // 表示名を取得
    const displayName = await getDisplayName(userId)

    // PDF・画像・ファイルは人間対応に振り分け
    if (messageType !== 'text') {
      let fileTypeLabel = 'ファイル'
      if (messageType === 'image') fileTypeLabel = '画像'
      else if (messageType === 'file') fileTypeLabel = 'ファイル・書類'
      else if (messageType === 'video') fileTypeLabel = '動画'
      else if (messageType === 'audio') fileTypeLabel = '音声'

      await supabase.from('line_messages').insert({
        user_id: userId,
        display_name: displayName,
        message_text: `【${fileTypeLabel}が送信されました】`,
        reply_text: '担当スタッフへ引き継ぎます。少々お待ちください。',
        is_auto_reply: false,
        needs_human: true,
        status: 'pending',
        replied_at: receivedAt,
      })

      await replyMessage(replyToken, `${fileTypeLabel}を受け取りました。担当スタッフが確認の上、折り返しご連絡いたします。お電話でのご相談は 048-606-4317 まで。`)
      continue
    }

    // テキストメッセージの処理
    const userMessage = event.message.text

    // キーワードマッチング
    const { data: keywords } = await supabase.from('line_keywords').select('*')

    let matched = null
    if (keywords) {
      for (const kw of keywords) {
        if (userMessage.includes(kw.keyword)) {
          matched = kw
          break
        }
      }
    }

    let replyText = ''
    let responseType = 'ai'

    if (matched) {
      replyText = matched.reply_message
      responseType = matched.response_type
    } else {
      replyText = await generateAIReply(userMessage)
      responseType = 'ai'
    }

    // Supabaseに保存
    await supabase.from('line_messages').insert({
      user_id: userId,
      display_name: displayName,
      message_text: userMessage,
      reply_text: replyText,
      is_auto_reply: responseType === 'ai',
      needs_human: responseType === 'human',
      status: responseType === 'human' ? 'pending' : 'replied',
      replied_at: receivedAt,
    })

    if (responseType === 'human') {
      await replyMessage(replyToken, '担当スタッフへ引き継ぎます。少々お待ちください。まもなくご連絡いたします。')
    } else {
      await replyMessage(replyToken, replyText)
    }
  }

  return NextResponse.json({ ok: true })
}

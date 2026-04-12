import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET!
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!

// LINE署名検証
function validateSignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac('SHA256', LINE_CHANNEL_SECRET)
    .update(body)
    .digest('base64')
  return hash === signature
}

// LINEにメッセージ送信
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

// AIで返信生成
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
返答は100文字以内で、丁寧かつ親しみやすい日本語でお答えください。
詳しい相談は「無料相談を予約する」か「048-606-4317」への電話をご案内ください。`,
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

  // 署名検証
  if (!validateSignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const data = JSON.parse(body)
  const events = data.events || []

  for (const event of events) {
    if (event.type !== 'message' || event.message.type !== 'text') continue

    const userMessage = event.message.text
    const userId = event.source.userId
    const replyToken = event.replyToken
    const receivedAt = new Date().toISOString()

    // キーワードマッチング（Supabaseのline_keywordsテーブルから取得）
    const { data: keywords } = await supabase
      .from('line_keywords')
      .select('*')

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
      responseType = matched.response_type // 'ai' or 'human'
    } else {
      // マッチしない場合はAIで返信
      replyText = await generateAIReply(userMessage)
      responseType = 'ai'
    }

    // Supabaseにメッセージを保存
    await supabase.from('line_messages').insert({
      user_id: userId,
      message: userMessage,
      reply: replyText,
      response_type: responseType,
      status: responseType === 'human' ? 'pending' : 'replied',
      received_at: receivedAt,
    })

    // AI対応の場合は即返信、人間対応の場合は一時メッセージ
    if (responseType === 'human') {
      await replyMessage(replyToken, '担当スタッフへ引き継ぎます。少々お待ちください。まもなくご連絡いたします。')
    } else {
      await replyMessage(replyToken, replyText)
    }
  }

  return NextResponse.json({ ok: true })
}

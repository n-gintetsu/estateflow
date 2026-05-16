import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { inquiry } = await req.json()

  const prompt = `
あなたは不動産査定の専門AIです。以下の物件情報をもとに査定レポートを生成してください。
必ずJSON形式のみで返答してください。前置きや説明文は不要です。

【物件情報】
所在地：${inquiry.address}
土地面積：${inquiry.land_area || '不明'}㎡
建物面積：${inquiry.building_area || '不明'}㎡
築年数：${inquiry.build_year || '不明'}
構造：${inquiry.structure || '不明'}
間取り：${inquiry.rooms || '不明'}
建物状態：${inquiry.condition || '不明'}
売却理由：${inquiry.reason || '不明'}
希望時期：${inquiry.timeline || '不明'}

以下のJSON形式で返答してください：
{
  "ai_price": "¥XX,XXX,XXX（円単位の査定額）",
  "price_range": "XX00〜XX00万円",
  "location_score": 数値(0-100),
  "school_score": 数値(0-100),
  "commerce_score": 数値(0-100),
  "safety_score": 数値(0-100),
  "monthly_deals": "月XX件",
  "avg_price": "XX万円/坪",
  "demand": "↑ 強い または → 普通 または ↓ 弱い",
  "advice1": "査定根拠の説明（100文字程度）",
  "advice2": "市場状況と売却タイミングのアドバイス（100文字程度）",
  "advice3": "売却理由・希望時期を踏まえた具体的アドバイス（100文字程度）",
  "tags": ["タグ1", "タグ2", "タグ3"]
}
`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await res.json()
    const text = data.content?.[0]?.text || ''
    const clean = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)

    return NextResponse.json({ result })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'AI生成失敗' }, { status: 500 })
  }
}

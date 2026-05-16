import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  const { year } = await req.json()

  const prompt = `あなたは不動産市場分析の専門AIです。
${year}年の埼玉県（特にさいたま市）の不動産市場予測レポートを作成してください。
必ずJSON形式のみで返答してください。前置きや説明文・マークダウン記法は不要です。

以下のJSON形式で返答してください：
{
  "title": "${year}年 埼玉県不動産市場予測レポート",
  "subtitle": "AI分析による市場動向・価格予測・投資判断レポート",
  "summary": "全体サマリー（150文字程度）",
  "sections": [
    {
      "title": "価格動向予測",
      "content": "詳細説明（150文字程度）",
      "data": [
        { "label": "新築マンション平均価格", "value": "XXXX万円", "change": "+X.X%", "up": true },
        { "label": "中古マンション平均価格", "value": "XXXX万円", "change": "+X.X%", "up": true },
        { "label": "新築戸建て平均価格", "value": "XXXX万円", "change": "+X.X%", "up": true },
        { "label": "土地平均単価（坪）", "value": "XX万円", "change": "+X.X%", "up": true }
      ]
    },
    {
      "title": "需要・供給バランス",
      "content": "詳細説明（150文字程度）",
      "data": [
        { "label": "新規供給戸数（年間）", "value": "X,XXX戸", "change": "X.X%", "up": true },
        { "label": "成約件数（年間予測）", "value": "X,XXX件", "change": "+X.X%", "up": true },
        { "label": "平均販売日数", "value": "XX日", "change": "-X日", "up": true },
        { "label": "需給ギャップ", "value": "+XXX戸", "change": "需要超過", "up": true }
      ]
    },
    {
      "title": "エリア別注目ポイント",
      "content": "大宮区・浦和区・中央区・見沼区などの詳細（200文字程度）",
      "data": [
        { "label": "大宮区 坪単価", "value": "XXX万円", "change": "+X.X%", "up": true },
        { "label": "浦和区 坪単価", "value": "XXX万円", "change": "+X.X%", "up": true },
        { "label": "中央区 坪単価", "value": "XX万円", "change": "+X.X%", "up": true },
        { "label": "見沼区 坪単価", "value": "XX万円", "change": "+X.X%", "up": true }
      ]
    },
    {
      "title": "投資・売却タイミング判断",
      "content": "売却・購入タイミングの具体的アドバイス（150文字程度）"
    }
  ]
}`

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
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await res.json()
    const text = data.content?.[0]?.text || ''
    const clean = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)

    await supabase.from('market_reports').insert({
      year,
      title: result.title,
      subtitle: result.subtitle,
      summary: result.summary,
      sections: result.sections,
      is_published: false,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'AI生成失敗' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { title, category } = await request.json()
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'APIキー未設定' }, { status: 500 })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `不動産コラム「${title}」（カテゴリ：${category || '不動産'}）のSEO最適化されたサムネイル画像のプロンプトを英語で1文で作成してください。プロフェッショナルで明るい不動産イメージ。プロンプトのみ返してください。`,
        }],
      }),
    })

    const data = await response.json()
    const prompt = data.content?.[0]?.text || ''

    // Unsplashから関連画像を取得
    const keyword = category === '不動産売買' ? 'real estate house' :
      category === 'リースバック' ? 'house keys property' :
      category === '空家対策' ? 'vacant house renovation' :
      category === '遺品整理' ? 'clean room interior' :
      category === '不動産投資' ? 'investment building' : 'real estate japan'

    const unsplashUrl = `https://source.unsplash.com/800x450/?${encodeURIComponent(keyword)}`

    return NextResponse.json({ url: unsplashUrl, prompt })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { title, category } = await request.json()

    // カテゴリごとに不動産らしい画像を使用（Picsum Photos - 安定した無料画像）
    const imageMap: Record<string, string> = {
      '不動産売買': 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
      'リースバック': 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
      '空家対策': 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80',
      '遺品整理': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
      '不動産投資': 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
    }

    const url = imageMap[category] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80'

    return NextResponse.json({ url, prompt: title })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

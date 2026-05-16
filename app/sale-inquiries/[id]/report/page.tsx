'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type SaleInquiry = {
  id: string
  created_at: string
  name: string
  phone: string
  email: string | null
  address: string
  land_area: string | null
  building_area: string | null
  build_year: string | null
  structure: string | null
  rooms: string | null
  condition: string | null
  reason: string | null
  timeline: string | null
  message: string | null
  status: string
  floor_plan_urls: string[] | null
  photo_urls: string[] | null
  ai_assessment: string | null
  our_price: string | null
  ai_price: string | null
}

export default function ReportPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const [inquiry, setInquiry] = useState<SaleInquiry | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [aiResult, setAiResult] = useState<{
    ai_price: string
    price_range: string
    location_score: number
    school_score: number
    commerce_score: number
    safety_score: number
    monthly_deals: string
    avg_price: string
    demand: string
    advice1: string
    advice2: string
    advice3: string
    tags: string[]
  } | null>(null)
  const [ourPrice, setOurPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await Promise.resolve(params)
      await fetchInquiry(resolved.id)
    }
    resolveParams()
  }, [])

  const fetchInquiry = async (id: string) => {
    const { data } = await supabase
      .from('sale_inquiries')
      .select('*')
      .eq('id', id)
      .single()
    if (data) {
      setInquiry(data)
      if (data.our_price) setOurPrice(data.our_price)
      if (data.ai_assessment) {
        try { setAiResult(JSON.parse(data.ai_assessment)) } catch {}
      }
    }
    setLoading(false)
  }

  const generateAI = async () => {
    if (!inquiry) return
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-sale-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiry }),
      })
      const data = await res.json()
      if (data.result) {
        setAiResult(data.result)
        await supabase.from('sale_inquiries').update({ ai_assessment: JSON.stringify(data.result) }).eq('id', inquiry.id)
      }
    } catch (e) {
      alert('AI生成に失敗しました')
    }
    setGenerating(false)
  }

  const saveOurPrice = async () => {
    if (!inquiry) return
    setSaving(true)
    await supabase.from('sale_inquiries').update({ our_price: ourPrice }).eq('id', inquiry.id)
    setSaving(false)
    alert('査定額を保存しました')
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSendEmail = async () => {
    if (!inquiry || !inquiry.email) {
      alert('メールアドレスが登録されていません')
      return
    }
    setSendingEmail(true)
    try {
      const res = await fetch('/api/send-report-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiryId: inquiry.id, reportUrl: `${window.location.origin}/sale-inquiries/${inquiry.id}/report` }),
      })
      if (res.ok) {
        setEmailSent(true)
        alert(`${inquiry.email} に査定書リンクを送信しました`)
      }
    } catch {
      alert('メール送信に失敗しました')
    }
    setSendingEmail(false)
  }

  const bar = (score: number, color: string) => (
    <div style={{ background: 'var(--color-background-secondary,#f3f4f6)', borderRadius: 4, height: 8, overflow: 'hidden', marginTop: 6 }}>
      <div style={{ width: `${score}%`, height: 8, background: color, borderRadius: 4, transition: '1s ease' }} />
    </div>
  )

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>読み込み中...</div>
  if (!inquiry) return <div style={{ padding: 40, textAlign: 'center', color: '#e53e3e' }}>データが見つかりません</div>

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px 64px', fontFamily: 'sans-serif' }}>

        {/* 操作バー */}
        <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link href={`/sale-inquiries`} style={{ color: '#1a3a5c', fontSize: 13, textDecoration: 'underline' }}>← 一覧に戻る</Link>
          <div style={{ flex: 1 }} />
          <button onClick={generateAI} disabled={generating} style={{ padding: '8px 16px', background: generating ? '#ccc' : '#c9a84c', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer' }}>
            {generating ? '🤖 AI生成中...' : '🤖 AI査定を生成'}
          </button>
          <button onClick={handlePrint} style={{ padding: '8px 16px', background: '#1a3a5c', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
            📄 PDF印刷
          </button>
          <button onClick={handleSendEmail} disabled={sendingEmail || !inquiry.email} style={{ padding: '8px 16px', background: inquiry.email ? '#059669' : '#ccc', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, cursor: inquiry.email ? 'pointer' : 'not-allowed' }}>
            {sendingEmail ? '送信中...' : emailSent ? '✅ 送信済み' : '✉️ メール送付'}
          </button>
        </div>

        {/* 査定書本体 */}
        <div ref={printRef}>

          {/* ヘッダー */}
          <div style={{ background: '#1a3a5c', color: 'white', padding: '20px 28px', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>GINTETSU不動産 / 買取査定書</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>さいたま市 戸建買取査定</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>{inquiry.name} 様｜{new Date(inquiry.created_at).toLocaleDateString('ja-JP')} 作成</div>
            </div>
            <span style={{ background: '#c9a84c', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20 }}>
              {aiResult ? 'AI査定済み' : 'AI査定待ち'}
            </span>
          </div>

          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: 24 }}>

            {/* 査定額 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 600 }}>🤖 AI査定額</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#c9a84c' }}>
                  {aiResult ? aiResult.ai_price : '—'}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                  {aiResult ? `推定レンジ：${aiResult.price_range}` : 'AI査定を生成してください'}
                </div>
              </div>
              <div style={{ border: '2px solid #1a3a5c', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 600 }}>🏢 弊社査定額</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#1a3a5c' }}>
                  {ourPrice ? ourPrice : '未設定'}
                </div>
                <div className="no-print" style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input
                    value={ourPrice}
                    onChange={e => setOurPrice(e.target.value)}
                    placeholder="例：¥27,200,000"
                    style={{ flex: 1, fontSize: 13, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, minWidth: 0 }}
                  />
                  <button onClick={saveOurPrice} disabled={saving} style={{ padding: '6px 12px', background: '#1a3a5c', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                    {saving ? '保存中' : '保存'}
                  </button>
                </div>
              </div>
            </div>

            {/* 物件データ */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb', paddingBottom: 8, marginBottom: 14 }}>🏠 物件データ</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  ['所在地', inquiry.address],
                  ['土地面積', inquiry.land_area ? `${inquiry.land_area}㎡` : '—'],
                  ['建物面積', inquiry.building_area ? `${inquiry.building_area}㎡` : '—'],
                  ['築年数', inquiry.build_year || '—'],
                  ['構造', inquiry.structure || '—'],
                  ['間取り', inquiry.rooms || '—'],
                  ['建物状態', inquiry.condition || '—'],
                  ['売却理由', inquiry.reason || '—'],
                  ['希望時期', inquiry.timeline || '—'],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 周辺環境スコア */}
            {aiResult ? (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb', paddingBottom: 8, marginBottom: 14 }}>📍 周辺環境スコア</div>
                {[
                  ['駅徒歩圏・交通', aiResult.location_score, '#1a3a5c'],
                  ['学区・教育環境', aiResult.school_score, '#c9a84c'],
                  ['商業施設・利便性', aiResult.commerce_score, '#1a3a5c'],
                  ['治安・生活環境', aiResult.safety_score, '#059669'],
                ].map(([label, score, color]) => (
                  <div key={label as string} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span>{label as string}</span>
                      <span style={{ fontWeight: 700 }}>{score as number}点</span>
                    </div>
                    {bar(score as number, color as string)}
                  </div>
                ))}
              </div>
            ) : null}

            {/* 市場動向 */}
            {aiResult ? (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb', paddingBottom: 8, marginBottom: 14 }}>📊 市場動向（{inquiry.address.split('市')[0]}市周辺）</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
                  {[
                    ['直近成約件数', aiResult.monthly_deals],
                    ['平均成約単価', aiResult.avg_price],
                    ['需要トレンド', aiResult.demand],
                  ].map(([label, value]) => (
                    <div key={label} style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>AIによる市場分析（参考値）</div>
              </div>
            ) : null}

            {/* AIアドバイス */}
            {aiResult ? (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb', paddingBottom: 8, marginBottom: 14 }}>✨ AIによる査定根拠・アドバイス</div>
                {[aiResult.advice1, aiResult.advice2, aiResult.advice3].map((advice, i) => (
                  <div key={i} style={{ borderLeft: '3px solid #c9a84c', padding: '10px 14px', marginBottom: 10, background: '#fffbf0', borderRadius: '0 8px 8px 0', fontSize: 13, lineHeight: 1.8, color: '#374151' }}>
                    {advice}
                  </div>
                ))}
                <div style={{ marginTop: 10 }}>
                  {aiResult.tags.map((tag, i) => (
                    <span key={i} style={{ display: 'inline-block', fontSize: 11, padding: '2px 10px', borderRadius: 20, marginRight: 6, background: i === 0 ? '#dbeafe' : i === 1 ? '#d1fae5' : '#fef3c7', color: i === 0 ? '#1e40af' : i === 1 ? '#065f46' : '#92400e' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* 注意書き */}
            <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.8, borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
              ※本査定書のAI査定額はGINTETSU不動産が提供するAIシステムによる参考価格です。将来の売却価格・買取価格を保証するものではございません。弊社査定額は担当者による正式査定に基づきます。市場動向・周辺環境スコアはAIによる分析であり、実際の市場状況と異なる場合があります。
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

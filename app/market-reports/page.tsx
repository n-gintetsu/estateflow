'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Report = { id: string; created_at: string; year: string; title: string; summary: string; is_published: boolean }

export default function MarketReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const currentYear = new Date().getFullYear()
  const [customYear, setCustomYear] = useState(String(currentYear))

  useEffect(() => { fetchReports() }, [])

  const fetchReports = async () => {
    setLoading(true)
    const { data } = await supabase.from('market_reports').select('id,created_at,year,title,summary,is_published').order('year', { ascending: false })
    setReports(data || [])
    setLoading(false)
  }

  const generate = async (year: string) => {
    if (!year) return
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-market-report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ year }) })
      const data = await res.json()
      if (data.ok) { alert(`${year}年版レポートを生成しました`); fetchReports() }
      else alert('生成失敗: ' + (data.error || ''))
    } catch { alert('生成に失敗しました') }
    setGenerating(false)
  }

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from('market_reports').update({ is_published: !current }).eq('id', id)
    setReports(reports.map(r => r.id === id ? { ...r, is_published: !current } : r))
  }

  const deleteReport = async (id: string) => {
    if (!confirm('削除しますか？')) return
    await supabase.from('market_reports').delete().eq('id', id)
    setReports(reports.filter(r => r.id !== id))
  }

  const yearOptions = Array.from({ length: 6 }, (_, i) => String(currentYear - 1 + i))

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a3a5c', margin: '0 0 4px' }}>📊 市場レポート管理</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>AIによる不動産市場予測レポートの生成・管理</p>
      </div>

      {/* AI生成パネル */}
      <div style={{ background: 'white', borderRadius: 12, padding: '20px 24px', marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#1a3a5c', marginBottom: 14 }}>🤖 新しいレポートをAI生成</p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>対象年：</label>
            <select
              value={customYear}
              onChange={e => setCustomYear(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, color: '#1f2937', background: 'white', cursor: 'pointer' }}
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => generate(customYear)}
            disabled={generating}
            style={{ padding: '10px 24px', background: generating ? '#ccc' : '#c9a84c', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {generating ? '⏳ AI生成中...' : `🤖 ${customYear}年版を生成する`}
          </button>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[String(currentYear - 1), String(currentYear), String(currentYear + 1)].map(y => (
              <button key={y} onClick={() => { setCustomYear(y); generate(y) }} disabled={generating}
                style={{ padding: '8px 14px', background: generating ? '#f3f4f6' : '#f0f4f8', color: '#1a3a5c', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer' }}>
                {y}年版
              </button>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 10, marginBottom: 0 }}>
          ※ ホームページには「去年・今年・来年」の公開済みレポートが最大3件表示されます
        </p>
      </div>

      {/* レポート一覧 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>読み込み中...</div>
      ) : reports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 12, color: '#6b7280' }}>
          レポートがありません。上のボタンから生成してください。
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {reports.map(r => (
            <div key={r.id} style={{ background: 'white', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: r.is_published ? '2px solid #059669' : '2px solid transparent' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ background: '#1a3a5c', color: 'white', fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>{r.year}年版</span>
                    <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20, background: r.is_published ? '#d1fae5' : '#f3f4f6', color: r.is_published ? '#065f46' : '#6b7280', fontWeight: 600 }}>
                      {r.is_published ? '✅ 公開中' : '下書き'}
                    </span>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(r.created_at).toLocaleString('ja-JP')}</span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1f2937', margin: '0 0 4px' }}>{r.title}</p>
                  <p style={{ fontSize: 13, color: '#6b7280', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{r.summary}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => togglePublish(r.id, r.is_published)}
                    style={{ padding: '6px 14px', background: r.is_published ? '#dc2626' : '#059669', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                    {r.is_published ? '非公開' : '公開する'}
                  </button>
                  <button onClick={() => deleteReport(r.id)}
                    style={{ padding: '6px 12px', background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

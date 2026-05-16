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
  const [generating, setGenerating] = useState<string | null>(null)

  useEffect(() => { fetchReports() }, [])

  const fetchReports = async () => {
    setLoading(true)
    const { data } = await supabase.from('market_reports').select('id,created_at,year,title,summary,is_published').order('created_at', { ascending: false })
    setReports(data || [])
    setLoading(false)
  }

  const generate = async (year: string) => {
    setGenerating(year)
    try {
      const res = await fetch('/api/generate-market-report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ year }) })
      const data = await res.json()
      if (data.ok) { alert(`${year}年版レポートを生成しました`); fetchReports() }
      else alert('生成失敗: ' + (data.error || ''))
    } catch { alert('生成に失敗しました') }
    setGenerating(null)
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

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a3a5c', margin: 0 }}>📊 市場レポート管理</h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>AIによる不動産市場予測レポートの生成・管理</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['2025', '2026', '2027'].map(year => (
            <button key={year} onClick={() => generate(year)} disabled={generating === year}
              style={{ padding: '8px 16px', background: generating === year ? '#ccc' : '#c9a84c', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: generating === year ? 'not-allowed' : 'pointer' }}>
              {generating === year ? '⏳ 生成中...' : `🤖 ${year}年版を生成`}
            </button>
          ))}
        </div>
      </div>

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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
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
                    {r.is_published ? '非公開にする' : '公開する'}
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

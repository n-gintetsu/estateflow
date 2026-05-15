'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const STATUS_MAP: any = {
  new: { label: '新規', bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  in_progress: { label: '対応中', bg: '#fef9c3', color: '#ca8a04', dot: '#ca8a04' },
  replied: { label: '返信済み', bg: '#dcfce7', color: '#16a34a', dot: '#16a34a' },
  closed: { label: 'クローズ', bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
}

const INQUIRY_TYPE_MAP: any = {
  viewing: { label: '内見依頼', icon: '🏠', bg: '#dbeafe', color: '#1e40af' },
  document: { label: '物件資料請求', icon: '📄', bg: '#dcfce7', color: '#166534' },
  advertising: { label: '広告掲載依頼', icon: '📣', bg: '#fef3c7', color: '#92400e' },
  purchase: { label: '購入/入居申込', icon: '📝', bg: '#fce7f3', color: '#9d174d' },
  other: { label: 'その他', icon: '💬', bg: '#f1f5f9', color: '#475569' },
}

export default function AdInquiriesPage() {
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
    })
  }, [])

  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selected, setSelected] = useState<any>(null)
  const [msg, setMsg] = useState('')
  const [limitCount, setLimitCount] = useState(20)
  const [isAllMode, setIsAllMode] = useState(false)

  const fetchItems = async () => {
    setLoading(true)
    const allMode = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('all') === 'true'
      : false
    let query = supabase.from('ad_inquiries').select('*').order('created_at', { ascending: false })
    if (!allMode) query = query.limit(limitCount)
    const { data } = await query
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAllMode(new URLSearchParams(window.location.search).get('all') === 'true')
    }
  }, [])

  useEffect(() => { fetchItems() }, [limitCount])

  const handleStatusChange = async (id: number, newStatus: string) => {
    await supabase.from('ad_inquiries').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id)
    await fetchItems()
    if (selected?.id === id) setSelected((prev: any) => ({ ...prev, status: newStatus }))
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`「${name}」からの問い合わせを削除しますか？`)) return
    await supabase.from('ad_inquiries').delete().eq('id', id)
    setSelected(null)
    await fetchItems()
  }

  let filtered = filter === 'all' ? items : items.filter(i => i.status === filter)
  if (typeFilter !== 'all') filtered = filtered.filter(i => i.inquiry_type === typeFilter)

  const counts = {
    all: items.length,
    new: items.filter(i => i.status === 'new').length,
    in_progress: items.filter(i => i.status === 'in_progress').length,
    replied: items.filter(i => i.status === 'replied').length,
    closed: items.filter(i => i.status === 'closed').length,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ background: '#1a3a5c', color: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 20, fontWeight: 'bold' }}>💬 お問い合わせ管理</span>
        <button onClick={() => window.location.href = '/'} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>← ダッシュボード</button>
      </header>

      <main style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
        {/* 統計カード */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
          {[
            { label: '新規', value: counts.new, color: '#1e40af', bg: '#dbeafe' },
            { label: '対応中', value: counts.in_progress, color: '#ca8a04', bg: '#fef9c3' },
            { label: '返信済み', value: counts.replied, color: '#16a34a', bg: '#dcfce7' },
            { label: 'クローズ', value: counts.closed, color: '#475569', bg: '#f1f5f9' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '16px 20px', borderLeft: `4px solid ${s.color}` }}>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {msg && (
          <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: '#f0fdf4', color: '#16a34a', fontWeight: 600 }}>{msg}</div>
        )}

        {/* ステータスフィルター */}
        <div style={{ display: 'flex', gap: 6, background: 'white', padding: 4, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 10, width: 'fit-content' }}>
          {[
            { value: 'all', label: `すべて (${counts.all})` },
            { value: 'new', label: `🆕 新規 (${counts.new})` },
            { value: 'in_progress', label: `🟡 対応中 (${counts.in_progress})` },
            { value: 'replied', label: `✅ 返信済み (${counts.replied})` },
            { value: 'closed', label: `⬜ クローズ (${counts.closed})` },
          ].map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              style={{ padding: '6px 14px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: filter === f.value ? 700 : 400, background: filter === f.value ? '#1a3a5c' : 'transparent', color: filter === f.value ? 'white' : '#374151' }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* 種類フィルター */}
        <div style={{ display: 'flex', gap: 6, background: 'white', padding: 4, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 20, width: 'fit-content', flexWrap: 'wrap' as const }}>
          <button onClick={() => setTypeFilter('all')}
            style={{ padding: '6px 12px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: typeFilter === 'all' ? 700 : 400, background: typeFilter === 'all' ? '#c9a84c' : 'transparent', color: typeFilter === 'all' ? 'white' : '#374151' }}>
            種類すべて
          </button>
          {Object.keys(INQUIRY_TYPE_MAP).map(k => {
            const t = INQUIRY_TYPE_MAP[k]
            return (
              <button key={k} onClick={() => setTypeFilter(k)}
                style={{ padding: '6px 12px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: typeFilter === k ? 700 : 400, background: typeFilter === k ? '#c9a84c' : 'transparent', color: typeFilter === k ? 'white' : '#374151' }}>
                {t.icon} {t.label}
              </button>
            )
          })}
        </div>

        {/* 表示件数セレクター */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#374151', fontWeight: 600, marginRight: 4 }}>表示件数：</span>
          {[5, 20, 50].map(n => (
            <button key={n} onClick={() => setLimitCount(n)}
              style={{ padding: '5px 12px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                fontWeight: limitCount === n && !isAllMode ? 700 : 400,
                background: limitCount === n && !isAllMode ? '#1a3a5c' : 'white',
                color: limitCount === n && !isAllMode ? 'white' : '#374151',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              {n}件
            </button>
          ))}
          <button onClick={() => window.open('/ad-inquiries?all=true', '_blank')}
            style={{ padding: '5px 12px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12,
              fontWeight: isAllMode ? 700 : 400,
              background: isAllMode ? '#7c3aed' : 'white',
              color: isAllMode ? 'white' : '#374151',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            50件以上 ↗
          </button>
          {isAllMode ? (
            <span style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, marginLeft: 4 }}>全件表示モード</span>
          ) : null}
        </div>

        {/* レイアウト：左一覧 / 右詳細 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20 }}>
          {/* 左：一覧 */}
          <div>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>読み込み中...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', background: 'white', borderRadius: 12 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                <p>問い合わせがありません</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                {filtered.map(item => {
                  const s = STATUS_MAP[item.status] || STATUS_MAP.new
                  const t = INQUIRY_TYPE_MAP[item.inquiry_type]
                  return (
                    <div key={item.id}
                      onClick={() => { setSelected(item) }}
                      style={{ background: 'white', borderRadius: 12, padding: 16, cursor: 'pointer', border: selected?.id === item.id ? '2px solid #1a3a5c' : '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8, flexWrap: 'wrap' as const }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                          {t && (
                            <span style={{ background: t.bg, color: t.color, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                              {t.icon} {t.label}
                            </span>
                          )}
                          <h3 style={{ fontSize: 15, fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{item.company_name}</h3>
                        </div>
                        <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{s.label}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>👤 {item.contact_name}{item.phone ? ` / 📱 ${item.phone}` : ''}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>✉️ {item.email}</div>
                      {item.property_name && (
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>🏢 対象物件: {item.property_name}</div>
                      )}
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>{new Date(item.created_at).toLocaleString('ja-JP')}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 右：詳細 */}
          {selected ? (
            <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'sticky' as const, top: 20, maxHeight: 'calc(100vh - 60px)', overflowY: 'auto' as const }}>
              <h2 style={{ fontSize: 16, fontWeight: 'bold', margin: '0 0 16px', color: '#1e293b' }}>📋 詳細</h2>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 2 }}>受付日時</div>
                <div style={{ fontSize: 14, color: '#1e293b' }}>
                  {new Date(selected.created_at).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}
                </div>
              </div>

              {INQUIRY_TYPE_MAP[selected.inquiry_type] && (
                <div style={{ marginBottom: 14, background: INQUIRY_TYPE_MAP[selected.inquiry_type].bg, borderRadius: 8, padding: '8px 12px', display: 'inline-block' }}>
                  <span style={{ fontSize: 13, color: INQUIRY_TYPE_MAP[selected.inquiry_type].color, fontWeight: 700 }}>
                    {INQUIRY_TYPE_MAP[selected.inquiry_type].icon} {INQUIRY_TYPE_MAP[selected.inquiry_type].label}
                  </span>
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 2 }}>会社名</div>
                <div style={{ fontSize: 14, color: '#1e293b' }}>{selected.company_name}</div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 2 }}>ご担当者様</div>
                <div style={{ fontSize: 14, color: '#1e293b' }}>{selected.contact_name}</div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 2 }}>メールアドレス</div>
                <div style={{ fontSize: 13, color: '#1e293b' }}><a href={`mailto:${selected.email}`} style={{ color: '#1d4ed8', textDecoration: 'none' }}>{selected.email}</a></div>
              </div>
              {selected.phone && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 2 }}>担当者携帯</div>
                  <div style={{ fontSize: 14, color: '#1e293b' }}>{selected.phone}</div>
                </div>
              )}
              {selected.property_name && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 2 }}>対象物件</div>
                  <div style={{ fontSize: 14, color: '#1e293b' }}>{selected.property_name}</div>
                </div>
              )}
              {selected.message && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 2 }}>お問い合わせ内容</div>
                  <div style={{ fontSize: 13, color: '#1e293b', background: '#f8fafc', borderRadius: 6, padding: 10, whiteSpace: 'pre-wrap' as const, lineHeight: 1.6 }}>{selected.message}</div>
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 6 }}>名刺</div>
                {selected.card_url ? (
                  <div>
                    <img src={selected.card_url} alt="名刺" style={{ width: '100%', borderRadius: 6, marginBottom: 6 }} />
                    <a href={selected.card_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#1d4ed8' }}>別タブで開く</a>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#9ca3af' }}>未登録</div>
                )}
              </div>

              {/* ステータス変更 */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 6 }}>ステータス変更</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                  {Object.keys(STATUS_MAP).filter(k => k !== selected.status).map(k => {
                    const s = STATUS_MAP[k]
                    return (
                      <button key={k} onClick={() => handleStatusChange(selected.id, k)}
                        style={{ background: s.bg, color: s.color, border: 'none', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        → {s.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button onClick={() => handleDelete(selected.id, selected.company_name)}
                style={{ width: '100%', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '8px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                🗑 この問い合わせを削除
              </button>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 12, padding: 40, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', textAlign: 'center' as const, color: '#94a3b8' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <p style={{ fontSize: 13 }}>左のカードを選択すると詳細が表示されます</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

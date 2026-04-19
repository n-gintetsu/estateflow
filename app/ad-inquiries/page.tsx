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

export default function AdInquiriesPage() {
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
    })
  }, [])

  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState<any>(null)
  const [editingMemo, setEditingMemo] = useState(false)
  const [memoText, setMemoText] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const fetchItems = async () => {
    setLoading(true)
    const { data } = await supabase.from('ad_inquiries').select('*').order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [])

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

  const handleSaveMemo = async () => {
    if (!selected) return
    setSaving(true)
    await supabase.from('ad_inquiries').update({ internal_memo: memoText, updated_at: new Date().toISOString() }).eq('id', selected.id)
    setSelected((prev: any) => ({ ...prev, internal_memo: memoText }))
    setEditingMemo(false)
    setSaving(false)
    setMsg('✅ メモを保存しました')
    setTimeout(() => setMsg(''), 3000)
    await fetchItems()
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter)
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
        <span style={{ fontSize: 20, fontWeight: 'bold' }}>📢 広告掲載問い合わせ管理</span>
        <button onClick={() => window.location.href = '/'} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>← ダッシュボード</button>
      </header>

      <main style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
        {/* 統計カード */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
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

        {/* フィルター */}
        <div style={{ display: 'flex', gap: 6, background: 'white', padding: 4, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 20, width: 'fit-content' }}>
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

        {/* レイアウト：左一覧 / 右詳細 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 20 }}>
          {/* 左：一覧 */}
          <div>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>読み込み中...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', background: 'white', borderRadius: 12 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📢</div>
                <p>問い合わせがありません</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                {filtered.map(item => {
                  const s = STATUS_MAP[item.status] || STATUS_MAP.new
                  return (
                    <div key={item.id}
                      onClick={() => { setSelected(item); setMemoText(item.internal_memo || ''); setEditingMemo(false) }}
                      style={{ background: 'white', borderRadius: 12, padding: 16, cursor: 'pointer', border: selected?.id === item.id ? '2px solid #1a3a5c' : '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                          <h3 style={{ fontSize: 15, fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{item.company_name}</h3>
                        </div>
                        <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{s.label}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>👤 {item.contact_name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>✉️ {item.email}</div>
                      {item.advertising_purpose && (
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>📌 {item.advertising_purpose}</div>
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
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 2 }}>電話番号</div>
                  <div style={{ fontSize: 14, color: '#1e293b' }}>{selected.phone}</div>
                </div>
              )}
              {selected.advertising_purpose && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 2 }}>広告の目的</div>
                  <div style={{ fontSize: 14, color: '#1e293b' }}>{selected.advertising_purpose}</div>
                </div>
              )}
              {selected.message && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 2 }}>ご要望・ご質問</div>
                  <div style={{ fontSize: 13, color: '#1e293b', background: '#f8fafc', borderRadius: 6, padding: 10, whiteSpace: 'pre-wrap' as const, lineHeight: 1.6 }}>{selected.message}</div>
                </div>
              )}

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

              {/* 内部メモ */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 14, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>📝 内部メモ（スタッフ用）</div>
                  {!editingMemo ? (
                    <button onClick={() => setEditingMemo(true)} style={{ background: '#eff6ff', color: '#1d4ed8', border: 'none', padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>✏️ 編集</button>
                  ) : (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={handleSaveMemo} disabled={saving} style={{ background: '#1a3a5c', color: 'white', border: 'none', padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>{saving ? '保存中' : '💾 保存'}</button>
                      <button onClick={() => { setEditingMemo(false); setMemoText(selected.internal_memo || '') }} style={{ background: '#f1f5f9', color: '#374151', border: 'none', padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>キャンセル</button>
                    </div>
                  )}
                </div>
                {editingMemo ? (
                  <textarea value={memoText} onChange={e => setMemoText(e.target.value)}
                    style={{ width: '100%', minHeight: 80, padding: 8, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', resize: 'vertical' as const, boxSizing: 'border-box' as const }} />
                ) : (
                  <div style={{ fontSize: 12, color: '#374151', background: '#fffbeb', borderRadius: 6, padding: 10, minHeight: 40, whiteSpace: 'pre-wrap' as const, lineHeight: 1.6 }}>
                    {selected.internal_memo || <span style={{ color: '#94a3b8' }}>（メモはまだありません）</span>}
                  </div>
                )}
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

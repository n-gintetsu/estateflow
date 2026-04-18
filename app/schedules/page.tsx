'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const STATUS_MAP: any = {
  confirmed: { label: '確定', bg: '#dcfce7', color: '#16a34a', dot: '#16a34a' },
  tentative: { label: '仮予約', bg: '#fef9c3', color: '#ca8a04', dot: '#ca8a04' },
  pending: { label: '未確定', bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
  cancelled: { label: 'キャンセル', bg: '#fef2f2', color: '#dc2626', dot: '#dc2626' },
}

const emptyForm = {
  property_name: '', customer_name: '', scheduled_at: '', assigned_staff: '', status: 'pending', notes: ''
}

export default function SchedulePage() {
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
    })
  }, [])

  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [filter, setFilter] = useState('all')

  const fetchItems = async () => {
    setLoading(true)
    const { data } = await supabase.from('schedules').select('*').order('scheduled_at', { ascending: true })
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [])

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleSubmit = async () => {
    if (!form.property_name || !form.customer_name || !form.scheduled_at) {
      setMsg('❌ 物件名・お客様名・日時は必須です')
      return
    }
    setSaving(true)
    setMsg('')
    if (editId) {
      await supabase.from('schedules').update(form).eq('id', editId)
      setMsg('✅ 更新しました！')
      setEditId(null)
    } else {
      await supabase.from('schedules').insert([form])
      setMsg('✅ 予約を追加しました！')
    }
    setForm({ ...emptyForm })
    setShowForm(false)
    await fetchItems()
    setSaving(false)
  }

  const handleEdit = (item: any) => {
    setForm({
      property_name: item.property_name || '',
      customer_name: item.customer_name || '',
      scheduled_at: item.scheduled_at ? item.scheduled_at.slice(0, 16) : '',
      assigned_staff: item.assigned_staff || '',
      status: item.status || 'pending',
      notes: item.notes || '',
    })
    setEditId(item.id)
    setShowForm(true)
    setMsg('')
  }

  const handleStatusChange = async (id: number, newStatus: string) => {
    await supabase.from('schedules').update({ status: newStatus }).eq('id', id)
    await fetchItems()
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`「${name}」の予約を削除しますか？`)) return
    await supabase.from('schedules').delete().eq('id', id)
    await fetchItems()
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter)

  const counts = {
    all: items.length,
    confirmed: items.filter(i => i.status === 'confirmed').length,
    tentative: items.filter(i => i.status === 'tentative').length,
    pending: items.filter(i => i.status === 'pending').length,
    cancelled: items.filter(i => i.status === 'cancelled').length,
  }

  const inp = { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, fontFamily: 'inherit', background: 'white', boxSizing: 'border-box' as const }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ background: '#1a3a5c', color: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 20, fontWeight: 'bold' }}>📅 内見スケジュール管理</span>
        <button onClick={() => window.location.href = '/'} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>← ダッシュボード</button>
      </header>

      <main style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
        {/* 統計 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: '確定', value: counts.confirmed, color: '#16a34a', bg: '#f0fdf4' },
            { label: '仮予約', value: counts.tentative, color: '#ca8a04', bg: '#fef9c3' },
            { label: '未確定', value: counts.pending, color: '#475569', bg: '#f1f5f9' },
            { label: 'キャンセル', value: counts.cancelled, color: '#dc2626', bg: '#fef2f2' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '16px 20px', borderLeft: `4px solid ${s.color}` }}>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ヘッダー操作 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          {/* フィルター */}
          <div style={{ display: 'flex', gap: 6, background: 'white', padding: 4, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            {[
              { value: 'all', label: `すべて (${counts.all})` },
              { value: 'confirmed', label: `✅ 確定 (${counts.confirmed})` },
              { value: 'tentative', label: `🟡 仮予約 (${counts.tentative})` },
              { value: 'pending', label: `⬜ 未確定 (${counts.pending})` },
              { value: 'cancelled', label: `❌ キャンセル (${counts.cancelled})` },
            ].map(f => (
              <button key={f.value} onClick={() => setFilter(f.value)}
                style={{ padding: '6px 14px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: filter === f.value ? 700 : 400, background: filter === f.value ? '#1a3a5c' : 'transparent', color: filter === f.value ? 'white' : '#374151' }}>
                {f.label}
              </button>
            ))}
          </div>
          <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ ...emptyForm }); setMsg('') }}
            style={{ background: '#c9a84c', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 'bold' }}>
            {showForm ? '✕ キャンセル' : '＋ 予約追加'}
          </button>
        </div>

        {msg && (
          <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: msg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', color: msg.startsWith('✅') ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{msg}</div>
        )}

        {/* 追加・編集フォーム */}
        {showForm && (
          <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '2px solid #1a3a5c' }}>
            <h3 style={{ fontSize: 15, fontWeight: 'bold', color: '#1a3a5c', margin: '0 0 16px' }}>
              {editId ? '✏️ 予約を編集' : '📅 新規内見予約'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>物件名 <span style={{ color: '#ef4444' }}>必須</span></label>
                <input style={inp} name="property_name" value={form.property_name} onChange={handleChange} placeholder="例：パークタワー渋谷" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>お客様名 <span style={{ color: '#ef4444' }}>必須</span></label>
                <input style={inp} name="customer_name" value={form.customer_name} onChange={handleChange} placeholder="例：田中 太郎" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>日時 <span style={{ color: '#ef4444' }}>必須</span></label>
                <input style={inp} type="datetime-local" name="scheduled_at" value={form.scheduled_at} onChange={handleChange} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>担当スタッフ</label>
                <input style={inp} name="assigned_staff" value={form.assigned_staff} onChange={handleChange} placeholder="例：山本" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>ステータス</label>
                <select style={inp} name="status" value={form.status} onChange={handleChange}>
                  <option value="pending">未確定</option>
                  <option value="tentative">仮予約</option>
                  <option value="confirmed">確定</option>
                  <option value="cancelled">キャンセル</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>備考</label>
                <input style={inp} name="notes" value={form.notes} onChange={handleChange} placeholder="特記事項など" />
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <button onClick={handleSubmit} disabled={saving}
                style={{ background: saving ? '#9ca3af' : '#1a3a5c', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 'bold' }}>
                {saving ? '保存中...' : editId ? '✓ 更新する' : '✓ 追加する'}
              </button>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm({ ...emptyForm }) }}
                style={{ background: '#f1f5f9', color: '#374151', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* 一覧 */}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>読み込み中...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', background: 'white', borderRadius: 12 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
            <p>予約がありません</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filtered.map(item => {
              const s = STATUS_MAP[item.status] || STATUS_MAP.pending
              const date = item.scheduled_at ? new Date(item.scheduled_at) : null
              const isPast = date ? date < new Date() : false
              return (
                <div key={item.id} style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${isPast && item.status !== 'cancelled' ? '#e5e7eb' : 'transparent'}`, opacity: item.status === 'cancelled' ? 0.7 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.dot, flexShrink: 0, marginTop: 3 }} />
                      <h3 style={{ fontSize: 15, fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{item.property_name}</h3>
                    </div>
                    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{s.label}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6, marginBottom: 14 }}>
                    <div style={{ fontSize: 13, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>👤</span> {item.customer_name}
                  {item.notes && item.notes.includes('【仲介】') && (
                    <span style={{ marginLeft: 6, background: '#dbeafe', color: '#1e40af', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>🤝 仲介</span>
                  )}
                    </div>
                    <div style={{ fontSize: 13, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>📅</span>
                      <span style={{ fontWeight: 600, color: isPast && item.status !== 'cancelled' ? '#94a3b8' : '#1a3a5c' }}>
                        {date ? `${date.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })}〜` : '日時未定（資料請求など)'}
                      </span>
                    </div>
                    {item.assigned_staff && (
                      <div style={{ fontSize: 13, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>🏷️</span> 担当：{item.assigned_staff}
                      </div>
                    )}
                    {item.notes && (
                      <div style={{ fontSize: 12, color: '#6b7280', background: '#f8fafc', borderRadius: 6, padding: '6px 10px', marginTop: 2 }}>
                        {item.notes}
                      </div>
                    )}
                  </div>

                  {/* ステータス変更ボタン */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 10 }}>
                    {item.status !== 'confirmed' && (
                      <button onClick={() => handleStatusChange(item.id, 'confirmed')}
                        style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        ✅ 確定
                      </button>
                    )}
                    {item.status !== 'tentative' && item.status !== 'confirmed' && (
                      <button onClick={() => handleStatusChange(item.id, 'tentative')}
                        style={{ background: '#fef9c3', color: '#ca8a04', border: '1px solid #fde68a', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        🟡 仮予約
                      </button>
                    )}
                    {item.status !== 'cancelled' && (
                      <button onClick={() => handleStatusChange(item.id, 'cancelled')}
                        style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        ❌ キャンセル
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 6, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                    <button onClick={() => handleEdit(item)}
                      style={{ flex: 1, background: '#eff6ff', color: '#1d4ed8', border: 'none', padding: '6px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      ✏️ 編集
                    </button>
                    <button onClick={() => handleDelete(item.id, item.property_name)}
                      style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                      削除
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

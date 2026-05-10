'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../src/app/lib/supabase'

type Schedule = {
  id: string
  property_name: string | null
  customer_name: string | null
  email: string | null
  phone: string | null
  scheduled_at: string | null
  status: string | null
  notes: string | null
  created_at: string
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: '確定',
  tentative: '仮予約',
  pending: '未確定',
  cancelled: 'キャンセル',
}
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  confirmed: { bg: '#dcfce7', color: '#166534' },
  tentative: { bg: '#dbeafe', color: '#1e40af' },
  pending: { bg: '#fef9c3', color: '#854d0e' },
  cancelled: { bg: '#fee2e2', color: '#991b1b' },
}

const FILTERS = [
  { key: 'all', label: 'すべて' },
  { key: 'pending', label: '未確定' },
  { key: 'confirmed', label: '確定' },
  { key: 'tentative', label: '仮予約' },
  { key: 'cancelled', label: 'キャンセル' },
]

export default function ReservationsPage() {
  const [items, setItems] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data } = await supabase
      .from('schedules')
      .select('*')
      .not('notes', 'like', '【%')
      .order('scheduled_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id)
    await supabase.from('schedules').update({ status }).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i))
    setUpdating(null)
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter)

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 }}>無料相談予約</h1>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 24 }}>gintetsu-fudosan.co.jp の予約フォームから受け付けた相談予約一覧</p>

      {/* フィルター */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map(f => {
          const count = f.key === 'all' ? items.length : items.filter(i => i.status === f.key).length
          return (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: filter === f.key ? 700 : 400, background: filter === f.key ? '#1e40af' : 'white', color: filter === f.key ? 'white' : '#374151', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              {f.label}{count > 0 ? ` (${count})` : ''}
            </button>
          )
        })}
      </div>

      {loading ? (
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>読み込み中...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>予約データがありません</p>
      ) : (
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 860 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['日時', '物件名', 'お客様名', 'メール', '電話', 'ステータス', 'メモ', '操作'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const sc = STATUS_COLORS[item.status || ''] || { bg: '#f1f5f9', color: '#374151' }
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#1e293b' }}>
                      {item.scheduled_at
                        ? new Date(item.scheduled_at).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                        : '未定'}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#1e293b', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.property_name || '—'}
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{item.customer_name || '—'}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{item.email || '—'}</td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{item.phone || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, whiteSpace: 'nowrap' }}>
                        {STATUS_LABELS[item.status || ''] || item.status || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.notes || '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {['confirmed', 'tentative', 'cancelled'].map(s => {
                          const isCurrent = item.status === s
                          const c = STATUS_COLORS[s]
                          return (
                            <button key={s} onClick={() => !isCurrent && updateStatus(item.id, s)}
                              disabled={isCurrent || updating === item.id}
                              style={{ padding: '4px 8px', fontSize: 11, fontWeight: 600, border: 'none', borderRadius: 6, cursor: isCurrent ? 'default' : 'pointer', background: isCurrent ? c.bg : '#f1f5f9', color: isCurrent ? c.color : '#374151', opacity: updating === item.id ? 0.5 : 1 }}>
                              {STATUS_LABELS[s]}
                            </button>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

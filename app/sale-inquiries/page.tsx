'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

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
  floor_plan_urls: string[] | null
  photo_urls: string[] | null
  status: string
}

export default function SaleInquiriesPage() {
  const [items, setItems] = useState<SaleInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<SaleInquiry | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('sale_inquiries')
      .select('*')
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('sale_inquiries').update({ status }).eq('id', id)
    setItems(items.map(i => i.id === id ? { ...i, status } : i))
    if (selected && selected.id === id) setSelected({ ...selected, status })
  }

  const filtered = statusFilter === 'all' ? items : items.filter(i => i.status === statusFilter)

  const statusColor = (s: string) => {
    if (s === 'new') return { background: '#fef3c7', color: '#d97706' }
    if (s === 'contacted') return { background: '#dbeafe', color: '#2563eb' }
    if (s === 'in_progress') return { background: '#d1fae5', color: '#059669' }
    if (s === 'closed') return { background: '#f3f4f6', color: '#6b7280' }
    return { background: '#f3f4f6', color: '#6b7280' }
  }

  const statusLabel = (s: string) => {
    if (s === 'new') return '新規'
    if (s === 'contacted') return '連絡済'
    if (s === 'in_progress') return '対応中'
    if (s === 'closed') return '完了'
    return s
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a3a5c', margin: 0 }}>📈 戸建買取査定申込管理</h1>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>さいたま市 戸建買取査定フォームからの申込一覧</p>
        </div>
        <button onClick={fetchData} style={{ padding: '8px 16px', background: '#1a3a5c', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
          🔄 更新
        </button>
      </div>

      {/* フィルター */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['all', 'new', 'contacted', 'in_progress', 'closed'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid #d1d5db', fontSize: '13px', cursor: 'pointer', background: statusFilter === s ? '#1a3a5c' : 'white', color: statusFilter === s ? 'white' : '#374151', fontWeight: statusFilter === s ? 600 : 400 }}
          >
            {s === 'all' ? `すべて（${items.length}）` : `${statusLabel(s)}（${items.filter(i => i.status === s).length}）`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>読み込み中...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280', background: 'white', borderRadius: '12px' }}>申込データがありません</div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {filtered.map(item => (
            <div
              key={item.id}
              onClick={() => setSelected(item)}
              style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer', border: selected && selected.id === item.id ? '2px solid #1a3a5c' : '2px solid transparent', transition: '0.2s' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ ...statusColor(item.status), padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>{statusLabel(item.status)}</span>
                  <span style={{ fontWeight: 700, color: '#1a3a5c', fontSize: '15px' }}>{item.name}</span>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>{item.phone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>{item.address}</span>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>{new Date(item.created_at).toLocaleDateString('ja-JP')}</span>
                  <a
                    href={`/sale-inquiries/${item.id}/report`}
                    onClick={e => e.stopPropagation()}
                    style={{ display: 'inline-block', padding: '4px 12px', background: '#c9a84c', color: 'white', borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}
                  >
                    📄 査定書
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 詳細パネル */}
      {selected ? (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '420px', height: '100vh', background: 'white', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', overflowY: 'auto', zIndex: 100, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1a3a5c', margin: 0 }}>申込詳細</h2>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>✕</button>
          </div>

          {/* ステータス変更 */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: 600 }}>ステータス変更</p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['new', 'contacted', 'in_progress', 'closed'].map(s => (
                <button
                  key={s}
                  onClick={() => updateStatus(selected.id, s)}
                  style={{ padding: '5px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '12px', cursor: 'pointer', background: selected.status === s ? '#1a3a5c' : 'white', color: selected.status === s ? 'white' : '#374151', fontWeight: selected.status === s ? 600 : 400 }}
                >
                  {statusLabel(s)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
            {[
              ['申込日時', new Date(selected.created_at).toLocaleString('ja-JP')],
              ['お名前', selected.name],
              ['電話番号', selected.phone],
              ['メール', selected.email || '未記入'],
              ['所在地', selected.address],
              ['土地面積', selected.land_area ? `${selected.land_area}㎡` : '未記入'],
              ['建物面積', selected.building_area ? `${selected.building_area}㎡` : '未記入'],
              ['築年数', selected.build_year || '未記入'],
              ['構造', selected.structure || '未記入'],
              ['間取り', selected.rooms || '未記入'],
              ['建物の状態', selected.condition || '未記入'],
              ['売却理由', selected.reason || '未記入'],
              ['売却希望時期', selected.timeline || '未記入'],
            ].map(([label, value]) => (
              <div key={label} style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 2px', fontWeight: 600 }}>{label}</p>
                <p style={{ fontSize: '14px', color: '#1f2937', margin: 0 }}>{value}</p>
              </div>
            ))}
            {selected.message ? (
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 2px', fontWeight: 600 }}>備考・ご要望</p>
                <p style={{ fontSize: '14px', color: '#1f2937', margin: 0, whiteSpace: 'pre-wrap' }}>{selected.message}</p>
              </div>
            ) : null}

            {selected.floor_plan_urls !== null && selected.floor_plan_urls.length > 0 ? (
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 6px', fontWeight: 600 }}>📐 間取り図</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selected.floor_plan_urls.map((url, i) => (
                    <a
                      key={i}
                      href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '13px', color: '#1a3a5c', textDecoration: 'underline', wordBreak: 'break-all' }}
                    >
                      📄 間取り図 {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {selected.photo_urls !== null && selected.photo_urls.length > 0 ? (
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 6px', fontWeight: 600 }}>📷 物件写真</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selected.photo_urls.map((url, i) => (
                    <a
                      key={i}
                      href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${url}`}
                        alt={`物件写真${i + 1}`}
                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                      />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

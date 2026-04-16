'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Inquiry = {
  id: string
  company_name: string
  address: string
  phone: string
  business_type: string
  department: string
  contact_name: string
  mobile_phone: string
  email: string
  business_card_url: string
  status: string
  internal_memo: string
  created_at: string
}

const statusOptions = [
  { value: 'pending', label: '審査中', color: '#f59e0b', bg: '#fef3c7' },
  { value: 'approved', label: '承認済み', color: '#059669', bg: '#d1fae5' },
  { value: 'rejected', label: '却下', color: '#dc2626', bg: '#fee2e2' },
]

export default function CompanyInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Inquiry | null>(null)
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchInquiries()
  }, [])

  const fetchInquiries = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('company_inquiries')
      .select('*')
      .order('created_at', { ascending: false })
    setInquiries(data || [])
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('company_inquiries').update({ status }).eq('id', id)
    setInquiries(prev => prev.map(i => i.id === id ? { ...i, status } : i))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
  }

  const saveMemo = async () => {
    if (!selected) return
    setSaving(true)
    await supabase.from('company_inquiries').update({ internal_memo: memo }).eq('id', selected.id)
    setInquiries(prev => prev.map(i => i.id === selected.id ? { ...i, internal_memo: memo } : i))
    setSaving(false)
  }

  const openDetail = (inquiry: Inquiry) => {
    setSelected(inquiry)
    setMemo(inquiry.internal_memo || '')
  }

  const filtered = filter === 'all' ? inquiries : inquiries.filter(i => i.status === filter)

  const getStatus = (val: string) => statusOptions.find(s => s.value === val) || statusOptions[0]

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* ヘッダー */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, color: '#c9a84c', fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>COMPANY INQUIRIES</div>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#1a3a5c', margin: 0 }}>企業者問い合わせ管理</h1>
      </div>

      {/* 件数バッジ */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'すべて', value: 'all', count: inquiries.length },
          { label: '審査中', value: 'pending', count: inquiries.filter(i => i.status === 'pending').length },
          { label: '承認済み', value: 'approved', count: inquiries.filter(i => i.status === 'approved').length },
          { label: '却下', value: 'rejected', count: inquiries.filter(i => i.status === 'rejected').length },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            style={{
              padding: '8px 20px',
              borderRadius: 50,
              border: filter === tab.value ? '2px solid #1a3a5c' : '2px solid #e5e7eb',
              background: filter === tab.value ? '#1a3a5c' : '#fff',
              color: filter === tab.value ? '#fff' : '#6b7280',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 24 }}>
        {/* 一覧 */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>読み込み中...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#6b7280', background: '#fff', borderRadius: 12 }}>
              登録はありません
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map(inquiry => {
                const st = getStatus(inquiry.status)
                return (
                  <div
                    key={inquiry.id}
                    onClick={() => openDetail(inquiry)}
                    style={{
                      background: '#fff',
                      borderRadius: 12,
                      padding: '20px 24px',
                      cursor: 'pointer',
                      border: selected?.id === inquiry.id ? '2px solid #1a3a5c' : '2px solid transparent',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      transition: 'border 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: '#1a3a5c' }}>{inquiry.company_name}</div>
                        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{inquiry.department}　{inquiry.contact_name}</div>
                      </div>
                      <span style={{ background: st.bg, color: st.color, fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 50 }}>
                        {st.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span>📞 {inquiry.phone}</span>
                      <span>✉️ {inquiry.email}</span>
                      <span>🏢 {inquiry.business_type}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
                      {new Date(inquiry.created_at).toLocaleString('ja-JP')}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 詳細パネル */}
        {selected && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: 'fit-content', position: 'sticky', top: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a3a5c', margin: 0 }}>詳細</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9ca3af' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {[
                { label: '会社名', value: selected.company_name },
                { label: '所在地', value: selected.address },
                { label: '電話番号', value: selected.phone },
                { label: '事業内容', value: selected.business_type },
                { label: '部署', value: selected.department },
                { label: '担当者名', value: selected.contact_name },
                { label: '携帯番号', value: selected.mobile_phone },
                { label: 'メール', value: selected.email },
              { label: 'お問い合わせ内容', value: selected.inquiry_content },
              ].map(item => (
                <div key={item.label} style={{ fontSize: 13 }}>
                  <span style={{ color: '#9ca3af', marginRight: 8 }}>{item.label}</span>
                  <span style={{ color: '#374151', fontWeight: 500 }}>{item.value}</span>
                </div>
              ))}

              {/* 名刺 */}
              <div style={{ fontSize: 13 }}>
                <span style={{ color: '#9ca3af', marginRight: 8 }}>名刺</span>
                <a href={selected.business_card_url} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#1a3a5c', fontWeight: 600, textDecoration: 'underline' }}>
                  📎 確認する
                </a>
              </div>
            </div>

            {/* ステータス変更 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>ステータス変更</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {statusOptions.map(s => (
                  <button
                    key={s.value}
                    onClick={() => updateStatus(selected.id, s.value)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 50,
                      border: selected.status === s.value ? `2px solid ${s.color}` : '2px solid #e5e7eb',
                      background: selected.status === s.value ? s.bg : '#fff',
                      color: selected.status === s.value ? s.color : '#6b7280',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 社内メモ */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>社内メモ</div>
              <textarea
                value={memo}
                onChange={e => setMemo(e.target.value)}
                rows={4}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', resize: 'vertical' }}
                placeholder="社内共有メモを入力..."
              />
              <button
                onClick={saveMemo}
                disabled={saving}
                style={{ marginTop: 8, background: '#1a3a5c', color: '#fff', border: 'none', padding: '8px 24px', borderRadius: 50, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
              >
                {saving ? '保存中...' : '💾 保存'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

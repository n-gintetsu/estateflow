'use client'
import { useState, useEffect } from 'react'

const statusOptions = ['未対応', '対応中', '対応済み', 'キャンセル']

const getInquiryType = (propertyName: string, message: string) => {
  if (propertyName?.startsWith('買取査定')) return { label: '買取査定', color: '#dc2626', bg: '#fee2e2' }
  if (message?.startsWith('【買取査定】')) return { label: '買取査定', color: '#dc2626', bg: '#fee2e2' }
  if (message?.startsWith('【お問い合わせフォーム】')) return { label: 'お問い合わせ', color: '#2563eb', bg: '#dbeafe' }
  if (propertyName?.includes('leaseback') || propertyName?.includes('リースバック')) return { label: 'リースバック', color: '#7c3aed', bg: '#ede9fe' }
  if (propertyName?.includes('akiya') || propertyName?.includes('空家')) return { label: '空家対策', color: '#059669', bg: '#d1fae5' }
  if (propertyName?.includes('ihin') || propertyName?.includes('遺品')) return { label: '遺品整理', color: '#b45309', bg: '#fef3c7' }
  if (propertyName?.includes('売買') || propertyName?.includes('properties')) return { label: '売買物件', color: '#1d4ed8', bg: '#dbeafe' }
  if (propertyName?.includes('賃貸') || propertyName?.includes('rental')) return { label: '賃貸物件', color: '#0891b2', bg: '#cffafe' }
  if (propertyName?.includes('収益') || propertyName?.includes('investment')) return { label: '収益物件', color: '#15803d', bg: '#dcfce7' }
  return { label: 'お問い合わせ', color: '#2563eb', bg: '#dbeafe' }
}

export default function Inquiries() {
  const [inquiries, setInquiries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [limitCount, setLimitCount] = useState(20)
  const [isAllMode, setIsAllMode] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAllMode(new URLSearchParams(window.location.search).get('all') === 'true')
    }
  }, [])

  useEffect(() => {
    fetchInquiries()
  }, [limitCount])

  const fetchInquiries = async () => {
    setLoading(true)
    const allMode = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('all') === 'true'
      : false
    const data = await fetch(`/api/document-requests${allMode ? '' : `?limit=${limitCount}`}`).then(r => r.json())
    setInquiries(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    await fetch('/api/document-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setInquiries(prev => prev.map(i => i.id === id ? { ...i, status } : i))
    setUpdatingId(null)
  }

  const filtered = inquiries.filter(i => {
    const type = getInquiryType(i.property_name, i.message)
    if (filterType !== 'all' && type.label !== filterType) return false
    if (filterStatus !== 'all' && (i.status || '未対応') !== filterStatus) return false
    return true
  })

  const typeCounts = {
    '買取査定': inquiries.filter(i => getInquiryType(i.property_name, i.message).label === '買取査定').length,
    'お問い合わせ': inquiries.filter(i => getInquiryType(i.property_name, i.message).label === 'お問い合わせ').length,
    'リースバック': inquiries.filter(i => getInquiryType(i.property_name, i.message).label === 'リースバック').length,
  }

  return (
    <div style={{ padding: '32px 24px' }}>
      {/* ヘッダー */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: '#c9a84c', fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>INQUIRIES</div>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#1a3a5c', margin: 0 }}>問い合わせ管理</h1>
      </div>

      {/* フィルター */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: `すべて (${inquiries.length})`, value: 'all' },
            { label: `買取査定 (${typeCounts['買取査定']})`, value: '買取査定' },
            { label: `お問い合わせ (${typeCounts['お問い合わせ']})`, value: 'お問い合わせ' },
            { label: `リースバック (${typeCounts['リースバック']})`, value: 'リースバック' },
          ].map(tab => (
            <button key={tab.value} onClick={() => setFilterType(tab.value)} style={{
              padding: '6px 16px', borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: filterType === tab.value ? '2px solid #1a3a5c' : '2px solid #e5e7eb',
              background: filterType === tab.value ? '#1a3a5c' : '#fff',
              color: filterType === tab.value ? '#fff' : '#6b7280',
            }}>{tab.label}</button>
          ))}
        </div>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, cursor: 'pointer' }}
        >
          <option value="all">全ステータス</option>
          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* 表示件数切り替え */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#374151', fontWeight: 600, marginRight: 4 }}>表示件数：</span>
        {[20, 50, 100].map(n => (
          <button key={n} onClick={() => setLimitCount(n)}
            style={{
              padding: '5px 14px',
              borderRadius: 50,
              border: '1.5px solid',
              borderColor: limitCount === n && !isAllMode ? '#1a3a5c' : '#d1d5db',
              background: limitCount === n && !isAllMode ? '#1a3a5c' : 'white',
              color: limitCount === n && !isAllMode ? 'white' : '#374151',
              fontSize: 12,
              fontWeight: limitCount === n && !isAllMode ? 700 : 400,
              cursor: 'pointer',
            }}>
            {n}件
          </button>
        ))}
        <button
          onClick={() => window.open('/inquiries?all=true', '_blank')}
          style={{
            padding: '5px 14px',
            borderRadius: 50,
            border: '1.5px solid',
            borderColor: isAllMode ? '#7c3aed' : '#d1d5db',
            background: isAllMode ? '#7c3aed' : 'white',
            color: isAllMode ? 'white' : '#374151',
            fontSize: 12,
            fontWeight: isAllMode ? 700 : 400,
            cursor: 'pointer',
          }}>
          100件以上 ↗
        </button>
        {isAllMode ? (
          <span style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, marginLeft: 4 }}>全件表示モード</span>
        ) : null}
      </div>

      {/* テーブル */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>読み込み中...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#6b7280', background: '#fff', borderRadius: 12 }}>該当する問い合わせはありません</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['日時', 'お問合せ種別', '氏名', 'メール', '電話番号', 'メッセージ', 'ステータス'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#475569', borderBottom: '1px solid #e2e8f0', fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => {
                const type = getInquiryType(i.property_name, i.message)
                const tel = i.tel?.replace(/[^0-9]/g, '') || '-'
                return (
                  <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(i.created_at).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: type.bg, color: type.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 50, whiteSpace: 'nowrap' }}>
                        {type.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{i.contact_name || '-'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#475569' }}>
                      {i.email ? <a href={`mailto:${i.email}`} style={{ color: '#2563eb' }}>{i.email}</a> : '-'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#1e293b', whiteSpace: 'nowrap' }}>
                      {tel !== '-' ? <a href={`tel:${tel}`} style={{ color: '#1e293b' }}>{tel}</a> : '-'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#475569', maxWidth: 300 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
                        {i.message?.replace('【買取査定】', '').replace('【お問い合わせフォーム】', '') || '-'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <select
                        value={i.status || '未対応'}
                        onChange={e => updateStatus(i.id, e.target.value)}
                        disabled={updatingId === i.id}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          border: '1px solid #d1d5db',
                          fontSize: 12,
                          cursor: 'pointer',
                          background: i.status === '対応済み' ? '#d1fae5' : i.status === '対応中' ? '#fef3c7' : i.status === 'キャンセル' ? '#fee2e2' : '#f1f5f9',
                          color: i.status === '対応済み' ? '#059669' : i.status === '対応中' ? '#b45309' : i.status === 'キャンセル' ? '#dc2626' : '#475569',
                          fontWeight: 600,
                        }}
                      >
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
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

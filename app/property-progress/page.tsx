'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const STATUS_OPTIONS = ['紹介可能', '申込一件', '契約予定', '成約済み', '掲載停止']
const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  '紹介可能': { bg: '#d1fae5', color: '#065f46' },
  '申込一件': { bg: '#fef9c3', color: '#854d0e' },
  '契約予定': { bg: '#dbeafe', color: '#1e40af' },
  '成約済み': { bg: '#f3e8ff', color: '#6b21a8' },
  '掲載停止': { bg: '#fee2e2', color: '#991b1b' },
}

export default function PropertyProgressPage() {
  const [properties, setProperties] = useState<any[]>([])
  const [progressMap, setProgressMap] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [tab, setTab] = useState<'properties'|'rental'|'investment'>('properties')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
    })
    fetchAll()
  }, [])

  const fetchAll = async () => {
    const [{ data: p }, { data: r }, { data: i }, { data: prog }] = await Promise.all([
      supabase.from('properties').select('id, name, address, price').eq('published', true),
      supabase.from('rental_properties').select('id, name, address, rent').eq('published', true),
      supabase.from('investment_properties').select('id, name, address, yield_rate').eq('published', true),
      supabase.from('property_progress').select('*'),
    ])
    setProperties([
      ...(p||[]).map(x => ({ ...x, _type: 'properties' })),
      ...(r||[]).map(x => ({ ...x, _type: 'rental' })),
      ...(i||[]).map(x => ({ ...x, _type: 'investment' })),
    ])
    const map: Record<string, any> = {}
    ;(prog||[]).forEach(x => { map[x.property_id] = x })
    setProgressMap(map)
    setLoading(false)
  }

  const handleStatusChange = async (property: any, status: string) => {
    const existing = progressMap[property.id]
    if (existing) {
      await supabase.from('property_progress').update({ status, property_name: property.name, updated_at: new Date().toISOString() }).eq('id', existing.id)
    } else {
      await supabase.from('property_progress').insert([{
        property_id: property.id,
        property_name: property.name,
        property_type: property._type,
        status,
      }])
    }
    setProgressMap(prev => ({ ...prev, [property.id]: { ...existing, status, property_name: property.name } }))
    setMsg(`「${property.name}」の進捗を「${status}」に更新しました`)
    setTimeout(() => setMsg(''), 3000)
  }

  const currentProps = properties.filter(p =>
    tab === 'properties' ? p._type === 'properties' :
    tab === 'rental' ? p._type === 'rental' : p._type === 'investment'
  )

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a3a5c', marginBottom: 8 }}>📊 物件進捗管理</h1>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
        各物件の進捗状況を設定します。仲介業者ポータルの「進捗状況」ボタンから確認できます。
      </p>

      {msg && <div style={{ background: '#d1fae5', color: '#065f46', padding: '10px 16px', borderRadius: 6, marginBottom: 16 }}>{msg}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['properties','rental','investment'] as const).map((key, i) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: '8px 20px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab===key?700:400, background: tab===key?'#1a3a5c':'white', color: tab===key?'white':'#374151' }}>
            {['売買物件','賃貸物件','収益物件'][i]}
          </button>
        ))}
      </div>

      {loading ? <p>読み込み中...</p> : (
        <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {currentProps.length === 0 ? (
            <p style={{ padding: 24, color: '#9ca3af', textAlign: 'center' }}>公開中の物件がありません</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#374151' }}>物件名</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#374151' }}>現在の進捗</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#374151' }}>進捗を変更</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#374151' }}>更新日時</th>
                </tr>
              </thead>
              <tbody>
                {currentProps.map(p => {
                  const prog = progressMap[p.id]
                  const status = prog?.status || '未設定'
                  const sc = STATUS_COLOR[status] || { bg: '#f1f5f9', color: '#374151' }
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{p.address}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: sc.bg, color: sc.color }}>
                          {status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <select
                          value={prog?.status || ''}
                          onChange={e => handleStatusChange(p, e.target.value)}
                          style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, cursor: 'pointer', background: 'white' }}>
                          <option value="">-- 選択 --</option>
                          {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280' }}>
                        {prog?.updated_at ? new Date(prog.updated_at).toLocaleString('ja-JP') : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

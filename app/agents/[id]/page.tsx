'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [agent, setAgent] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [memo, setMemo] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
    })
    fetchAgent()
    fetchLogs()
  }, [])

  const fetchAgent = async () => {
    const { data } = await supabase.from('agent_users').select('*').eq('id', id).single()
    if (data) { setAgent(data); setMemo(data.internal_memo || '') }
    setLoading(false)
  }

  const fetchLogs = async () => {
    const { data } = await supabase.from('agent_activity_logs').select('*').eq('agent_id', id).order('created_at', { ascending: false })
    setLogs(data || [])
  }

  const handleStatusChange = async (status: string) => {
    await supabase.from('agent_users').update({ status }).eq('id', id)
    setAgent((prev: any) => ({ ...prev, status }))
    setMsg('ステータスを更新しました')
    setTimeout(() => setMsg(''), 3000)

    if (status === 'active' && agent?.email) {
      await fetch('/api/notify-agent-approved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: agent.email,
          company_name: agent.company_name,
          contact_name: agent.contact_name,
          agent_code: agent.agent_code,
        }),
      })
    }
  }

  const handleMemoSave = async () => {
    await supabase.from('agent_users').update({ internal_memo: memo }).eq('id', id)
    setMsg('メモを保存しました')
    setTimeout(() => setMsg(''), 3000)
  }

  const statusLabel: any = { pending: '審査中', active: '承認済み', inactive: '無効' }
  const statusColor: any = { pending: '#f59e0b', active: '#10b981', inactive: '#6b7280' }

  if (loading) return <div style={{ padding: 40 }}>読み込み中...</div>
  if (!agent) return <div style={{ padding: 40 }}>業者が見つかりません</div>

  const card: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '20px 24px', marginBottom: 20 }
  const label: React.CSSProperties = { fontSize: 12, color: '#6b7280', marginBottom: 4 }
  const value: React.CSSProperties = { fontSize: 14, color: '#1f2937', marginBottom: 12 }
  const row: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900, margin: '0 auto' }}>
      <button onClick={() => router.push('/agents')} style={{ marginBottom: 20, background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 14 }}>
        ← 業者一覧に戻る
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a3a5c' }}>{agent.company_name}</h1>
        <span style={{ background: statusColor[agent.status] || '#6b7280', color: '#fff', padding: '4px 14px', borderRadius: 20, fontSize: 13 }}>
          {statusLabel[agent.status] || agent.status}
        </span>
      </div>

      {msg && <div style={{ background: '#d1fae5', color: '#065f46', padding: '10px 16px', borderRadius: 6, marginBottom: 16 }}>{msg}</div>}

      {/* 会社情報 */}
      <div style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a3a5c', marginBottom: 16, borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}>🏢 会社情報</h2>
        <div style={row}>
          <div><p style={label}>業者コード</p><p style={value}>{agent.agent_code || '—'}</p></div>
          <div><p style={label}>会社名</p><p style={value}>{agent.company_name || '—'}</p></div>
          <div><p style={label}>住所</p><p style={value}>{agent.address || '—'}</p></div>
              <div><p style={label}>番地</p><p style={value}>{agent.street_address || '-'}</p></div>
              <div><p style={label}>建物名</p><p style={value}>{agent.building_name || '-'}</p></div>
        </div>
      </div>

      {/* 担当者情報 */}
      <div style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a3a5c', marginBottom: 16, borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}>👤 担当者情報</h2>
        <div style={row}>
          <div><p style={label}>担当者名</p><p style={value}>{agent.contact_name || '—'}</p></div>
          <div><p style={label}>部署</p><p style={value}>{agent.department || '—'}</p></div>
          <div><p style={label}>メール</p><p style={value}>{agent.email || '—'}</p></div>
          <div><p style={label}>電話番号</p><p style={value}>{agent.phone || '—'}</p></div>
          <div><p style={label}>携帯番号</p><p style={value}>{agent.mobile_phone || '—'}</p></div>
        </div>
      </div>

      {/* 宅建免許 */}
      <div style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a3a5c', marginBottom: 16, borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}>📋 宅建免許</h2>
        <div style={row}>
          <div><p style={label}>免許種別</p><p style={value}>{agent.license_type || '—'}</p></div>
          <div><p style={label}>都道府県</p><p style={value}>{agent.license_prefecture || '—'}</p></div>
          <div><p style={label}>免許番号</p><p style={value}>{agent.license_number || '—'}</p></div>
        </div>
      </div>

      {/* 名刺画像 */}
      {agent.card_url && (
        <div style={card}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a3a5c', marginBottom: 16, borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}>🪪 名刺画像</h2>
          <img src={agent.card_url} alt="名刺" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, border: '1px solid #e5e7eb', objectFit: 'contain' }} />
          <p style={{ marginTop: 8 }}><a href={agent.card_url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontSize: 13 }}>画像を別タブで開く</a></p>
        </div>
      )}

      {/* ステータス管理 */}
      <div style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a3a5c', marginBottom: 16, borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}>⚙️ ステータス管理</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          {['pending', 'active', 'inactive'].map(s => (
            <button key={s} onClick={() => handleStatusChange(s)}
              style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid', cursor: 'pointer', fontSize: 13,
                background: agent.status === s ? statusColor[s] : '#fff',
                color: agent.status === s ? '#fff' : statusColor[s],
                borderColor: statusColor[s] }}>
              {statusLabel[s]}
            </button>
          ))}
        </div>
      </div>

      {/* 社内メモ */}
      <div style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a3a5c', marginBottom: 16, borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}>📝 社内メモ</h2>
        <textarea value={memo} onChange={e => setMemo(e.target.value)}
          style={{ width: '100%', minHeight: 100, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', resize: 'vertical' }} />
        <button onClick={handleMemoSave}
          style={{ marginTop: 10, padding: '8px 20px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
          メモを保存
        </button>
      </div>

      {/* アクティビティログ */}
      <div style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a3a5c', marginBottom: 16, borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}>📊 アクティビティログ</h2>
        {logs.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: 14 }}>まだログがありません</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid #e5e7eb' }}>日時</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid #e5e7eb' }}>アクション</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid #e5e7eb' }}>物件名</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid #e5e7eb' }}>詳細</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb' }}>{new Date(log.created_at).toLocaleString('ja-JP')}</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb' }}>{log.action_type}</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb' }}>{log.property_name || '—'}</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #e5e7eb' }}>{log.detail || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

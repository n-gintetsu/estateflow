'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState({ agent_code: '', password: '', company_name: '', contact_name: '', email: '', phone: '', is_active: true })
  const [msg, setMsg] = useState('')

  useEffect(() => { fetchAgents() }, [])

  const fetchAgents = async () => {
    const { data } = await supabase.from('agent_users').select('*').order('created_at', { ascending: false })
    setAgents(data || [])
    setLoading(false)
  }

  const handleSave = async () => {
    if (!form.agent_code || !form.password || !form.company_name) { setMsg('業者ID・パスワード・会社名は必須です'); return }
    if (editItem) {
      await supabase.from('agent_users').update(form).eq('id', editItem.id)
    } else {
      await supabase.from('agent_users').insert([form])
    }
    setShowForm(false); setEditItem(null)
    setForm({ agent_code: '', password: '', company_name: '', contact_name: '', email: '', phone: '', is_active: true })
    fetchAgents()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('削除しますか？')) return
    await supabase.from('agent_users').delete().eq('id', id)
    fetchAgents()
  }

  const handleToggle = async (id: string, current: boolean) => {
    await supabase.from('agent_users').update({ is_active: !current }).eq('id', id)
    fetchAgents()
  }

  const inp = { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' as const }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 'bold', color: '#1e293b', margin: 0 }}>🤝 仲介業者管理</h1>
        <button onClick={() => { setShowForm(true); setEditItem(null); setForm({ agent_code: '', password: '', company_name: '', contact_name: '', email: '', phone: '', is_active: true }) }}
          style={{ background: '#1a3a5c', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>
          ＋ 新規登録
        </button>
      </div>
      {loading ? <p>読み込み中...</p> : (
        <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['業者ID','会社名','担当者名','メール','電話','ステータス','操作'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agents.length === 0 && <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>登録された業者がありません</td></tr>}
              {agents.map((a: any) => (
                <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1a3a5c' }}>{a.agent_code}</td>
                  <td style={{ padding: '12px 16px' }}>{a.company_name}</td>
                  <td style={{ padding: '12px 16px' }}>{a.contact_name || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>{a.email || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>{a.phone || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span onClick={() => handleToggle(a.id, a.is_active)} style={{ cursor: 'pointer', padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: a.is_active ? '#dcfce7' : '#fee2e2', color: a.is_active ? '#166534' : '#991b1b' }}>
                      {a.is_active ? '有効' : '無効'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { setEditItem(a); setForm({ agent_code: a.agent_code, password: a.password, company_name: a.company_name, contact_name: a.contact_name||'', email: a.email||'', phone: a.phone||'', is_active: a.is_active }); setShowForm(true) }}
                        style={{ padding: '4px 12px', background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>編集</button>
                      <button onClick={() => handleDelete(a.id)}
                        style={{ padding: '4px 12px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>削除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 32, width: '100%', maxWidth: 480 }}>
            <h3 style={{ color: '#1a3a5c', marginTop: 0 }}>{editItem ? '業者情報を編集' : '新規業者登録'}</h3>
            {msg && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{msg}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>業者ID</label><input style={inp} value={form.agent_code} onChange={e => setForm(f=>({...f,agent_code:e.target.value}))} placeholder="AGENT001" /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>パスワード</label><input style={inp} value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} /></div>
            </div>
            <div style={{ marginBottom: 12 }}><label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>会社名</label><input style={inp} value={form.company_name} onChange={e => setForm(f=>({...f,company_name:e.target.value}))} placeholder="○○不動産株式会社" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>担当者名</label><input style={inp} value={form.contact_name} onChange={e => setForm(f=>({...f,contact_name:e.target.value}))} /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>電話番号</label><input style={inp} value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} /></div>
            </div>
            <div style={{ marginBottom: 20 }}><label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>メール</label><input style={inp} value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} /></div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setShowForm(false); setMsg('') }} style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer' }}>キャンセル</button>
              <button onClick={handleSave} style={{ flex: 1, padding: '10px', background: '#1a3a5c', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

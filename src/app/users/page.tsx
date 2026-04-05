'use client'
import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function Users() {
  useEffect(() => { supabase.auth.getUser().then(({ data }) => { if (!data.user) window.location.href = '/login' }) }, [])
  const users = [
    { name: '小川 宜猛', email: 'gintetsu.fudosan@gmail.com', role: '管理者', branch: '大宮本店' },
    { name: '山田 一郎', email: 'yamada@gintetsu.co.jp', role: 'スタッフ', branch: '大宮本店' },
  ]
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ background: '#1e40af', color: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 20, fontWeight: 'bold' }}>👥 ユーザー管理</span>
        <button onClick={() => window.location.href = '/dashboard'} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>← ダッシュボード</button>
      </header>
      <main style={{ padding: 32 }}>
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f1f5f9' }}>
              {['氏名', 'メール', '権限', '支店'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#475569' }}>{h}</th>)}
            </tr></thead>
            <tbody>{users.map((u, i) => <tr key={i} style={{ borderTop: '1px solid #e2e8f0' }}>
              <td style={{ padding: '14px 16px', fontWeight: 600 }}>{u.name}</td>
              <td style={{ padding: '14px 16px', color: '#64748b' }}>{u.email}</td>
              <td style={{ padding: '14px 16px' }}><span style={{ background: u.role === '管理者' ? '#dbeafe' : '#f1f5f9', color: u.role === '管理者' ? '#1e40af' : '#64748b', padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>{u.role}</span></td>
              <td style={{ padding: '14px 16px', color: '#64748b' }}>{u.branch}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </main>
    </div>
  )
}

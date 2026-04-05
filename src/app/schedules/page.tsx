'use client'
import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function Schedules() {
  useEffect(() => { supabase.auth.getUser().then(({ data }) => { if (!data.user) window.location.href = '/login' }) }, [])
  const items = [
    { id: 1, name: '田中 太郎', property: 'サンプル物件A', date: '2026-04-10', time: '10:00', staff: '小川' },
    { id: 2, name: '鈴木 花子', property: 'サンプル物件B', date: '2026-04-11', time: '14:00', staff: '小川' },
  ]
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ background: '#1e40af', color: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 20, fontWeight: 'bold' }}>📅 内見スケジュール</span>
        <button onClick={() => window.location.href = '/dashboard'} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>← ダッシュボード</button>
      </header>
      <main style={{ padding: 32 }}>
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f1f5f9' }}>
              {['氏名', '物件名', '日付', '時間', '担当者'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#475569' }}>{h}</th>)}
            </tr></thead>
            <tbody>{items.map(i => <tr key={i.id} style={{ borderTop: '1px solid #e2e8f0' }}>
              <td style={{ padding: '14px 16px', fontWeight: 600 }}>{i.name}</td>
              <td style={{ padding: '14px 16px' }}>{i.property}</td>
              <td style={{ padding: '14px 16px', color: '#1e40af', fontWeight: 600 }}>{i.date}</td>
              <td style={{ padding: '14px 16px' }}>{i.time}</td>
              <td style={{ padding: '14px 16px', color: '#64748b' }}>{i.staff}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </main>
    </div>
  )
}

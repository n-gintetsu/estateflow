'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function Properties() {
  useEffect(() => { supabase.auth.getUser().then(({ data }) => { if (!data.user) window.location.href = '/login' }) }, [])
  const items = [
    { id: 1, name: 'サンプル物件A', address: '埼玉県さいたま市大宮区', price: '2,500万円', status: '販売中' },
    { id: 2, name: 'サンプル物件B', address: '埼玉県さいたま市浦和区', price: '3,200万円', status: '商談中' },
    { id: 3, name: 'サンプル物件C', address: '埼玉県川口市', price: '1,800万円', status: '成約済' },
  ]
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ background: '#1e40af', color: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 20, fontWeight: 'bold' }}>🏠 物件管理</span>
        <button onClick={() => window.location.href = '/dashboard'} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>← ダッシュボード</button>
      </header>
      <main style={{ padding: 32 }}>
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f1f5f9' }}>
              {['物件名', '住所', '価格', 'ステータス'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#475569' }}>{h}</th>)}
            </tr></thead>
            <tbody>{items.map(i => <tr key={i.id} style={{ borderTop: '1px solid #e2e8f0' }}>
              <td style={{ padding: '14px 16px', fontWeight: 600 }}>{i.name}</td>
              <td style={{ padding: '14px 16px', color: '#64748b' }}>{i.address}</td>
              <td style={{ padding: '14px 16px', color: '#1e40af', fontWeight: 600 }}>{i.price}</td>
              <td style={{ padding: '14px 16px' }}><span style={{ background: i.status === '販売中' ? '#dcfce7' : i.status === '商談中' ? '#fef9c3' : '#f1f5f9', color: i.status === '販売中' ? '#16a34a' : i.status === '商談中' ? '#ca8a04' : '#64748b', padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>{i.status}</span></td>
            </tr>)}</tbody>
          </table>
        </div>
      </main>
    </div>
  )
}

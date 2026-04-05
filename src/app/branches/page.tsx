'use client'
import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function Branches() {
  useEffect(() => { supabase.auth.getUser().then(({ data }) => { if (!data.user) window.location.href = '/login' }) }, [])
  const branches = [
    { name: '大宮本店', address: '埼玉県さいたま市大宮区', tel: '048-000-0001', staff: 3 },
    { name: '浦和支店', address: '埼玉県さいたま市浦和区', tel: '048-000-0002', staff: 2 },
  ]
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ background: '#1e40af', color: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 20, fontWeight: 'bold' }}>🏢 支店管理</span>
        <button onClick={() => window.location.href = '/dashboard'} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>← ダッシュボード</button>
      </header>
      <main style={{ padding: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {branches.map((b, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>🏢</div>
              <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>{b.name}</div>
              <div style={{ color: '#64748b', fontSize: 14, marginBottom: 6 }}>📍 {b.address}</div>
              <div style={{ color: '#64748b', fontSize: 14, marginBottom: 6 }}>📞 {b.tel}</div>
              <div style={{ color: '#64748b', fontSize: 14 }}>👥 スタッフ {b.staff}名</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

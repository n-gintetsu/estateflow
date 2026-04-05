'use client'
import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function Email() {
  useEffect(() => { supabase.auth.getUser().then(({ data }) => { if (!data.user) window.location.href = '/login' }) }, [])
  const templates = [
    { title: '内見確認メール', desc: '内見予約が確定した際に送るテンプレート' },
    { title: '物件紹介メール', desc: '新着物件をお客様にご案内するテンプレート' },
    { title: 'フォローアップメール', desc: '内見後のお礼とフォローアップ用テンプレート' },
  ]
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ background: '#1e40af', color: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 20, fontWeight: 'bold' }}>✉️ メール管理</span>
        <button onClick={() => window.location.href = '/dashboard'} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>← ダッシュボード</button>
      </header>
      <main style={{ padding: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {templates.map((t, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>✉️</div>
              <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>{t.title}</div>
              <div style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>{t.desc}</div>
              <button style={{ background: '#1e40af', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>編集する</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

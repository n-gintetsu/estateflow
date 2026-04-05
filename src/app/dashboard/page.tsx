'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
      else setUser(data.user)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const pages = [
    { name: '物件管理', icon: '🏠', path: '/properties', desc: '物件の登録・編集・削除' },
    { name: '問い合わせ管理', icon: '📩', path: '/inquiries', desc: '顧客からの問い合わせ一覧' },
    { name: '内見スケジュール', icon: '📅', path: '/schedules', desc: '内見予約の管理' },
    { name: 'LINE Bot', icon: '💬', path: '/line-bot', desc: 'LINE自動返信シミュレーター' },
    { name: 'メール管理', icon: '✉️', path: '/email', desc: 'メールテンプレート管理' },
    { name: 'ユーザー管理', icon: '👥', path: '/users', desc: 'スタッフアカウント管理' },
    { name: '支店管理', icon: '🏢', path: '/branches', desc: '支店情報の管理' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ background: '#1e40af', color: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: 'white', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e40af', fontWeight: 'bold' }}>不</div>
          <span style={{ fontSize: 20, fontWeight: 'bold' }}>EstateFlow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14 }}>{user?.email}</span>
          <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>ログアウト</button>
        </div>
      </header>
      <main style={{ padding: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 }}>ダッシュボード</h2>
        <p style={{ color: '#64748b', marginBottom: 32 }}>管理メニューを選択してください</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
          {pages.map(p => (
            <div key={p.path} onClick={() => window.location.href = p.path}
              style={{ background: 'white', borderRadius: 16, padding: 24, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'transform 0.15s', border: '1px solid #e2e8f0' }}
              onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseOut={e => (e.currentTarget.style.transform = 'translateY(0)')}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{p.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 6 }}>{p.name}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

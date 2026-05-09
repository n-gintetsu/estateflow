'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navGroups = [
  { group: '物件管理', icon: '🏠', items: [
    { id: 'properties', label: '売買物件', icon: '🏢', href: '/properties' },
    { id: 'rental', label: '賃貸管理', icon: '🏘', href: '/rental' },
    { id: 'investment', label: '収益物件', icon: '💰', href: '/investment' },
  ]},
  { group: '顧客対応', icon: '💬', items: [
    { id: 'inquiries', label: '問い合わせ', icon: '💬', href: '/inquiries' },
    { id: 'schedule', label: '内見スケジュール', icon: '📅', href: '/schedules' },
    { id: 'agents', label: '仲介業者管理', icon: '🤝', href: '/agents' },
    { id: 'agent-docs', label: '各種書類管理', icon: '📂', href: '/agent-docs' },
    { id: 'property-progress', label: '物件進捗管理', icon: '📊', href: '/property-progress' },
    { id: 'company-inquiries', label: '企業者問い合わせ', icon: '🏢', href: '/company-inquiries' },
    { id: 'ad-inquiries', label: '仲介業者問い合わせ', icon: '💼', href: '/ad-inquiries' },
  ]},
  { group: 'コンテンツ', icon: '✏️', items: [
    { id: 'columns', label: 'コラム管理', icon: '✏️', href: '/columns' },
    { id: 'news', label: 'お知らせ管理', icon: '📢', href: '/news' },
    { id: 'promo', label: 'PromoIQ', icon: '🤖', href: '/promo' },
  ]},
  { group: '管理', icon: '⚙️', items: [
    { id: 'documents', label: '書類管理', icon: '📋', href: '/documents' },
    { id: 'analytics', label: '分析', icon: '📊', href: '/analytics' },
    { id: 'linebot', label: 'LINE Bot', icon: '💚', href: '/line-bot' },
    { id: 'mail', label: 'メール通知', icon: '📧', href: '/email' },
    { id: 'staff', label: 'スタッフ管理', icon: '👥', href: '/staff' },
    { id: 'partner-notifications', label: 'パートナーお知らせ', icon: '📣', href: '/partner-notifications' },
    { id: 'notices', label: '仲介業者お知らせ', icon: '🔔', href: '/notices' },
  ]},
]

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [openGroups, setOpenGroups] = useState<string[]>(['物件管理', '顧客対応', 'コンテンツ', '管理'])

  if (pathname === '/login') return <>{children}</>

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group])
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ width: 200, background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', padding: 16, minHeight: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, padding: '8px 0' }}>
          <div style={{ width: 32, height: 32, background: '#1e40af', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>不</div>
          <span style={{ fontWeight: 'bold', color: '#1e293b' }}>EstateFlow</span>
        </div>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, marginBottom: 8, background: pathname === '/' ? '#1e40af' : 'transparent', color: pathname === '/' ? 'white' : '#475569', fontWeight: pathname === '/' ? 600 : 400, fontSize: 13, textDecoration: 'none' }}>
          <span>📊</span><span>ダッシュボード</span>
        </Link>
        {navGroups.map((group) => (
          <div key={group.group} style={{ marginBottom: 4 }}>
            <button onClick={() => toggleGroup(group.group)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#f1f5f9', color: '#374151', fontWeight: 600, fontSize: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span>{group.icon}</span><span>{group.group}</span></span>
              <span style={{ fontSize: 10 }}>{openGroups.includes(group.group) ? '▲' : '▼'}</span>
            </button>
            {openGroups.includes(group.group) && (
              <div style={{ paddingLeft: 8, marginTop: 2 }}>
                {group.items.map((n) => (
                  <Link key={n.id} href={n.href} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', marginBottom: 1, background: pathname === n.href ? '#1e40af' : 'transparent', color: pathname === n.href ? 'white' : '#475569', fontWeight: pathname === n.href ? 600 : 400, fontSize: 13, textDecoration: 'none' }}>
                    <span>{n.icon}</span><span>{n.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
        <div style={{ marginTop: 'auto' }}>
          <button onClick={async () => { const { createClient } = await import('@supabase/supabase-js'); const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!); await s.auth.signOut(); window.location.href = '/login'; }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: '#ef4444', fontWeight: 600, fontSize: 14, width: '100%' }}>
            <span>🚪</span><span>ログアウト</span>
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
    </div>
  )
}

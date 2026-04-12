'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/', icon: '📊', label: 'ダッシュボード' },
  { href: '/properties', icon: '🏠', label: '物件管理' },
  { href: '/rental', icon: '🏠', label: '賃貸管理' },
  { href: '/investment', icon: '💰', label: '収益物件管理' },
  { href: '/agents', icon: '🤝', label: '仲介業者管理' },
  { href: '/schedules', icon: '📅', label: '内見スケジュール' },
  { href: '/documents', icon: '📋', label: '書類管理' },
  { href: '/columns', icon: '✍️', label: 'コラム管理' },
  { href: '/news', icon: '📢', label: 'お知らせ管理' },
  { href: '/promo', icon: '🤖', label: 'PromoIQ' },
  { href: '/analytics', icon: '📊', label: '分析' },
]

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/login') return <>{children}</>;
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
    <div style={{ width: 200, background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', padding: 16, minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, padding: '8px 0' }}>
        <div style={{ width: 32, height: 32, background: '#1e40af', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>不</div>
        <span style={{ fontWeight: 'bold', color: '#1e293b' }}>EstateFlow</span>
      </div>
      {nav.map(n => (
        <Link key={n.href} href={n.href} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, marginBottom: 4, background: pathname === n.href ? '#1e40af' : 'transparent', color: pathname === n.href ? 'white' : '#475569', fontWeight: pathname === n.href ? 600 : 400, fontSize: 14, textDecoration: 'none' }}>
          <span>{n.icon}</span>{n.label}
        </Link>
      ))}
    </div>
    <div style={{ flex: 1, overflow: "auto" }}>{children}</div>
    </div>
  )
}


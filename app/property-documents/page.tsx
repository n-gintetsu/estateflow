'use client'
import { useState } from 'react'

type TabType = 'all' | 'sale' | 'rental' | 'investment'

const TYPE_LABEL: Record<'sale' | 'rental' | 'investment', string> = {
  sale: '売買',
  rental: '賃貸',
  investment: '収益',
}

export default function PropertyDocumentsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all')

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, color: '#1a3a5c' }}>📁 物件別書類管理</h1>
        <a href="/" style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none' }}>← ダッシュボード</a>
      </div>

      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
        物件ごとの資料（概要書、謄本、案内方法など）を管理します。
      </p>

      <button
        style={{ padding: '10px 20px', background: '#1a3a5c', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, marginBottom: 20 }}
      >
        ＋ 書類を追加
      </button>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', 'sale', 'rental', 'investment'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              background: activeTab === tab ? '#1a3a5c' : 'white',
              color: activeTab === tab ? 'white' : '#374151',
              border: '1px solid ' + (activeTab === tab ? '#1a3a5c' : '#d1d5db'),
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {tab === 'all' ? 'すべて' : TYPE_LABEL[tab]} (0)
          </button>
        ))}
      </div>

      <p style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>
        書類がまだ登録されていません
      </p>
    </div>
  )
}

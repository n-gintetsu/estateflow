'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Notification = {
  id: string
  title: string
  body: string
  target_type: string
  target_label: string
  created_at: string
}

type PartnerUser = {
  id: string
  company_name: string
  deleted_at: string | null
  is_active: boolean
}

export default function PartnerNotificationsPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all')
  const [targetPartnerId, setTargetPartnerId] = useState('')
  const [partners, setPartners] = useState<PartnerUser[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [partnersRes, { data: notifs }] = await Promise.all([
      fetch('/api/partner-accounts').then(r => r.json()),
      supabase.from('partner_notifications').select('*').order('created_at', { ascending: false }),
    ])
    const active: PartnerUser[] = (partnersRes || []).filter(
      (p: PartnerUser) => p.is_active && !p.deleted_at
    )
    setPartners(active)
    setNotifications(notifs || [])
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      alert('件名と本文を入力してください')
      return
    }
    if (targetType === 'specific' && !targetPartnerId) {
      alert('送信先の会社を選択してください')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/partner-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          target_type: targetType,
          target_partner_id: targetType === 'specific' ? targetPartnerId : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || '送信に失敗しました')
        return
      }
      alert(`送信完了（${data.sent}件）`)
      setTitle('')
      setBody('')
      setTargetType('all')
      setTargetPartnerId('')
      await fetchData()
    } catch {
      alert('通信エラーが発生しました')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      {/* ヘッダー */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, color: '#c9a84c', fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>
          PARTNER NOTIFICATIONS
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#1a3a5c', margin: 0 }}>
          パートナーお知らせ送信
        </h1>
      </div>

      {/* 送信フォーム */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a3a5c', marginBottom: 20, paddingBottom: 12, borderBottom: '2px solid #f1f5f9' }}>
          新規送信
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* 件名 */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              件名 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="件名を入力"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 16, boxSizing: 'border-box' }}
            />
          </div>

          {/* 本文 */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              本文 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={4}
              placeholder="本文を入力"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 16, boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>

          {/* 送信対象 */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 10 }}>
              送信対象 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: 20, marginBottom: targetType === 'specific' ? 12 : 0 }}>
              {(['all', 'specific'] as const).map(val => (
                <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                  <input
                    type="radio"
                    name="targetType"
                    value={val}
                    checked={targetType === val}
                    onChange={() => { setTargetType(val); setTargetPartnerId('') }}
                    style={{ accentColor: '#1a3a5c', width: 16, height: 16 }}
                  />
                  <span style={{ color: '#374151', fontWeight: targetType === val ? 600 : 400 }}>
                    {val === 'all' ? '全パートナー' : '特定の会社'}
                  </span>
                </label>
              ))}
            </div>

            {targetType === 'specific' && (
              <select
                value={targetPartnerId}
                onChange={e => setTargetPartnerId(e.target.value)}
                style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 16, minWidth: 280, background: '#fff' }}
              >
                <option value="">会社を選択してください</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.company_name}</option>
                ))}
              </select>
            )}
          </div>

          {/* 送信ボタン */}
          <div>
            <button
              onClick={handleSubmit}
              disabled={sending}
              style={{ background: '#c9a84c', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1 }}
            >
              {sending ? '送信中...' : '送信する'}
            </button>
          </div>
        </div>
      </div>

      {/* 送信履歴 */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a3a5c', marginBottom: 20, paddingBottom: 12, borderBottom: '2px solid #f1f5f9' }}>
          送信履歴
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>読み込み中...</div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>送信履歴はありません</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* テーブルヘッダー */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px', gap: 12, padding: '8px 16px', background: '#f8fafc', borderRadius: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>件名</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>送信対象</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>送信日時</span>
            </div>
            {notifications.map(n => (
              <div
                key={n.id}
                style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px', gap: 12, padding: '14px 16px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}
              >
                <span style={{ fontSize: 14, color: '#1a3a5c', fontWeight: 600 }}>{n.title}</span>
                <span style={{ fontSize: 13, color: '#6b7280' }}>
                  <span style={{
                    background: n.target_type === 'all' ? '#dbeafe' : '#fef3c7',
                    color: n.target_type === 'all' ? '#1d4ed8' : '#92400e',
                    padding: '2px 10px',
                    borderRadius: 50,
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    {n.target_label || (n.target_type === 'all' ? '全パートナー' : '特定')}
                  </span>
                </span>
                <span style={{ fontSize: 13, color: '#9ca3af' }}>
                  {new Date(n.created_at).toLocaleString('ja-JP')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

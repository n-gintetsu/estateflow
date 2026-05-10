'use client'
import { useState, useEffect, useRef } from 'react'

type Notice = {
  id: string
  title: string
  body: string
  target_type: string
  agent_id: string | null
  priority: string
  status: string
  published_at: string | null
  created_at: string
}

type PartnerUser = {
  id: string
  company_name: string
}

const PRIORITY_LABELS: Record<string, string> = {
  normal: '通常',
  important: '重要',
  urgent: '緊急',
}

const PRIORITY_STYLES: Record<string, { bg: string; color: string }> = {
  normal: { bg: '#eef2f7', color: '#1a3a5c' },
  important: { bg: '#fff3e0', color: '#e65100' },
  urgent: { bg: '#fce4ec', color: '#c62828' },
}

const EMPTY_FORM = { title: '', body: '', priority: 'normal' }

export default function NoticesPage() {
  const formRef = useRef<HTMLDivElement>(null)

  const [notices, setNotices] = useState<Notice[]>([])
  const [partners, setPartners] = useState<PartnerUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [targetMode, setTargetMode] = useState<'all' | 'specific'>('all')
  const [agentId, setAgentId] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const fetchNotices = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notices')
      const data = await res.json()
      setNotices(Array.isArray(data) ? data : [])
    } catch {
      setNotices([])
    }
    setLoading(false)
  }

  const fetchPartners = async () => {
    try {
      const res = await fetch('/api/agents')
      const data = await res.json()
      setPartners(Array.isArray(data) ? data : [])
    } catch {
      setPartners([])
    }
  }

  useEffect(() => {
    fetchNotices()
    fetchPartners()
  }, [])

  const resetForm = () => {
    setForm({ ...EMPTY_FORM })
    setTargetMode('all')
    setAgentId('')
  }

  const openForm = () => {
    setShowForm(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (targetMode === 'specific' && !agentId) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          priority: form.priority,
          target_type: 'agent',
          status: 'published',
          agent_id: targetMode === 'specific' ? agentId : null,
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        console.error('[notices POST] error:', res.status, errData)
        return
      }
      resetForm()
      setShowForm(false)
      setSuccessMsg('✅ お知らせを送信しました')
      setTimeout(() => setSuccessMsg(''), 4000)
      fetchNotices()
    } catch (err) {
      console.error('[notices POST] network error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', fontSize: 16,
    border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none',
    color: '#1e293b', background: 'white', boxSizing: 'border-box',
  }

  const pStyle = (p: string) => PRIORITY_STYLES[p] || PRIORITY_STYLES.normal

  const getAgentLabel = (notice: Notice) => {
    if (!notice.agent_id) return '🏢 全業者'
    const partner = partners.find(p => p.id === notice.agent_id)
    return partner ? `🏢 ${partner.company_name}` : '🏢 特定業者'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ background: '#1a3a5c', color: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 'bold' }}>🔔 仲介業者向けお知らせ管理</div>
          <div style={{ fontSize: 12, color: '#93c5fd', marginTop: 2 }}>notices テーブル（target_type: agent）</div>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{ padding: '10px 22px', borderRadius: 8, border: 'none', background: showForm ? '#475569' : '#c9a84c', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
        >
          {showForm ? 'キャンセル' : '＋ 新規送信'}
        </button>
      </header>

      <main style={{ padding: '32px 32px', maxWidth: 900, margin: '0 auto' }}>

        {successMsg ? (
          <div style={{ marginBottom: 20, padding: '12px 20px', background: '#f0fdf4', color: '#16a34a', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
            {successMsg}
          </div>
        ) : null}

        {showForm ? (
          <div ref={formRef} style={{ background: 'white', borderRadius: 12, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 28, border: '1.5px solid #c9a84c' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 18 }}>🏢</span>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#92400e', margin: 0 }}>仲介業者向けお知らせ送信</h2>
              <span style={{ fontSize: 11, background: '#c9a84c', color: 'white', padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>agent 固定 / 即時公開</span>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: 16 }}>

                {/* 送信先選択 */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                    送信先 <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: 24 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#1e293b' }}>
                      <input
                        type="radio"
                        name="targetMode"
                        value="all"
                        checked={targetMode === 'all'}
                        onChange={() => { setTargetMode('all'); setAgentId('') }}
                        style={{ accentColor: '#1a3a5c', width: 16, height: 16 }}
                      />
                      全業者へ送信
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#1e293b' }}>
                      <input
                        type="radio"
                        name="targetMode"
                        value="specific"
                        checked={targetMode === 'specific'}
                        onChange={() => setTargetMode('specific')}
                        style={{ accentColor: '#1a3a5c', width: 16, height: 16 }}
                      />
                      特定業者を指定
                    </label>
                  </div>

                  {targetMode === 'specific' && (
                    <div style={{ marginTop: 10 }}>
                      <select
                        value={agentId}
                        onChange={e => setAgentId(e.target.value)}
                        required
                        style={{ ...inp, maxWidth: 320 }}
                      >
                        <option value="">業者を選択してください</option>
                        {partners.map(p => (
                          <option key={p.id} value={p.id}>{p.company_name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                    タイトル <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    required
                    placeholder="仲介業者へのお知らせタイトル"
                    style={inp}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>本文</label>
                  <textarea
                    value={form.body}
                    onChange={e => setForm({ ...form, body: e.target.value })}
                    rows={4}
                    placeholder="仲介業者へ伝える内容を入力してください"
                    style={{ ...inp, resize: 'vertical', fontFamily: 'inherit', minHeight: 90 }}
                  />
                </div>
                <div style={{ maxWidth: 220 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>重要度</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                    style={inp}
                  >
                    <option value="normal">通常</option>
                    <option value="important">重要</option>
                    <option value="urgent">緊急</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); resetForm() }}
                    style={{ padding: '10px 24px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || (targetMode === 'specific' && !agentId)}
                    style={{ padding: '10px 28px', borderRadius: 8, border: 'none', background: (submitting || (targetMode === 'specific' && !agentId)) ? '#d1d5db' : '#c9a84c', color: 'white', fontSize: 14, fontWeight: 700, cursor: (submitting || (targetMode === 'specific' && !agentId)) ? 'default' : 'pointer' }}
                  >
                    {submitting ? '送信中...' : '📨 送信する（即時公開）'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : null}

        <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>読み込み中...</div>
          ) : notices.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
              <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>お知らせがまだありません</p>
              <button
                onClick={openForm}
                style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#c9a84c', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                最初のお知らせを送信する
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['タイトル', '本文', '重要度', '送信先', '公開日時', 'ステータス'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#1a3a5c', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {notices.map((n, i) => (
                  <tr key={n.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafaf8' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14, color: '#1e293b', maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569', maxWidth: 260 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body || '—'}</div>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: pStyle(n.priority).bg, color: pStyle(n.priority).color }}>
                        {PRIORITY_LABELS[n.priority] || n.priority}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap', maxWidth: 160 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getAgentLabel(n)}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {n.published_at ? new Date(n.published_at).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: n.status === 'published' ? '#dcfce7' : '#fef9c3', color: n.status === 'published' ? '#16a34a' : '#ca8a04' }}>
                        {n.status === 'published' ? '公開中' : '下書き'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}

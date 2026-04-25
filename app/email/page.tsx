'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TRIGGER_LABELS: any = {
  new_inquiry: '新規問い合わせ受信時',
  before_visit: '内見24時間前',
  status_change: '申込ステータス変更時',
  manual: '手動送信',
  ad_inquiry_received: '広告掲載問い合わせ受信時',
  agent_ad_placement: '【業者】広告掲載依頼受信時',
  agent_viewing: '【業者】内見依頼受信時',
  agent_application: '【業者】購入/入居申込受信時',
  agent_doc_request: '【業者】物件資料請求受信時',
  agent_other: '【業者】その他お問い合わせ受信時',
}

const TRIGGER_ICONS: any = {
  new_inquiry: '⚡',
  before_visit: '📅',
  status_change: '🔄',
  manual: '✉️',
  ad_inquiry_received: '📢',
  agent_ad_placement: '📣',
  agent_viewing: '🏠',
  agent_application: '📝',
  agent_doc_request: '📄',
  agent_other: '💬',
}

export default function EmailPage() {
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
    })
  }, [])

  const [workflows, setWorkflows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', trigger_type: 'new_inquiry', subject: '', body: '', is_active: true })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [testMsg, setTestMsg] = useState('')

  const fetchWorkflows = async () => {
    setLoading(true)
    const { data } = await supabase.from('email_workflows').select('*').order('created_at', { ascending: true })
    setWorkflows(data || [])
    if (data && data.length > 0 && !selected) setSelected(data[0])
    setLoading(false)
  }

  useEffect(() => { fetchWorkflows() }, [])

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    setMsg('')
    const { error } = await supabase.from('email_workflows').update({
      name: selected.name,
      subject: selected.subject,
      body: selected.body,
      is_active: selected.is_active,
    }).eq('id', selected.id)
    if (error) setMsg('❌ 保存に失敗しました')
    else { setMsg('✅ 保存しました！'); setEditing(false) }
    setSaving(false)
    await fetchWorkflows()
  }

  const handleToggle = async (id: number, current: boolean) => {
    await supabase.from('email_workflows').update({ is_active: !current }).eq('id', id)
    await fetchWorkflows()
    if (selected?.id === id) setSelected((prev: any) => ({ ...prev, is_active: !current }))
  }

  const handleNew = async () => {
    if (!form.name || !form.subject || !form.body) { setMsg('❌ 必須項目を入力してください'); return }
    setSaving(true)
    await supabase.from('email_workflows').insert([form])
    setForm({ name: '', trigger_type: 'new_inquiry', subject: '', body: '', is_active: true })
    setShowNew(false)
    setMsg('✅ ワークフローを追加しました！')
    await fetchWorkflows()
    setSaving(false)
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return
    await supabase.from('email_workflows').delete().eq('id', id)
    setSelected(null)
    await fetchWorkflows()
  }

  const handleTestSend = async () => {
    if (!testEmail) { setTestMsg('❌ メールアドレスを入力してください'); return }
    setSending(true)
    setTestMsg('')
    try {
      const res = await fetch('/api/email-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail }),
      })
      if (res.ok) {
        setTestMsg(`✅ ${testEmail} にテスト送信しました`)
      } else {
        const data = await res.json()
        setTestMsg(`❌ 送信失敗：${data.error}`)
      }
    } catch {
      setTestMsg('❌ 送信エラーが発生しました')
    }
  }

  const inp = { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, fontFamily: 'inherit', background: 'white', boxSizing: 'border-box' as const }
  const activeCount = workflows.filter(w => w.is_active).length

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ background: '#1a3a5c', color: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 20, fontWeight: 'bold' }}>✉️ メール通知管理</span>
        <button onClick={() => window.location.href = '/'} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>← ダッシュボード</button>
      </header>

      <main style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
        {/* 統計 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: '総ワークフロー', value: workflows.length, color: '#1a3a5c', bg: '#eff6ff' },
            { label: '有効中', value: activeCount, color: '#16a34a', bg: '#f0fdf4' },
            { label: '停止中', value: workflows.length - activeCount, color: '#6b7280', bg: '#f1f5f9' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '16px 20px', borderLeft: `4px solid ${s.color}` }}>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {msg && (
          <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: msg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', color: msg.startsWith('✅') ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{msg}</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
          {/* 左：ワークフロー一覧 */}
            <div style={{ position: 'relative', zIndex: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontSize: 15, fontWeight: 'bold', margin: 0 }}>ワークフロー一覧</h2>
              <button onClick={() => { setShowNew(!showNew); setMsg('') }}
                style={{ background: '#1a3a5c', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                ＋ 新規追加
              </button>
            </div>

            {loading ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>読み込み中...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                {workflows.map(w => (
                  <div key={w.id}
                    onClick={() => { setSelected(w); setEditing(false); setMsg('') }}
                    style={{ background: 'white', borderRadius: 10, padding: '14px 16px', cursor: 'pointer', border: selected?.id === w.id ? '2px solid #1a3a5c' : '2px solid transparent', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{w.name}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: w.is_active ? '#dcfce7' : '#f1f5f9', color: w.is_active ? '#16a34a' : '#6b7280', fontWeight: 600 }}>
                        {w.is_active ? '有効' : '停止中'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {TRIGGER_ICONS[w.trigger_type]} {TRIGGER_LABELS[w.trigger_type] || w.trigger_type}
                    </div>
                    {w.sent_count > 0 && (
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>送信数：{w.sent_count}件</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 新規追加フォーム */}
            {showNew && (
              <div style={{ background: 'white', borderRadius: 10, padding: 16, marginTop: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '2px solid #1a3a5c' }}>
                <h3 style={{ fontSize: 14, fontWeight: 'bold', margin: '0 0 12px', color: '#1a3a5c' }}>新規ワークフロー</h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 3 }}>ワークフロー名 <span style={{ color: '#ef4444' }}>必須</span></label>
                    <input style={inp} placeholder="例：資料請求完了メール" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 3 }}>送信タイミング</label>
                    <select style={inp} value={form.trigger_type} onChange={e => setForm(f => ({ ...f, trigger_type: e.target.value }))}>
                      <option value="new_inquiry">新規問い合わせ受信時</option>
                      <option value="before_visit">内見24時間前</option>
                      <option value="status_change">申込ステータス変更時</option>
                      <option value="manual">手動送信</option>
                      <option value="ad_inquiry_received">広告掲載問い合わせ受信時</option>
                      <option value="agent_ad_placement">【業者】広告掲載依頼受信時</option>
                      <option value="agent_viewing">【業者】内見依頼受信時</option>
                      <option value="agent_application">【業者】購入/入居申込受信時</option>
                      <option value="agent_doc_request">【業者】物件資料請求受信時</option>
                      <option value="agent_other">【業者】その他お問い合わせ受信時</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 3 }}>件名 <span style={{ color: '#ef4444' }}>必須</span></label>
                    <input style={inp} placeholder="メール件名" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 3 }}>本文 <span style={{ color: '#ef4444' }}>必須</span></label>
                    <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} placeholder="メール本文" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
                  </div>
                  <button onClick={handleNew} disabled={saving}
                    style={{ background: '#1a3a5c', color: 'white', border: 'none', padding: '9px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    {saving ? '追加中...' : '追加する'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 右：詳細・編集 */}
          {selected ? (
            <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 'bold', margin: 0, color: '#1e293b' }}>{selected.name}</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setEditing(!editing)}
                    style={{ background: editing ? '#f1f5f9' : '#eff6ff', color: editing ? '#374151' : '#1d4ed8', border: 'none', padding: '7px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    {editing ? 'キャンセル' : '✏️ 編集'}
                  </button>
                  <button onClick={() => handleToggle(selected.id, selected.is_active)}
                    style={{ background: selected.is_active ? '#fef2f2' : '#f0fdf4', color: selected.is_active ? '#dc2626' : '#16a34a', border: 'none', padding: '7px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    {selected.is_active ? '⏸ 停止' : '▶️ 有効化'}
                  </button>
                  <button onClick={() => handleDelete(selected.id, selected.name)}
                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '7px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                    削除
                  </button>
                </div>
              </div>

              {/* トリガー表示 */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, background: '#f8fafc', borderRadius: 10, padding: 16, alignItems: 'center' }}>
                <div style={{ background: '#fef9c3', borderRadius: 8, padding: '12px 16px', textAlign: 'center' as const, minWidth: 120 }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>⚡</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e' }}>トリガー</div>
                  <div style={{ fontSize: 11, color: '#374151', marginTop: 2 }}>{TRIGGER_LABELS[selected.trigger_type]}</div>
                </div>
                <div style={{ fontSize: 20, color: '#94a3b8' }}>→</div>
                <div style={{ background: '#eff6ff', borderRadius: 8, padding: '12px 16px', textAlign: 'center' as const, minWidth: 120 }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>✉️</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8' }}>メール送信</div>
                  <div style={{ fontSize: 11, color: '#374151', marginTop: 2 }}>テンプレート適用</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' as const }}>
                  <div style={{ fontSize: 22, fontWeight: 'bold', color: '#1a3a5c' }}>{selected.sent_count || 0}件</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>累計送信数</div>
                </div>
              </div>

              {/* 件名・本文 */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>件名</label>
                {editing ? (
                  <input style={inp} value={selected.subject} onChange={e => setSelected((prev: any) => ({ ...prev, subject: e.target.value }))} />
                ) : (
                  <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#1e293b', border: '1px solid #e5e7eb' }}>{selected.subject}</div>
                )}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>メール本文</label>
                {editing ? (
                  <textarea style={{ ...inp, minHeight: 180, resize: 'vertical' }} value={selected.body} onChange={e => setSelected((prev: any) => ({ ...prev, body: e.target.value }))} />
                ) : (
                  <div style={{ background: '#f8fafc', borderRadius: 8, padding: '14px 16px', fontSize: 14, color: '#1e293b', border: '1px solid #e5e7eb', whiteSpace: 'pre-wrap', minHeight: 120, lineHeight: 1.8 }}>{selected.body}</div>
                )}
              </div>

              {editing && (
                <button onClick={handleSave} disabled={saving}
                  style={{ background: saving ? '#9ca3af' : '#1a3a5c', color: 'white', border: 'none', padding: '11px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 'bold', marginBottom: 20 }}>
                  {saving ? '保存中...' : '💾 保存する'}
                </button>
              )}

              {/* テスト送信 */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: '#374151' }}>📤 テスト送信</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
                  <input style={inp} type="email" placeholder="テスト送信先メールアドレス" value={testEmail} onChange={e => setTestEmail(e.target.value)} />
                  <button onClick={handleTestSend} disabled={sending}
                    style={{ background: sending ? '#9ca3af' : '#c9a84c', color: 'white', border: 'none', padding: '9px 18px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' as const }}>
                    {sending ? '送信中...' : 'テスト送信'}
                  </button>
                </div>
                {testMsg && (
                  <p style={{ fontSize: 13, color: testMsg.startsWith('✅') ? '#16a34a' : '#dc2626', marginTop: 8, fontWeight: 600 }}>{testMsg}</p>
                )}
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>※ 実際のメール送信にはSendGridやResendなどのメールサービスとの連携が必要です</p>
              </div>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 12, padding: 40, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✉️</div>
              <p>左のワークフローを選択してください</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

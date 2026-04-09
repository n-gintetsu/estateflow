'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const AUTO_REPLIES = [
  { keyword: '内見', reply: '内見のご希望ありがとうございます！ご希望の日時をお知らせください。担当者よりご連絡いたします。' },
  { keyword: '資料', reply: '資料請求ありがとうございます！ご希望の物件名をお知らせください。メールにてお送りいたします。' },
  { keyword: '価格', reply: '価格についてのお問い合わせありがとうございます。詳細はお気軽にご相談ください。' },
  { keyword: 'こんにちは', reply: 'こんにちは！GINTETSU不動産です。お気軽にご相談ください😊' },
  { keyword: 'よろしく', reply: 'よろしくお願いいたします！何かご不明な点がございましたらお気軽にどうぞ。' },
]

export default function LineBotPage() {
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
    })
  }, [])

  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [tab, setTab] = useState<'inbox' | 'auto' | 'stats'>('inbox')
  const [autoReplies, setAutoReplies] = useState(AUTO_REPLIES)
  const [newKeyword, setNewKeyword] = useState('')
  const [newReply, setNewReply] = useState('')
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true)

  const fetchMessages = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('line_messages')
      .select('*')
      .order('created_at', { ascending: false })
    setMessages(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchMessages() }, [])

  const handleReply = async () => {
    if (!replyText.trim() || !selected) return
    setSending(true)
    await supabase.from('line_messages').update({
      reply_text: replyText,
      replied_at: new Date().toISOString(),
      status: 'replied'
    }).eq('id', selected.id)
    setReplyText('')
    setSelected(null)
    await fetchMessages()
    setSending(false)
  }

  const handleAddAutoReply = () => {
    if (!newKeyword || !newReply) return
    setAutoReplies(prev => [...prev, { keyword: newKeyword, reply: newReply }])
    setNewKeyword('')
    setNewReply('')
  }

  const stats = {
    total: messages.length,
    replied: messages.filter(m => m.status === 'replied').length,
    pending: messages.filter(m => m.status !== 'replied').length,
    autoReply: messages.filter(m => m.is_auto_reply).length,
  }

  const inp = { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, fontFamily: 'inherit', background: 'white', boxSizing: 'border-box' as const }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ background: '#06C755', color: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 20, fontWeight: 'bold' }}>💬 LINE Bot 管理</span>
        <button onClick={() => window.location.href = '/'} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>← ダッシュボード</button>
      </header>

      <main style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
        {/* 統計カード */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: '総受信数', value: stats.total, color: '#06C755', bg: '#f0fdf4' },
            { label: '返信済み', value: stats.replied, color: '#1a3a5c', bg: '#eff6ff' },
            { label: '未返信', value: stats.pending, color: '#dc2626', bg: '#fef2f2' },
            { label: '自動返信', value: stats.autoReply, color: '#c9a84c', bg: '#fefce8' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '16px 20px', borderLeft: `4px solid ${s.color}` }}>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* タブ */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'white', padding: 4, borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', width: 'fit-content' }}>
          {[
            { id: 'inbox', label: '📥 受信履歴' },
            { id: 'auto', label: '🤖 自動返信設定' },
            { id: 'stats', label: '📊 詳細統計' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              style={{ padding: '8px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: tab === t.id ? 700 : 400, background: tab === t.id ? '#06C755' : 'transparent', color: tab === t.id ? 'white' : '#374151' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* 受信履歴タブ */}
        {tab === 'inbox' && (
          <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap: 20 }}>
            <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 16, fontWeight: 'bold', margin: 0 }}>受信メッセージ一覧</h2>
                <button onClick={fetchMessages} style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>🔄 更新</button>
              </div>
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>読み込み中...</div>
              ) : messages.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                  <p>まだメッセージがありません</p>
                  <p style={{ fontSize: 13 }}>LINEからメッセージが届くとここに表示されます</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f0fdf4' }}>
                      {['送信者', 'メッセージ', '受信日時', 'ステータス', '操作'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: '#16a34a', fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map(m => (
                      <tr key={m.id} style={{ borderTop: '1px solid #e5e7eb', background: selected?.id === m.id ? '#f0fdf4' : 'white' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{m.display_name || '名前なし'}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{m.user_id?.slice(0, 12)}...</div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151', maxWidth: 200 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.message_text}</div>
                          {m.is_auto_reply && <span style={{ fontSize: 10, background: '#fef9c3', color: '#ca8a04', padding: '1px 6px', borderRadius: 4 }}>自動返信済</span>}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                          {new Date(m.created_at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            background: m.status === 'replied' ? '#dcfce7' : '#fef2f2',
                            color: m.status === 'replied' ? '#16a34a' : '#dc2626',
                            padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600
                          }}>
                            {m.status === 'replied' ? '返信済' : '未返信'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button onClick={() => { setSelected(m); setReplyText('') }}
                            style={{ background: '#06C755', color: 'white', border: 'none', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                            返信
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* 返信パネル */}
            {selected && (
              <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 20, height: 'fit-content' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 'bold', margin: 0 }}>💬 返信する</h3>
                  <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6b7280' }}>✕</button>
                </div>
                <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, margin: '0 0 4px' }}>{selected.display_name}からのメッセージ</p>
                  <p style={{ fontSize: 14, color: '#1e293b', margin: 0 }}>{selected.message_text}</p>
                </div>
                {selected.reply_text && (
                  <div style={{ background: '#eff6ff', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                    <p style={{ fontSize: 12, color: '#1d4ed8', fontWeight: 700, margin: '0 0 4px' }}>送信済み返信</p>
                    <p style={{ fontSize: 14, color: '#1e293b', margin: 0 }}>{selected.reply_text}</p>
                  </div>
                )}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>返信テンプレート</label>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                    {[
                      'ありがとうございます。担当者より折り返しご連絡いたします。',
                      '内見のご希望承りました。ご都合の良い日時をお知らせください。',
                      '資料をお送りいたします。少々お待ちください。',
                    ].map(t => (
                      <button key={t} onClick={() => setReplyText(t)}
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12, textAlign: 'left' as const, color: '#374151' }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  style={{ ...inp, minHeight: 100, resize: 'vertical' }}
                  placeholder="返信メッセージを入力..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                />
                <button onClick={handleReply} disabled={sending || !replyText.trim()}
                  style={{ width: '100%', marginTop: 10, padding: '10px', background: sending ? '#9ca3af' : '#06C755', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 'bold' }}>
                  {sending ? '送信中...' : '📤 返信を記録する'}
                </button>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, textAlign: 'center' as const }}>※ 実際のLINE送信はLINE公式アカウントから行ってください</p>
              </div>
            )}
          </div>
        )}

        {/* 自動返信設定タブ */}
        {tab === 'auto' && (
          <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 'bold', margin: 0 }}>🤖 自動返信キーワード設定</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#374151' }}>自動返信</span>
                <div onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
                  style={{ width: 44, height: 24, background: autoReplyEnabled ? '#06C755' : '#d1d5db', borderRadius: 12, cursor: 'pointer', position: 'relative', transition: '0.2s' }}>
                  <div style={{ width: 20, height: 20, background: 'white', borderRadius: '50%', position: 'absolute', top: 2, left: autoReplyEnabled ? 22 : 2, transition: '0.2s' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: autoReplyEnabled ? '#06C755' : '#6b7280' }}>{autoReplyEnabled ? 'ON' : 'OFF'}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
              {autoReplies.map((ar, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '150px 1fr auto', gap: 12, alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: 8 }}>
                  <div style={{ background: '#e0fce7', color: '#16a34a', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, textAlign: 'center' as const }}>
                    🔑 {ar.keyword}
                  </div>
                  <div style={{ fontSize: 13, color: '#374151' }}>{ar.reply}</div>
                  <button onClick={() => setAutoReplies(prev => prev.filter((_, idx) => idx !== i))}
                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                    削除
                  </button>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>＋ 新しいキーワードを追加</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr auto', gap: 12 }}>
                <input style={inp} placeholder="キーワード（例：営業時間）" value={newKeyword} onChange={e => setNewKeyword(e.target.value)} />
                <input style={inp} placeholder="自動返信メッセージ" value={newReply} onChange={e => setNewReply(e.target.value)} />
                <button onClick={handleAddAutoReply}
                  style={{ background: '#06C755', color: 'white', border: 'none', padding: '9px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' as const }}>
                  追加
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 統計タブ */}
        {tab === 'stats' && (
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 'bold', margin: '0 0 20px' }}>📊 LINE Bot 統計</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div style={{ background: '#f0fdf4', borderRadius: 10, padding: 20 }}>
                  <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>返信率</div>
                  <div style={{ fontSize: 32, fontWeight: 'bold', color: '#16a34a' }}>
                    {stats.total > 0 ? Math.round((stats.replied / stats.total) * 100) : 0}%
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{stats.replied} / {stats.total} 件</div>
                </div>
                <div style={{ background: '#fef9c3', borderRadius: 10, padding: 20 }}>
                  <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>自動返信率</div>
                  <div style={{ fontSize: 32, fontWeight: 'bold', color: '#ca8a04' }}>
                    {stats.total > 0 ? Math.round((stats.autoReply / stats.total) * 100) : 0}%
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{stats.autoReply} / {stats.total} 件</div>
                </div>
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 'bold', margin: '0 0 16px' }}>💡 LINE Bot Webhook URL</h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>House AIのLINE BotがこのURLにメッセージを転送するよう設定すると、受信履歴がここに記録されます。</p>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 16px', fontFamily: 'monospace', fontSize: 13, color: '#1e293b' }}>
                https://estateflow-ochre.vercel.app/api/line-webhook
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const AUTO_REPLIES = [
  { keyword: '内見', reply: '内見のご希望ありがとうございます！ご希望の日時をお知らせください。担当者よりご連絡いたします。', needsHuman: false },
  { keyword: '資料', reply: '資料請求ありがとうございます！ご希望の物件名をお知らせください。メールにてお送りいたします。', needsHuman: false },
  { keyword: '価格', reply: '価格についてのお問い合わせありがとうございます。詳細はお気軽にご相談ください。', needsHuman: false },
  { keyword: 'こんにちは', reply: 'こんにちは！GINTETSU不動産です。お気軽にご相談ください😊', needsHuman: false },
  { keyword: 'スタッフ', reply: '担当スタッフへ引き継ぎます。少々お待ちください。まもなくご連絡いたします。', needsHuman: true },
  { keyword: '担当者', reply: '担当者へおつなぎします。しばらくお待ちください。', needsHuman: true },
  { keyword: '直接', reply: '直接ご対応いたします。担当者より折り返しご連絡いたします。', needsHuman: true },
  { keyword: '話したい', reply: 'スタッフが直接対応いたします。少々お待ちください。', needsHuman: true },
  { keyword: '電話', reply: 'お電話でのご対応も可能です。担当者よりご連絡いたします。', needsHuman: true },
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
  const [tab, setTab] = useState<'human' | 'inbox' | 'auto' | 'vip'>('human')
  const [autoReplies, setAutoReplies] = useState(AUTO_REPLIES)
  const [newKeyword, setNewKeyword] = useState('')
  const [newReply, setNewReply] = useState('')
  const [newNeedsHuman, setNewNeedsHuman] = useState(false)
  const [staffName, setStaffName] = useState('')
  const [vipUsers, setVipUsers] = useState<any[]>([])
  const [vipUserId, setVipUserId] = useState('')
  const [vipName, setVipName] = useState('')
  const [vipNote, setVipNote] = useState('')
  const [vipStaff, setVipStaff] = useState('')

  const fetchMessages = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('line_messages')
      .select('*')
      .order('created_at', { ascending: false })
    setMessages(data || [])
    setLoading(false)
  }

  const fetchVipUsers = async () => {
    const { data } = await supabase.from('line_vip_users').select('*').order('created_at', { ascending: false })
    setVipUsers(data || [])
  }

  useEffect(() => { fetchMessages(); fetchVipUsers() }, [])

  const humanMessages = messages.filter(m => m.needs_human && m.status !== 'human_handled')

  const handleReply = async (isHuman = false) => {
    if (!replyText.trim() || !selected) return
    setSending(true)
    const update: any = {
      reply_text: replyText,
      replied_at: new Date().toISOString(),
      status: isHuman ? 'human_handled' : 'replied',
    }
    if (isHuman && staffName) {
      update.assigned_to = staffName
      update.human_handled_at = new Date().toISOString()
    }
    await supabase.from('line_messages').update(update).eq('id', selected.id)
    setReplyText('')
    setSelected(null)
    await fetchMessages()
    setSending(false)
  }

  const handleMarkHuman = async (id: number) => {
    await supabase.from('line_messages').update({ needs_human: true, status: 'needs_human' }).eq('id', id)
    await fetchMessages()
  }

  const stats = {
    total: messages.length,
    needsHuman: humanMessages.length,
    humanHandled: messages.filter(m => m.status === 'human_handled').length,
    autoReplied: messages.filter(m => m.is_auto_reply).length,
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
            { label: '🚨 人間対応待ち', value: stats.needsHuman, color: '#dc2626', bg: '#fef2f2' },
            { label: '✅ 対応完了', value: stats.humanHandled, color: '#1a3a5c', bg: '#eff6ff' },
            { label: '🤖 自動返信', value: stats.autoReplied, color: '#c9a84c', bg: '#fefce8' },
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
            { id: 'human', label: `🚨 人間対応待ち${stats.needsHuman > 0 ? ` (${stats.needsHuman})` : ''}` },
            { id: 'inbox', label: '📥 全受信履歴' },
            { id: 'auto', label: '⚙️ 自動返信設定' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              style={{ padding: '8px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: tab === t.id ? 700 : 400, background: tab === t.id ? (t.id === 'human' ? '#dc2626' : '#06C755') : 'transparent', color: tab === t.id ? 'white' : '#374151' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* 人間対応待ちタブ */}
        {tab === 'human' && (
          <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 20 }}>
            <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #fecaca', background: '#fef2f2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 'bold', margin: '0 0 4px', color: '#dc2626' }}>🚨 スタッフ対応が必要なメッセージ</h2>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>「スタッフと話したい」「担当者に繋いで」などのメッセージが届くとここに表示されます</p>
                </div>
                <button onClick={fetchMessages} style={{ background: 'white', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>🔄 更新</button>
              </div>
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>読み込み中...</div>
              ) : humanMessages.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                  <p style={{ fontWeight: 600, color: '#16a34a' }}>対応待ちのメッセージはありません</p>
                  <p style={{ fontSize: 13 }}>お客様から「スタッフと話したい」などが届くとここに表示されます</p>
                </div>
              ) : (
                <div>
                  {humanMessages.map(m => (
                    <div key={m.id}
                      onClick={() => { setSelected(m); setReplyText('') }}
                      style={{ padding: '16px 20px', borderBottom: '1px solid #fee2e2', background: selected?.id === m.id ? '#fff5f5' : 'white', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 40, height: 40, background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>👤</div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{m.display_name || '名前なし'}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(m.created_at).toLocaleString('ja-JP')}</div>
                          </div>
                        </div>
                        <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>要対応</span>
                      </div>
                      <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#374151' }}>
                        {m.message_text}
                      </div>
                      {m.reply_text && (
                        <div style={{ marginTop: 8, background: '#f0fdf4', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#16a34a' }}>
                          自動返信済：{m.reply_text}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* スタッフ対応パネル */}
            {selected && (
              <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', padding: 20, height: 'fit-content', border: '2px solid #fecaca' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 'bold', margin: 0, color: '#dc2626' }}>🚨 スタッフ対応</h3>
                  <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#6b7280' }}>✕</button>
                </div>

                <div style={{ background: '#fef2f2', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: '#dc2626', fontWeight: 700, margin: '0 0 6px' }}>{selected.display_name}からのメッセージ</p>
                  <p style={{ fontSize: 14, color: '#1e293b', margin: 0, lineHeight: 1.6 }}>{selected.message_text}</p>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>対応スタッフ名</label>
                  <input style={inp} placeholder="例：小川" value={staffName} onChange={e => setStaffName(e.target.value)} />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>返信テンプレート（クリックで入力）</label>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                    {[
                      'お問い合わせありがとうございます。担当の者です。詳しくお話を伺えますか？',
                      'ご連絡ありがとうございます。直接ご対応いたします。ご都合の良いお時間をお知らせください。',
                      'スタッフが対応いたします。お電話番号をお教えいただければ、こちらからご連絡いたします。',
                      'ありがとうございます。本日中に担当者よりご連絡いたします。',
                    ].map(t => (
                      <button key={t} onClick={() => setReplyText(t)}
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 10px', cursor: 'pointer', fontSize: 12, textAlign: 'left' as const, color: '#374151', lineHeight: 1.4 }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea style={{ ...inp, minHeight: 90, resize: 'vertical' }}
                  placeholder="返信内容を入力（実際のLINE送信は公式アカウントから）"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                />

                <button onClick={() => handleReply(true)} disabled={sending || !replyText.trim()}
                  style={{ width: '100%', marginTop: 10, padding: '12px', background: sending ? '#9ca3af' : '#dc2626', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 'bold' }}>
                  {sending ? '処理中...' : '✅ 対応完了として記録する'}
                </button>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8, textAlign: 'center' as const }}>※ 実際のLINE返信はLINE公式アカウントから送信してください</p>
              </div>
            )}
          </div>
        )}

        {/* 全受信履歴タブ */}
        {tab === 'inbox' && (
          <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 20 }}>
            <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 16, fontWeight: 'bold', margin: 0 }}>全受信メッセージ</h2>
                <button onClick={fetchMessages} style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>🔄 更新</button>
              </div>
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>読み込み中...</div>
              ) : messages.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                  <p>まだメッセージがありません</p>
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
                      <tr key={m.id} style={{ borderTop: '1px solid #e5e7eb', background: m.needs_human && m.status !== 'human_handled' ? '#fff5f5' : 'white' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13 }}>{m.display_name || '名前なし'}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, maxWidth: 200 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.message_text}</div>
                          {m.needs_human && <span style={{ fontSize: 10, background: '#fef2f2', color: '#dc2626', padding: '1px 6px', borderRadius: 4, marginTop: 2, display: 'inline-block' }}>🚨 人間対応</span>}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                          {new Date(m.created_at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            background: m.status === 'human_handled' ? '#dcfce7' : m.status === 'needs_human' ? '#fef2f2' : m.status === 'replied' ? '#eff6ff' : '#f1f5f9',
                            color: m.status === 'human_handled' ? '#16a34a' : m.status === 'needs_human' ? '#dc2626' : m.status === 'replied' ? '#1d4ed8' : '#475569',
                            padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600
                          }}>
                            {m.status === 'human_handled' ? '✅ 対応済' : m.status === 'needs_human' ? '🚨 要対応' : m.status === 'replied' ? '返信済' : '未返信'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => { setSelected(m); setReplyText('') }}
                              style={{ background: '#06C755', color: 'white', border: 'none', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>返信</button>
                            {!m.needs_human && (
                              <button onClick={() => handleMarkHuman(m.id)}
                                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>要対応</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {selected && (
              <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: 'fit-content' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 'bold', margin: 0 }}>返信記録</h3>
                  <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
                </div>
                <div style={{ background: '#f9fafb', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 13 }}>{selected.message_text}</div>
                <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} placeholder="返信内容..." value={replyText} onChange={e => setReplyText(e.target.value)} />
                <button onClick={() => handleReply(false)} disabled={sending || !replyText.trim()}
                  style={{ width: '100%', marginTop: 8, padding: '10px', background: '#06C755', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 'bold' }}>
                  {sending ? '処理中...' : '記録する'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIP顧客管理タブ */}
        {tab === 'vip' && (
          <div>
            <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#1a3a5c' }}>⭐️ 既存顧客登録（直接人間対応）</h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>登録したLINEユーザーからメッセージが来ると、AIをスキップして直接担当者に通知します。</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>LINE ユーザーID *</label>
                  <input style={inp} value={vipUserId} onChange={e => setVipUserId(e.target.value)} placeholder="Uxxxxxxxxxxxxxxxxx" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>お客様名</label>
                  <input style={inp} value={vipName} onChange={e => setVipName(e.target.value)} placeholder="例：山田 太郎 様" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>担当スタッフ名</label>
                  <input style={inp} value={vipStaff} onChange={e => setVipStaff(e.target.value)} placeholder="例：小川" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>メモ</label>
                  <input style={inp} value={vipNote} onChange={e => setVipNote(e.target.value)} placeholder="例：売却相談中・大宮区の物件" />
                </div>
              </div>
              <button onClick={async () => {
                if (!vipUserId) return alert('LINE ユーザーIDを入力してください')
                await supabase.from('line_vip_users').upsert({
                  user_id: vipUserId,
                  display_name: vipName,
                  assigned_staff: vipStaff,
                  note: vipNote,
                })
                setVipUserId(''); setVipName(''); setVipStaff(''); setVipNote('')
                await fetchVipUsers()
                alert('登録しました！')
              }} style={{ background: '#1a3a5c', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                登録する
              </button>
            </div>
            <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#1a3a5c' }}>登録済み既存顧客一覧</h3>
              {vipUsers.length === 0 ? (
                <p style={{ color: '#9ca3af', textAlign: 'center', padding: 24 }}>登録済みの顧客はいません</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      {['お客様名', 'LINE ID', '担当', 'メモ', '操作'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vipUsers.map(v => (
                      <tr key={v.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{v.display_name || '名前なし'}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280' }}>{v.user_id}</td>
                        <td style={{ padding: '12px 16px' }}>{v.assigned_staff || '-'}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>{v.note || '-'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <button onClick={async () => {
                            if (confirm('削除しますか？')) {
                              await supabase.from('line_vip_users').delete().eq('id', v.id)
                              await fetchVipUsers()
                            }
                          }} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>削除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* 自動返信設定タブ */}
        {tab === 'auto' && (
          <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 'bold', margin: '0 0 12px' }}>⚙️ 自動返信キーワード設定</h2>
            <div style={{ background: '#fef2f2', borderRadius: 8, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: '#dc2626' }}>
              🚨 <strong>人間対応</strong>に設定したキーワードは、自動返信後に「人間対応待ち」タブへ通知されます
            </div>
            <div style={{ display: 'grid', gap: 8, marginBottom: 24 }}>
              {autoReplies.map((ar, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 90px 44px', gap: 10, alignItems: 'center', background: ar.needsHuman ? '#fff5f5' : '#f8fafc', padding: '10px 14px', borderRadius: 8, border: `1px solid ${ar.needsHuman ? '#fecaca' : '#e5e7eb'}` }}>
                  <div style={{ background: ar.needsHuman ? '#fef2f2' : '#e0fce7', color: ar.needsHuman ? '#dc2626' : '#16a34a', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, textAlign: 'center' as const }}>
                    {ar.needsHuman ? '🚨' : '🔑'} {ar.keyword}
                  </div>
                  <div style={{ fontSize: 12, color: '#374151' }}>{ar.reply}</div>
                  <div style={{ fontSize: 11, textAlign: 'center' as const, fontWeight: 600, color: ar.needsHuman ? '#dc2626' : '#16a34a' }}>
                    {ar.needsHuman ? '🚨 人間対応' : '🤖 AI対応'}
                  </div>
                  <button onClick={() => setAutoReplies(prev => prev.filter((_, idx) => idx !== i))}
                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '4px', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>削除</button>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>＋ 新しいキーワードを追加</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 130px 60px', gap: 10, alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>キーワード</label>
                  <input style={inp} placeholder="例：相談したい" value={newKeyword} onChange={e => setNewKeyword(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>自動返信メッセージ</label>
                  <input style={inp} placeholder="返信内容" value={newReply} onChange={e => setNewReply(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>対応タイプ</label>
                  <select style={inp} value={newNeedsHuman ? 'human' : 'auto'} onChange={e => setNewNeedsHuman(e.target.value === 'human')}>
                    <option value="auto">🤖 AI対応</option>
                    <option value="human">🚨 人間対応</option>
                  </select>
                </div>
                <button onClick={() => {
                  if (!newKeyword || !newReply) return
                  setAutoReplies(prev => [...prev, { keyword: newKeyword, reply: newReply, needsHuman: newNeedsHuman }])
                  setNewKeyword(''); setNewReply(''); setNewNeedsHuman(false)
                }} style={{ background: '#06C755', color: 'white', border: 'none', padding: '9px', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>追加</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

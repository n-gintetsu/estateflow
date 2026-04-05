'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function LineBot() {
  useEffect(() => { supabase.auth.getUser().then(({ data }) => { if (!data.user) window.location.href = '/login' }) }, [])
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([{ from: 'bot', text: 'こんにちは！GINTETSU不動産です。物件についてお気軽にお問い合わせください。' }])
  const send = () => {
    if (!input.trim()) return
    const userMsg = { from: 'user', text: input }
    const botReply = { from: 'bot', text: input.includes('物件') ? 'ご希望の物件について詳しくお聞かせください。' : input.includes('内見') ? 'ご希望の日時をお知らせください。' : 'ありがとうございます。担当者よりご連絡いたします。' }
    setMessages(prev => [...prev, userMsg, botReply])
    setInput('')
  }
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ background: '#1e40af', color: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 20, fontWeight: 'bold' }}>💬 LINE Bot シミュレーター</span>
        <button onClick={() => window.location.href = '/dashboard'} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>← ダッシュボード</button>
      </header>
      <main style={{ padding: 32, maxWidth: 500, margin: '0 auto' }}>
        <div style={{ background: '#00B900', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <div style={{ background: '#00A000', padding: '16px 20px', color: 'white', fontWeight: 'bold', textAlign: 'center' }}>GINTETSU不動産 公式LINE</div>
          <div style={{ background: '#f0f0f0', padding: 16, minHeight: 300, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
                <span style={{ background: m.from === 'user' ? '#00B900' : 'white', color: m.from === 'user' ? 'white' : '#333', padding: '10px 14px', borderRadius: 16, maxWidth: '75%', fontSize: 14 }}>{m.text}</span>
              </div>
            ))}
          </div>
          <div style={{ background: 'white', padding: 12, display: 'flex', gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="メッセージを入力" style={{ flex: 1, padding: '10px 14px', borderRadius: 20, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }} />
            <button onClick={send} style={{ background: '#00B900', color: 'white', border: 'none', borderRadius: 20, padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' }}>送信</button>
          </div>
        </div>
      </main>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { supabase } from '../../src/app/lib/supabase'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleReset = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://estateflow.gintetsu-fudosan.co.jp/update-password',
    })
    if (error) {
      setError('送信に失敗しました。メールアドレスを確認してください。')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
      <div style={{ background: 'white', padding: 40, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, background: '#1e40af', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: 20, margin: '0 auto 12px' }}>不</div>
          <h1 style={{ fontSize: 22, fontWeight: 'bold', color: '#1e293b' }}>パスワードリセット</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>登録済みのメールアドレスを入力してください</p>
        </div>
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
            <p style={{ color: '#1e293b', fontWeight: 600, marginBottom: 8 }}>メールを送信しました</p>
            <p style={{ color: '#64748b', fontSize: 13 }}>受信ボックスをご確認ください。メール内のリンクからパスワードを再設定できます。</p>
            <a href="/login" style={{ display: 'block', marginTop: 24, color: '#1e40af', fontSize: 14, textDecoration: 'none' }}>← ログインページに戻る</a>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>メールアドレス</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@gintetsu.co.jp" style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</p>}
            <button onClick={handleReset} disabled={loading || !email} style={{ width: '100%', padding: '12px 0', background: '#1e40af', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              {loading ? '送信中...' : 'リセットメールを送信'}
            </button>
            <a href="/login" style={{ display: 'block', marginTop: 16, textAlign: 'center', color: '#475569', fontSize: 13, textDecoration: 'none' }}>← ログインページに戻る</a>
          </>
        )}
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { supabase } from '../../src/app/lib/supabase'

export default function UpdatePassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpdate = async () => {
    if (password !== confirm) { setError('パスワードが一致しません'); return }
    if (password.length < 8) { setError('パスワードは8文字以上で入力してください'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError('更新に失敗しました。もう一度お試しください。')
    } else {
      setDone(true)
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
      <div style={{ background: 'white', padding: 40, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, background: '#1e40af', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: 20, margin: '0 auto 12px' }}>不</div>
          <h1 style={{ fontSize: 22, fontWeight: 'bold', color: '#1e293b' }}>新しいパスワード設定</h1>
        </div>
        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <p style={{ color: '#1e293b', fontWeight: 600, marginBottom: 8 }}>パスワードを更新しました</p>
            <a href="/login" style={{ display: 'block', marginTop: 24, padding: '12px 0', background: '#1e40af', color: 'white', borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>ログインページへ</a>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>新しいパスワード</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="8文字以上" style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>パスワード確認</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="もう一度入力" style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</p>}
            <button onClick={handleUpdate} disabled={loading || !password || !confirm} style={{ width: '100%', padding: '12px 0', background: '#1e40af', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              {loading ? '更新中...' : 'パスワードを更新する'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

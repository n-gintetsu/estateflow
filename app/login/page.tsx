'use client'
import { useState } from 'react'
import { supabase } from '../../src/app/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('メールアドレスまたはパスワードが正しくありません')
    } else {
      await new Promise(r => setTimeout(r, 2000))
      window.location.href = '/dashboard'
    }
    setLoading(false)
  }

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#f8fafc' }}>
      <div style={{ background:'white', padding:40, borderRadius:16, boxShadow:'0 4px 20px rgba(0,0,0,0.1)', width:360 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:48, height:48, background:'#1e40af', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'bold', fontSize:20, margin:'0 auto 12px' }}>不</div>
          <h1 style={{ fontSize:22, fontWeight:'bold', color:'#1e293b' }}>EstateFlow</h1>
          <p style={{ color:'#64748b', fontSize:14 }}>スタッフ専用ログイン</p>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:6 }}>メールアドレス</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@gintetsu.co.jp" style={{ width:'100%', padding:'10px 14px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box' }} />
        </div>
        <div style={{ marginBottom:24 }}>
          <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:6 }}>パスワード</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="パスワードを入力" style={{ width:'100%', padding:'10px 14px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box' }} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>
        {error && <p style={{ color:'#ef4444', fontSize:13, marginBottom:16, textAlign:'center' }}>{error}</p>}
        <button onClick={handleLogin} disabled={loading} style={{ width:'100%', padding:'12px 0', background:'#1e40af', color:'white', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer' }}>
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <a href="/reset-password" style={{ color: '#475569', fontSize: 13, textDecoration: 'none' }}>パスワードをお忘れの方はこちら</a>
      </div>
      </div>
    </div>
  )
}
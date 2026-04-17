'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type StaffUser = {
  id: string
  email: string
  name: string
  role: 'admin' | 'staff'
  is_active: boolean
  created_at: string
}

const emptyForm = { email: '', name: '', role: 'staff' as 'admin' | 'staff', password: '' }

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
    })
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    setLoading(true)
    const { data } = await supabase.from('staff_users').select('*').order('created_at')
    setStaffList(data || [])
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!form.email || !form.name || !form.password) {
      setMsg('⚠️ 全項目を入力してください')
      return
    }
    if (form.password.length < 8) {
      setMsg('⚠️ パスワードは8文字以上で入力してください')
      return
    }
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/create-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, name: form.name, role: form.role, password: form.password }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || '追加に失敗しました')
      setMsg('✅ スタッフを追加しました！')
      setForm(emptyForm)
      setShowForm(false)
      fetchStaff()
    } catch (e: any) {
      setMsg('❌ エラー: ' + e.message)
    }
    setSaving(false)
  }

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('staff_users').update({ is_active: !current }).eq('id', id)
    fetchStaff()
  }

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`${email} を削除しますか？`)) return
    await supabase.from('staff_users').delete().eq('id', id)
    fetchStaff()
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a3a5c', margin: 0 }}>👥 スタッフ管理</h1>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>EstateFlowにアクセスできるスタッフを管理します</p>
        </div>
        <button onClick={() => { setShowForm(true); setMsg('') }}
          style={{ background: '#1a3a5c', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          ＋ スタッフ追加
        </button>
      </div>

      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 16, background: msg.startsWith('✅') ? '#f0fdf4' : msg.startsWith('⚠️') ? '#fffbeb' : '#fef2f2', color: msg.startsWith('✅') ? '#166534' : msg.startsWith('⚠️') ? '#92400e' : '#991b1b', fontSize: 14 }}>
          {msg}
        </div>
      )}

      {showForm && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a3a5c', marginTop: 0, marginBottom: 20 }}>新規スタッフ追加</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={lbl}>名前 <span style={{ color: '#ef4444' }}>*</span></label>
              <input style={inp} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="例：田中太郎" />
            </div>
            <div>
              <label style={lbl}>メールアドレス <span style={{ color: '#ef4444' }}>*</span></label>
              <input style={inp} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="例：tanaka@gintetsu-fudosan.co.jp" />
            </div>
            <div>
              <label style={lbl}>初期パスワード <span style={{ color: '#ef4444' }}>*</span></label>
              <input style={inp} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="8文字以上" />
            </div>
            <div>
              <label style={lbl}>権限</label>
              <select style={inp} value={form.role} onChange={e => setForm({ ...form, role: e.target.value as 'admin' | 'staff' })}>
                <option value="staff">一般スタッフ</option>
                <option value="admin">管理者</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handleAdd} disabled={saving}
              style={{ background: saving ? '#9ca3af' : '#1a3a5c', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? '追加中...' : '✓ 追加する'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(emptyForm); setMsg('') }}
              style={{ background: '#f1f5f9', color: '#374151', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>
              キャンセル
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>読み込み中...</p>
      ) : (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#374151' }}>名前</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#374151' }}>メールアドレス</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#374151' }}>権限</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#374151' }}>ステータス</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#374151' }}>登録日</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#374151' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((s, idx) => (
                <tr key={s.id} style={{ borderBottom: idx < staffList.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: '#1a3a5c' }}>{s.name}</td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: '#374151' }}>{s.email}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: s.role === 'admin' ? '#fef3c7' : '#f0f9ff', color: s.role === 'admin' ? '#b45309' : '#0369a1', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      {s.role === 'admin' ? '👑 管理者' : '👤 スタッフ'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: s.is_active ? '#f0fdf4' : '#f1f5f9', color: s.is_active ? '#166534' : '#6b7280', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      {s.is_active ? '✅ 有効' : '⏸ 無効'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#6b7280' }}>
                    {new Date(s.created_at).toLocaleDateString('ja-JP')}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => toggleActive(s.id, s.is_active)}
                        style={{ background: s.is_active ? '#fef3c7' : '#f0fdf4', color: s.is_active ? '#b45309' : '#166534', border: 'none', padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                        {s.is_active ? '無効化' : '有効化'}
                      </button>
                      <button onClick={() => handleDelete(s.id, s.email)}
                        style={{ background: '#fef2f2', color: '#991b1b', border: 'none', padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

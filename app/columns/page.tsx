'use client'
import Sidebar from '../layout-sidebar'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ColumnsPage() {
  const [columns, setColumns] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ title: '', content: '', category: '', published: false })
  const [msg, setMsg] = useState('')

  const fetch = async () => {
    const { data } = await supabase.from('columns').select('*').order('created_at', { ascending: false })
    setColumns(data || [])
  }

  useEffect(() => { fetch() }, [])

  const save = async () => {
    if (!form.title || !form.content) { setMsg('タイトルと本文は必須です'); return }
    if (editId) {
      await supabase.from('columns').update({ ...form }).eq('id', editId)
    } else {
      await supabase.from('columns').insert({ ...form, slug: crypto.randomUUID() })
    }
    setForm({ title: '', content: '', category: '', published: false })
    setEditId(null)
    setShowForm(false)
    setMsg('✅ 保存しました！')
    fetch()
    setTimeout(() => setMsg(''), 3000)
  }

  const edit = (col: any) => {
    setForm({ title: col.title, content: col.content, category: col.category || '', published: col.published })
    setEditId(col.id)
    setShowForm(true)
    window.scrollTo(0, 0)
  }

  const del = async (id: number) => {
    if (!confirm('削除しますか？')) return
    await supabase.from('columns').delete().eq('id', id)
    fetch()
  }

  return (
    <div style={{ display: 'flex' }}>
    <Sidebar />
    <div style={{ flex: 1, padding: 24 }} style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>コラム管理</h1>
          <p style={{ color: '#666', margin: '4px 0 0' }}>GINTETSUサイトのコラム記事を管理します</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ title: '', content: '', category: '', published: false }) }}
          style={{ background: '#1a3a5c', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>
          ＋ 新規作成
        </button>
      </div>

      {msg && <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '10px 16px', borderRadius: 8, marginBottom: 16 }}>{msg}</div>}

      {showForm && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>{editId ? 'コラム編集' : '新規コラム作成'}</h2>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13 }}>タイトル *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
              placeholder="記事タイトルを入力" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13 }}>カテゴリ</label>
            <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
              placeholder="例：相続、空家、不動産売買" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13 }}>本文 *</label>
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', resize: 'vertical', minHeight: 300 }}
              placeholder="記事本文を入力（Markdown対応）" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <input type="checkbox" id="published" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} />
            <label htmlFor="published" style={{ fontSize: 14, cursor: 'pointer' }}>公開する</label>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setShowForm(false); setEditId(null) }}
              style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 14 }}>
              キャンセル
            </button>
            <button onClick={save}
              style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#1a3a5c', color: 'white', cursor: 'pointer', fontSize: 14 }}>
              保存する
            </button>
          </div>
        </div>
      )}

      {columns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
          <p>コラム記事がまだありません</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {columns.map(col => (
            <div key={col.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 'bold', fontSize: 16 }}>{col.title}</span>
                  {col.published && <span style={{ background: '#e8f5e9', color: '#2e7d32', fontSize: 11, padding: '2px 8px', borderRadius: 20 }}>公開中</span>}
                  {!col.published && <span style={{ background: '#f5f5f5', color: '#999', fontSize: 11, padding: '2px 8px', borderRadius: 20 }}>下書き</span>}
                  {col.category && <span style={{ background: '#e3f2fd', color: '#1565c0', fontSize: 11, padding: '2px 8px', borderRadius: 20 }}>{col.category}</span>}
                </div>
                <p style={{ color: '#666', fontSize: 13, margin: 0 }}>{col.content?.slice(0, 60)}...</p>
                <p style={{ color: '#999', fontSize: 12, margin: '4px 0 0' }}>{new Date(col.created_at).toLocaleDateString('ja-JP')}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => edit(col)}
                  style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 13 }}>編集</button>
                <button onClick={() => del(col.id)}
                  style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#fee2e2', color: '#991b1b', cursor: 'pointer', fontSize: 13 }}>削除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
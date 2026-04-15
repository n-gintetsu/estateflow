'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AgentDocsPage() {
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', file_url: '', sort_order: 0 })
  const [editItem, setEditItem] = useState<any>(null)
  const [msg, setMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
    })
    fetchDocs()
  }, [])

  const fetchDocs = async () => {
    const { data } = await supabase.from('agent_documents').select('*').order('sort_order').order('created_at')
    setDocs(data || [])
    setLoading(false)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const fileName = `agent-docs/${Date.now()}-${safeName}`
    const { data, error } = await supabase.storage.from('property-images').upload(fileName, file)
    if (error) { setMsg('アップロードエラー: ' + error.message); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('property-images').getPublicUrl(fileName)
    setForm(f => ({ ...f, file_url: urlData.publicUrl }))
    setUploading(false)
    setMsg('ファイルをアップロードしました')
    setTimeout(() => setMsg(''), 3000)
  }

  const handleSave = async () => {
    if (!form.title || !form.file_url) { setMsg('タイトルとファイルは必須です'); return }
    if (editItem) {
      await supabase.from('agent_documents').update(form).eq('id', editItem.id)
    } else {
      const { error } = await supabase.from('agent_documents').insert([{ ...form, is_active: true }])
      if (error) { setMsg('保存エラー: ' + error.message); return }
    }
    setShowForm(false); setEditItem(null)
    setForm({ title: '', description: '', file_url: '', sort_order: 0 })
    fetchDocs()
    setMsg('保存しました')
    setTimeout(() => setMsg(''), 3000)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('削除しますか？')) return
    await supabase.from('agent_documents').delete().eq('id', id)
    fetchDocs()
  }

  const handleToggle = async (id: string, current: boolean) => {
    await supabase.from('agent_documents').update({ is_active: !current }).eq('id', id)
    fetchDocs()
  }

  const inp = { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' as const }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a3a5c', margin: 0 }}>📂 各種書類管理</h1>
        <button onClick={() => { setShowForm(true); setEditItem(null); setForm({ title: '', description: '', file_url: '', sort_order: 0 }) }}
          style={{ background: '#1a3a5c', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>
          ＋ 書類を追加
        </button>
      </div>

      {msg && <div style={{ background: '#d1fae5', color: '#065f46', padding: '10px 16px', borderRadius: 6, marginBottom: 16 }}>{msg}</div>}

      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
        ここで管理した書類は仲介業者ポータルの「各種書類」ボタンから閲覧・ダウンロードできます。
      </p>

      {loading ? <p>読み込み中...</p> : (
        <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {docs.length === 0 ? (
            <p style={{ padding: 24, color: '#9ca3af', textAlign: 'center' }}>書類がまだ登録されていません</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#374151' }}>順番</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#374151' }}>書類名</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#374151' }}>説明</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#374151' }}>公開</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', color: '#374151' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {docs.map(doc => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 16px' }}>{doc.sort_order}</td>
                    <td style={{ padding: '10px 16px', fontWeight: 600 }}>
                      <a href={doc.file_url} target="_blank" rel="noreferrer" style={{ color: '#1a3a5c', textDecoration: 'none' }}>
                        📄 {doc.title}
                      </a>
                    </td>
                    <td style={{ padding: '10px 16px', color: '#6b7280', fontSize: 12 }}>{doc.description || '—'}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span onClick={() => handleToggle(doc.id, doc.is_active)}
                        style={{ cursor: 'pointer', padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: doc.is_active ? '#dcfce7' : '#fee2e2', color: doc.is_active ? '#166534' : '#991b1b' }}>
                        {doc.is_active ? '公開中' : '非公開'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { setEditItem(doc); setForm({ title: doc.title, description: doc.description || '', file_url: doc.file_url, sort_order: doc.sort_order }); setShowForm(true) }}
                          style={{ padding: '4px 12px', background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>編集</button>
                        <button onClick={() => handleDelete(doc.id)}
                          style={{ padding: '4px 12px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>削除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 32, width: '100%', maxWidth: 500 }}>
            <h3 style={{ color: '#1a3a5c', marginTop: 0, marginBottom: 20 }}>{editItem ? '書類を編集' : '書類を追加'}</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>書類名 <span style={{ color: 'red' }}>必須</span></label>
              <input style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="例：買付申込書" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>説明（任意）</label>
              <input style={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="例：売買物件の買付申込書" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>PDFファイル <span style={{ color: 'red' }}>必須</span></label>
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleUpload} />
              <button onClick={() => fileRef.current?.click()}
                style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12, cursor: 'pointer', marginBottom: 8 }}>
                📎 PDFを選択
              </button>
              {uploading && <span style={{ marginLeft: 8, fontSize: 12, color: '#6b7280' }}>アップロード中...</span>}
              {form.file_url && <div style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>✅ ファイル設定済み <a href={form.file_url} target="_blank" rel="noreferrer" style={{ color: '#1a3a5c' }}>確認</a></div>}
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>表示順（数字が小さいほど上に表示）</label>
              <input type="number" style={{ ...inp, width: 100 }} value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setShowForm(false); setEditItem(null) }} style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>キャンセル</button>
              <button onClick={handleSave} style={{ flex: 1, padding: '10px', background: '#1a3a5c', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

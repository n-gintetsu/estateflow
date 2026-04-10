'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DocumentsPage() {
  const [docs, setDocs] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', category: 'application', file_url: '' })
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')

  const fetchDocs = async () => {
    const { data } = await supabase.from('agent_documents').select('*').order('created_at', { ascending: false })
    setDocs(data || [])
  }

  useEffect(() => { fetchDocs() }, [])

  const handleUpload = async () => {
    if (!file || !form.title) { setMsg('❌ タイトルとファイルは必須です'); return }
    setUploading(true)
    const fileName = `docs/${Date.now()}_${file.name}`
    const { error: upErr } = await supabase.storage.from('property-images').upload(fileName, file, { contentType: 'application/pdf' })
    if (upErr) { setMsg('❌ アップロード失敗: ' + upErr.message); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('property-images').getPublicUrl(fileName)
    const { error } = await supabase.from('agent_documents').insert([{ ...form, file_url: urlData.publicUrl }])
    if (error) { setMsg('❌ 保存失敗: ' + error.message) } else { setMsg('✅ 登録しました！'); setShowForm(false); setForm({ title: '', description: '', category: 'application', file_url: '' }); setFile(null); fetchDocs() }
    setUploading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return
    await supabase.from('agent_documents').delete().eq('id', id)
    fetchDocs()
  }

  const categoryLabel = (c: string) => ({ application: '📋 申込書', explanation: '📄 重要事項説明書', contract: '📝 契約書', other: '📁 その他' }[c] || c)

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ background: '#1a3a5c', color: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>📋 書類管理</h1>
        <a href="/dashboard" style={{ color: 'white', fontSize: 14 }}>← ダッシュボード</a>
      </header>
      <main style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
        {msg && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#166534' }}>{msg}</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: '#1a3a5c' }}>仲介業者向け書類一覧</h2>
          <button onClick={() => setShowForm(!showForm)} style={{ background: '#1a3a5c', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>+ 書類を追加</button>
        </div>
        {showForm && (
          <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ marginBottom: 12 }}><label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>書類タイトル *</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, marginTop: 4, boxSizing: 'border-box' as const }} /></div>
            <div style={{ marginBottom: 12 }}><label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>カテゴリ</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, marginTop: 4 }}><option value="application">📋 申込書</option><option value="explanation">📄 重要事項説明書</option><option value="contract">📝 契約書</option><option value="other">📁 その他</option></select></div>
            <div style={{ marginBottom: 12 }}><label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>説明</label><input value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, marginTop: 4, boxSizing: 'border-box' as const }} /></div>
            <div style={{ marginBottom: 16 }}><label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>PDFファイル *</label><input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} style={{ display: 'block', marginTop: 4 }} /></div>
            <button onClick={handleUpload} disabled={uploading} style={{ background: '#1a3a5c', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>{uploading ? 'アップロード中...' : '✅ 登録する'}</button>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {docs.length === 0 ? <p style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>書類がまだ登録されていません</p> : docs.map(doc => (
            <div key={doc.id} style={{ background: 'white', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, color: '#1a3a5c', marginBottom: 4 }}>{categoryLabel(doc.category)} {doc.title}</div>
                {doc.description && <div style={{ fontSize: 13, color: '#6b7280' }}>{doc.description}</div>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href={doc.file_url} target="_blank" rel="noreferrer" style={{ background: '#e8f4fd', color: '#1a3a5c', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>📥 確認</a>
                <button onClick={() => handleDelete(doc.id)} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>削除</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

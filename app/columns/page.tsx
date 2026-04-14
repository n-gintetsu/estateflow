'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../src/app/lib/supabase'

export default function ColumnsPage() {
  const [columns, setColumns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', category: '', published: false })
  const [editId, setEditId] = useState<string | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const thumbnailRef = useRef<HTMLInputElement>(null)
  const imagesRef = useRef<HTMLInputElement>(null)

  const fetch = async () => {
    setLoading(true)
    const { data } = await supabase.from('columns').select('*').order('created_at', { ascending: false })
    if (data) setColumns(data)
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const handleThumbnailDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setThumbnailFile(file)
      setThumbnailPreview(URL.createObjectURL(file))
    }
  }

  const handleImagesDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    setImageFiles(prev => [...prev, ...files])
    setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
  }

  const uploadImage = async (file: File, folder: string) => {
    const ext = file.name.split('.').pop()
    const path = `${folder}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('column-images').upload(path, file)
    if (error) throw error
    const { data } = supabase.storage.from('column-images').getPublicUrl(path)
    return data.publicUrl
  }

  const generateAiThumbnail = async () => {
    if (!form.title) return alert('先にタイトルを入力してください')
    setAiGenerating(true)
    try {
      const res = await window.fetch('/api/generate-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, category: form.category }),
      })
      const data = await res.json()
      if (data.url) {
        setThumbnailPreview(data.url)
        setThumbnailFile(null)
      }
    } catch {
      alert('AI生成に失敗しました')
    }
    setAiGenerating(false)
  }

  const save = async () => {
    if (!form.title || !form.content) return alert('タイトルと本文は必須です')
    setUploading(true)
    try {
      let thumbnailUrl = thumbnailPreview
      if (thumbnailFile) thumbnailUrl = await uploadImage(thumbnailFile, 'thumbnails')
      const imageUrls: string[] = []
      for (const file of imageFiles) {
        const url = await uploadImage(file, 'images')
        imageUrls.push(url)
      }
      const payload = { ...form, thumbnail_url: thumbnailUrl || null, images: imageUrls }
      if (editId) {
        await supabase.from('columns').update(payload).eq('id', editId)
      } else {
        await supabase.from('columns').insert({ ...payload, slug: crypto.randomUUID() })
      }
      resetForm()
      fetch()
    } catch (e) {
      alert('保存に失敗しました')
    }
    setUploading(false)
  }

  const resetForm = () => {
    setForm({ title: '', content: '', category: '', published: false })
    setEditId(null)
    setShowForm(false)
    setThumbnailFile(null)
    setThumbnailPreview('')
    setImageFiles([])
    setImagePreviews([])
  }

  const edit = (col: any) => {
    setForm({ title: col.title, content: col.content, category: col.category || '', published: col.published })
    setEditId(col.id)
    setThumbnailPreview(col.thumbnail_url || '')
    setImagePreviews(col.images || [])
    setShowForm(true)
  }

  const del = async (id: string) => {
    if (!confirm('削除しますか？')) return
    await supabase.from('columns').delete().eq('id', id)
    fetch()
  }

  const inp = { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, width: '100%', boxSizing: 'border-box' as const }

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b' }}>コラム管理</h1>
        <button onClick={() => setShowForm(true)} style={{ background: '#1a3a5c', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>＋ 新規作成</button>
      </div>

      {showForm && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>{editId ? '編集' : '新規作成'}</h2>
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: 4 }}>タイトル *</label>
              <input style={inp} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="コラムタイトル" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: 4 }}>カテゴリ</label>
              <select style={inp} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="">選択してください</option>
                {['不動産売買', '不動産投資', 'リースバック', '空家対策', '遺品整理', '税金・法律', 'その他'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: 4 }}>本文 *</label>
              <textarea style={{ ...inp, minHeight: 200 }} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="コラム本文" />
            </div>

            {/* サムネイル */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: 8 }}>サムネイル画像</label>
              <div
                onDrop={handleThumbnailDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => thumbnailRef.current?.click()}
                style={{ border: '2px dashed #cbd5e1', borderRadius: 8, padding: 24, textAlign: 'center', cursor: 'pointer', background: '#f8fafc', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}
              >
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} style={{ maxHeight: 150, borderRadius: 8 }} />
                ) : (
                  <>
                    <div style={{ fontSize: 32 }}>🖼️</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>ドラッグ&ドロップ または クリックして画像を選択</div>
                  </>
                )}
              </div>
              <input ref={thumbnailRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setThumbnailFile(f); setThumbnailPreview(URL.createObjectURL(f)) } }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {thumbnailPreview && <button onClick={() => { setThumbnailPreview(''); setThumbnailFile(null) }} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>削除</button>}
                <button onClick={generateAiThumbnail} disabled={aiGenerating} style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                  {aiGenerating ? 'AI生成中...' : '✨ AIでサムネイル生成'}
                </button>
              </div>
            </div>

            {/* 本文写真 */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: 8 }}>本文写真（複数可）</label>
              <div
                onDrop={handleImagesDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => imagesRef.current?.click()}
                style={{ border: '2px dashed #cbd5e1', borderRadius: 8, padding: 24, textAlign: 'center', cursor: 'pointer', background: '#f8fafc', minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}
              >
                <div style={{ fontSize: 32 }}>📷</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>ドラッグ&ドロップ または クリックして写真を追加</div>
              </div>
              <input ref={imagesRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => { const files = Array.from(e.target.files || []); setImageFiles(prev => [...prev, ...files]); setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]) }} />
              {imagePreviews.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {imagePreviews.map((url, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={url} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                      <button onClick={() => { setImageFiles(prev => prev.filter((_, j) => j !== i)); setImagePreviews(prev => prev.filter((_, j) => j !== i)) }} style={{ position: 'absolute', top: -6, right: -6, background: '#dc2626', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 11 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="published" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} />
              <label htmlFor="published" style={{ fontSize: 14 }}>公開する</label>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={save} disabled={uploading} style={{ background: '#1a3a5c', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
                {uploading ? '保存中...' : '保存'}
              </button>
              <button onClick={resetForm} style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>キャンセル</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <p>読み込み中...</p> : (
        <div style={{ display: 'grid', gap: 12 }}>
          {columns.length === 0 ? <p style={{ color: '#94a3b8' }}>コラムはありません</p> : columns.map(col => (
            <div key={col.id} style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              {col.thumbnail_url && <img src={col.thumbnail_url} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 'bold', color: '#1e293b' }}>{col.title}</span>
                  <span style={{ fontSize: 11, background: col.published ? '#dcfce7' : '#f1f5f9', color: col.published ? '#16a34a' : '#64748b', padding: '2px 8px', borderRadius: 10 }}>{col.published ? '公開中' : '下書き'}</span>
                  {col.category && <span style={{ fontSize: 11, background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 10 }}>{col.category}</span>}
                </div>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{col.content?.substring(0, 80)}...</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => edit(col)} style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>✏️ 編集</button>
                <button onClick={() => del(col.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>削除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

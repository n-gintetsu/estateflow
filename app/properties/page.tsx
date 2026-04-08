'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const emptyForm = {
  name: '',
  address: '',
  price: '',
  area: '',
  rooms: '',
  floor: '',
  total_floors: '',
  building_type: '',
  nearest_station: '',
  walk_minutes: '',
  management_fee: '',
  description: '',
  status: 'available',
  published: true,
}

export default function Properties() {
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/login'
    })
  }, [])

  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const fetchProperties = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchProperties() }, [])

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  // 写真選択
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploadFiles(prev => [...prev, ...files])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setUploadPreviews(prev => [...prev, ev.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  // 写真削除（プレビューから）
  const removePhoto = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index))
    setUploadPreviews(prev => prev.filter((_, i) => i !== index))
  }

  // 写真をSupabase Storageにアップロード
  const uploadImages = async (): Promise<string[]> => {
    if (uploadFiles.length === 0) return []
    setUploading(true)
    const urls: string[] = []
    for (const file of uploadFiles) {
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage
        .from('property-images')
        .upload(fileName, file, { contentType: file.type })
      if (!error) {
        const { data } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName)
        urls.push(data.publicUrl)
      }
    }
    setUploading(false)
    return urls
  }

  const handleSubmit = async () => {
    if (!form.name || !form.address) {
      setMsg('❌ 物件名と住所は必須です')
      return
    }
    setSaving(true)
    setMsg('')

    // 写真アップロード
    const imageUrls = await uploadImages()

    const payload = {
      name: form.name,
      address: form.address,
      price: form.price ? Number(form.price) : null,
      area: form.area ? Number(form.area) : null,
      rooms: form.rooms || null,
      floor: form.floor ? Number(form.floor) : null,
      total_floors: form.total_floors ? Number(form.total_floors) : null,
      building_type: form.building_type || null,
      nearest_station: form.nearest_station || null,
      walk_minutes: form.walk_minutes ? Number(form.walk_minutes) : null,
      management_fee: form.management_fee ? Number(form.management_fee) : null,
      description: form.description || null,
      status: form.status,
      published: form.published,
      images: imageUrls.length > 0 ? imageUrls : null,
    }
    const { error } = await supabase.from('properties').insert([payload])
    if (error) {
      setMsg(`❌ エラー: ${error.message}`)
    } else {
      setMsg('✅ 登録しました！')
      setForm({ ...emptyForm })
      setUploadFiles([])
      setUploadPreviews([])
      setShowForm(false)
      fetchProperties()
    }
    setSaving(false)
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return
    const { error } = await supabase.from('properties').delete().eq('id', id)
    if (error) alert('削除に失敗しました')
    else fetchProperties()
  }

  const statusLabel = (s: string) => {
    if (s === 'sold') return { text: '成約済', bg: '#f1f5f9', color: '#475569' }
    if (s === 'pending') return { text: '商談中', bg: '#fef9c3', color: '#ca8a04' }
    return { text: '販売中', bg: '#dcfce7', color: '#16a34a' }
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', border: '1px solid #d1d5db',
    borderRadius: 6, fontSize: 14, fontFamily: 'inherit',
    background: 'white', boxSizing: 'border-box' as const,
  }
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ background: '#1e40af', color: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 20, fontWeight: 'bold' }}>🏠 物件管理</span>
        <button onClick={() => window.location.href = '/dashboard'} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>← ダッシュボード</button>
      </header>

      <main style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#1e293b', margin: 0 }}>物件一覧</h2>
          <button
            onClick={() => { setShowForm(!showForm); setMsg('') }}
            style={{ background: '#1e40af', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 'bold' }}
          >
            {showForm ? '✕ キャンセル' : '＋ 新規物件登録'}
          </button>
        </div>

        {msg && <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: msg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', color: msg.startsWith('✅') ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{msg}</div>}

        {/* 新規登録フォーム */}
        {showForm && (
          <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 28, border: '2px solid #1e40af' }}>
            <h3 style={{ fontSize: 16, fontWeight: 'bold', color: '#1e40af', marginTop: 0, marginBottom: 20 }}>📝 新規物件登録</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>物件名 <span style={{ color: '#ef4444' }}>必須</span></label>
                <input style={inputStyle} name="name" value={form.name} onChange={handleChange} placeholder="例：パークタワー渋谷" />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>住所 <span style={{ color: '#ef4444' }}>必須</span></label>
                <input style={inputStyle} name="address" value={form.address} onChange={handleChange} placeholder="例：東京都渋谷区道玄坂１－１－１" />
              </div>

              <div>
                <label style={labelStyle}>価格（万円）</label>
                <input style={inputStyle} type="number" name="price" value={form.price} onChange={handleChange} placeholder="例：9080" />
              </div>

              <div>
                <label style={labelStyle}>面積（㎡）</label>
                <input style={inputStyle} type="number" name="area" value={form.area} onChange={handleChange} placeholder="例：45.2" />
              </div>

              <div>
                <label style={labelStyle}>間取り</label>
                <input style={inputStyle} name="rooms" value={form.rooms} onChange={handleChange} placeholder="例：1LDK" />
              </div>

              <div>
                <label style={labelStyle}>建物種別</label>
                <select style={inputStyle} name="building_type" value={form.building_type} onChange={handleChange}>
                  <option value="">選択してください</option>
                  <option>マンション</option>
                  <option>一戸建て</option>
                  <option>土地</option>
                  <option>収益物件</option>
                  <option>RC造</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>階数</label>
                <input style={inputStyle} type="number" name="floor" value={form.floor} onChange={handleChange} placeholder="例：8" />
              </div>

              <div>
                <label style={labelStyle}>総階数</label>
                <input style={inputStyle} type="number" name="total_floors" value={form.total_floors} onChange={handleChange} placeholder="例：15" />
              </div>

              <div>
                <label style={labelStyle}>最寄り駅</label>
                <input style={inputStyle} name="nearest_station" value={form.nearest_station} onChange={handleChange} placeholder="例：渋谷駅" />
              </div>

              <div>
                <label style={labelStyle}>徒歩（分）</label>
                <input style={inputStyle} type="number" name="walk_minutes" value={form.walk_minutes} onChange={handleChange} placeholder="例：5" />
              </div>

              <div>
                <label style={labelStyle}>管理費（円/月）</label>
                <input style={inputStyle} type="number" name="management_fee" value={form.management_fee} onChange={handleChange} placeholder="例：15000" />
              </div>

              <div>
                <label style={labelStyle}>ステータス</label>
                <select style={inputStyle} name="status" value={form.status} onChange={handleChange}>
                  <option value="available">販売中</option>
                  <option value="pending">商談中</option>
                  <option value="sold">成約済</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>説明文</label>
                <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} name="description" value={form.description} onChange={handleChange} placeholder="物件の説明・セールスポイントを入力" />
              </div>

              {/* 写真アップロード */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>物件写真（複数選択可）</label>
                <div style={{
                  border: '2px dashed #d1d5db', borderRadius: 8, padding: 20,
                  textAlign: 'center', background: '#f9fafb', cursor: 'pointer',
                  transition: 'border-color 0.2s'
                }}
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
                    if (files.length === 0) return
                    setUploadFiles(prev => [...prev, ...files])
                    files.forEach(file => {
                      const reader = new FileReader()
                      reader.onload = (ev) => setUploadPreviews(prev => [...prev, ev.target?.result as string])
                      reader.readAsDataURL(file)
                    })
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                  <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>クリックまたはドラッグ＆ドロップで写真を追加</p>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>JPG・PNG・WebP対応（複数選択可）</p>
                </div>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />

                {/* プレビュー */}
                {uploadPreviews.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10, marginTop: 12 }}>
                    {uploadPreviews.map((preview, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img
                          src={preview}
                          alt={`写真${i + 1}`}
                          style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }}
                        />
                        <button
                          onClick={() => removePhoto(i)}
                          style={{
                            position: 'absolute', top: 4, right: 4,
                            background: 'rgba(239,68,68,0.9)', color: 'white',
                            border: 'none', borderRadius: '50%', width: 22, height: 22,
                            cursor: 'pointer', fontSize: 12, display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                          }}
                        >✕</button>
                        {i === 0 && (
                          <span style={{
                            position: 'absolute', bottom: 4, left: 4,
                            background: '#1e40af', color: 'white',
                            fontSize: 10, padding: '2px 6px', borderRadius: 4
                          }}>メイン</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" name="published" checked={form.published} onChange={handleChange} id="published" />
                <label htmlFor="published" style={{ fontSize: 14, color: '#374151', cursor: 'pointer' }}>公開する（GINTETSUサイトに表示）</label>
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
              <button
                onClick={handleSubmit}
                disabled={saving || uploading}
                style={{ background: (saving || uploading) ? '#9ca3af' : '#1e40af', color: 'white', border: 'none', padding: '12px 28px', borderRadius: 8, cursor: (saving || uploading) ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 'bold' }}
              >
                {uploading ? '写真アップロード中...' : saving ? '登録中...' : '✓ 登録する'}
              </button>
              <button
                onClick={() => { setShowForm(false); setForm({ ...emptyForm }); setUploadFiles([]); setUploadPreviews([]); setMsg('') }}
                style={{ background: '#f1f5f9', color: '#374151', border: 'none', padding: '12px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
              >
                キャンセル
              </button>
              {uploadPreviews.length > 0 && (
                <span style={{ fontSize: 13, color: '#6b7280' }}>📷 {uploadPreviews.length}枚選択中</span>
              )}
            </div>
          </div>
        )}

        {/* 物件一覧テーブル */}
        <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>読み込み中...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏠</div>
              <p>物件がまだ登録されていません</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  {['写真', '物件名', '住所', '価格', '間取り', '最寄り駅', 'ステータス', '公開', '操作'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#475569', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(i => {
                  const s = statusLabel(i.status)
                  const thumb = Array.isArray(i.images) && i.images.length > 0 ? i.images[0] : null
                  return (
                    <tr key={i.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 16px' }}>
                        {thumb ? (
                          <img src={thumb} alt="" style={{ width: 60, height: 44, objectFit: 'cover', borderRadius: 6 }} />
                        ) : (
                          <div style={{ width: 60, height: 44, background: '#f1f5f9', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏠</div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b' }}>{i.name}</td>
                      <td style={{ padding: '14px 16px', color: '#64748b', fontSize: 13 }}>{i.address}</td>
                      <td style={{ padding: '14px 16px', color: '#1e40af', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {i.price ? `${i.price.toLocaleString()}万円` : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748b' }}>{i.rooms || '—'}</td>
                      <td style={{ padding: '14px 16px', color: '#64748b', fontSize: 13 }}>
                        {i.nearest_station ? `${i.nearest_station} 徒歩${i.walk_minutes || '?'}分` : '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{s.text}</span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {i.published ? '✅' : '🔒'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => handleDelete(i.id, i.name)}
                          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}

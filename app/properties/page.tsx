'use client'
import QRCode from 'react-qr-code'
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
  floor_plan_url: '',
  visibility: 'public',
  viewing_method: '', staff_name: '', staff_phone: '',
  staff_email: '', keybox_code: '', keybox_location: ''
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
  const [editItem, setEditItem] = useState<any>(null)
  const [qrItem, setQrItem] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [floorPlanFile, setFloorPlanFile] = useState<File|null>(null)
  const [floorPlanPreview, setFloorPlanPreview] = useState<string>('')
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [pdfFiles, setPdfFiles] = useState<File[]>([])
  const [pdfUploading, setPdfUploading] = useState(false)

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
    setUploadFiles(prev => {
      const combined = [...prev, ...files]
      if (combined.length > 20) { alert('写真は最大20枚まで登録できます'); return prev }
      return combined
    })
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
  const uploadPdfs = async (): Promise<string[]> => {
    if (pdfFiles.length === 0) return []
    setPdfUploading(true)
    const urls: string[] = []
    for (const file of pdfFiles) {
      const fileName = `pdf/${Date.now()}-${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`
      const { error } = await supabase.storage.from('property-images').upload(fileName, file, { contentType: 'application/pdf' })
      if (!error) {
        const { data: urlData } = supabase.storage.from('property-images').getPublicUrl(fileName)
        urls.push(urlData.publicUrl)
      }
    }
    setPdfUploading(false)
    return urls
  }

  const uploadImages = async (): Promise<string[]> => {
    if (uploadFiles.length === 0) return uploadPreviews
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
  // 間取り図アップロード
  let floorPlanUrl = form.floor_plan_url || null
  if (floorPlanFile) {
    const ext = floorPlanFile.name.split('.').pop()
    const path = `floor-plans/${Date.now()}.${ext}`
    await supabase.storage.from('property-images').upload(path, floorPlanFile, { contentType: floorPlanFile.type })
    const { data: fpData } = supabase.storage.from('property-images').getPublicUrl(path)
    floorPlanUrl = fpData.publicUrl
  }
    const documentUrl = await uploadPdfs()

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
      visibility: form.visibility,
      viewing_method: form.viewing_method || null,
      staff_name: form.staff_name || null,
      staff_phone: form.staff_phone || null,
    staff_email: form.staff_email || null,
    keybox_code: form.keybox_code || null,
    keybox_location: form.keybox_location || null,
      images: imageUrls.length > 0 ? imageUrls : (uploadPreviews.length > 0 ? uploadPreviews : null),
    floor_plan_url: floorPlanUrl,
    document_urls: documentUrl.length > 0 ? documentUrl : (editItem?.document_urls || null),
    }
      if (editItem) {
    const { error } = await supabase.from('properties').update(payload).eq('id', editItem.id)
    if (error) {
      setMsg(`❌ エラー：${error.message}`)
    } else {
      setMsg('✅ 更新しました！')
      setEditItem(null)
      setForm({ ...emptyForm })
      setUploadFiles([])
      setUploadPreviews([])
      setShowForm(false)
      fetchProperties()
    }
  } else {
    const { error } = await supabase.from('properties').insert([payload])
    if (error) {
      setMsg(`❌ エラー：${error.message}`)
    } else {
      setMsg('✅ 登録しました！')
        setForm({ ...emptyForm })
      setUploadFiles([])
      setUploadPreviews([])
      setShowForm(false)
      fetchProperties()
    }
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

  const downloadQR = () => {
    const svg = document.getElementById('qr-svg')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    canvas.width = 300; canvas.height = 300
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => { ctx?.drawImage(img, 0, 0); const a = document.createElement('a'); a.download = `QR_${qrItem?.name || 'property'}.png`; a.href = canvas.toDataURL('image/png'); a.click() }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

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

              {/* 間取り図アップロード */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>間取り図（1枚）</label>
              <div style={{ border: '2px dashed #d1d5db', borderRadius: 8, padding: 16, textAlign: 'center', background: '#f9fafb', cursor: 'pointer' }}
                onClick={() => document.getElementById('floorplan-upload')?.click()}>
                {floorPlanPreview ? (
                  <img src={floorPlanPreview} alt="間取り図" style={{ maxHeight: 200, margin: '0 auto', display: 'block', borderRadius: 4 }} />
                ) : (
                  <>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>🏠</div>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>クリックして間取り図を追加</p>
                  </>
                )}
              </div>
              <input id="floorplan-upload" type="file" accept="image/*" style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFloorPlanFile(f); const r = new FileReader(); r.onload = (ev) => setFloorPlanPreview(ev.target?.result as string); r.readAsDataURL(f) }}} />
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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginTop: 12 }}>
                    {uploadPreviews.map((preview, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img
                          src={preview}
                          alt={`写真${i + 1}`}
                          style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }}
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

                      <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>📄 物件資料PDF（仲介業者向け・最大20ファイル）</label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1e40af', color: 'white', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
              📎 PDFを選択
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  if (files.length > 20) { alert('PDFは最大20ファイルまでです'); return }
                  setPdfFiles(files)
                }}
                style={{ display: 'none' }}
              />
            </label>
            {pdfFiles.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {pdfFiles.map((f, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                    ✅ {f.name}
                  </div>
                ))}
              </div>
            )}
            {editItem?.document_urls && pdfFiles.length === 0 && (
              <div style={{ marginTop: 6, fontSize: 12, color: '#1a3a5c' }}>
                {editItem.document_urls.map((url: string, i: number) => (
                  <div key={i}>📎 <a href={url} target="_blank" rel="noreferrer" style={{ color: '#1a3a5c' }}>PDF {i+1} を確認する</a></div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>公開範囲</label>
          <select name="visibility" value={form.visibility || 'public'} onChange={handleChange}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, width: '100%' }}>
            <option value="public">🌐 一般公開（GINTETSUサイトに表示）</option>
            <option value="agent">🤝 仲介業者のみ（業者ダッシュボードのみ）</option>
            <option value="both">📢 両方に掲載（サイト＋業者ダッシュボード）</option>
          </select>
              {(form.visibility === 'agent' || form.visibility === 'both') && (
                <div style={{ marginTop: 12, padding: 12, background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
                  <p style={{ fontSize: 12, color: '#0369a1', fontWeight: 700, margin: '0 0 8px' }}>🏠 仲介業者向け設定</p>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 12, color: '#374151', display: 'block', marginBottom: 4 }}>内見方法</label>
                    <select name="viewing_method" value={form.viewing_method || '対面'} onChange={handleChange}
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}>
                      <option value="対面">対面</option>
                      <option value="現地対応">現地対応</option>
                      <option value="鍵取り">鍵取り</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 12, color: '#374151', display: 'block', marginBottom: 4 }}>担当スタッフ名</label>
                    <input name="staff_name" value={form.staff_name || ''} onChange={handleChange}
                      placeholder="例：小川 宜猛" style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' as const }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#374151', display: 'block', marginBottom: 4 }}>担当スタッフ電話番号</label>
                    <input name="staff_phone" value={form.staff_phone || ''} onChange={handleChange}
                      placeholder="例：048-606-4317" style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' as const }} />
                  </div>
                <div>
                  <label style={{ fontSize: 12, color: '#374151', display: 'block', marginBottom: 4 }}>担当スタッフメール</label>
                  <input name="staff_email" value={form.staff_email || ''} onChange={handleChange}
                    placeholder="例：staff@gintetsu-fudosan.co.jp" style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' as const }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#374151', display: 'block', marginBottom: 4 }}>キーボックス番号（現地対応時）</label>
                  <input name="keybox_code" value={form.keybox_code || ''} onChange={handleChange}
                    placeholder="例：1234" style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' as const }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#374151', display: 'block', marginBottom: 4 }}>キーボックス設置場所（現地対応時）</label>
                  <input name="keybox_location" value={form.keybox_location || ''} onChange={handleChange}
                    placeholder="例：玄関ドア横" style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' as const }} />
                </div>
                </div>
              )}
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
                  onClick={() => { setShowForm(false); setForm({ ...emptyForm }); setUploadFiles([]); setUploadPreviews([]); setPdfFiles([]); setMsg('') }}
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
                    onClick={() => setQrItem(i)}
                    style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, marginRight: 6 }}
                  >
                    📱 QR
                  </button>
                  <button
                    onClick={() => { setEditItem(i); setForm({ name: i.name || '', price: i.price || '', address: i.address || '', area: i.area || '', rooms: i.rooms || '', description: i.description || '', nearest_station: i.nearest_station || '', walk_minutes: i.walk_minutes || '', building_type: i.building_type || '', floor: i.floor || '', total_floors: i.total_floors || '', management_fee: i.management_fee || '', status: i.status || 'available', published: i.published || false, floor_plan_url: i.floor_plan_url || '',
              visibility: i.visibility || 'public', viewing_method: i.viewing_method || '', staff_name: i.staff_name || '', staff_phone: i.staff_phone || '', staff_email: i.staff_email || '', keybox_code: i.keybox_code || '', keybox_location: i.keybox_location || '' }); setUploadPreviews(Array.isArray(i.images) ? i.images : []); if (i.floor_plan_url) setFloorPlanPreview(i.floor_plan_url); setShowForm(true); }}
                    style={{ background: '#e8f4fd', color: '#1a3a5c', border: '1px solid #b3d4f0', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, marginRight: 6 }}
                  >
                    ✏️ 編集
                  </button>
                  <button
                  onClick={() => handleDelete(i.id, i.name)}
                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 13, padding: "4px 8px" }}
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

      {/* QRコードモーダル */}
      {qrItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 32, textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
            <h3 style={{ color: '#1a3a5c', marginBottom: 8, fontSize: 18 }}>📱 QRコード</h3>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>{qrItem.name || qrItem.title}</p>
            <QRCode id="qr-svg" value={`https://gintetsu-fudosan-v2.vercel.app/agent`} size={200} />
            <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={downloadQR} style={{ background: '#1a3a5c', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                ⬇️ ダウンロード
              </button>
              <button onClick={() => setQrItem(null)} style={{ background: '#f1f5f9', color: '#374151', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer' }}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const emptyForm = {
  name: '', address: '', rent: '', management_fee: '',
  deposit: '', key_money: '', area: '', rooms: '',
  floor: '', total_floors: '', building_type: '',
  nearest_station: '', walk_minutes: '', built_year: '',
  pet_allowed: false, parking: '',
  fire_insurance: '', guarantee_company: '', key_exchange: '',
  equipment: '', features: '', description: '',
  floor_plan_url: '',
  status: 'available', published: true,
  visibility: 'public'
}

export default function RentalProperties() {
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
  const [pdfFiles, setPdfFiles] = useState<File[]>([])
  const [pdfUploading, setPdfUploading] = useState(false)
  const [qrItem, setQrItem] = useState<any>(null)
  const [editItem, setEditItem] = useState<any>(null)

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

  const fetchItems = async () => {
    setLoading(true)
    const { data } = await supabase.from('rental_properties').select('*').order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchItems() }, [])

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadFiles(prev => [...prev, ...files])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => setUploadPreviews(prev => [...prev, ev.target?.result as string])
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index))
    setUploadPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async (): Promise<string[]> => {
    if (uploadFiles.length === 0) return []
    setUploading(true)
    const urls: string[] = []
    for (const file of uploadFiles) {
      const ext = file.name.split('.').pop()
      const fileName = `rental/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('property-images').upload(fileName, file, { contentType: file.type })
      if (!error) {
        const { data } = supabase.storage.from('property-images').getPublicUrl(fileName)
        urls.push(data.publicUrl)
      }
    }
    setUploading(false)
    return urls
  }

  const handleSubmit = async () => {
    if (!form.name || !form.address) { setMsg('❌ 物件名と住所は必須です'); return }
    setSaving(true)
    setMsg('')
    const imageUrls = await uploadImages()
      const documentUrls = await uploadPdfs()
    const payload = {
      name: form.name, address: form.address,
      rent: form.rent ? Number(form.rent) : null,
      management_fee: form.management_fee ? Number(form.management_fee) : null,
      deposit: form.deposit || null, key_money: form.key_money || null,
      area: form.area ? Number(form.area) : null,
      rooms: form.rooms || null,
      floor: form.floor ? Number(form.floor) : null,
      total_floors: form.total_floors ? Number(form.total_floors) : null,
      building_type: form.building_type || null,
      nearest_station: form.nearest_station || null,
      walk_minutes: form.walk_minutes ? Number(form.walk_minutes) : null,
      built_year: form.built_year ? Number(form.built_year) : null,
      pet_allowed: form.pet_allowed,
      parking: form.parking || null,
      fire_insurance: form.fire_insurance ? Number(form.fire_insurance) : null,
      guarantee_company: form.guarantee_company ? Number(form.guarantee_company) : null,
      key_exchange: form.key_exchange ? Number(form.key_exchange) : null,
      equipment: form.equipment ? form.equipment.split('、').map((s: string) => s.trim()).filter(Boolean) : null,
      features: form.features ? form.features.split('、').map((s: string) => s.trim()).filter(Boolean) : null,
      description: form.description || null,
    status: form.status, published: form.published,
    document_urls: documentUrls.length > 0 ? documentUrls : (editItem?.document_urls || null),
      images: imageUrls.length > 0 ? imageUrls : (editItem?.images || null),
    floor_plan_url: form.floor_plan_url || (editItem?.floor_plan_url || null),
    }
    let error
    if (editItem) {
      const { error: e } = await supabase.from('rental_properties').update(payload).eq('id', editItem.id)
      error = e
    } else {
      const { error: e } = await supabase.from('rental_properties').insert([payload])
      error = e
    }
    if (error) { setMsg(`❌ エラー: ${error.message}`) }
    else { setMsg('✅ 登録しました！'); setForm({ ...emptyForm }); setUploadFiles([]); setUploadPreviews([]); setPdfFiles([]); setShowForm(false); fetchItems() }
    setSaving(false)
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return
    await supabase.from('rental_properties').delete().eq('id', id)
    fetchItems()
  }

  const inp = { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, fontFamily: 'inherit', background: 'white', boxSizing: 'border-box' as const }
  const lbl = { display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }
  const sec = { fontSize: 13, fontWeight: 700, color: '#1e40af', marginBottom: 12, marginTop: 20, paddingBottom: 6, borderBottom: '2px solid #e0e7ff' }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ background: '#059669', color: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 20, fontWeight: 'bold' }}>🏢 賃貸物件管理</span>
        <button onClick={() => window.location.href = '/'} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>← ダッシュボード</button>
      </header>

      <main style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#1e293b', margin: 0 }}>賃貸物件一覧</h2>
          <button onClick={() => { setShowForm(!showForm); setMsg('') }} style={{ background: '#059669', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 'bold' }}>
            {showForm ? '✕ キャンセル' : '＋ 新規物件登録'}
          </button>
        </div>

        {msg && <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: msg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', color: msg.startsWith('✅') ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{msg}</div>}

        {showForm && (
          <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 28, border: '2px solid #059669' }}>
            <h3 style={{ fontSize: 16, fontWeight: 'bold', color: '#059669', marginTop: 0, marginBottom: 4 }}>📝 新規賃貸物件登録</h3>

            {/* 基本情報 */}
            <p style={sec}>📍 基本情報</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>物件名 <span style={{ color: '#ef4444' }}>必須</span></label>
                <input style={inp} name="name" value={form.name} onChange={handleChange} placeholder="例：グランドハイツ大宮" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>住所 <span style={{ color: '#ef4444' }}>必須</span></label>
                <input style={inp} name="address" value={form.address} onChange={handleChange} placeholder="例：埼玉県さいたま市大宮区..." />
              </div>
              <div>
                <label style={lbl}>建物種別</label>
                <select style={inp} name="building_type" value={form.building_type} onChange={handleChange}>
                  <option value="">選択</option>
                  <option>マンション</option><option>アパート</option><option>一戸建て</option>
                  <option>テラスハウス</option><option>マンション（低層）</option>
                </select>
              </div>
              <div>
                <label style={lbl}>間取り</label>
                <input style={inp} name="rooms" value={form.rooms} onChange={handleChange} placeholder="例：2LDK" />
              </div>
              <div>
                <label style={lbl}>面積（㎡）</label>
                <input style={inp} type="number" name="area" value={form.area} onChange={handleChange} placeholder="例：55.2" />
              </div>
              <div>
                <label style={lbl}>階数</label>
                <input style={inp} type="number" name="floor" value={form.floor} onChange={handleChange} placeholder="例：3" />
              </div>
              <div>
                <label style={lbl}>総階数</label>
                <input style={inp} type="number" name="total_floors" value={form.total_floors} onChange={handleChange} placeholder="例：8" />
              </div>
              <div>
                <label style={lbl}>築年数（西暦）</label>
                <input style={inp} type="number" name="built_year" value={form.built_year} onChange={handleChange} placeholder="例：2010" />
              </div>
              <div>
                <label style={lbl}>最寄り駅</label>
                <input style={inp} name="nearest_station" value={form.nearest_station} onChange={handleChange} placeholder="例：大宮駅" />
              </div>
              <div>
                <label style={lbl}>徒歩（分）</label>
                <input style={inp} type="number" name="walk_minutes" value={form.walk_minutes} onChange={handleChange} placeholder="例：5" />
              </div>
            </div>

            {/* 賃料・費用 */}
            <p style={sec}>💰 賃料・費用</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              <div>
                <label style={lbl}>賃料（円/月）</label>
                <input style={inp} type="number" name="rent" value={form.rent} onChange={handleChange} placeholder="例：80000" />
              </div>
              <div>
                <label style={lbl}>管理費（円/月）</label>
                <input style={inp} type="number" name="management_fee" value={form.management_fee} onChange={handleChange} placeholder="例：5000" />
              </div>
              <div>
                <label style={lbl}>敷金</label>
                <input style={inp} name="deposit" value={form.deposit} onChange={handleChange} placeholder="例：1ヶ月" />
              </div>
              <div>
                <label style={lbl}>礼金</label>
                <input style={inp} name="key_money" value={form.key_money} onChange={handleChange} placeholder="例：1ヶ月" />
              </div>
            </div>

            {/* 一時金 */}
            <p style={sec}>📄 一時金</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              <div>
                <label style={lbl}>火災保険（円）</label>
                <input style={inp} type="number" name="fire_insurance" value={form.fire_insurance} onChange={handleChange} placeholder="例：20000" />
              </div>
              <div>
                <label style={lbl}>保証会社（円）</label>
                <input style={inp} type="number" name="guarantee_company" value={form.guarantee_company} onChange={handleChange} placeholder="例：50000" />
              </div>
              <div>
                <label style={lbl}>鍵交換費（円）</label>
                <input style={inp} type="number" name="key_exchange" value={form.key_exchange} onChange={handleChange} placeholder="例：15000" />
              </div>
              <div>
                <label style={lbl}>駐車場</label>
                <input style={inp} name="parking" value={form.parking} onChange={handleChange} placeholder="例：有（月5,000円）" />
              </div>
            </div>

            {/* 条件・設備 */}
            <p style={sec}>🏠 条件・設備</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>📄 物件資料PDF（仲介業者向け・最大20ファイル）</label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1e40af', color: 'white', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
              📎 PDFを選択
              <input type="file" accept=".pdf" multiple onChange={(e) => { const files = Array.from(e.target.files || []); if (files.length > 20) { alert('PDFは最大20ファイルまでです'); return }; setPdfFiles(files) }} style={{ display: 'none' }} />
            </label>
            {pdfFiles.length > 0 && (
              <div style={{ marginTop: 8 }}>{pdfFiles.map((f, i) => <div key={i} style={{ fontSize: 12, color: '#6b7280' }}>✅ {f.name}</div>)}</div>
            )}
            {editItem?.document_urls && pdfFiles.length === 0 && (
              <div style={{ marginTop: 6, fontSize: 12, color: '#1a3a5c' }}>
                {editItem.document_urls.map((url: string, i: number) => (
                    <div key={i} style={{ display: 'inline-flex', alignItems: 'center', marginRight: 8, marginBottom: 4 }}>📎 <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563eb' }}>PDF {i+1}</a><button onClick={() => { const updated = [...(editItem.document_urls || [])]; updated.splice(i, 1); setEditItem({...editItem, document_urls: updated}) }} style={{ marginLeft: 4, background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14 }}>×</button></div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
                <input type="checkbox" name="pet_allowed" checked={form.pet_allowed} onChange={handleChange} id="pet" />
                <label htmlFor="pet" style={{ fontSize: 14, cursor: 'pointer' }}>ペット可</label>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>設備（「、」区切りで複数入力）</label>
                <input style={inp} name="equipment" value={form.equipment} onChange={handleChange} placeholder="例：エアコン、システムキッチン、オートロック、宅配ボックス" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>特徴タグ（「、」区切り）</label>
                <input style={inp} name="features" value={form.features} onChange={handleChange} placeholder="例：南向き、角部屋、リノベーション済み" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>物件説明</label>
                <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} name="description" value={form.description} onChange={handleChange} placeholder="物件の魅力・セールスポイントを入力" />
              </div>
            </div>

            {/* 写真アップロード */}
            <p style={sec}>🗺️ 間取り図（1枚）</p>
          <div style={{ border: '2px dashed #d1d5db', borderRadius: 8, padding: 16, marginBottom: 16, textAlign: 'center' }}>
            <input type="file" accept="image/*" onChange={async e => {
              const file = e.target.files?.[0]
              if (!file) return
              const ext = file.name.split('.').pop()
              const fileName = `rental/floorplan-${Date.now()}.${ext}`
              const { error } = await supabase.storage.from('property-images').upload(fileName, file, { contentType: file.type })
              if (!error) {
                const { data } = supabase.storage.from('property-images').getPublicUrl(fileName)
                setForm(prev => ({ ...prev, floor_plan_url: data.publicUrl }))
              }
            }} style={{ fontSize: 13 }} />
            {form.floor_plan_url && <div style={{ marginTop: 8 }}><img src={form.floor_plan_url} style={{ maxWidth: 200, maxHeight: 150, borderRadius: 4 }} /></div>}
          </div>
          <p style={sec}>📷 物件写真</p>
            <div style={{ border: '2px dashed #d1d5db', borderRadius: 8, padding: 20, textAlign: 'center', background: '#f9fafb', cursor: 'pointer' }}
              onClick={() => document.getElementById('rental-photo')?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
                setUploadFiles(prev => [...prev, ...files])
                files.forEach(file => {
                  const reader = new FileReader()
                  reader.onload = (ev) => setUploadPreviews(prev => [...prev, ev.target?.result as string])
                  reader.readAsDataURL(file)
                })
              }}
            >
              <div style={{ fontSize: 32 }}>📷</div>
              <p style={{ fontSize: 14, color: '#6b7280', margin: '8px 0 4px' }}>クリックまたはドラッグ＆ドロップで写真を追加</p>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>JPG・PNG・WebP（複数選択可）</p>
            </div>
            <input id="rental-photo" type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileSelect} />
            {uploadPreviews.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8, marginTop: 10 }}>
                {uploadPreviews.map((p, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={p} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }} />
                    <button onClick={() => removePhoto(i)} style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(239,68,68,0.9)', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 11 }}>✕</button>
                    {i === 0 && <span style={{ position: 'absolute', bottom: 3, left: 3, background: '#059669', color: 'white', fontSize: 9, padding: '2px 5px', borderRadius: 3 }}>メイン</span>}
                  </div>
                ))}
              </div>
            )}

            {/* ステータス */}
            <p style={sec}>⚙️ 公開設定</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              <div>
                <label style={lbl}>ステータス</label>
                <select style={inp} name="status" value={form.status} onChange={handleChange}>
                  <option value="available">募集中</option>
                  <option value="pending">申込中</option>
                  <option value="sold">成約済</option>
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>📄 物件資料PDF（仲介業者向け・最大20ファイル）</label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1e40af', color: 'white', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
              📎 PDFを選択
              <input type="file" accept=".pdf" multiple onChange={(e) => { const files = Array.from(e.target.files || []); if (files.length > 20) { alert('PDFは最大20ファイルまでです'); return }; setPdfFiles(files) }} style={{ display: 'none' }} />
            </label>
            {pdfFiles.length > 0 && (
              <div style={{ marginTop: 8 }}>{pdfFiles.map((f, i) => <div key={i} style={{ fontSize: 12, color: '#6b7280' }}>✅ {f.name}</div>)}</div>
            )}
            {editItem?.document_urls && pdfFiles.length === 0 && (
              <div style={{ marginTop: 6, fontSize: 12, color: '#1a3a5c' }}>
                {editItem.document_urls.map((url: string, i: number) => (
                    <div key={i} style={{ display: 'inline-flex', alignItems: 'center', marginRight: 8, marginBottom: 4 }}>📎 <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563eb' }}>PDF {i+1}</a><button onClick={() => { const updated = [...(editItem.document_urls || [])]; updated.splice(i, 1); setEditItem({...editItem, document_urls: updated}) }} style={{ marginLeft: 4, background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14 }}>×</button></div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
                <input type="checkbox" name="published" checked={form.published} onChange={handleChange} id="pub" />
                <label htmlFor="pub" style={{ fontSize: 14, cursor: 'pointer' }}>公開する（サイトに表示）</label>
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
        </div>

<div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
              <button onClick={handleSubmit} disabled={saving || uploading}
                style={{ background: (saving || uploading) ? '#9ca3af' : '#059669', color: 'white', border: 'none', padding: '12px 28px', borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 'bold' }}>
                {uploading ? '写真アップロード中...' : saving ? '登録中...' : '✓ 登録する'}
              </button>
              <button onClick={() => { setShowForm(false); setForm({ ...emptyForm }); setUploadFiles([]); setUploadPreviews([]); setPdfFiles([]); setMsg('') }}
                style={{ background: '#f1f5f9', color: '#374151', border: 'none', padding: '12px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
                キャンセル
              </button>
              {uploadPreviews.length > 0 && <span style={{ fontSize: 13, color: '#6b7280' }}>📷 {uploadPreviews.length}枚選択中</span>}
            </div>
          </div>
        )}

        {/* 一覧テーブル */}
        <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>読み込み中...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
              <p>賃貸物件がまだ登録されていません</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f0fdf4' }}>
                  {['写真', '物件名', '住所', '賃料', '間取り', '最寄り駅', 'ステータス', '公開', '操作'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#166534', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(i => {
                  const thumb = Array.isArray(i.images) && i.images.length > 0 ? i.images[0] : null
                  const statusMap: any = { available: { text: '募集中', bg: '#dcfce7', color: '#16a34a' }, pending: { text: '申込中', bg: '#fef9c3', color: '#ca8a04' }, sold: { text: '成約済', bg: '#f1f5f9', color: '#475569' } }
                  const s = statusMap[i.status] || statusMap.available
                  return (
                    <tr key={i.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 16px' }}>
                        {thumb ? <img src={thumb} alt="" style={{ width: 60, height: 44, objectFit: 'cover', borderRadius: 6 }} />
                          : <div style={{ width: 60, height: 44, background: '#f0fdf4', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏢</div>}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b' }}>{i.name}</td>
                      <td style={{ padding: '14px 16px', color: '#64748b', fontSize: 13 }}>{i.address}</td>
                      <td style={{ padding: '14px 16px', color: '#059669', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {i.rent ? `${i.rent.toLocaleString()}円` : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748b' }}>{i.rooms || '—'}</td>
                      <td style={{ padding: '14px 16px', color: '#64748b', fontSize: 13 }}>{i.nearest_station ? `${i.nearest_station} 徒歩${i.walk_minutes || '?'}分` : '—'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{s.text}</span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>{i.published ? '✅' : '🔒'}</td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button onClick={() => setQrItem(i)} style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      📱 QR
                    </button>
                    <button onClick={() => { setEditItem(i); setForm({ name: i.name || '', rent: i.rent || '', address: i.address || '', area: i.area || '', rooms: i.rooms || '', deposit: i.deposit || '', key_money: i.key_money || '', floor: i.floor || '', total_floors: i.total_floors || '', building_type: i.building_type || '', nearest_station: i.nearest_station || '', walk_minutes: i.walk_minutes || '', management_fee: i.management_fee || '', built_year: i.built_year || '', pet_allowed: i.pet_allowed || false, parking: i.parking || '', fire_insurance: i.fire_insurance || '', guarantee_company: i.guarantee_company || '', key_exchange: i.key_exchange || '', equipment: i.equipment || '', features: i.features || '', description: i.description || '', status: i.status || 'available', published: i.published || false, floor_plan_url: i.floor_plan_url || '' }); setUploadPreviews(Array.isArray(i.images) ? i.images : []); setShowForm(true) }} style={{ background: '#e8f4fd', color: '#1a3a5c', border: '1px solid #b3d4f0', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      ✏️ 編集
                    </button>
                    <button onClick={() => handleDelete(i.id, i.name)} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      削除
                    </button>
                  </div>
                </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    {qrItem && (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 32, textAlign: 'center', minWidth: 280 }}>
          <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>📱 QRコード</div>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>{qrItem.name}</div>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(typeof window !== 'undefined' ? 'https://gintetsu-fudosan.co.jp/agent' : '')}`} alt="QR" style={{ width: 200, height: 200, borderRadius: 8 }} />
          <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={() => setQrItem(null)} style={{ background: '#f1f5f9', color: '#374151', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>閉じる</button>
          </div>
        </div>
      </div>
    )}
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const emptyForm = {
  name: '', address: '', price: '', yield_rate: '',
  building_type: '', built_year: '', structure: '',
  total_units: '', occupied_units: '', monthly_income: '',
  area: '', land_area: '', nearest_station: '', walk_minutes: '',
  management_company: '', management_type: '', management_fee: '',
  repair_reserve: '', land_right: '', shared_ownership: '',
  exclusive_area: '', water: '', electricity: '', gas: '',
  road_frontage: '', fixed_asset_tax: '', land_area_registry: '',
  city_planning: '', use_district: '', other_regulations: '',
  reform_history: '', loan_simulation: '', remarks: '',
  features: '', description: '',
  status: 'available', published: true,
}

export default function InvestmentProperties() {
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
  const [editItem, setEditItem] = useState<any>(null)
  const [qrItem, setQrItem] = useState<any>(null)

  const fetchItems = async () => {
    setLoading(true)
    const { data } = await supabase.from('investment_properties').select('*').order('created_at', { ascending: false })
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
      const fileName = `investment/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('property-images').upload(fileName, file, { contentType: file.type })
      if (!error) {
        const { data } = supabase.storage.from('property-images').getPublicUrl(fileName)
        urls.push(data.publicUrl)
      }
    }
    setUploading(false)
    return urls
  }

  const uploadPdfs = async (): Promise<string[]> => {
    if (pdfFiles.length === 0) return []
    setPdfUploading(true)
    const urls: string[] = []
    for (const file of pdfFiles) {
      const ext = file.name.split('.').pop()
      const fileName = `investment/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('property-images').upload(fileName, file, { contentType: file.type })
      if (!error) {
        const { data } = supabase.storage.from('property-images').getPublicUrl(fileName)
        urls.push(data.publicUrl)
      }
    }
    setPdfUploading(false)
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
      price: form.price ? Number(form.price) : null,
      yield_rate: form.yield_rate ? Number(form.yield_rate) : null,
      building_type: form.building_type || null,
      built_year: form.built_year ? Number(form.built_year) : null,
      structure: form.structure || null,
      total_units: form.total_units ? Number(form.total_units) : null,
      occupied_units: form.occupied_units ? Number(form.occupied_units) : null,
      monthly_income: form.monthly_income ? Number(form.monthly_income) : null,
      area: form.area ? Number(form.area) : null,
      land_area: form.land_area ? Number(form.land_area) : null,
      nearest_station: form.nearest_station || null,
      walk_minutes: form.walk_minutes ? Number(form.walk_minutes) : null,
      management_company: form.management_company || null,
      management_type: form.management_type || null,
      management_fee: form.management_fee ? Number(form.management_fee) : null,
      repair_reserve: form.repair_reserve ? Number(form.repair_reserve) : null,
      land_right: form.land_right || null,
      shared_ownership: form.shared_ownership || null,
      exclusive_area: form.exclusive_area ? Number(form.exclusive_area) : null,
      water: form.water || null, electricity: form.electricity || null, gas: form.gas || null,
      road_frontage: form.road_frontage || null,
      fixed_asset_tax: form.fixed_asset_tax ? Number(form.fixed_asset_tax) : null,
      land_area_registry: form.land_area_registry ? Number(form.land_area_registry) : null,
      city_planning: form.city_planning || null,
      use_district: form.use_district || null,
      other_regulations: form.other_regulations || null,
      reform_history: form.reform_history || null,
      loan_simulation: form.loan_simulation || null,
      remarks: form.remarks || null,
      features: form.features ? form.features.split('、').map((s: string) => s.trim()).filter(Boolean) : null,
      description: form.description || null,
      status: form.status, published: form.published,
      images: imageUrls.length > 0 ? imageUrls : null,
      document_urls: documentUrls.length > 0 ? documentUrls : (editItem?.document_urls || null),
    }
    const { error } = await supabase.from('investment_properties').insert([payload])
    if (error) { setMsg(`❌ エラー: ${error.message}`) }
    else { setMsg('✅ 登録しました！'); setForm({ ...emptyForm }); setUploadFiles([]); setUploadPreviews([]); setPdfFiles([]); setShowForm(false); fetchItems() }
    setSaving(false)
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return
    await supabase.from('investment_properties').delete().eq('id', id)
    fetchItems()
  }

  const inp = { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, fontFamily: 'inherit', background: 'white', boxSizing: 'border-box' as const }
  const lbl = { display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }
  const sec = { fontSize: 13, fontWeight: 700, color: '#7c3aed', marginBottom: 12, marginTop: 20, paddingBottom: 6, borderBottom: '2px solid #ede9fe' }
  const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ background: '#7c3aed', color: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 20, fontWeight: 'bold' }}>💰 収益物件管理</span>
        <button onClick={() => window.location.href = '/'} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>← ダッシュボード</button>
      </header>

      <main style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#1e293b', margin: 0 }}>収益物件一覧</h2>
          <button onClick={() => { setShowForm(!showForm); setMsg('') }} style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 'bold' }}>
            {showForm ? '✕ キャンセル' : '＋ 新規物件登録'}
          </button>
        </div>

        {msg && <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: msg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', color: msg.startsWith('✅') ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{msg}</div>}

        {showForm && (
          <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 28, border: '2px solid #7c3aed' }}>
            <h3 style={{ fontSize: 16, fontWeight: 'bold', color: '#7c3aed', marginTop: 0, marginBottom: 4 }}>📝 新規収益物件登録</h3>

            {/* 基本情報 */}
            <p style={sec}>📍 基本情報</p>
            <div style={grid}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>物件名 <span style={{ color: '#ef4444' }}>必須</span></label>
                <input style={inp} name="name" value={form.name} onChange={handleChange} placeholder="例：グランドコート大宮" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>住所 <span style={{ color: '#ef4444' }}>必須</span></label>
                <input style={inp} name="address" value={form.address} onChange={handleChange} placeholder="例：埼玉県さいたま市大宮区..." />
              </div>
              <div>
                <label style={lbl}>建物種別</label>
                <select style={inp} name="building_type" value={form.building_type} onChange={handleChange}>
                  <option value="">選択</option>
                  <option>マンション</option><option>アパート</option><option>一棟ビル</option>
                  <option>一戸建て</option><option>区分マンション</option><option>土地</option>
                </select>
              </div>
              <div>
                <label style={lbl}>構造</label>
                <select style={inp} name="structure" value={form.structure} onChange={handleChange}>
                  <option value="">選択</option>
                  <option>RC造</option><option>SRC造</option><option>鉄骨造</option>
                  <option>木造</option><option>軽量鉄骨造</option>
                </select>
              </div>
              <div>
                <label style={lbl}>築年数（西暦）</label>
                <input style={inp} type="number" name="built_year" value={form.built_year} onChange={handleChange} placeholder="例：2005" />
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

            {/* 収益情報 */}
            <p style={sec}>💰 収益情報</p>
            <div style={grid}>
              <div>
                <label style={lbl}>販売価格（万円）</label>
                <input style={inp} type="number" name="price" value={form.price} onChange={handleChange} placeholder="例：5000" />
              </div>
              <div>
                <label style={lbl}>表面利回り（%）</label>
                <input style={inp} type="number" step="0.1" name="yield_rate" value={form.yield_rate} onChange={handleChange} placeholder="例：8.5" />
              </div>
              <div>
                <label style={lbl}>総戸数</label>
                <input style={inp} type="number" name="total_units" value={form.total_units} onChange={handleChange} placeholder="例：10" />
              </div>
              <div>
                <label style={lbl}>入居戸数</label>
                <input style={inp} type="number" name="occupied_units" value={form.occupied_units} onChange={handleChange} placeholder="例：9" />
              </div>
              <div>
                <label style={lbl}>満室時月収（円）</label>
                <input style={inp} type="number" name="monthly_income" value={form.monthly_income} onChange={handleChange} placeholder="例：350000" />
              </div>
            </div>

            {/* 面積 */}
            <p style={sec}>📐 面積・権利</p>
            <div style={grid}>
              <div>
                <label style={lbl}>建物面積（㎡）</label>
                <input style={inp} type="number" name="area" value={form.area} onChange={handleChange} placeholder="例：250" />
              </div>
              <div>
                <label style={lbl}>土地面積（㎡）</label>
                <input style={inp} type="number" name="land_area" value={form.land_area} onChange={handleChange} placeholder="例：180" />
              </div>
              <div>
                <label style={lbl}>専有面積（㎡）</label>
                <input style={inp} type="number" name="exclusive_area" value={form.exclusive_area} onChange={handleChange} placeholder="例：45" />
              </div>
              <div>
                <label style={lbl}>土地の権利</label>
                <select style={inp} name="land_right" value={form.land_right} onChange={handleChange}>
                  <option value="">選択</option>
                  <option>所有権</option><option>借地権</option><option>地上権</option>
                </select>
              </div>
              <div>
                <label style={lbl}>共有持分</label>
                <input style={inp} name="shared_ownership" value={form.shared_ownership} onChange={handleChange} placeholder="例：1/2" />
              </div>
              <div>
                <label style={lbl}>地積（㎡）</label>
                <input style={inp} type="number" name="land_area_registry" value={form.land_area_registry} onChange={handleChange} placeholder="例：180.5" />
              </div>
            </div>

            {/* 管理情報 */}
            <p style={sec}>🏢 管理情報</p>
            <div style={grid}>
              <div>
                <label style={lbl}>管理会社</label>
                <input style={inp} name="management_company" value={form.management_company} onChange={handleChange} placeholder="例：〇〇管理株式会社" />
              </div>
              <div>
                <label style={lbl}>管理形態</label>
                <select style={inp} name="management_type" value={form.management_type} onChange={handleChange}>
                  <option value="">選択</option>
                  <option>自主管理</option><option>全部委託</option><option>一部委託</option><option>サブリース</option>
                </select>
              </div>
              <div>
                <label style={lbl}>管理費（円/月）</label>
                <input style={inp} type="number" name="management_fee" value={form.management_fee} onChange={handleChange} placeholder="例：30000" />
              </div>
              <div>
                <label style={lbl}>修繕積立金（円/月）</label>
                <input style={inp} type="number" name="repair_reserve" value={form.repair_reserve} onChange={handleChange} placeholder="例：20000" />
              </div>
            </div>

            {/* インフラ・接道 */}
            <p style={sec}>⚡ インフラ・接道状況</p>
            <div style={grid}>
              <div>
                <label style={lbl}>水道</label>
                <input style={inp} name="water" value={form.water} onChange={handleChange} placeholder="例：公営水道" />
              </div>
              <div>
                <label style={lbl}>電気</label>
                <input style={inp} name="electricity" value={form.electricity} onChange={handleChange} placeholder="例：東京電力" />
              </div>
              <div>
                <label style={lbl}>ガス</label>
                <input style={inp} name="gas" value={form.gas} onChange={handleChange} placeholder="例：都市ガス" />
              </div>
              <div>
                <label style={lbl}>接道状況（幅員）</label>
                <input style={inp} name="road_frontage" value={form.road_frontage} onChange={handleChange} placeholder="例：北側4m公道" />
              </div>
            </div>

            {/* 法令・税金 */}
            <p style={sec}>📋 法令・税金</p>
            <div style={grid}>
              <div>
                <label style={lbl}>都市計画</label>
                <input style={inp} name="city_planning" value={form.city_planning} onChange={handleChange} placeholder="例：市街化区域" />
              </div>
              <div>
                <label style={lbl}>用途地域</label>
                <input style={inp} name="use_district" value={form.use_district} onChange={handleChange} placeholder="例：第一種中高層住居専用地域" />
              </div>
              <div>
                <label style={lbl}>固定資産税（円/年）</label>
                <input style={inp} type="number" name="fixed_asset_tax" value={form.fixed_asset_tax} onChange={handleChange} placeholder="例：180000" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>その他法令制限</label>
                <input style={inp} name="other_regulations" value={form.other_regulations} onChange={handleChange} placeholder="例：建ぺい率60%、容積率200%、準防火地域" />
              </div>
            </div>

            {/* リフォーム・ローン */}
            <p style={sec}>🔧 リフォーム歴・ローン・備考</p>
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={lbl}>リフォーム歴</label>
                <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} name="reform_history" value={form.reform_history} onChange={handleChange} placeholder="例：2020年 外壁塗装、2022年 キッチン・浴室リフォーム" />
              </div>
              <div>
                <label style={lbl}>ローンシミュレーション</label>
                <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} name="loan_simulation" value={form.loan_simulation} onChange={handleChange} placeholder="例：借入3000万円・金利1.5%・35年返済の場合、月々約91,800円" />
              </div>
              <div>
                <label style={lbl}>備考</label>
                <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} name="remarks" value={form.remarks} onChange={handleChange} placeholder="その他特記事項など" />
              </div>
              <div>
                <label style={lbl}>特徴タグ（「、」区切り）</label>
                <input style={inp} name="features" value={form.features} onChange={handleChange} placeholder="例：駅近、高利回り、満室稼働中、新耐震基準" />
              </div>
              <div>
                <label style={lbl}>物件説明</label>
                <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} name="description" value={form.description} onChange={handleChange} placeholder="物件の魅力・投資ポイントを入力" />
              </div>
            </div>

            {/* 写真 */}
            <p style={sec}>📷 物件写真</p>
            <div style={{ border: '2px dashed #d1d5db', borderRadius: 8, padding: 20, textAlign: 'center', background: '#f9fafb', cursor: 'pointer' }}
              onClick={() => document.getElementById('invest-photo')?.click()}
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
            <input id="invest-photo" type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileSelect} />
            {uploadPreviews.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8, marginTop: 10 }}>
                {uploadPreviews.map((p, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={p} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }} />
                    <button onClick={() => removePhoto(i)} style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(239,68,68,0.9)', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 11 }}>✕</button>
                    {i === 0 && <span style={{ position: 'absolute', bottom: 3, left: 3, background: '#7c3aed', color: 'white', fontSize: 9, padding: '2px 5px', borderRadius: 3 }}>メイン</span>}
                  </div>
                ))}
              </div>
            )}

            {/* 公開設定 */}
            <p style={sec}>⚙️ 公開設定</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              <div>
                <label style={lbl}>ステータス</label>
                <select style={inp} name="status" value={form.status} onChange={handleChange}>
                  <option value="available">販売中</option>
                  <option value="pending">商談中</option>
                  <option value="sold">成約済</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
                <input type="checkbox" name="published" checked={form.published} onChange={handleChange} id="pub2" />
                <label htmlFor="pub2" style={{ fontSize: 14, cursor: 'pointer' }}>公開する（サイトに表示）</label>
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
              <button onClick={handleSubmit} disabled={saving || uploading}
                style={{ background: (saving || uploading) ? '#9ca3af' : '#7c3aed', color: 'white', border: 'none', padding: '12px 28px', borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 'bold' }}>
                {uploading ? '写真アップロード中...' : saving ? '登録中...' : '✓ 登録する'}
              </button>
              <button onClick={() => { setShowForm(false); setForm({ ...emptyForm }); setUploadFiles([]); setUploadPreviews([]); setMsg('') }}
                style={{ background: '#f1f5f9', color: '#374151', border: 'none', padding: '12px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
                キャンセル
              </button>
              {uploadPreviews.length > 0 && <span style={{ fontSize: 13, color: '#6b7280' }}>📷 {uploadPreviews.length}枚選択中</span>}
            </div>
          </div>
        )}

        {/* 一覧 */}
        <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>読み込み中...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
              <p>収益物件がまだ登録されていません</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f3ff' }}>
                  {['写真', '物件名', '住所', '価格', '利回り', '最寄り駅', 'ステータス', '公開', '操作'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#5b21b6', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(i => {
                  const thumb = Array.isArray(i.images) && i.images.length > 0 ? i.images[0] : null
                  const statusMap: any = { available: { text: '販売中', bg: '#dcfce7', color: '#16a34a' }, pending: { text: '商談中', bg: '#fef9c3', color: '#ca8a04' }, sold: { text: '成約済', bg: '#f1f5f9', color: '#475569' } }
                  const s = statusMap[i.status] || statusMap.available
                  return (
                    <tr key={i.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 16px' }}>
                        {thumb ? <img src={thumb} alt="" style={{ width: 60, height: 44, objectFit: 'cover', borderRadius: 6 }} />
                          : <div style={{ width: 60, height: 44, background: '#f5f3ff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💰</div>}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b' }}>{i.name}</td>
                      <td style={{ padding: '14px 16px', color: '#64748b', fontSize: 13 }}>{i.address}</td>
                      <td style={{ padding: '14px 16px', color: '#7c3aed', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {i.price ? `${i.price.toLocaleString()}万円` : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#dc2626', fontWeight: 700 }}>
                        {i.yield_rate ? `${i.yield_rate}%` : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748b', fontSize: 13 }}>{i.nearest_station ? `${i.nearest_station} 徒歩${i.walk_minutes || '?'}分` : '—'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{s.text}</span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>{i.published ? '✅' : '🔒'}</td>
                      <td style={{ padding: '14px 16px' }}>
                <button onClick={() => { setEditItem(i); setForm({ name: i.name || '', address: i.address || '', price: String(i.price || ''), yield_rate: String(i.yield_rate || ''), building_type: i.building_type || '', built_year: String(i.built_year || ''), structure: i.structure || '', total_units: String(i.total_units || ''), occupied_units: String(i.occupied_units || ''), monthly_income: String(i.monthly_income || ''), area: String(i.area || ''), land_area: String(i.land_area || ''), nearest_station: i.nearest_station || '', walk_minutes: String(i.walk_minutes || ''), management_company: i.management_company || '', management_type: i.management_type || '', management_fee: String(i.management_fee || ''), repair_reserve: String(i.repair_reserve || ''), land_right: i.land_right || '', shared_ownership: i.shared_ownership || '', exclusive_area: String(i.exclusive_area || ''), water: i.water || '', electricity: i.electricity || '', gas: i.gas || '', road_frontage: i.road_frontage || '', fixed_asset_tax: String(i.fixed_asset_tax || ''), land_area_registry: String(i.land_area_registry || ''), city_planning: i.city_planning || '', use_district: i.use_district || '', other_regulations: i.other_regulations || '', reform_history: i.reform_history || '', loan_simulation: i.loan_simulation || '', remarks: i.remarks || '', features: i.features ? i.features.join('、') : '', description: i.description || '', status: i.status || 'available', published: i.published ?? true }); setUploadPreviews(Array.isArray(i.images) ? i.images : []); setShowForm(true) }}
                  style={{ background: '#e8f4fd', color: '#1a6aad', border: '1px solid #b3d4f0', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, marginRight: 4 }}>
                  編集
                </button>
                <button onClick={() => setQrItem(i)}
                  style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, marginRight: 4 }}>
                  QR
                </button>
                        <button onClick={() => handleDelete(i.id, i.name)}
                          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
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

      {qrItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 32, textAlign: 'center', maxWidth: 300 }}>
            <h3 style={{ marginBottom: 16, color: '#1e293b' }}>📱 QRコード</h3>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>{qrItem.name}</p>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin + '/investment/' + qrItem.id : '')}`} alt="QR" style={{ width: 200, height: 200, borderRadius: 8 }} />
            <br />
            <button onClick={() => setQrItem(null)} style={{ marginTop: 16, background: '#f1f5f9', color: '#374151', border: 'none', padding: '8px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>閉じる</button>
          </div>
        </div>
      )}
    </div>
  )
}

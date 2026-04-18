'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type PropertyType = 'sale' | 'rental' | 'investment'
type DocumentType = 'material' | 'guide'
type TabType = 'all' | PropertyType

type PropertyDoc = {
  id: number
  property_type: PropertyType
  property_id: number
  title: string
  description: string | null
  file_url: string
  document_type: DocumentType
  visible_to_public: boolean
  visible_to_agent: boolean
  is_active: boolean
  created_at: string
}

type PropertyOption = {
  id: number
  name: string
  type: PropertyType
}

const TYPE_LABEL: Record<PropertyType, string> = {
  sale: '売買',
  rental: '賃貸',
  investment: '収益',
}

const TYPE_BG: Record<PropertyType, { bg: string; color: string }> = {
  sale: { bg: '#E6F1FB', color: '#0C447C' },
  rental: { bg: '#FBEAF0', color: '#4B1528' },
  investment: { bg: '#FAEEDA', color: '#633806' },
}

const DOC_TYPE_BG: Record<DocumentType, { bg: string; color: string; label: string }> = {
  material: { bg: '#EAF3DE', color: '#27500A', label: '📄 物件資料' },
  guide: { bg: '#FBEAF0', color: '#4B1528', label: '🔑 案内方法' },
}

export default function PropertyDocumentsPage() {
  const [docs, setDocs] = useState<PropertyDoc[]>([])
  const [properties, setProperties] = useState<PropertyOption[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    property_type: 'sale' as PropertyType,
    property_id: 0,
    title: '',
    description: '',
    document_type: 'material' as DocumentType,
    visible_to_public: false,
    visible_to_agent: true,
  })
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const { data: docsData } = await supabase
      .from('property_documents')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    const [sale, rental, inv] = await Promise.all([
      supabase.from('properties').select('id, name'),
      supabase.from('rental_properties').select('id, name'),
      supabase.from('investment_properties').select('id, name'),
    ])

    const allProps: PropertyOption[] = []
    ;(sale.data || []).forEach(p => allProps.push({ id: p.id, name: p.name || '(無題)', type: 'sale' }))
    ;(rental.data || []).forEach(p => allProps.push({ id: p.id, name: p.name || '(無題)', type: 'rental' }))
    ;(inv.data || []).forEach(p => allProps.push({ id: p.id, name: p.name || '(無題)', type: 'investment' }))

    setDocs((docsData as PropertyDoc[]) || [])
    setProperties(allProps)
    setLoading(false)
  }

  const handleDocTypeChange = (type: DocumentType) => {
    setForm(f => ({
      ...f,
      document_type: type,
      visible_to_public: type === 'guide' ? false : f.visible_to_public,
    }))
  }

  const handleSubmit = async () => {
    if (!form.title || !form.property_id) {
      alert('物件とタイトルは必須です')
      return
    }
    if (!file) {
      alert('PDFファイルを選択してください')
      return
    }
    setSaving(true)
    try {
      const fileName = Date.now() + '_' + file.name
      const { error: upErr } = await supabase.storage
        .from('property-images')
        .upload('documents/' + fileName, file, { contentType: file.type })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage
        .from('property-images')
        .getPublicUrl('documents/' + fileName)
      const file_url = urlData.publicUrl

      const { error } = await supabase.from('property_documents').insert([{
        property_type: form.property_type,
        property_id: form.property_id,
        title: form.title,
        description: form.description || null,
        file_url: file_url,
        document_type: form.document_type,
        visible_to_public: form.visible_to_public,
        visible_to_agent: form.visible_to_agent,
      }])
      if (error) throw error

      resetForm()
      loadData()
    } catch (e: any) {
      alert('エラー: ' + (e.message || e))
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setForm({
      property_type: 'sale',
      property_id: 0,
      title: '',
      description: '',
      document_type: 'material',
      visible_to_public: false,
      visible_to_agent: true,
    })
    setFile(null)
    setShowForm(false)
  }

  const getPropertyName = (doc: PropertyDoc) => {
    const prop = properties.find(p => p.id === doc.property_id && p.type === doc.property_type)
    return prop?.name || '(物件情報なし)'
  }

  const filteredDocs = activeTab === 'all' ? docs : docs.filter(d => d.property_type === activeTab)
  const countByType = {
    all: docs.length,
    sale: docs.filter(d => d.property_type === 'sale').length,
    rental: docs.filter(d => d.property_type === 'rental').length,
    investment: docs.filter(d => d.property_type === 'investment').length,
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, color: '#1a3a5c' }}>📁 物件別書類管理</h1>
        <a href="/" style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none' }}>← ダッシュボード</a>
      </div>

      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
        物件ごとの資料(概要書、謄本、案内方法など)を管理します。
      </p>

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          style={{ padding: '10px 20px', background: '#1a3a5c', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, marginBottom: 20 }}
        >
          ＋ 書類を追加
        </button>
      )}

      {showForm && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#1a3a5c' }}>＋ 書類を追加</h3>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              対象物件 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={form.property_type + ':' + form.property_id}
              onChange={e => {
                const parts = e.target.value.split(':')
                setForm(f => ({ ...f, property_type: parts[0] as PropertyType, property_id: Number(parts[1]) }))
              }}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
            >
              <option value="sale:0">▼ 物件を選択してください</option>
              {properties.map(p => (
                <option key={p.type + ':' + p.id} value={p.type + ':' + p.id}>
                  【{TYPE_LABEL[p.type]}】{p.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              書類タイトル <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="例:物件概要書、キーボックス情報"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                書類種別 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={form.document_type}
                onChange={e => handleDocTypeChange(e.target.value as DocumentType)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
              >
                <option value="material">📄 物件資料</option>
                <option value="guide">🔑 案内方法</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                PDFファイル <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={e => setFile(e.target.files?.[0] || null)}
                style={{ width: '100%', padding: 6, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>説明（任意）</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="例:鍵の場所、暗証番号など"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ background: '#FAEEDA', borderRadius: 8, padding: 14, marginBottom: 16 }}>
            <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#633806' }}>🛡️ 公開範囲</p>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.visible_to_agent}
                onChange={e => setForm(f => ({ ...f, visible_to_agent: e.target.checked }))}
                style={{ marginTop: 3 }}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>仲介業者にメール送信OK</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>業者ポータルからの資料請求で即座に自動送信</div>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: form.document_type === 'guide' ? 'not-allowed' : 'pointer', opacity: form.document_type === 'guide' ? 0.5 : 1 }}>
              <input
                type="checkbox"
                checked={form.visible_to_public}
                onChange={e => setForm(f => ({ ...f, visible_to_public: e.target.checked }))}
                disabled={form.document_type === 'guide'}
                style={{ marginTop: 3 }}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>一般ユーザーにもメール送信OK</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>GINTETSUサイトの資料請求で送信。スタッフ承認フロー経由</div>
              </div>
            </label>

            {form.document_type === 'guide' && (
              <p style={{ margin: '10px 0 0', fontSize: 11, color: '#633806' }}>
                💡「案内方法」は一般ユーザーに送信不可（自動でOFF）
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{ padding: '10px 20px', background: saving ? '#9ca3af' : '#1a3a5c', color: 'white', border: 'none', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600 }}
            >
              {saving ? '保存中...' : '✅ 登録する'}
            </button>
            <button
              onClick={resetForm}
              style={{ padding: '10px 20px', background: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', 'sale', 'rental', 'investment'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              background: activeTab === tab ? '#1a3a5c' : 'white',
              color: activeTab === tab ? 'white' : '#374151',
              border: '1px solid ' + (activeTab === tab ? '#1a3a5c' : '#d1d5db'),
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {tab === 'all' ? 'すべて' : TYPE_LABEL[tab]} ({countByType[tab]})
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>読み込み中...</p>
      ) : filteredDocs.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>書類がまだ登録されていません</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredDocs.map(doc => {
            const typeStyle = TYPE_BG[doc.property_type]
            const docStyle = DOC_TYPE_BG[doc.document_type]
            return (
              <div key={doc.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ padding: '2px 8px', background: typeStyle.bg, color: typeStyle.color, borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                      {TYPE_LABEL[doc.property_type]}
                    </span>
                    <span style={{ padding: '2px 8px', background: docStyle.bg, color: docStyle.color, borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                      {docStyle.label}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{doc.title}</span>
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: 12, color: '#6b7280' }}>
                    {getPropertyName(doc)}{doc.description ? ' / ' + doc.description : ''}
                  </p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ padding: '2px 6px', background: doc.visible_to_agent ? '#FAEEDA' : '#F1EFE8', color: doc.visible_to_agent ? '#633806' : '#6b7280', borderRadius: 6, fontSize: 11 }}>
                      {doc.visible_to_agent ? '✓' : '✕'} 業者送信{doc.visible_to_agent ? 'OK' : 'NG'}
                    </span>
                    <span style={{ padding: '2px 6px', background: doc.visible_to_public ? '#FAEEDA' : '#F1EFE8', color: doc.visible_to_public ? '#633806' : '#6b7280', borderRadius: 6, fontSize: 11 }}>
                      {doc.visible_to_public ? '✓' : '✕'} 一般送信{doc.visible_to_public ? 'OK' : 'NG'}
                    </span>
                  </div>
                </div>
                
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: '6px 12px', background: 'white', color: '#1a3a5c', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12, textDecoration: 'none' }}
                >
                  📥 PDF
                </a>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

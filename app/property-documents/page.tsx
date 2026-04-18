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

      <button
        style={{ padding: '10px 20px', background: '#1a3a5c', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, marginBottom: 20 }}
      >
        ＋ 書類を追加
      </button>

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

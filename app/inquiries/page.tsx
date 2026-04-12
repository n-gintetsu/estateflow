'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../src/app/lib/supabase'

export default function Inquiries() {
  const [inquiries, setInquiries] = useState<any[]>([])

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('document_requests').select('*').order('created_at', { ascending: false })
      setInquiries(data || [])
    }
    fetch()
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 24 }}>問い合わせ一覧</h1>
      {inquiries.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: 48 }}>問い合わせはありません</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['日時', '物件名', '氏名', 'メール', '種別', 'ステータス'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inquiries.map(i => (
              <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>{new Date(i.created_at).toLocaleDateString('ja-JP')}</td>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>{i.property_name || '-'}</td>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>{i.name || '-'}</td>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>{i.email || '-'}</td>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>{i.type || '-'}</td>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>{i.status || '未対応'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

'use client'
import { useState, useEffect } from "react";
import { supabase } from "../src/app/lib/supabase";

export default function Home() {
  const [stats, setStats] = useState({ properties: 0, rental: 0, inquiries: 0, schedules: 0 });
  const [recentInquiries, setRecentInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [
        { count: propCount },
        { count: rentalCount },
        { count: inqCount },
        { count: schedCount },
        { data: inquiries }
      ] = await Promise.all([
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('rental_properties').select('*', { count: 'exact', head: true }),
        supabase.from('document_requests').select('*', { count: 'exact', head: true }),
        supabase.from('schedules').select('*', { count: 'exact', head: true }),
        supabase.from('document_requests').select('*').order('created_at', { ascending: false }).limit(5),
      ]);
      setStats({
        properties: propCount || 0,
        rental: rentalCount || 0,
        inquiries: inqCount || 0,
        schedules: schedCount || 0,
      });
      setRecentInquiries(inquiries || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const statCards = [
    { icon: '🏢', label: '売買物件数', value: stats.properties, color: '#dbeafe' },
    { icon: '🏘', label: '賃貸物件数', value: stats.rental, color: '#dcfce7' },
    { icon: '💬', label: '資料請求数', value: stats.inquiries, color: '#fef9c3' },
    { icon: '📅', label: '内見スケジュール', value: stats.schedules, color: '#fce7f3' },
  ];

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 }}>ダッシュボード</h1>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 24 }}>{new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      {/* 統計カード */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {statCards.map(card => (
          <div key={card.label} style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{card.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1e293b' }}>{loading ? '...' : card.value}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* 外部リンク */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { icon: '📊', label: 'Google Analytics', desc: 'アクセス解析・リアルタイム', url: 'https://analytics.google.com/analytics/web/#/a390991849p532556612/realtime/overview', color: '#f0fdf4', border: '#86efac' },
          { icon: '🌐', label: 'GINTETSUサイト', desc: '公式ホームページを確認', url: 'https://gintetsu-fudosan.co.jp', color: '#eff6ff', border: '#93c5fd' },
          { icon: '📅', label: '無料相談予約', desc: '予約状況を確認', url: 'https://gintetsu-fudosan.co.jp/reservation', color: '#fefce8', border: '#fde047' },
        ].map(link => (
          <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
            style={{ background: link.color, borderRadius: 16, padding: 20, border: `1px solid ${link.border}`, textDecoration: 'none', display: 'block', transition: 'opacity 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{link.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 }}>{link.label}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{link.desc}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>外部リンク →</div>
          </a>
        ))}
      </div>

      {/* 最新資料請求 */}
      <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
        <h2 style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 }}>最新資料請求</h2>
        {loading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: 24 }}>読み込み中...</p>
        ) : recentInquiries.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: 24 }}>資料請求はありません</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['日時', '物件名', '氏名', 'メール', 'ステータス'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentInquiries.map(i => (
                <tr key={i.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#64748b' }}>{new Date(i.created_at).toLocaleDateString('ja-JP')}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>{i.property_name || '-'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>{i.name || '-'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>{i.email || '-'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>
                    <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>{i.status || '未対応'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

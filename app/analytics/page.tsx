'use client'
import { useState, useEffect } from "react";
import { supabase } from "../../src/app/lib/supabase";

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    properties: 0,
    rentals: 0,
    investments: 0,
    agents: 0,
    schedules: 0,
    documents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [p, r, i, a, s, d] = await Promise.all([
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        fetch('/api/rental-properties?count=1').then(r => r.json()).then(d => ({ count: d.count ?? 0 })),
        supabase.from('investment_properties').select('*', { count: 'exact', head: true }),
        fetch('/api/agents?count=1').then(r => r.json()).then(d => ({ count: d.count ?? 0 })),
        supabase.from('schedules').select('*', { count: 'exact', head: true }),
        supabase.from('agent_documents').select('*', { count: 'exact', head: true }),
      ]);
      setStats({
        properties: p.count || 0,
        rentals: r.count || 0,
        investments: i.count || 0,
        agents: a.count || 0,
        schedules: s.count || 0,
        documents: d.count || 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "売買物件", value: stats.properties, icon: "🏢", color: "#dbeafe", textColor: "#1e40af" },
    { label: "賃貸物件", value: stats.rentals, icon: "🏠", color: "#d1fae5", textColor: "#065f46" },
    { label: "収益物件", value: stats.investments, icon: "💰", color: "#fef3c7", textColor: "#92400e" },
    { label: "仲介業者", value: stats.agents, icon: "🤝", color: "#ede9fe", textColor: "#4c1d95" },
    { label: "内見予約", value: stats.schedules, icon: "📅", color: "#fce7f3", textColor: "#9d174d" },
    { label: "書類", value: stats.documents, icon: "📋", color: "#f1f5f9", textColor: "#475569" },
  ];

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: "bold", color: "#1e293b", margin: 0 }}>分析ダッシュボード</h1>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>データベースの現状サマリー</p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>読み込み中...</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            {cards.map(card => (
              <div key={card.label} style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: card.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{card.icon}</div>
                  <span style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>{card.label}</span>
                </div>
                <div style={{ fontSize: 36, fontWeight: "bold", color: card.textColor }}>{card.value}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>件</div>
              </div>
            ))}
          </div>

          <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: 16, fontWeight: "bold", color: "#1e293b", marginBottom: 16 }}>📊 物件比率</h3>
            {[
              { label: "売買物件", value: stats.properties, color: "#3b82f6" },
              { label: "賃貸物件", value: stats.rentals, color: "#10b981" },
              { label: "収益物件", value: stats.investments, color: "#f59e0b" },
            ].map(item => {
              const total = stats.properties + stats.rentals + stats.investments || 1;
              const pct = Math.round((item.value / total) * 100);
              return (
                <div key={item.label} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "#475569" }}>{item.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{item.value}件 ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: item.color, borderRadius: 4, transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

'use client'
import Sidebar from '../layout-sidebar'
import { useState, useEffect } from "react";
import { supabase } from "../../src/app/lib/supabase";

export default function NewsPage() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", published: false });
  const [editId, setEditId] = useState<string | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    const { data } = await supabase.from("news").select("*").order("created_at", { ascending: false });
    if (data) setNews(data);
    setLoading(false);
  };

  useEffect(() => { fetchNews(); }, []);

  const save = async () => {
    if (!form.title || !form.content) return alert("タイトルと本文は必須です");
    if (editId) {
      await supabase.from("news").update(form).eq("id", editId);
    } else {
      await supabase.from("news").insert(form);
    }
    setForm({ title: "", content: "", published: false });
    setEditId(null);
    setShowForm(false);
    fetchNews();
  };

  const del = async (id: string) => {
    if (!confirm("削除しますか？")) return;
    await supabase.from("news").delete().eq("id", id);
    fetchNews();
  };

  const edit = (item: any) => {
    setForm({ title: item.title, content: item.content, published: item.published });
    setEditId(item.id);
    setShowForm(true);
  };

  return (
    <div style={{ display: 'flex' }}>
    <Sidebar />
    <div style={{ flex: 1, padding: 24 }} style={{ padding: 24, fontFamily: "sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: "bold", color: "#1e293b", margin: 0 }}>お知らせ管理</h1>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>GINTETSUサイトのお知らせを管理します</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ title: "", content: "", published: false }); }}
          style={{ background: "#1e40af", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
          ＋ 新規作成
        </button>
      </div>

      {showForm && (
        <div style={{ background: "white", borderRadius: 16, padding: 24, marginBottom: 24, border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: 16, fontWeight: "bold", color: "#1e293b", marginBottom: 16 }}>{editId ? "お知らせ編集" : "新規お知らせ作成"}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>タイトル *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} placeholder="お知らせタイトルを入力" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>本文 *</label>
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box" }} rows={6} placeholder="お知らせ内容を入力" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" id="published" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} />
              <label htmlFor="published" style={{ fontSize: 14, color: "#475569", cursor: "pointer" }}>公開する</label>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button onClick={() => { setShowForm(false); setEditId(null); }}
              style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 14, color: "#475569" }}>キャンセル</button>
            <button onClick={save}
              style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#1e40af", cursor: "pointer", fontSize: 14, color: "white", fontWeight: 600 }}>保存する</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>読み込み中...</div>
      ) : news.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, background: "white", borderRadius: 16, color: "#94a3b8" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📢</div>
          <div>お知らせがまだありません</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {news.map(item => (
            <div key={item.id} style={{ background: "white", borderRadius: 16, padding: 20, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: "bold", color: "#1e293b" }}>{item.title}</span>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: item.published ? "#d1fae5" : "#f1f5f9", color: item.published ? "#065f46" : "#64748b", fontWeight: 600 }}>
                    {item.published ? "公開中" : "下書き"}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>{item.content.slice(0, 100)}...</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{new Date(item.created_at).toLocaleDateString("ja-JP")}</div>
              </div>
              <div style={{ display: "flex", gap: 8, marginLeft: 16 }}>
                <button onClick={() => edit(item)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 13, color: "#475569" }}>編集</button>
                <button onClick={() => del(item.id)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#fee2e2", cursor: "pointer", fontSize: 13, color: "#991b1b" }}>削除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
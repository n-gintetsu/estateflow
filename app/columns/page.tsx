'use client'
import { useState, useEffect } from "react";
import { supabase } from "../../src/app/lib/supabase";

export default function ColumnsPage() {
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", category: "", published: false });
  const [editId, setEditId] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("columns").select("*").order("created_at", { ascending: false });
    if (data) setColumns(data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const save = async () => {
    if (!form.title || !form.content) return alert("タイトルと本文は必須です");
    if (editId) {
      await supabase.from("columns").update(form).eq("id", editId);
    } else {
      await supabase.from("columns").insert({ ...form, slug: crypto.randomUUID() });
    }
    setForm({ title: "", content: "", category: "", published: false });
    setEditId(null);
    setShowForm(false);
    fetch();
  };

  const del = async (id: string) => {
    if (!confirm("削除しますか？")) return;
    await supabase.from("columns").delete().eq("id", id);
    fetch();
  };

  const edit = (col: any) => {
    setForm({ title: col.title, content: col.content, category: col.category || "", published: col.published });
    setEditId(col.id);
    setShowForm(true);
  };

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: "bold", color: "#1e293b", margin: 0 }}>コラム管理</h1>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>GINTETSUサイトのコラム記事を管理します</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ title: "", content: "", category: "", published: false }); }}
          style={{ background: "#1e40af", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
          ＋ 新規作成
        </button>
      </div>

      {showForm && (
        <div style={{ background: "white", borderRadius: 16, padding: 24, marginBottom: 24, border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: 16, fontWeight: "bold", color: "#1e293b", marginBottom: 16 }}>{editId ? "コラム編集" : "新規コラム作成"}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>タイトル *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} placeholder="記事タイトルを入力" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>カテゴリ</label>
              <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} placeholder="例：不動産売買、相続、空家" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>本文 *</label>
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box" }} rows={8} placeholder="記事本文を入力（Markdown対応）" />
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
      ) : columns.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, background: "white", borderRadius: 16, color: "#94a3b8" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📝</div>
          <div>コラム記事がまだありません</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {columns.map(col => (
            <div key={col.id} style={{ background: "white", borderRadius: 16, padding: 20, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: "bold", color: "#1e293b" }}>{col.title}</span>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: col.published ? "#d1fae5" : "#f1f5f9", color: col.published ? "#065f46" : "#64748b", fontWeight: 600 }}>
                    {col.published ? "公開中" : "下書き"}
                  </span>
                  {col.category && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#dbeafe", color: "#1e40af", fontWeight: 600 }}>{col.category}</span>}
                </div>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>{col.content.slice(0, 80)}...</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{new Date(col.created_at).toLocaleDateString("ja-JP")}</div>
              </div>
              <div style={{ display: "flex", gap: 8, marginLeft: 16 }}>
                <button onClick={() => edit(col)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 13, color: "#475569" }}>編集</button>
                <button onClick={() => del(col.id)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#fee2e2", cursor: "pointer", fontSize: 13, color: "#991b1b" }}>削除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

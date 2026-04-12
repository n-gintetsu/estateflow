'use client'
import { useState, useEffect } from "react";
import { supabase } from "../../src/app/lib/supabase";

type Tab = "competitive" | "keyword" | "article";

export default function PromoPage() {
  const [tab, setTab] = useState<Tab>("article");
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<any[]>([]);

  const fetchSaved = async () => {
    const { data } = await supabase.from("promo_library").select("*").order("created_at", { ascending: false });
    if (data) setSaved(data);
  };

  useEffect(() => { fetchSaved(); }, []);

  const prompts: Record<Tab, string> = {
    competitive: `あなたは不動産会社のSEOコンサルタントです。以下のキーワードで競合サイトを想定した分析レポートを日本語で作成してください。ターゲットキーワード、想定競合、差別化ポイント、推奨コンテンツ戦略を含めてください。\n\nキーワード：`,
    keyword: `あなたは不動産会社のSEOコンサルタントです。以下のテーマに関連するSEOキーワード戦略を日本語で作成してください。メインキーワード、ロングテールキーワード、月間検索ボリューム予測、優先度を含めてください。\n\nテーマ：`,
    article: `あなたはGINTETSU不動産（さいたま市大宮区）のブログライターです。以下のテーマで、地域の不動産情報として役立つSEO記事を日本語で書いてください。見出し（H2/H3）を使い、1500〜2000文字程度でわかりやすく書いてください。記事の最後に必ず以下の会社情報を入れてください：

【GINTETSU不動産】
📍 埼玉県さいたま市大宮区桜木町1-366-9 オープンオフィス大宮駅西口ビル402
📞 048-606-4317（平日9:00〜18:00）
✉️ info@gintetsu-fudosan.co.jp
🏢 埼玉県知事(1)第25256号
\n\nテーマ：`,
  };

  const tabLabels: Record<Tab, string> = {
    competitive: "🔍 競合分析",
    keyword: "🎯 KW戦略",
    article: "✍️ 記事生成",
  };

  const run = async () => {
    if (!input.trim()) return alert("テーマ・キーワードを入力してください");
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompts[tab] + input }),
      });
      const data = await res.json();
      setResult(data.result || "エラーが発生しました");
    } catch {
      setResult("エラーが発生しました");
    }
    setLoading(false);
  };

  const saveToLibrary = async () => {
    if (!result) return;
    await supabase.from("promo_library").insert({
      title: input,
      content: result,
      type: tab,
      published: false,
    });
    fetchSaved();
    alert("ライブラリに保存しました！");
  };

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: "bold", color: "#1e293b", margin: 0 }}>PromoIQ</h1>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>AIを使ったSEOコンテンツ生成ツール</p>
      </div>

      {/* タブ */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(Object.keys(tabLabels) as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "8px 20px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 14, fontWeight: tab === t ? 600 : 400, background: tab === t ? "#1e40af" : "white", color: tab === t ? "white" : "#475569", boxShadow: tab === t ? "none" : "0 1px 3px rgba(0,0,0,0.05)" }}>
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {/* 入力エリア */}
      <div style={{ background: "white", borderRadius: 16, padding: 20, marginBottom: 16, border: "1px solid #e2e8f0" }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 8 }}>
          {tab === "competitive" ? "分析したいキーワードを入力" : tab === "keyword" ? "KW戦略を立てたいテーマを入力" : "記事にしたいテーマを入力"}
        </label>
        <div style={{ display: "flex", gap: 12 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && run()}
            style={{ flex: 1, padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none" }}
            placeholder={tab === "article" ? "例：空室を相続した時の対策" : "例：さいたま市 不動産売却"} />
          <button onClick={run} disabled={loading}
            style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: loading ? "#94a3b8" : "#1e40af", color: "white", cursor: loading ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>
            {loading ? "生成中..." : "生成する"}
          </button>
        </div>
      </div>

      {/* 結果 */}
      {(result || loading) && (
        <div style={{ background: "white", borderRadius: 16, padding: 20, marginBottom: 16, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", margin: 0 }}>生成結果</h3>
              {result && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={saveToLibrary}
                    style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: "#d1fae5", color: "#065f46", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                    📋 ライブラリに保存
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(result); alert("コピーしました！"); }}
                    style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: "#dbeafe", color: "#1e40af", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                    📄 記事をコピー
                  </button>
                </div>
              )}
          </div>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>AIが生成中です...</div>
          ) : (
            <div style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.8, whiteSpace: "pre-wrap", maxHeight: 500, overflowY: "auto" }}>{result}</div>
          )}
        </div>
      )}

      {/* 保存済みライブラリ */}
      {saved.length > 0 && (
        <div style={{ background: "white", borderRadius: 16, padding: 20, border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", marginBottom: 16 }}>📚 保存済みコンテンツ</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {saved.map(item => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", borderRadius: 10 }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{item.title}</span>
                  <span style={{ marginLeft: 8, fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#dbeafe", color: "#1e40af" }}>
                    {item.type === "article" ? "記事" : item.type === "keyword" ? "KW戦略" : "競合分析"}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{new Date(item.created_at).toLocaleDateString("ja-JP")}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

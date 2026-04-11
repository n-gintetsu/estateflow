'use client'
import { useState, useEffect } from "react";
import { supabase } from "../src/app/lib/supabase";

const PROPERTIES = [
  { id: 1, name: "パークタワー渋谷", address: "東京都渋谷区道玄坂1-1-1", price: 85000, area: 45.2, rooms: "1LDK", floor: 8, status: "募集中", type: "マンション", inquiries: 12, views: 340 },
  { id: 2, name: "グランドハイツ新宿", address: "東京都新宿区西新宿2-3-4", price: 120000, area: 62.5, rooms: "2LDK", floor: 15, status: "申込中", type: "マンション", inquiries: 8, views: 210 },
  { id: 3, name: "サンライズ目黒", address: "東京都目黒区目黒3-5-2", price: 95000, area: 52.0, rooms: "2DK", floor: 3, status: "募集中", type: "マンション", inquiries: 5, views: 180 },
  { id: 4, name: "ブルースカイ品川", address: "東京都品川区大井1-7-3", price: 72000, area: 38.1, rooms: "1K", floor: 5, status: "募集中", type: "マンション", inquiries: 18, views: 420 },
];

const INQUIRIES = [
  { id: 1, name: "田中 太郎", property: "パークタワー渋谷", date: "2026-03-18", status: "未対応", message: "内見を希望しています。週末は可能でしょうか？" },
  { id: 2, name: "鈴木 花子", property: "グランドハイツ新宿", date: "2026-03-17", status: "対応中", message: "ペット可能かどうか確認したいです。" },
  { id: 3, name: "佐藤 次郎", property: "ブルースカイ品川", date: "2026-03-16", status: "完了", message: "申込書類の準備が完了しました。" },
];

const Badge = ({ status }: { status: string }) => {
  const colors: { [key: string]: string } = {
    "募集中": "background:#d1fae5;color:#065f46",
    "申込中": "background:#fef3c7;color:#92400e",
    "契約済": "background:#f1f5f9;color:#475569",
    "未対応": "background:#fee2e2;color:#991b1b",
    "対応中": "background:#dbeafe;color:#1e40af",
    "完了": "background:#d1fae5;color:#065f46",
  };
  const style = colors[status] || "background:#f1f5f9;color:#475569";
  return <span style={{...Object.fromEntries(style.split(";").map(s => s.split(":"))) as React.CSSProperties, padding:"2px 10px", borderRadius:20, fontSize:12, fontWeight:600}}>{status}</span>;
};

export default function Home() {
  const [screen, setScreen] = useState("dashboard");

  const nav = [
    { id: "dashboard", label: "ダッシュボード", icon: "📊" },
    { id: "properties", label: "物件管理", icon: "🏢" },
    { id: "inquiries", label: "問い合わせ", icon: "💬" },
     { id: "schedule", label: "内見スケジュール", icon: "📅" },
      { id: "linebot", label: "LINE Bot", icon: "💚" },
      { id: "mail", label: "メール通知", icon: "📧" },
       { id: "users", label: "ユーザー管理", icon: "👥" },
        { id: "branches", label: "拠点管理", icon: "🏬" },
  { id: "rental", label: "賃貸管理", icon: "🏠", href: "/rental" },
  { id: "investment", label: "収益物件管理", icon: "💰", href: "/investment" },
  { id: "agents", label: "仲介業者管理", icon: "🤝", href: "/agents" },
    { id: 'documents', label: "書類管理", icon: "📋", href: "/documents" },
  { id: 'columns', label: "コラム管理", icon: "✍️", href: "/columns" },
  { id: 'news', label: "お知らせ管理", icon: "📢", href: "/news" },
  { id: 'promo', label: "PromoIQ", icon: "🤖", href: "/promo" },
  ];

  return (
    <div style={{display:"flex", height:"100vh", fontFamily:"sans-serif", background:"#f8fafc"}}>
      {/* サイドバー */}
      <div style={{width:200, background:"white", borderRight:"1px solid #e2e8f0", display:"flex", flexDirection:"column", padding:16}}>
        <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:24, padding:"8px 0"}}>
          <div style={{width:32, height:32, background:"#1e40af", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:"bold"}}>不</div>
          <span style={{fontWeight:"bold", color:"#1e293b"}}>EstateFlow</span>
        </div>
        {nav.map(n => (
          <button key={n.id} onClick={() => n.href ? window.location.href = n.href : setScreen(n.id)} style={{display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:10, border:"none", cursor:"pointer", marginBottom:4, background: screen === n.id ? "#1e40af" : "transparent", color: screen === n.id ? "white" : "#475569", fontWeight: screen === n.id ? 600 : 400, fontSize:14, textAlign:"left"}}>
            <span>{n.icon}</span>{n.label}
          </button>
        ))}
      
      <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', borderRadius:10, border:'none', cursor:'pointer', background:'transparent', color:'#ef4444', fontWeight:600, fontSize:14, textAlign:'left', width:'100%'}}>
            <span>🚪</span>ログアウト
          </button>
          </div> 

      {/* メインコンテンツ */}
      <div style={{flex:1, overflow:"auto", padding:24}}>
        {screen === "dashboard" && <Dashboard />}
        {screen === "properties" && <Properties />}
        {screen === "inquiries" && <Inquiries />}
        {screen === "schedule" && <Schedule />}
        {screen === "linebot" && <LineBot />}
         {screen === "mail" && <MailWorkflow />}
        {screen === "users" && <UserManagement />}
         {screen === "branches" && <BranchManagement />}
      </div>
    </div>
  );
}

function Dashboard() {
   useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase.from('properties').select('*');
      if (data) console.log('DB接続成功！', data);
      if (error) console.log('エラー:', error);
    };
    fetchProperties();
  }, []);
  return (
    <div>
      <h1 style={{fontSize:24, fontWeight:"bold", color:"#1e293b", marginBottom:4}}>ダッシュボード</h1>
      <p style={{color:"#64748b", marginBottom:24}}>2026年3月22日</p>
      <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:16, marginBottom:24}}>
        {[["🏢","掲載物件数","142","前月比 +8"],["💬","今月問い合わせ","87","前月比 +23%"],["📅","今月内見数","34","前月比 +12%"],["✅","今月成約","12","前月比 +3"]].map(([icon,label,val,sub]) => (
          <div key={label} style={{background:"white", borderRadius:16, padding:20, boxShadow:"0 1px 3px rgba(0,0,0,0.05)", border:"1px solid #f1f5f9"}}>
            <div style={{fontSize:24, marginBottom:8}}>{icon}</div>
            <div style={{fontSize:12, color:"#64748b", marginBottom:4}}>{label}</div>
            <div style={{fontSize:28, fontWeight:"bold", color:"#1e293b"}}>{val}</div>
            <div style={{fontSize:12, color:"#94a3b8"}}>{sub}</div>
          </div>
        ))}
      </div>
      <div style={{background:"white", borderRadius:16, padding:20, boxShadow:"0 1px 3px rgba(0,0,0,0.05)", border:"1px solid #f1f5f9"}}>
        <h2 style={{fontSize:16, fontWeight:"bold", color:"#1e293b", marginBottom:16}}>最新問い合わせ</h2>
        {INQUIRIES.map(inq => (
          <div key={inq.id} style={{display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:"1px solid #f8fafc"}}>
            <div style={{width:36, height:36, borderRadius:"50%", background:"#dbeafe", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"bold", color:"#1e40af"}}>{inq.name[0]}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:14, fontWeight:500, color:"#1e293b"}}>{inq.name} → {inq.property}</div>
              <div style={{fontSize:12, color:"#94a3b8"}}>{inq.message}</div>
            </div>
            <Badge status={inq.status} />
            <div style={{fontSize:12, color:"#94a3b8"}}>{inq.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Properties() {
  const [dbProperties, setDbProperties] = useState<any[]>([]);
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('properties').select('*');
      if (data && data.length > 0) setDbProperties(data);
    };
    fetch();
  }, []);
  const displayProperties = dbProperties.length > 0 ? dbProperties : PROPERTIES;
  return (
    <div>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24}}>
        <h1 style={{fontSize:24, fontWeight:"bold", color:"#1e293b"}}>物件管理</h1>
        <button style={{background:"#1e40af", color:"white", border:"none", borderRadius:10, padding:"8px 16px", cursor:"pointer", fontSize:14}}>＋ 新規登録</button>
      </div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:16}}>
        {displayProperties.map(p => (
          <div key={p.id} style={{background:"white", borderRadius:16, padding:20, boxShadow:"0 1px 3px rgba(0,0,0,0.05)", border:"1px solid #f1f5f9"}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8}}>
              <div style={{fontSize:18, fontWeight:"bold", color:"#1e293b"}}>{p.name}</div>
              <Badge status={p.status} />
            </div>
            <div style={{fontSize:13, color:"#64748b", marginBottom:12}}>📍 {p.address}</div>
            <div style={{display:"flex", gap:16, fontSize:14}}>
              <span style={{fontWeight:"bold", color:"#1e40af"}}>¥{p.price.toLocaleString()}<span style={{fontSize:11, color:"#94a3b8", fontWeight:400}}>/月</span></span>
              <span style={{color:"#64748b"}}>{p.rooms}</span>
              <span style={{color:"#64748b"}}>{p.area}㎡</span>
              <span style={{color:"#64748b"}}>{p.floor}F</span>
            </div>
            <div style={{display:"flex", gap:12, marginTop:8, fontSize:12, color:"#94a3b8"}}>
              <span>👁 {p.views}</span><span>💬 {p.inquiries}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Inquiries() {
  const [selected, setSelected] = useState(INQUIRIES[0]);
  return (
    <div>
      <h1 style={{fontSize:24, fontWeight:"bold", color:"#1e293b", marginBottom:24}}>問い合わせ管理</h1>
      <div style={{display:"flex", gap:16}}>
        <div style={{width:280, background:"white", borderRadius:16, border:"1px solid #e2e8f0", overflow:"hidden"}}>
          {INQUIRIES.map(inq => (
            <div key={inq.id} onClick={() => setSelected(inq)} style={{padding:16, cursor:"pointer", borderBottom:"1px solid #f8fafc", background: selected.id === inq.id ? "#eff6ff" : "white"}}>
              <div style={{display:"flex", justifyContent:"space-between", marginBottom:4}}>
                <span style={{fontWeight:600, fontSize:14, color:"#1e293b"}}>{inq.name}</span>
                <Badge status={inq.status} />
              </div>
              <div style={{fontSize:12, color:"#64748b"}}>{inq.property}</div>
            </div>
          ))}
        </div>
        <div style={{flex:1, background:"white", borderRadius:16, border:"1px solid #e2e8f0", padding:20}}>
          <h2 style={{fontSize:18, fontWeight:"bold", color:"#1e293b", marginBottom:4}}>{selected.name}</h2>
          <p style={{fontSize:13, color:"#64748b", marginBottom:16}}>対象物件：{selected.property}</p>
          <div style={{background:"#eff6ff", borderRadius:12, padding:16, marginBottom:16}}>
            <p style={{fontSize:14, color:"#1e293b"}}>{selected.message}</p>
            <p style={{fontSize:12, color:"#94a3b8", marginTop:8}}>{selected.date}</p>
          </div>
          <textarea style={{width:"100%", border:"1px solid #e2e8f0", borderRadius:10, padding:12, fontSize:14, resize:"none", outline:"none"}} rows={3} placeholder="返信を入力..." />
          <button style={{marginTop:8, background:"#1e40af", color:"white", border:"none", borderRadius:10, padding:"8px 20px", cursor:"pointer", fontSize:14}}>📧 返信する</button>
        </div>
      </div>
    </div>
  );
}
const SCHEDULES = [
  { id: 1, property: "パークタワー渋谷", client: "田中 太郎", date: "2026-03-22", time: "10:00", agent: "山本 担当", status: "確定" },
  { id: 2, property: "グランドハイツ新宿", client: "伊藤 良子", date: "2026-03-22", time: "14:00", agent: "佐々木 担当", status: "仮予約" },
  { id: 3, property: "サンライズ目黒", client: "渡辺 謙一", date: "2026-03-23", time: "11:00", agent: "山本 担当", status: "確定" },
  { id: 4, property: "ブルースカイ品川", client: "小林 正樹", date: "2026-03-24", time: "15:30", agent: "田村 担当", status: "確定" },
  { id: 5, property: "リバーサイド墨田", client: "加藤 美穂", date: "2026-03-25", time: "13:00", agent: "佐々木 担当", status: "キャンセル" },
];

function Schedule() {
  const [selected, setSelected] = useState<number | null>(null);
  const statusColor: { [key: string]: string } = {
    "確定": "#10b981", "仮予約": "#f59e0b", "キャンセル": "#ef4444"
  };
  return (
    <div>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24}}>
        <h1 style={{fontSize:24, fontWeight:"bold", color:"#1e293b"}}>内見スケジュール</h1>
        <button style={{background:"#1e40af", color:"white", border:"none", borderRadius:10, padding:"8px 16px", cursor:"pointer", fontSize:14}}>＋ 予約追加</button>
      </div>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
        {SCHEDULES.map(s => (
          <div key={s.id} onClick={() => setSelected(selected === s.id ? null : s.id)}
            style={{background:"white", borderRadius:16, padding:20, border: selected === s.id ? "2px solid #1e40af" : "1px solid #e2e8f0", cursor:"pointer", boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
            <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:8}}>
              <div style={{width:10, height:10, borderRadius:"50%", background: statusColor[s.status]}} />
              <span style={{fontWeight:"bold", color:"#1e293b", fontSize:15}}>{s.property}</span>
            </div>
            <div style={{fontSize:13, color:"#64748b", marginBottom:4}}>👤 {s.client}</div>
            <div style={{fontSize:13, color:"#64748b", marginBottom:4}}>📅 {s.date} {s.time}〜</div>
            <div style={{fontSize:13, color:"#64748b", marginBottom:12}}>🏷 担当：{s.agent}</div>
            <Badge status={s.status} />
            {selected === s.id && (
              <div style={{marginTop:12, paddingTop:12, borderTop:"1px solid #f1f5f9", display:"flex", gap:8}}>
                <button style={{flex:1, padding:"6px 0", borderRadius:8, border:"none", background:"#1e40af", color:"white", cursor:"pointer", fontSize:13}}>編集</button>
                <button style={{flex:1, padding:"6px 0", borderRadius:8, border:"none", background:"#fee2e2", color:"#991b1b", cursor:"pointer", fontSize:13}}>キャンセル</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
const LINE_MESSAGES = [
  { role: "user", text: "こんにちは！渋谷周辺で1LDKを探しています", time: "10:00" },
  { role: "bot", text: "こんにちは！渋谷周辺の1LDKをお探しですね。ご予算はどのくらいをお考えですか？", time: "10:00" },
  { role: "user", text: "8万円くらいで考えています", time: "10:01" },
  { role: "bot", text: "ご予算8万円以内の渋谷周辺1LDKをご紹介します！\n\n🏢 パークタワー渋谷\n📍 渋谷区道玄坂1-1-1\n💰 85,000円/月\n📐 45.2㎡ | 8F\n\nこちらはいかがでしょうか？", time: "10:01" },
  { role: "user", text: "内見できますか？", time: "10:02" },
  { role: "bot", text: "はい、内見可能です！ご希望の日時を教えていただけますか？\n\n📅 3月22日(日) 10:00〜\n📅 3月23日(月) 14:00〜\n📅 3月24日(火) 11:00〜", time: "10:02" },
];

function LineBot() {
  const [messages, setMessages] = useState(LINE_MESSAGES);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const send = () => {
    if (!input.trim()) return;
    const now = new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    setMessages(prev => [...prev, { role: "user", text: input, time: now }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const replies: { [key: string]: string } = {
        "礼金": "礼金0の物件もご用意しています！",
        "ペット": "ペット可物件も多数ございます。",
        "駐車場": "駐車場付き物件をご希望ですか？",
      };
      const key = Object.keys(replies).find(k => input.includes(k));
      const reply = key ? replies[key] : "ありがとうございます。担当者より折り返しご連絡いたします。";
      setMessages(prev => [...prev, { role: "bot", text: reply, time: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }) }]);
      setTyping(false);
    }, 1500);
  };

  return (
    <div>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24}}>
        <h1 style={{fontSize:24, fontWeight:"bold", color:"#1e293b"}}>LINE Bot シミュレーター</h1>
        <div style={{display:"flex", alignItems:"center", gap:8, background:"#d1fae5", padding:"6px 16px", borderRadius:20}}>
          <div style={{width:8, height:8, borderRadius:"50%", background:"#10b981"}} />
          <span style={{fontSize:13, color:"#065f46", fontWeight:600}}>Bot 稼働中</span>
        </div>
      </div>
      <div style={{display:"flex", gap:20}}>
        {/* スマホ画面 */}
        <div style={{width:320, background:"#1e293b", borderRadius:32, padding:16, boxShadow:"0 20px 40px rgba(0,0,0,0.3)"}}>
          <div style={{background:"#00b900", borderRadius:"16px 16px 0 0", padding:"12px 16px", display:"flex", alignItems:"center", gap:10}}>
            <div style={{width:36, height:36, background:"white", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"bold", color:"#00b900", fontSize:14}}>不</div>
            <div>
              <div style={{color:"white", fontWeight:"bold", fontSize:14}}>不動産サポートBot</div>
              <div style={{color:"#bbf7d0", fontSize:11}}>オンライン</div>
            </div>
          </div>
          <div style={{background:"#87ceeb20", backgroundColor:"#e8f4f8", height:320, overflowY:"auto", padding:12, display:"flex", flexDirection:"column", gap:10}}>
            {messages.map((msg, i) => (
              <div key={i} style={{display:"flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap:6}}>
                {msg.role === "bot" && (
                  <div style={{width:28, height:28, background:"#00b900", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, flexShrink:0, marginTop:2}}>🤖</div>
                )}
                <div>
                  <div style={{maxWidth:180, padding:"8px 12px", borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px", background: msg.role === "user" ? "#00b900" : "white", color: msg.role === "user" ? "white" : "#1e293b", fontSize:12, lineHeight:1.5, whiteSpace:"pre-line", boxShadow:"0 1px 2px rgba(0,0,0,0.1)"}}>
                    {msg.text}
                  </div>
                  <div style={{fontSize:10, color:"#94a3b8", marginTop:2, textAlign: msg.role === "user" ? "right" : "left"}}>{msg.time}</div>
                </div>
              </div>
            ))}
            {typing && (
              <div style={{display:"flex", gap:6, alignItems:"center"}}>
                <div style={{width:28, height:28, background:"#00b900", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12}}>🤖</div>
                <div style={{background:"white", borderRadius:"4px 16px 16px 16px", padding:"8px 14px", display:"flex", gap:4}}>
                  {[0,1,2].map(i => <div key={i} style={{width:6, height:6, background:"#94a3b8", borderRadius:"50%", animation:"bounce 0.6s infinite", animationDelay:`${i*0.15}s`}} />)}
                </div>
              </div>
            )}
          </div>
          <div style={{background:"white", borderRadius:"0 0 16px 16px", display:"flex", alignItems:"center", gap:8, padding:"8px 12px"}}>
            <input
              style={{flex:1, border:"none", outline:"none", fontSize:12}}
              placeholder="メッセージを入力..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
            />
            <button onClick={send} style={{width:28, height:28, background:"#00b900", border:"none", borderRadius:"50%", color:"white", cursor:"pointer", fontSize:12}}>➤</button>
          </div>
        </div>

        {/* 統計パネル */}
        <div style={{flex:1, display:"flex", flexDirection:"column", gap:16}}>
          <div style={{background:"white", borderRadius:16, padding:20, border:"1px solid #e2e8f0"}}>
            <h3 style={{fontWeight:"bold", color:"#1e293b", marginBottom:16, fontSize:15}}>今日の統計</h3>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
              {[["47","メッセージ受信"],["38","自動返信"],["6","予約転換"],["81%","解決率"]].map(([val, label]) => (
                <div key={label} style={{background:"#f8fafc", borderRadius:12, padding:16, textAlign:"center"}}>
                  <div style={{fontSize:24, fontWeight:"bold", color:"#1e293b"}}>{val}</div>
                  <div style={{fontSize:12, color:"#64748b"}}>{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{background:"white", borderRadius:16, padding:20, border:"1px solid #e2e8f0"}}>
            <h3 style={{fontWeight:"bold", color:"#1e293b", marginBottom:16, fontSize:15}}>Bot 設定</h3>
            {[["自動返信",true],["物件レコメンド",true],["内見予約連携",true],["夜間自動返信",false]].map(([label, on]) => (
              <div key={label as string} style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
                <span style={{fontSize:14, color:"#475569"}}>{label as string}</span>
                <div style={{width:40, height:22, borderRadius:11, background: on ? "#10b981" : "#e2e8f0", position:"relative", cursor:"pointer"}}>
                  <div style={{position:"absolute", width:18, height:18, background:"white", borderRadius:"50%", top:2, transition:"all 0.2s", left: on ? 20 : 2, boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
const MAIL_WORKFLOWS = [
  { id: 1, name: "問い合わせ自動返信", trigger: "新規問い合わせ受信時", status: "有効", sentToday: 12 },
  { id: 2, name: "内見前リマインダー", trigger: "内見24時間前", status: "有効", sentToday: 5 },
  { id: 3, name: "申込確認メール", trigger: "申込ステータス変更時", status: "有効", sentToday: 3 },
  { id: 4, name: "週次レポート", trigger: "毎週月曜日 9:00", status: "停止中", sentToday: 0 },
];

function MailWorkflow() {
  const [selected, setSelected] = useState(MAIL_WORKFLOWS[0]);
  const [preview, setPreview] = useState(false);

  const templates: { [key: string]: string } = {
    "問い合わせ自動返信": "○○様\n\nお問い合わせいただきありがとうございます。\n担当者より24時間以内にご連絡いたします。\n\n不動産エージェント株式会社",
    "内見前リマインダー": "○○様\n\n明日の内見のリマインドです。\nご確認のほどよろしくお願いいたします。\n\n不動産エージェント株式会社",
    "申込確認メール": "○○様\n\nお申し込みを受け付けました。\n審査結果を3営業日以内にお知らせします。\n\n不動産エージェント株式会社",
    "週次レポート": "管理者様\n\n先週の物件閲覧数・問い合わせ数のサマリーです。\n詳細はダッシュボードをご確認ください。\n\n不動産エージェント株式会社",
  };

  return (
    <div>
      <h1 style={{fontSize:24, fontWeight:"bold", color:"#1e293b", marginBottom:24}}>メール通知ワークフロー</h1>
      <div style={{display:"flex", gap:16}}>
        {/* ワークフローリスト */}
        <div style={{width:280, display:"flex", flexDirection:"column", gap:12}}>
          {MAIL_WORKFLOWS.map(wf => (
            <div key={wf.id} onClick={() => { setSelected(wf); setPreview(false); }}
              style={{background:"white", borderRadius:16, padding:16, border: selected.id === wf.id ? "2px solid #1e40af" : "1px solid #e2e8f0", cursor:"pointer", boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6}}>
                <span style={{fontWeight:"bold", fontSize:14, color:"#1e293b"}}>{wf.name}</span>
                <Badge status={wf.status} />
              </div>
              <div style={{fontSize:12, color:"#64748b", marginBottom:8}}>⚡ {wf.trigger}</div>
              <div style={{fontSize:12, color:"#94a3b8"}}>今日の送信：<span style={{fontWeight:"bold", color:"#1e293b"}}>{wf.sentToday}件</span></div>
            </div>
          ))}
          <button style={{padding:16, borderRadius:16, border:"2px dashed #e2e8f0", background:"transparent", cursor:"pointer", color:"#94a3b8", fontSize:14}}>
            ＋ 新規ワークフロー
          </button>
        </div>

        {/* 詳細エディタ */}
        <div style={{flex:1, background:"white", borderRadius:16, border:"1px solid #e2e8f0", overflow:"hidden"}}>
          <div style={{padding:20, borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <h2 style={{fontWeight:"bold", color:"#1e293b", fontSize:16}}>{selected.name}</h2>
            <div style={{display:"flex", gap:8}}>
              <button onClick={() => setPreview(!preview)}
                style={{padding:"6px 14px", borderRadius:8, border:"1px solid #e2e8f0", background:"white", cursor:"pointer", fontSize:13, color:"#475569"}}>
                {preview ? "✏️ 編集" : "👁 プレビュー"}
              </button>
              <button style={{padding:"6px 14px", borderRadius:8, border:"none", background:"#1e40af", cursor:"pointer", fontSize:13, color:"white"}}>
                💾 保存
              </button>
            </div>
          </div>

          <div style={{padding:20}}>
            {/* フロー図 */}
            <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:20}}>
              {[
                { icon:"⚡", label:"トリガー", sub: selected.trigger, bg:"#fef3c7" },
                { icon:"→", label:"", sub:"", bg:"transparent" },
                { icon:"🔍", label:"条件チェック", sub:"顧客データ確認", bg:"#dbeafe" },
                { icon:"→", label:"", sub:"", bg:"transparent" },
                { icon:"📧", label:"メール送信", sub:"テンプレート適用", bg:"#d1fae5" },
              ].map((step, i) => (
                step.icon === "→"
                  ? <div key={i} style={{color:"#cbd5e1", fontSize:20, fontWeight:"bold"}}>→</div>
                  : <div key={i} style={{flex:1, background:step.bg, borderRadius:12, padding:12, border:"1px solid #e2e8f0"}}>
                      <div style={{fontSize:20, marginBottom:4}}>{step.icon}</div>
                      <div style={{fontSize:12, fontWeight:"bold", color:"#1e293b"}}>{step.label}</div>
                      <div style={{fontSize:11, color:"#64748b"}}>{step.sub}</div>
                    </div>
              ))}
            </div>

            {/* 件名 */}
            <div style={{marginBottom:16}}>
              <label style={{display:"block", fontSize:13, fontWeight:600, color:"#475569", marginBottom:6}}>件名</label>
              <input
                style={{width:"100%", padding:"10px 14px", border:"1px solid #e2e8f0", borderRadius:10, fontSize:14, outline:"none", boxSizing:"border-box"}}
                defaultValue={`【不動産エージェント】${selected.name}`}
                readOnly={preview}
              />
            </div>

            {/* 本文 */}
            <div style={{marginBottom:16}}>
              <label style={{display:"block", fontSize:13, fontWeight:600, color:"#475569", marginBottom:6}}>メール本文</label>
              {preview ? (
                <div style={{padding:16, background:"#f8fafc", borderRadius:10, fontSize:14, color:"#1e293b", lineHeight:1.8, whiteSpace:"pre-line", border:"1px solid #e2e8f0"}}>
                  {templates[selected.name]}
                </div>
              ) : (
                <textarea
                  style={{width:"100%", padding:"10px 14px", border:"1px solid #e2e8f0", borderRadius:10, fontSize:14, outline:"none", resize:"none", lineHeight:1.8, boxSizing:"border-box"}}
                  rows={7}
                  defaultValue={templates[selected.name]}
                />
              )}
            </div>

            {/* 統計 */}
            <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, padding:16, background:"#f8fafc", borderRadius:12}}>
              {[["今日送信", `${selected.sentToday}件`], ["開封率", "94%"], ["クリック率", "12%"]].map(([label, val]) => (
                <div key={label} style={{textAlign:"center"}}>
                  <div style={{fontSize:22, fontWeight:"bold", color:"#1e293b"}}>{val}</div>
                  <div style={{fontSize:12, color:"#64748b"}}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
const USERS = [
  { id: 1, name: "山本 太郎", email: "yamamoto@estate.co.jp", role: "管理者", branch: "渋谷支店", status: "有効", lastLogin: "2026-03-21" },
  { id: 2, name: "佐々木 花子", email: "sasaki@estate.co.jp", role: "エージェント", branch: "新宿支店", status: "有効", lastLogin: "2026-03-20" },
  { id: 3, name: "田村 一郎", email: "tamura@estate.co.jp", role: "エージェント", branch: "品川支店", status: "有効", lastLogin: "2026-03-19" },
  { id: 4, name: "木村 さやか", email: "kimura@estate.co.jp", role: "閲覧者", branch: "目黒支店", status: "無効", lastLogin: "2026-03-01" },
];

function UserManagement() {
  const [showModal, setShowModal] = useState(false);

  const roleStyle: { [key: string]: string } = {
    "管理者": "background:#ede9fe;color:#4c1d95",
    "エージェント": "background:#dbeafe;color:#1e40af",
    "閲覧者": "background:#f1f5f9;color:#475569",
  };

  return (
    <div>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24}}>
        <h1 style={{fontSize:24, fontWeight:"bold", color:"#1e293b"}}>ユーザー・権限管理</h1>
        <button onClick={() => setShowModal(true)}
          style={{background:"#1e40af", color:"white", border:"none", borderRadius:10, padding:"8px 16px", cursor:"pointer", fontSize:14}}>
          ＋ ユーザー追加
        </button>
      </div>

      {/* 権限カード */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24}}>
        {[
          { role:"管理者", count:1, color:"#ede9fe", textColor:"#4c1d95", perms:["✅ 全機能アクセス","✅ ユーザー管理","✅ 設定変更"] },
          { role:"エージェント", count:2, color:"#dbeafe", textColor:"#1e40af", perms:["✅ 物件管理","✅ 問い合わせ対応","❌ ユーザー管理"] },
          { role:"閲覧者", count:1, color:"#f1f5f9", textColor:"#475569", perms:["✅ 閲覧のみ","❌ 編集不可","❌ 管理機能なし"] },
        ].map(({ role, count, color, textColor, perms }) => (
          <div key={role} style={{background:"white", borderRadius:16, padding:20, border:"1px solid #e2e8f0"}}>
            <span style={{...Object.fromEntries((roleStyle[role] || "").split(";").map(s => s.split(":"))) as React.CSSProperties, padding:"2px 10px", borderRadius:20, fontSize:12, fontWeight:600}}>{role}</span>
            <div style={{fontSize:32, fontWeight:"bold", color:"#1e293b", margin:"8px 0 4px"}}>{count}</div>
            <div style={{fontSize:12, color:"#64748b", marginBottom:12}}>ユーザー</div>
            <div style={{borderTop:"1px solid #f1f5f9", paddingTop:12}}>
              {perms.map(p => <div key={p} style={{fontSize:12, color:"#475569", marginBottom:4}}>{p}</div>)}
            </div>
          </div>
        ))}
      </div>

      {/* ユーザーテーブル */}
      <div style={{background:"white", borderRadius:16, border:"1px solid #e2e8f0", overflow:"hidden"}}>
        <table style={{width:"100%", borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:"#f8fafc"}}>
              {["ユーザー","メール","権限","支店","ステータス","最終ログイン","操作"].map(h => (
                <th key={h} style={{padding:"12px 16px", textAlign:"left", fontSize:12, fontWeight:600, color:"#64748b", borderBottom:"1px solid #f1f5f9"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {USERS.map(user => (
              <tr key={user.id} style={{borderBottom:"1px solid #f8fafc"}}>
                <td style={{padding:"14px 16px"}}>
                  <div style={{display:"flex", alignItems:"center", gap:10}}>
                    <div style={{width:32, height:32, borderRadius:"50%", background:"#dbeafe", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"bold", color:"#1e40af", fontSize:13}}>{user.name[0]}</div>
                    <span style={{fontSize:14, fontWeight:500, color:"#1e293b"}}>{user.name}</span>
                  </div>
                </td>
                <td style={{padding:"14px 16px", fontSize:13, color:"#64748b"}}>{user.email}</td>
                <td style={{padding:"14px 16px"}}>
                  <span style={{...Object.fromEntries((roleStyle[user.role] || "").split(";").map(s => s.split(":"))) as React.CSSProperties, padding:"2px 10px", borderRadius:20, fontSize:12, fontWeight:600}}>{user.role}</span>
                </td>
                <td style={{padding:"14px 16px", fontSize:13, color:"#64748b"}}>{user.branch}</td>
                <td style={{padding:"14px 16px"}}><Badge status={user.status} /></td>
                <td style={{padding:"14px 16px", fontSize:13, color:"#94a3b8"}}>{user.lastLogin}</td>
                <td style={{padding:"14px 16px"}}>
                  <div style={{display:"flex", gap:8}}>
                    <button style={{padding:"4px 12px", borderRadius:8, border:"1px solid #e2e8f0", background:"white", cursor:"pointer", fontSize:12, color:"#475569"}}>編集</button>
                    <button style={{padding:"4px 12px", borderRadius:8, border:"none", background:"#fee2e2", cursor:"pointer", fontSize:12, color:"#991b1b"}}>無効化</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* モーダル */}
      {showModal && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50}} onClick={() => setShowModal(false)}>
          <div style={{background:"white", borderRadius:20, padding:24, width:380, boxShadow:"0 20px 40px rgba(0,0,0,0.2)"}} onClick={e => e.stopPropagation()}>
            <h2 style={{fontWeight:"bold", color:"#1e293b", fontSize:18, marginBottom:20}}>新規ユーザー追加</h2>
            <div style={{display:"flex", flexDirection:"column", gap:12}}>
              {[["氏名","text","山田 太郎"],["メールアドレス","email","yamada@estate.co.jp"],["電話番号","tel","03-xxxx-xxxx"]].map(([label,type,placeholder]) => (
                <div key={label}>
                  <label style={{display:"block", fontSize:12, fontWeight:600, color:"#475569", marginBottom:4}}>{label}</label>
                  <input type={type} placeholder={placeholder} style={{width:"100%", padding:"8px 12px", border:"1px solid #e2e8f0", borderRadius:10, fontSize:14, outline:"none", boxSizing:"border-box"}} />
                </div>
              ))}
              <div>
                <label style={{display:"block", fontSize:12, fontWeight:600, color:"#475569", marginBottom:4}}>権限</label>
                <select style={{width:"100%", padding:"8px 12px", border:"1px solid #e2e8f0", borderRadius:10, fontSize:14, outline:"none"}}>
                  <option>エージェント</option><option>管理者</option><option>閲覧者</option>
                </select>
              </div>
            </div>
            <div style={{display:"flex", gap:12, marginTop:20}}>
              <button onClick={() => setShowModal(false)} style={{flex:1, padding:"10px 0", borderRadius:10, border:"1px solid #e2e8f0", background:"white", cursor:"pointer", fontSize:14, color:"#475569"}}>キャンセル</button>
              <button onClick={() => setShowModal(false)} style={{flex:1, padding:"10px 0", borderRadius:10, border:"none", background:"#1e40af", cursor:"pointer", fontSize:14, color:"white", fontWeight:600}}>追加する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
const BRANCHES = [
  { id: 1, name: "渋谷支店", address: "東京都渋谷区道玄坂1-1", tel: "03-1111-2222", manager: "山本 太郎", agents: 8, properties: 42 },
  { id: 2, name: "新宿支店", address: "東京都新宿区西新宿2-3", tel: "03-3333-4444", manager: "中山 部長", agents: 12, properties: 67 },
  { id: 3, name: "品川支店", address: "東京都品川区大井1-7", tel: "03-5555-6666", manager: "岡田 部長", agents: 6, properties: 31 },
  { id: 4, name: "目黒支店", address: "東京都目黒区目黒3-5", tel: "03-7777-8888", manager: "高橋 部長", agents: 9, properties: 55 },
];

function BranchManagement() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24}}>
        <h1 style={{fontSize:24, fontWeight:"bold", color:"#1e293b"}}>拠点管理</h1>
        <button style={{background:"#1e40af", color:"white", border:"none", borderRadius:10, padding:"8px 16px", cursor:"pointer", fontSize:14}}>＋ 拠点追加</button>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:16}}>
        {BRANCHES.map(branch => (
          <div key={branch.id}
            onClick={() => setSelected(selected === branch.id ? null : branch.id)}
            style={{background:"white", borderRadius:16, padding:20, border: selected === branch.id ? "2px solid #1e40af" : "1px solid #e2e8f0", cursor:"pointer", boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>

            <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12}}>
              <div>
                <h3 style={{fontSize:18, fontWeight:"bold", color:"#1e293b", marginBottom:4}}>{branch.name}</h3>
                <p style={{fontSize:13, color:"#64748b", marginBottom:2}}>📍 {branch.address}</p>
                <p style={{fontSize:13, color:"#64748b"}}>📞 {branch.tel}</p>
              </div>
              <div style={{textAlign:"right"}}>
                <p style={{fontSize:11, color:"#94a3b8"}}>支店長</p>
                <p style={{fontSize:14, fontWeight:600, color:"#1e293b"}}>{branch.manager}</p>
              </div>
            </div>

            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
              <div style={{background:"#dbeafe", borderRadius:12, padding:12, textAlign:"center"}}>
                <div style={{fontSize:22, fontWeight:"bold", color:"#1e40af"}}>{branch.agents}</div>
                <div style={{fontSize:12, color:"#64748b"}}>担当者数</div>
              </div>
              <div style={{background:"#d1fae5", borderRadius:12, padding:12, textAlign:"center"}}>
                <div style={{fontSize:22, fontWeight:"bold", color:"#065f46"}}>{branch.properties}</div>
                <div style={{fontSize:12, color:"#64748b"}}>掲載物件数</div>
              </div>
            </div>

            {selected === branch.id && (
              <div style={{marginTop:16, paddingTop:16, borderTop:"1px solid #f1f5f9"}}>
                <h4 style={{fontSize:13, fontWeight:600, color:"#475569", marginBottom:12}}>今月の実績</h4>
                <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12}}>
                  {[["問い合わせ","23"],["内見","8"],["成約","3"]].map(([label,val]) => (
                    <div key={label} style={{background:"#f8fafc", borderRadius:10, padding:10, textAlign:"center"}}>
                      <div style={{fontSize:18, fontWeight:"bold", color:"#1e293b"}}>{val}</div>
                      <div style={{fontSize:11, color:"#64748b"}}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex", gap:8}}>
                  <button style={{flex:1, padding:"8px 0", borderRadius:10, border:"none", background:"#1e40af", color:"white", cursor:"pointer", fontSize:13}}>編集</button>
                  <button style={{flex:1, padding:"8px 0", borderRadius:10, border:"1px solid #e2e8f0", background:"white", color:"#475569", cursor:"pointer", fontSize:13}}>スタッフ一覧</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
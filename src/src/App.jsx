import { useState, useEffect, useRef } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const NEWS_API_KEY = "PUNE_API_KEY_TU_AICI"; // newsapi.org → Get API Key (gratuit)
const SECRET_PASSWORD = "1234";
const SHARED_KEY = "dailyinfo_news_chat_v1";
const NAMES_KEY = "dailyinfo_news_username_v1";
const LONG_PRESS_MS = 3000;

// ─── NEWSPAPER LOGO SVG ───────────────────────────────────────────────────────
const NewspaperSVG = ({ size = 28, color = "#111" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Main newspaper body */}
    <rect x="10" y="8" width="68" height="84" rx="4" fill={color} />
    {/* Small folded corner / second page */}
    <rect x="22" y="14" width="68" height="84" rx="4" fill={color} opacity="0.25" />
    {/* Header bar */}
    <rect x="16" y="14" width="56" height="12" rx="2" fill="white" opacity="0.15" />
    {/* Headline lines */}
    <rect x="16" y="32" width="56" height="5" rx="1.5" fill="white" opacity="0.9" />
    <rect x="16" y="41" width="42" height="3.5" rx="1.5" fill="white" opacity="0.5" />
    {/* Divider */}
    <rect x="16" y="50" width="56" height="1" rx="0.5" fill="white" opacity="0.3" />
    {/* Columns */}
    <rect x="16" y="55" width="25" height="3" rx="1" fill="white" opacity="0.5" />
    <rect x="16" y="61" width="25" height="3" rx="1" fill="white" opacity="0.4" />
    <rect x="16" y="67" width="20" height="3" rx="1" fill="white" opacity="0.3" />
    <rect x="47" y="55" width="25" height="3" rx="1" fill="white" opacity="0.5" />
    <rect x="47" y="61" width="25" height="3" rx="1" fill="white" opacity="0.4" />
    <rect x="47" y="67" width="18" height="3" rx="1" fill="white" opacity="0.3" />
    {/* Bottom lines */}
    <rect x="16" y="76" width="56" height="2.5" rx="1" fill="white" opacity="0.25" />
    <rect x="16" y="81" width="40" height="2.5" rx="1" fill="white" opacity="0.2" />
  </svg>
);

// ─── DEMO NEWS (fallback când nu e API key) ───────────────────────────────────
const DEMO_NEWS = [
  { title: "România, creștere economică de 3.2% în primul trimestru", description: "Institutul Național de Statistică a publicat datele preliminare pentru T1 2026, confirmând o tendință pozitivă.", source: { name: "Digi24" }, publishedAt: new Date().toISOString(), url: "#", urlToImage: null },
  { title: "Vremea se schimbă: temperaturi de până la 32°C săptămâna viitoare", description: "Meteorologii anunță un val de căldură care va afecta toată țara în perioada imediat următoare.", source: { name: "ProTV" }, publishedAt: new Date().toISOString(), url: "#", urlToImage: null },
  { title: "Noi investiții în infrastructura feroviară din Transilvania", description: "Ministerul Transporturilor a anunțat un pachet de modernizare a liniilor CF din zona de centru-vest.", source: { name: "Antena3" }, publishedAt: new Date().toISOString(), url: "#", urlToImage: null },
  { title: "Echipa națională de fotbal pregătește meciurile din Liga Națiunilor", description: "Selecționerul a convocat 26 de jucători pentru meciurile din luna iunie.", source: { name: "Sport.ro" }, publishedAt: new Date().toISOString(), url: "#", urlToImage: null },
  { title: "Bursa de la București a înregistrat un maxim istoric", description: "Indicele BET a depășit pragul de 20.000 de puncte pentru prima dată în istorie.", source: { name: "Ziarul Financiar" }, publishedAt: new Date().toISOString(), url: "#", urlToImage: null },
  { title: "Festival internațional de muzică la Cluj-Napoca în această vară", description: "Organizatorii UNTOLD au anunțat primii artiști confirmați pentru ediția din 2026.", source: { name: "Click" }, publishedAt: new Date().toISOString(), url: "#", urlToImage: null },
];

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (diff < 1) return "acum";
  if (diff < 60) return `${diff} min`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return `${Math.floor(diff / 1440)}z`;
}

export default function App() {
  const [mode, setMode] = useState("news"); // news | unlock | setname | secret
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [username, setUsername] = useState("");
  const [inputName, setInputName] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [pressing, setPressing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
  const pressTimer = useRef(null);
  const progressInterval = useRef(null);
  const messagesEnd = useRef(null);
  const pollRef = useRef(null);
  const pressStart = useRef(0);

  // Load username
  useEffect(() => {
    const saved = localStorage.getItem(NAMES_KEY);
    if (saved) setUsername(saved);
  }, []);

  // Fetch news
  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      if (NEWS_API_KEY === "PUNE_API_KEY_TU_AICI") {
        setTimeout(() => { setNews(DEMO_NEWS); setLoading(false); }, 800);
        return;
      }
      try {
        const res = await fetch(
          `https://newsapi.org/v2/top-headlines?country=ro&pageSize=20&apiKey=${NEWS_API_KEY}`
        );
        const data = await res.json();
        if (data.articles && data.articles.length > 0) {
          setNews(data.articles.filter(a => a.title && a.title !== "[Removed]"));
        } else {
          setNews(DEMO_NEWS);
        }
      } catch {
        setNews(DEMO_NEWS);
      }
      setLoading(false);
    };
    fetchNews();
  }, []);

  // Long press on first news item
  const handlePressStart = () => {
    pressStart.current = Date.now();
    setPressing(true);
    setPressProgress(0);
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - pressStart.current;
      const pct = Math.min((elapsed / LONG_PRESS_MS) * 100, 100);
      setPressProgress(pct);
    }, 30);
    pressTimer.current = setTimeout(() => {
      clearInterval(progressInterval.current);
      setPressing(false);
      setPressProgress(0);
      setMode("unlock");
      setPassword("");
      setPasswordError(false);
    }, LONG_PRESS_MS);
  };

  const handlePressEnd = () => {
    clearTimeout(pressTimer.current);
    clearInterval(progressInterval.current);
    setPressing(false);
    setPressProgress(0);
  };

  // Chat polling
  const loadMessages = async () => {
    try {
      const result = await window.storage.get(SHARED_KEY, true);
      if (result && result.value) setMessages(JSON.parse(result.value));
    } catch { setMessages([]); }
  };

  useEffect(() => {
    if (mode === "secret") {
      loadMessages();
      pollRef.current = setInterval(loadMessages, 2000);
    }
    return () => clearInterval(pollRef.current);
  }, [mode]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUnlock = () => {
    if (password === SECRET_PASSWORD) {
      setPasswordError(false);
      const saved = localStorage.getItem(NAMES_KEY);
      if (!saved) setMode("setname");
      else { setUsername(saved); setMode("secret"); }
    } else {
      setPasswordError(true);
      setPassword("");
    }
  };

  const handleSetName = () => {
    if (inputName.trim()) {
      localStorage.setItem(NAMES_KEY, inputName.trim());
      setUsername(inputName.trim());
      setMode("secret");
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    const newMsg = {
      id: Date.now(),
      sender: username,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" }),
    };
    const updated = [...messages, newMsg];
    setMessages(updated);
    setChatInput("");
    try { await window.storage.set(SHARED_KEY, JSON.stringify(updated), true); } catch {}
  };

  // ─── STYLES ─────────────────────────────────────────────────────────────────
  const S = {
    app: { minHeight: "100vh", background: "#f7f6f3", fontFamily: "'Georgia', 'Times New Roman', serif", color: "#111", display: "flex", flexDirection: "column" },
    header: { background: "#fff", borderBottom: "2px solid #111", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 },
    headerLeft: { display: "flex", alignItems: "center", gap: 10 },
    brand: { fontSize: 20, fontWeight: "bold", letterSpacing: "0.01em", color: "#111" },
    brandSub: { fontSize: 10, color: "#999", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 1 },
    date: { fontSize: 11, color: "#999", letterSpacing: "0.05em" },
    feed: { flex: 1, overflowY: "auto", padding: "0 0 32px 0" },
    topStory: (pressing) => ({
      position: "relative",
      margin: "16px 16px 0 16px",
      borderRadius: 16,
      overflow: "hidden",
      background: "#111",
      cursor: "pointer",
      userSelect: "none",
      boxShadow: pressing ? "0 0 0 3px #111, 0 0 0 5px #f7f6f3" : "0 4px 20px #00000018",
      transition: "box-shadow 0.2s",
      WebkitUserSelect: "none",
    }),
    topStoryImg: { width: "100%", height: 200, objectFit: "cover", opacity: 0.7, display: "block" },
    topStoryImgPlaceholder: { width: "100%", height: 200, background: "linear-gradient(135deg, #1a1a2e, #333)", display: "flex", alignItems: "center", justifyContent: "center" },
    topStoryOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 16px 16px", background: "linear-gradient(transparent, #000000cc)" },
    topStoryTag: { fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 },
    topStoryTitle: { fontSize: 18, fontWeight: "bold", color: "#fff", lineHeight: 1.35 },
    progressBar: { position: "absolute", bottom: 0, left: 0, height: 3, background: "#fff", transition: "width 0.05s linear", borderRadius: "0 2px 2px 0" },
    holdHint: { position: "absolute", top: 10, right: 12, fontSize: 10, color: "#ffffff88", letterSpacing: "0.05em" },
    divider: { margin: "16px 16px 0", borderTop: "1px solid #e0ddd8", paddingTop: 4 },
    sectionLabel: { fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "#999", padding: "10px 16px 4px" },
    newsItem: { display: "flex", gap: 12, padding: "12px 16px", borderBottom: "1px solid #eeecea", cursor: "pointer", background: "#fff", transition: "background 0.15s" },
    newsThumb: { width: 72, height: 72, borderRadius: 8, objectFit: "cover", flexShrink: 0, background: "#eee" },
    newsThumbPlaceholder: { width: 72, height: 72, borderRadius: 8, background: "#e8e5e0", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" },
    newsContent: { flex: 1, display: "flex", flexDirection: "column", gap: 4 },
    newsSource: { fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: "0.08em" },
    newsTitle: { fontSize: 14, fontWeight: "bold", lineHeight: 1.4, color: "#111" },
    newsMeta: { fontSize: 11, color: "#bbb", marginTop: 2 },
    // overlay/modal
    overlay: { position: "fixed", inset: 0, background: "#00000060", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
    modal: { background: "#fff", border: "2px solid #111", borderRadius: 20, padding: "32px 28px", width: 300, display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 20px 60px #00000030" },
    modalTitle: { fontSize: 18, fontWeight: "bold", color: "#111", textAlign: "center" },
    modalInput: { background: "#f4f2ef", border: "1px solid #ccc", borderRadius: 10, padding: "10px 14px", color: "#111", fontSize: 15, outline: "none", fontFamily: "inherit", textAlign: "center", letterSpacing: "0.18em" },
    btn: (bg = "#111", col = "#fff") => ({ background: bg, border: "none", borderRadius: 10, padding: "11px 18px", color: col, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }),
    // secret chat
    secretHeader: { background: "#111", borderBottom: "2px solid #333", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 },
    secretChat: { flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10, background: "#f7f6f3" },
    bubble: (isMe) => ({ maxWidth: "78%", alignSelf: isMe ? "flex-end" : "flex-start", background: isMe ? "#111" : "#fff", color: isMe ? "#f7f6f3" : "#111", padding: "10px 14px", borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px", fontSize: 14, lineHeight: 1.55, boxShadow: "0 2px 8px #00000012", border: isMe ? "none" : "1px solid #e0ddd8" }),
    bubbleLabel: { fontSize: 10, opacity: 0.45, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" },
    inputRow: { display: "flex", gap: 8, padding: "12px 16px", borderTop: "1px solid #ddd", background: "#fff" },
    chatInput: { flex: 1, background: "#f4f2ef", border: "1px solid #ddd", borderRadius: 12, padding: "10px 14px", color: "#111", fontSize: 14, outline: "none", fontFamily: "inherit" },
    dot: { width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 5px #22c55e", display: "inline-block", marginRight: 6 },
  };

  const today = new Date().toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" });

  // ─── UNLOCK MODAL ────────────────────────────────────────────────────────────
  if (mode === "unlock") return (
    <div style={S.app}>
      <div style={S.header}>
        <div style={S.headerLeft}>
          <NewspaperSVG size={26} />
          <div><div style={S.brand}>DailyInfo</div></div>
        </div>
      </div>
      <div style={S.overlay}>
        <div style={S.modal}>
          <div style={{ display: "flex", justifyContent: "center" }}><NewspaperSVG size={40} /></div>
          <div style={S.modalTitle}>Cod secret</div>
          <input
            style={{ ...S.modalInput, borderColor: passwordError ? "#ef4444" : "#ccc" }}
            type="password" placeholder="••••"
            value={password}
            onChange={e => { setPassword(e.target.value); setPasswordError(false); }}
            onKeyDown={e => e.key === "Enter" && handleUnlock()}
            autoFocus
          />
          {passwordError && <div style={{ color: "#ef4444", fontSize: 12, textAlign: "center" }}>Cod greșit.</div>}
          <button style={S.btn()} onClick={handleUnlock}>Intră</button>
          <button style={S.btn("#f4f2ef", "#555")} onClick={() => setMode("news")}>Anulează</button>
        </div>
      </div>
    </div>
  );

  // ─── SET NAME MODAL ──────────────────────────────────────────────────────────
  if (mode === "setname") return (
    <div style={S.app}>
      <div style={S.overlay}>
        <div style={S.modal}>
          <div style={{ display: "flex", justifyContent: "center" }}><NewspaperSVG size={38} /></div>
          <div style={S.modalTitle}>Cum te cheamă?</div>
          <div style={{ fontSize: 12, color: "#999", textAlign: "center" }}>Numele apare în chat-ul privat</div>
          <input style={S.modalInput} placeholder="Numele tău..." value={inputName}
            onChange={e => setInputName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSetName()} autoFocus />
          <button style={S.btn()} onClick={handleSetName}>Continuă</button>
        </div>
      </div>
    </div>
  );

  // ─── SECRET CHAT ─────────────────────────────────────────────────────────────
  if (mode === "secret") return (
    <div style={{ ...S.app }}>
      <div style={S.secretHeader}>
        <NewspaperSVG size={26} color="#fff" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: "bold", color: "#fff" }}>
            <span style={S.dot}></span>Chat privat
          </div>
          <div style={{ fontSize: 11, color: "#666", marginTop: 1 }}>
            conectat ca <strong style={{ color: "#aaa" }}>{username}</strong>
          </div>
        </div>
        <button style={{ background: "none", border: "1px solid #333", color: "#aaa", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}
          onClick={() => setMode("news")}>← știri</button>
      </div>

      <div style={S.secretChat}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#ccc", fontSize: 13, marginTop: 60 }}>
            <NewspaperSVG size={36} color="#ddd" /><br /><br />
            Niciun mesaj încă.
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.sender === username;
          return (
            <div key={msg.id} style={S.bubble(isMe)}>
              <div style={{ ...S.bubbleLabel, color: isMe ? "#888" : "#999" }}>{msg.sender} · {msg.time}</div>
              {msg.text}
            </div>
          );
        })}
        <div ref={messagesEnd} />
      </div>

      <div style={S.inputRow}>
        <input style={S.chatInput} placeholder="Scrie un mesaj..."
          value={chatInput} onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()} />
        <button style={S.btn()} onClick={sendMessage}>↑</button>
      </div>
    </div>
  );

  // ─── NEWS FEED ───────────────────────────────────────────────────────────────
  const firstNews = news[0];
  const restNews = news.slice(1);

  return (
    <div style={S.app}>
      <div style={S.header}>
        <div style={S.headerLeft}>
          <NewspaperSVG size={26} />
          <div>
            <div style={S.brand}>DailyInfo</div>
            <div style={S.brandSub}>știri de ultimă oră</div>
          </div>
        </div>
        <div style={S.date}>{today}</div>
      </div>

      <div style={S.feed}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#bbb" }}>
            <NewspaperSVG size={40} color="#ddd" /><br /><br />Se încarcă știrile...
          </div>
        ) : (
          <>
            {/* TOP STORY — long press to unlock */}
            {firstNews && (
              <div
                style={S.topStory(pressing)}
                onMouseDown={handlePressStart}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onTouchStart={handlePressStart}
                onTouchEnd={handlePressEnd}
                onClick={() => firstNews.url !== "#" && window.open(firstNews.url, "_blank")}
              >
                {firstNews.urlToImage
                  ? <img src={firstNews.urlToImage} alt="" style={S.topStoryImg} draggable={false} />
                  : <div style={S.topStoryImgPlaceholder}><NewspaperSVG size={48} color="#444" /></div>
                }
                <div style={S.topStoryOverlay}>
                  <div style={S.topStoryTag}>{firstNews.source?.name} · {timeAgo(firstNews.publishedAt)}</div>
                  <div style={S.topStoryTitle}>{firstNews.title}</div>
                </div>
                {pressing && <div style={{ ...S.progressBar, width: pressProgress + "%" }} />}
                <div style={S.holdHint}>{pressing ? "ține apăsat..." : "ține apăsat 3s"}</div>
              </div>
            )}

            <div style={S.divider} />
            <div style={S.sectionLabel}>Ultimele știri</div>

            {restNews.map((article, i) => (
              <div key={i} style={S.newsItem}
                onClick={() => article.url !== "#" && window.open(article.url, "_blank")}>
                {article.urlToImage
                  ? <img src={article.urlToImage} alt="" style={S.newsThumb} />
                  : <div style={S.newsThumbPlaceholder}><NewspaperSVG size={22} color="#bbb" /></div>
                }
                <div style={S.newsContent}>
                  <div style={S.newsSource}>{article.source?.name}</div>
                  <div style={S.newsTitle}>{art

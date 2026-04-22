import { useState, useRef, useEffect } from "react";

const API_KEY = process.env.REACT_APP_API_KEY;

const SYSTEM_PROMPT = `You are an AI Documentary Creator assistant — a specialized storytelling guide that helps filmmakers, journalists, and content creators craft compelling documentaries.
1. RESEARCH PHASE: Research angles, themes, background, credible sources, knowledge gaps.
2. STRUCTURE PHASE: Acts, sequences, scene breakdowns, narrative frameworks, timestamped outlines.
3. NARRATIVE PHASE: Opening hooks, character arcs, emotional beats, narration drafts.
4. REVIEW PHASE: Critique structure, improve logic, polish narrative.
When a user uploads a PDF, analyze it and provide documentary-specific insights.
Be concise, creative, specific. Use numbered lists. Keep under 250 words unless asked. Be enthusiastic!`;

const PHASES = [
  { id: 0, label: "Research", icon: "🔍", color: "#6366f1", light: "#eef2ff", border: "#c7d2fe", desc: "Find angles & sources" },
  { id: 1, label: "Structure", icon: "📋", color: "#7c3aed", light: "#f5f3ff", border: "#ddd6fe", desc: "Build your outline" },
  { id: 2, label: "Narrative", icon: "✍️", color: "#db2777", light: "#fdf2f8", border: "#fbcfe8", desc: "Craft the story" },
  { id: 3, label: "Review", icon: "🎬", color: "#059669", light: "#ecfdf5", border: "#a7f3d0", desc: "Polish & refine" },
];

const QUICK_PROMPTS = [
  { text: "Generate structure", icon: "📋", color: "#6366f1" },
  { text: "Interview questions", icon: "🎙️", color: "#7c3aed" },
  { text: "Opening narration", icon: "✍️", color: "#db2777" },
  { text: "Research angles", icon: "🔍", color: "#0891b2" },
  { text: "3-act outline", icon: "📝", color: "#059669" },
  { text: "B-roll ideas", icon: "🎥", color: "#d97706" },
];

const SAMPLE_SESSIONS = [
  { id: 1, title: "Street Food in Delhi", phase: "Research", time: "2h ago", color: "#6366f1" },
  { id: 3, title: "Women in Tech India", phase: "Narrative", time: "2 days ago", color: "#db2777" },
  
];

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "2px 0" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#7c3aed)", animation: `typeBounce 1.4s ${i * 0.2}s infinite ease-in-out` }} />
      ))}
      <style>{`@keyframes typeBounce{0%,80%,100%{transform:scale(0.8);opacity:0.5}40%{transform:scale(1.2);opacity:1}}`}</style>
    </div>
  );
}

function Avatar({ initials, size = 36, gradient = "linear-gradient(135deg,#6366f1,#7c3aed)" }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 800, color: "#fff", flexShrink: 0, boxShadow: "0 4px 14px rgba(99,102,241,0.3)" }}>
      {initials}
    </div>
  );
}

function Message({ msg, userInitials }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", flexDirection: isUser ? "row-reverse" : "row", alignItems: "flex-end", gap: 12, marginBottom: 24, animation: "msgIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
      <style>{`@keyframes msgIn{from{opacity:0;transform:translateY(16px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
      {isUser
        ? <Avatar initials={userInitials} size={34} />
        : <div style={{ width: 34, height: 34, borderRadius: "50%", background: "white", border: "2px solid #e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, boxShadow: "0 2px 12px rgba(99,102,241,0.12)" }}>🎬</div>
      }
      <div style={{ maxWidth: "73%", display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", gap: 4 }}>
        <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {isUser ? "You" : "Documentary AI"}
        </span>
        {msg.isPdf && (
          <div style={{ padding: "8px 14px", borderRadius: 12, background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", border: "1px solid #ddd6fe", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>📄</span>
            <span style={{ fontSize: 12, color: "#7c3aed", fontWeight: 600 }}>{msg.fileName}</span>
          </div>
        )}
        <div style={{
          padding: "14px 20px",
          borderRadius: isUser ? "22px 22px 6px 22px" : "22px 22px 22px 6px",
          background: isUser ? "linear-gradient(135deg,#6366f1,#7c3aed,#db2777)" : "white",
          color: isUser ? "#fff" : "#1e293b",
          fontSize: 14.5,
          lineHeight: 1.75,
          boxShadow: isUser ? "0 8px 30px rgba(99,102,241,0.3)" : "0 4px 24px rgba(0,0,0,0.06)",
          border: isUser ? "none" : "1px solid #f1f5f9",
          whiteSpace: "pre-wrap",
          letterSpacing: "0.01em",
        }}>
          {msg.content}
        </div>
        {msg.isVoice && <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 600 }}>🎤 Voice</span>}
      </div>
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState(0);
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Welcome to Documentary Creator! ✨\n\nI'm your AI storytelling partner — guiding you through every phase of documentary filmmaking.\n\n🔍 Research  →  📋 Structure  →  ✍️ Narrative  →  🎬 Review\n\n💡 Tap a phase above to begin\n🎤 Speak using the mic button\n📄 Upload a PDF script for AI analysis\n\nWhat documentary are you working on?"
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [sessions, setSessions] = useState(SAMPLE_SESSIONS);
  const [activeSession, setActiveSession] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState({ name: "Aakriti", email: "aakriti@email.com", initials: "AA" });
  const [loginForm, setLoginForm] = useState({ name: "", email: "" });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [pdfUploading, setPdfUploading] = useState(false);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const fileRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const r = new SR();
      r.continuous = false; r.interimResults = true; r.lang = "en-US";
      r.onresult = e => setInput(Array.from(e.results).map(x => x[0].transcript).join(""));
      r.onend = () => { setIsRecording(false); clearInterval(timerRef.current); setRecordingTime(0); };
      r.onerror = () => { setIsRecording(false); clearInterval(timerRef.current); setRecordingTime(0); };
      recognitionRef.current = r;
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) return alert("Use Chrome for voice input!");
    if (isRecording) { recognitionRef.current.stop(); }
    else {
      setInput(""); recognitionRef.current.start(); setIsRecording(true); setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    }
  };

  const handlePdf = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== "application/pdf") return alert("PDF only!");
    if (file.size > 5e6) return alert("Max 5MB!");
    setPdfUploading(true);
    setMessages(p => [...p, { role: "user", content: `Analyse this PDF: "${file.name}" for documentary insights.`, isPdf: true, fileName: file.name }]);
    setLoading(true); setPdfUploading(false);
    const nh = [...history, { role: "user", content: `[Phase: ${PHASES[phase].label}] User uploaded PDF "${file.name}". Acknowledge and ask what documentary analysis they need.` }];
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}` }, body: JSON.stringify({ model: "llama-3.3-70b-versatile", max_tokens: 1000, messages: [{ role: "system", content: SYSTEM_PROMPT }, ...nh] }) });
      const d = await res.json(); if (d.error) throw new Error(d.error.message);
      const reply = d.choices?.[0]?.message?.content || "Something went wrong.";
      setHistory([...nh, { role: "assistant", content: reply }]);
      setMessages(p => [...p, { role: "assistant", content: reply }]);
      setSessions(p => [{ id: Date.now(), title: file.name.slice(0, 26), phase: PHASES[phase].label, time: "Just now", color: PHASES[phase].color }, ...p.slice(0, 9)]);
    } catch (err) { setMessages(p => [...p, { role: "assistant", content: `❌ ${err.message}` }]); }
    setLoading(false); e.target.value = "";
  };

  const send = async (text, isVoice = false) => {
    const msg = text || input.trim(); if (!msg || loading) return;
    setInput("");
    setMessages(p => [...p, { role: "user", content: msg, isVoice }]);
    setLoading(true);
    const nh = [...history, { role: "user", content: `[Phase: ${PHASES[phase].label}] ${msg}` }];
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}` }, body: JSON.stringify({ model: "llama-3.3-70b-versatile", max_tokens: 1000, messages: [{ role: "system", content: SYSTEM_PROMPT }, ...nh] }) });
      const d = await res.json(); if (d.error) throw new Error(d.error.message);
      const reply = d.choices?.[0]?.message?.content || "Something went wrong.";
      setHistory([...nh, { role: "assistant", content: reply }]);
      setMessages(p => [...p, { role: "assistant", content: reply }]);
      setSessions(p => [{ id: Date.now(), title: msg.slice(0, 28) + (msg.length > 28 ? "…" : ""), phase: PHASES[phase].label, time: "Just now", color: PHASES[phase].color }, ...p.slice(0, 9)]);
    } catch (err) { setMessages(p => [...p, { role: "assistant", content: `❌ ${err.message}` }]); }
    setLoading(false);
  };

  const switchPhase = idx => {
    setPhase(idx);
    setMessages(p => [...p, { role: "assistant", content: `${PHASES[idx].icon} Switched to **${PHASES[idx].label}** phase!\n\n${PHASES[idx].desc} — what would you like to work on?` }]);
  };

  const newChat = () => { setMessages([{ role: "assistant", content: "New session! 🎬\n\n🎤 Speak  •  📄 Upload PDF  •  ⌨️ Type\n\nWhat's your documentary topic?" }]); setHistory([]); setActiveSession(null); };
  const handleLogin = () => { if (loginForm.name && loginForm.email) { setUser({ name: loginForm.name, email: loginForm.email, initials: loginForm.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) }); setShowLogin(false); setLoginForm({ name: "", email: "" }); } };
  const cp = PHASES[phase];

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: "hidden", background: "#f8faff" }}>
      <style>{`
        *{box-sizing:border-box}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}
        @keyframes floatAnim{0%,100%{transform:translateY(0px)}50%{transform:translateY(-5px)}}
        @keyframes pulseGreen{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.4)}70%{box-shadow:0 0 0 8px rgba(16,185,129,0)}}
        @keyframes pulseRed{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)}70%{box-shadow:0 0 0 10px rgba(239,68,68,0)}}
        @keyframes wave{0%,100%{transform:scaleY(0.4)}50%{transform:scaleY(1.6)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.2);border-radius:99px}
        textarea{resize:none;outline:none;scrollbar-width:none;background:transparent;border:none;font-family:inherit}
        textarea::-webkit-scrollbar{display:none}
        input{outline:none;font-family:inherit}
        button{font-family:inherit;cursor:pointer;border:none;transition:all 0.2s cubic-bezier(0.34,1.56,0.64,1)}
        .hoverlift:hover{transform:translateY(-2px)!important}
        .hoverscale:hover{transform:scale(1.06)!important}
        .sessionrow:hover{background:linear-gradient(135deg,rgba(99,102,241,0.06),rgba(124,58,237,0.06))!important;transform:translateX(4px)!important}
      `}</style>

      {/* BG decorative blobs */}
      <div style={{ position: "fixed", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.08),transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -80, left: 200, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(219,39,119,0.06),transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* ════════════ SIDEBAR ════════════ */}
      {sidebarOpen && (
        <div style={{ width: 272, background: "white", borderRight: "1px solid #e8eaf6", display: "flex", flexDirection: "column", flexShrink: 0, animation: "slideIn 0.28s ease", boxShadow: "4px 0 32px rgba(99,102,241,0.07)", zIndex: 10, position: "relative" }}>

          {/* Logo area */}
          <div style={{ padding: "22px 18px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
              <div style={{ width: 42, height: 42, borderRadius: 14, background: "linear-gradient(135deg,#6366f1,#7c3aed,#db2777)", backgroundSize: "200% 200%", animation: "gradientShift 4s ease infinite, floatAnim 3s ease infinite", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 6px 20px rgba(99,102,241,0.35)" }}>🎬</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", letterSpacing: "-0.4px" }}>DocCreator</div>
                <div style={{ fontSize: 11, fontWeight: 500, background: "linear-gradient(135deg,#6366f1,#db2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI Storytelling Studio</div>
              </div>
              <button onClick={() => setSidebarOpen(false)} style={{ marginLeft: "auto", background: "#f1f5f9", border: "none", color: "#64748b", width: 28, height: 28, borderRadius: 8, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
            </div>

            <button onClick={newChat} className="hoverlift" style={{ width: "100%", padding: "11px 16px", borderRadius: 14, border: "1.5px solid #e0e7ff", background: "linear-gradient(135deg,#eef2ff,#f5f3ff)", color: "#6366f1", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, justifyContent: "center", boxShadow: "0 2px 12px rgba(99,102,241,0.1)" }}>
              <span>✨</span> New Chat
            </button>
          </div>

          {/* Feature pills */}
          <div style={{ padding: "0 16px 12px", display: "flex", gap: 6 }}>
            <div style={{ padding: "4px 12px", borderRadius: 99, background: "linear-gradient(135deg,#fef2f2,#fee2e2)", border: "1px solid #fecaca", fontSize: 11, color: "#ef4444", fontWeight: 700 }}>🎤 Voice AI</div>
            <div style={{ padding: "4px 12px", borderRadius: 99, background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", border: "1px solid #ddd6fe", fontSize: 11, color: "#7c3aed", fontWeight: 700 }}>📄 PDF AI</div>
          </div>

          {/* Phases */}
          <div style={{ padding: "0 16px 12px" }}>
            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Workflow</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {PHASES.map(p => (
                <button key={p.id} onClick={() => switchPhase(p.id)} style={{ padding: "9px 14px", borderRadius: 12, border: `1.5px solid ${phase === p.id ? p.border : "transparent"}`, background: phase === p.id ? p.light : "transparent", color: phase === p.id ? p.color : "#64748b", fontSize: 12, fontWeight: phase === p.id ? 700 : 500, display: "flex", alignItems: "center", gap: 8, textAlign: "left", boxShadow: phase === p.id ? `0 2px 12px ${p.color}20` : "none", transition: "all 0.18s" }}>
                  <span style={{ fontSize: 15 }}>{p.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: phase === p.id ? 700 : 500 }}>{p.label}</div>
                    <div style={{ fontSize: 10, color: phase === p.id ? p.color : "#94a3b8", opacity: 0.8 }}>{p.desc}</div>
                  </div>
                  {phase === p.id && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: p.color, animation: "pulseGreen 2s infinite" }} />}
                </button>
              ))}
            </div>
          </div>

          {/* History */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 10px" }}>
            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 8px 8px" }}>Recent Chats</div>
            {sessions.map(s => (
              <div key={s.id} className="sessionrow" onClick={() => setActiveSession(s.id)} style={{ padding: "10px 12px", borderRadius: 12, marginBottom: 3, cursor: "pointer", background: activeSession === s.id ? `${s.color}10` : "transparent", border: `1px solid ${activeSession === s.id ? s.color + "30" : "transparent"}`, transition: "all 0.2s" }}>
                <div style={{ fontSize: 13, color: "#334155", fontWeight: 500, marginBottom: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>💬 {s.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: `${s.color}15`, color: s.color, fontWeight: 700, border: `1px solid ${s.color}25` }}>{s.phase}</span>
                  <span style={{ fontSize: 10, color: "#cbd5e1" }}>{s.time}</span>
                </div>
              </div>
            ))}
          </div>

          {/* User */}
          <div style={{ padding: "12px 14px 16px", borderTop: "1px solid #f1f5f9" }}>
            <div onClick={() => setShowUserMenu(!showUserMenu)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 14, cursor: "pointer", background: showUserMenu ? "#f8faff" : "transparent", border: `1px solid ${showUserMenu ? "#e0e7ff" : "transparent"}`, transition: "all 0.18s" }}>
              <Avatar initials={user.initials} size={36} />
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
              </div>
              <span style={{ fontSize: 14, opacity: 0.5 }}>⚙️</span>
            </div>
            {showUserMenu && (
              <div style={{ marginTop: 8, borderRadius: 14, background: "white", border: "1px solid #e8eaf6", boxShadow: "0 8px 32px rgba(99,102,241,0.12)", overflow: "hidden" }}>
                <button onClick={() => { setShowLogin(true); setShowUserMenu(false); }} style={{ width: "100%", padding: "11px 16px", background: "none", color: "#6366f1", fontSize: 13, fontWeight: 600, textAlign: "left", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #f1f5f9" }}>✏️ Edit Profile</button>
                <button onClick={() => { setUser({ name: "Guest", email: "guest@email.com", initials: "G" }); setShowUserMenu(false); }} style={{ width: "100%", padding: "11px 16px", background: "none", color: "#ef4444", fontSize: 13, fontWeight: 600, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>🚪 Sign Out</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════ MAIN ════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1 }}>

        {/* TOPBAR */}
        <div style={{ padding: "0 24px", height: 64, borderBottom: "1px solid #eef2ff", display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(20px)", flexShrink: 0, boxShadow: "0 1px 24px rgba(99,102,241,0.06)" }}>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} style={{ background: "#f8faff", border: "1px solid #e0e7ff", color: "#6366f1", width: 36, height: 36, borderRadius: 10, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>☰</button>
          )}

          <div style={{ fontSize: 24, animation: "floatAnim 3s ease infinite" }}>🎬</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", letterSpacing: "-0.4px" }}>Documentary Creator</div>
            <div style={{ fontSize: 11, fontWeight: 600, background: "linear-gradient(135deg,#6366f1,#7c3aed,#db2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Powered by LLaMA 3.3 · Groq · Voice · PDF</div>
          </div>

          {/* Phase pills center */}
          <div style={{ display: "flex", gap: 6, marginLeft: "auto", marginRight: "auto" }}>
            {PHASES.map(p => (
              <button key={p.id} className="hoverlift" onClick={() => switchPhase(p.id)} style={{ padding: "7px 16px", borderRadius: 99, border: `1.5px solid ${phase === p.id ? p.color : "#e8eaf6"}`, background: phase === p.id ? `linear-gradient(135deg,${p.light},white)` : "white", color: phase === p.id ? p.color : "#94a3b8", fontSize: 12, fontWeight: phase === p.id ? 800 : 500, display: "flex", alignItems: "center", gap: 5, boxShadow: phase === p.id ? `0 4px 16px ${p.color}25` : "0 1px 4px rgba(0,0,0,0.04)" }}>
                <span>{p.icon}</span><span>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99, background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", animation: "pulseGreen 2s infinite" }} />
              <span style={{ fontSize: 11, color: "#059669", fontWeight: 700 }}>Live</span>
            </div>
            <div onClick={() => setShowLogin(true)} className="hoverscale" style={{ cursor: "pointer" }}>
              <Avatar initials={user.initials} size={38} />
            </div>
          </div>
        </div>

        {/* Recording banner */}
        {isRecording && (
          <div style={{ background: "linear-gradient(135deg,#fef2f2,#fff1f2)", borderBottom: "1px solid #fecaca", padding: "10px 28px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", flexShrink: 0, animation: "pulseRed 1s infinite" }} />
            <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 700 }}>🎤 Recording... {recordingTime}s — Speak now!</span>
            <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
              {[3,5,7,9,7,5,7,9,7,5,3,5,7,5,3].map((h, i) => (
                <div key={i} style={{ width: 3, height: h * 2.5, background: "linear-gradient(to top,#ef4444,#fb7185)", borderRadius: 3, animation: `wave 0.6s ${i * 0.06}s infinite` }} />
              ))}
            </div>
            <span style={{ marginLeft: "auto", fontSize: 12, color: "#f87171", fontWeight: 600 }}>Tap 🎤 to stop</span>
          </div>
        )}

        {/* Phase progress bar */}
        <div style={{ height: 3, background: "#f1f5f9", flexShrink: 0, display: "flex" }}>
          {PHASES.map((p, i) => (
            <div key={i} style={{ flex: 1, background: i <= phase ? `linear-gradient(90deg,${p.color},${PHASES[Math.min(i + 1, 3)].color})` : "transparent", transition: "all 0.4s ease", opacity: i <= phase ? 1 : 0 }} />
          ))}
        </div>

        {/* Phase context pill */}
        <div style={{ padding: "10px 28px", background: "white", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ padding: "5px 14px", borderRadius: 99, background: cp.light, border: `1px solid ${cp.border}`, fontSize: 12, color: cp.color, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            <span>{cp.icon}</span><span>{cp.label} Phase</span>
          </div>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
          <span style={{ fontSize: 12, color: "#64748b" }}>{cp.desc}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 5, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>Progress</span>
            {PHASES.map((p, i) => (
              <div key={i} className="hoverlift" onClick={() => switchPhase(i)} style={{ width: i === phase ? 28 : 10, height: 8, borderRadius: 99, background: i <= phase ? p.color : "#e8eaf6", transition: "all 0.3s", cursor: "pointer", boxShadow: i === phase ? `0 2px 8px ${p.color}50` : "none" }} />
            ))}
          </div>
        </div>

        {/* CHAT */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px 16px", background: "#fafbff" }}>
          <div style={{ maxWidth: 820, margin: "0 auto" }}>
            {messages.map((m, i) => <Message key={i} msg={m} userInitials={user.initials} />)}
            {(loading || pdfUploading) && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "white", border: "2px solid #e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎬</div>
                <div style={{ padding: "16px 20px", borderRadius: "22px 22px 22px 6px", background: "white", border: "1px solid #f1f5f9", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
                  {pdfUploading ? <span style={{ fontSize: 13, color: "#7c3aed", fontWeight: 600 }}>📄 Analysing PDF...</span> : <TypingDots />}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* QUICK PROMPTS */}
        <div style={{ padding: "10px 32px 8px", background: "white", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", gap: 7, overflowX: "auto", scrollbarWidth: "none" }}>
            {QUICK_PROMPTS.map(q => (
              <button key={q.text} className="hoverlift" onClick={() => send(q.text)} style={{ whiteSpace: "nowrap", padding: "7px 16px", borderRadius: 99, border: `1.5px solid ${q.color}25`, background: `${q.color}08`, color: q.color, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5, boxShadow: `0 2px 8px ${q.color}10` }}>
                <span>{q.icon}</span><span>{q.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* INPUT AREA */}
        <div style={{ padding: "10px 32px 20px", background: "white", boxShadow: "0 -4px 32px rgba(99,102,241,0.06)" }}>
          <div style={{ maxWidth: 820, margin: "0 auto" }}>
            {/* Upload row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <button onClick={() => fileRef.current?.click()} className="hoverlift" style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 10, border: "1.5px solid #ddd6fe", background: "linear-gradient(135deg,#faf5ff,#f5f3ff)", color: "#7c3aed", fontSize: 12, fontWeight: 700, boxShadow: "0 2px 10px rgba(124,58,237,0.1)" }}>
                📄 Upload PDF Script
              </button>
              <input ref={fileRef} type="file" accept=".pdf" onChange={handlePdf} style={{ display: "none" }} />
              <span style={{ fontSize: 11, color: "#94a3b8" }}>AI will analyse your documentary script instantly</span>
            </div>

            {/* Input box */}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ flex: 1, background: isRecording ? "#fff5f5" : "#f8faff", border: `2px solid ${isRecording ? "#fca5a5" : "#e0e7ff"}`, borderRadius: 20, padding: "14px 20px", boxShadow: isRecording ? "0 0 0 4px rgba(239,68,68,0.08), 0 4px 24px rgba(0,0,0,0.06)" : "0 4px 24px rgba(99,102,241,0.08)", transition: "all 0.25s" }}>
                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder={isRecording ? "🎤 Listening... speak now!" : "Ask about your documentary... (Enter to send, Shift+Enter for new line)"}
                  rows={1}
                  style={{ width: "100%", color: isRecording ? "#dc2626" : "#1e293b", fontSize: 14.5, lineHeight: 1.6, maxHeight: 130 }} />
              </div>

              {/* Mic */}
              <button onClick={toggleVoice} className="hoverscale" style={{ width: 52, height: 52, borderRadius: 16, background: isRecording ? "linear-gradient(135deg,#ef4444,#dc2626)" : "linear-gradient(135deg,#fef2f2,#fee2e2)", border: isRecording ? "none" : "1.5px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, boxShadow: isRecording ? "0 0 28px rgba(239,68,68,0.55)" : "0 3px 14px rgba(239,68,68,0.15)", animation: isRecording ? "pulseRed 1s infinite" : "none" }}>
                {isRecording ? "⏹️" : "🎤"}
              </button>

              {/* Send */}
              <button onClick={() => send()} disabled={!input.trim() || loading} className="hoverscale" style={{ width: 52, height: 52, borderRadius: 16, background: input.trim() && !loading ? "linear-gradient(135deg,#6366f1,#7c3aed,#db2777)" : "#f1f5f9", backgroundSize: "200% 200%", animation: input.trim() && !loading ? "gradientShift 3s ease infinite" : "none", border: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, boxShadow: input.trim() && !loading ? "0 6px 28px rgba(99,102,241,0.4)" : "none", cursor: input.trim() && !loading ? "pointer" : "not-allowed" }}>
                <span style={{ color: input.trim() && !loading ? "white" : "#cbd5e1" }}>➤</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════ PROFILE MODAL ════════════ */}
      {showLogin && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(10px)" }}>
          <div style={{ width: 400, background: "white", borderRadius: 28, padding: 36, boxShadow: "0 32px 80px rgba(99,102,241,0.2)", animation: "fadeUp 0.3s cubic-bezier(0.34,1.56,0.64,1)", border: "1px solid #e0e7ff" }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ margin: "0 auto 14px" }}><Avatar initials={user.initials} size={64} /></div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", letterSpacing: "-0.4px" }}>Your Profile</div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 5 }}>Update your details below</div>
            </div>
            {[{ label: "Full Name", key: "name", ph: user.name }, { label: "Email Address", key: "email", ph: user.email }].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "#6366f1", marginBottom: 7, fontWeight: 700, letterSpacing: "0.04em" }}>{f.label}</div>
                <input value={loginForm[f.key]} onChange={e => setLoginForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 14, border: "1.5px solid #e0e7ff", background: "#f8faff", color: "#1e293b", fontSize: 14, boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowLogin(false)} style={{ flex: 1, padding: "13px", borderRadius: 14, background: "#f8faff", color: "#64748b", fontSize: 14, fontWeight: 600, border: "1.5px solid #e0e7ff" }}>Cancel</button>
              <button onClick={handleLogin} style={{ flex: 1, padding: "13px", borderRadius: 14, background: "linear-gradient(135deg,#6366f1,#7c3aed)", color: "#fff", fontSize: 14, fontWeight: 800, boxShadow: "0 6px 24px rgba(99,102,241,0.35)", letterSpacing: "0.02em" }}>Save ✓</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

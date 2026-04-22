import { useState, useRef, useEffect } from "react";

const API_KEY = process.env.REACT_APP_API_KEY;
const SYSTEM_PROMPT = `You are an AI Documentary Creator assistant — a specialized storytelling guide that helps filmmakers, journalists, and content creators craft compelling documentaries.
Your role is to:
1. RESEARCH PHASE: Help users identify research angles, key themes, background information, historical context, and credible sources. Generate research summaries and identify knowledge gaps.
2. STRUCTURE PHASE: Generate documentary structures — acts, sequences, scene breakdowns. Suggest narrative frameworks. Provide timestamped outlines.
3. NARRATIVE PHASE: Guide storytelling — opening hooks, character arcs, conflict-resolution patterns, emotional beats, closing statements. Help write narration drafts.
4. REVIEW PHASE: Review and critique documentary structure, suggest improvements, identify weak points in narrative logic.
When a user uploads a PDF, analyze its content and provide documentary-specific insights.
Always be concise, creative, and specific. Format responses clearly. Use numbered lists for structures. Keep responses under 250 words unless asked. Be enthusiastic!`;

const PHASES = [
  { id: 0, label: "Research", icon: "🔍", color: "#6366f1", bg: "#eef2ff", desc: "Find angles & sources" },
  { id: 1, label: "Structure", icon: "📋", color: "#8b5cf6", bg: "#f5f3ff", desc: "Build your outline" },
  { id: 2, label: "Narrative", icon: "✍️", color: "#ec4899", bg: "#fdf2f8", desc: "Craft the story" },
  { id: 3, label: "Review", icon: "🎬", color: "#10b981", bg: "#ecfdf5", desc: "Polish & refine" },
];

const QUICK_PROMPTS = [
  { text: "Generate structure", icon: "📋" },
  { text: "Interview questions", icon: "🎤" },
  { text: "Opening narration", icon: "✍️" },
  { text: "Research angles", icon: "🔍" },
  { text: "3-act outline", icon: "📝" },
  { text: "B-roll ideas", icon: "🎥" },
];

const phaseColors = { Research: "#6366f1", Structure: "#8b5cf6", Narrative: "#ec4899", Review: "#10b981" };

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, padding: "6px 2px", alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#8b5cf6", animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
      ))}
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}`}</style>
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", flexDirection: isUser ? "row-reverse" : "row", alignItems: "flex-end", gap: 10, marginBottom: 20, animation: "fadeUp 0.35s ease" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: isUser ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "linear-gradient(135deg,#f8fafc,#e2e8f0)", border: isUser ? "none" : "2px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: isUser ? 13 : 18, fontWeight: 700, color: isUser ? "#fff" : "#1e293b", flexShrink: 0, boxShadow: isUser ? "0 4px 12px rgba(99,102,241,0.3)" : "0 2px 8px rgba(0,0,0,0.08)" }}>
        {isUser ? "U" : "🎬"}
      </div>
      <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
        <span style={{ fontSize: 11, color: "#94a3b8", marginBottom: 5, fontWeight: 600, letterSpacing: "0.02em" }}>{isUser ? "You" : "Documentary AI"}</span>
        {msg.isPdf && (
          <div style={{ padding: "8px 14px", borderRadius: 12, background: "#f5f3ff", border: "1px solid #ddd6fe", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>📄</span>
            <span style={{ fontSize: 12, color: "#7c3aed", fontWeight: 600 }}>{msg.fileName}</span>
          </div>
        )}
        <div style={{ padding: "14px 18px", borderRadius: isUser ? "20px 20px 4px 20px" : "20px 20px 20px 4px", background: isUser ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#ffffff", color: isUser ? "#fff" : "#1e293b", fontSize: 14, lineHeight: 1.7, boxShadow: isUser ? "0 4px 20px rgba(99,102,241,0.25)" : "0 2px 16px rgba(0,0,0,0.06)", border: isUser ? "none" : "1px solid #f1f5f9", whiteSpace: "pre-wrap" }}>
          {msg.content}
        </div>
        {msg.isVoice && <span style={{ fontSize: 10, color: "#ef4444", marginTop: 4, fontWeight: 500 }}>🎤 Voice message</span>}
      </div>
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState(0);
  const [messages, setMessages] = useState([{ role: "assistant", content: "Welcome to Documentary Creator! ✨\n\nI'm your AI storytelling partner — guiding you through every phase of documentary filmmaking.\n\n🔍 Research → 📋 Structure → ✍️ Narrative → 🎬 Review\n\n🎤 Tap the mic to speak  •  📄 Upload a PDF script\n\nWhat documentary are you working on?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [sessions, setSessions] = useState([
    { id: 1, title: "Street Food in Delhi", phase: "Research", time: "2h ago" },
    { id: 2, title: "Climate Change Glaciers", phase: "Structure", time: "Yesterday" },
    { id: 3, title: "Women in Tech India", phase: "Narrative", time: "2 days ago" },
    { id: 4, title: "Ancient Temples Punjab", phase: "Review", time: "3 days ago" },
    { id: 5, title: "Startup Revolution", phase: "Research", time: "1 week ago" },
  ]);
  const [activeSession, setActiveSession] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState({ name: "Aakriti", email: "aakriti@email.com", initials: "AA" });
  const [loginForm, setLoginForm] = useState({ name: "", email: "" });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [hoveredPhase, setHoveredPhase] = useState(null);
  const recognitionRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const r = new SR();
      r.continuous = false;
      r.interimResults = true;
      r.lang = "en-US";
      r.onresult = (e) => setInput(Array.from(e.results).map(x => x[0].transcript).join(""));
      r.onend = () => { setIsRecording(false); clearInterval(recordingTimerRef.current); setRecordingTime(0); };
      r.onerror = () => { setIsRecording(false); clearInterval(recordingTimerRef.current); setRecordingTime(0); };
      recognitionRef.current = r;
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) { alert("Voice not supported! Use Chrome."); return; }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setInput("");
      recognitionRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== "application/pdf") { alert("PDF only!"); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Max 5MB!"); return; }
    setPdfUploading(true);
    setMessages(prev => [...prev, { role: "user", content: `Please analyse this PDF: "${file.name}" and give me documentary insights.`, isPdf: true, fileName: file.name }]);
    setLoading(true); setPdfUploading(false);
    const newHistory = [...history, { role: "user", content: `[Phase: ${PHASES[phase].label}] User uploaded PDF "${file.name}". Acknowledge and ask what documentary analysis they need.` }];
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}` }, body: JSON.stringify({ model: "llama-3.3-70b-versatile", max_tokens: 1000, messages: [{ role: "system", content: SYSTEM_PROMPT }, ...newHistory] }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const reply = data.choices?.[0]?.message?.content || "Something went wrong.";
      setHistory([...newHistory, { role: "assistant", content: reply }]);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      setSessions(prev => [{ id: Date.now(), title: file.name.slice(0, 28), phase: PHASES[phase].label, time: "Just now" }, ...prev.slice(0, 9)]);
    } catch (err) { setMessages(prev => [...prev, { role: "assistant", content: `❌ ${err.message}` }]); }
    setLoading(false); e.target.value = "";
  };

  const send = async (text, isVoice = false) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg, isVoice }]);
    setLoading(true);
    const newHistory = [...history, { role: "user", content: `[Phase: ${PHASES[phase].label}] ${msg}` }];
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}` }, body: JSON.stringify({ model: "llama-3.3-70b-versatile", max_tokens: 1000, messages: [{ role: "system", content: SYSTEM_PROMPT }, ...newHistory] }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const reply = data.choices?.[0]?.message?.content || "Something went wrong.";
      setHistory([...newHistory, { role: "assistant", content: reply }]);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      setSessions(prev => [{ id: Date.now(), title: msg.slice(0, 30) + (msg.length > 30 ? "..." : ""), phase: PHASES[phase].label, time: "Just now" }, ...prev.slice(0, 9)]);
    } catch (err) { setMessages(prev => [...prev, { role: "assistant", content: `❌ ${err.message}` }]); }
    setLoading(false);
  };

  const switchPhase = (idx) => {
    setPhase(idx);
    setMessages(prev => [...prev, { role: "assistant", content: `${PHASES[idx].icon} Switched to **${PHASES[idx].label}** phase!\n\n${PHASES[idx].desc} — what would you like to work on?` }]);
  };

  const newChat = () => { setMessages([{ role: "assistant", content: "New session started! 🎬\n\n🎤 Speak to me or 📄 upload a PDF script!\n\nWhat documentary topic are you working on?" }]); setHistory([]); setActiveSession(null); };

  const handleLogin = () => {
    if (loginForm.name && loginForm.email) {
      setUser({ name: loginForm.name, email: loginForm.email, initials: loginForm.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) });
      setShowLogin(false); setLoginForm({ name: "", email: "" });
    }
  };

  const currentPhase = PHASES[phase];

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", background: "linear-gradient(135deg,#f0f4ff 0%,#faf5ff 50%,#fdf2f8 100%)", fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: "hidden" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes pulseRed{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)}70%{box-shadow:0 0 0 10px rgba(239,68,68,0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
        @keyframes wave{0%,100%{transform:scaleY(0.5)}50%{transform:scaleY(1.5)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:rgba(139,92,246,0.25);border-radius:99px}
        textarea{resize:none;outline:none;scrollbar-width:none} textarea::-webkit-scrollbar{display:none}
        input{outline:none} button{font-family:inherit;cursor:pointer;transition:all 0.18s}
        .session-item:hover{background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.08)) !important; transform:translateX(3px)}
        .quick-chip:hover{background:white !important; box-shadow:0 4px 16px rgba(99,102,241,0.2) !important; transform:translateY(-2px)}
        .phase-card:hover{transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.1) !important}
        .send-btn:hover:not(:disabled){transform:scale(1.05); box-shadow:0 6px 24px rgba(99,102,241,0.45) !important}
        .mic-btn:hover{transform:scale(1.05)}
        .upload-btn:hover{background:white !important; box-shadow:0 4px 16px rgba(139,92,246,0.2) !important}
        .sidebar-btn:hover{background:rgba(99,102,241,0.08) !important}
      `}</style>

      {/* ── SIDEBAR ── */}
      {sidebarOpen && (
        <div style={{ width: 268, background: "rgba(255,255,255,0.75)", backdropFilter: "blur(20px)", borderRight: "1px solid rgba(139,92,246,0.12)", display: "flex", flexDirection: "column", flexShrink: 0, animation: "slideIn 0.25s ease", boxShadow: "4px 0 24px rgba(99,102,241,0.06)" }}>

          {/* Logo */}
          <div style={{ padding: "20px 18px 14px", borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 4px 14px rgba(99,102,241,0.35)", animation: "float 3s infinite" }}>🎬</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", letterSpacing: "-0.3px" }}>DocCreator</div>
                <div style={{ fontSize: 11, color: "#8b5cf6", fontWeight: 500 }}>AI Storytelling Studio</div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="sidebar-btn" style={{ marginLeft: "auto", background: "none", border: "none", color: "#94a3b8", fontSize: 18, padding: "4px 6px", borderRadius: 8 }}>‹</button>
            </div>

            <button onClick={newChat} style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1.5px solid rgba(99,102,241,0.3)", background: "linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.08))", color: "#6366f1", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, justifyContent: "center", boxShadow: "0 2px 8px rgba(99,102,241,0.1)" }}>
              <span>✏️</span> New Chat
            </button>
          </div>

          {/* Feature Badges */}
          <div style={{ padding: "10px 16px 6px", display: "flex", gap: 6 }}>
            <div style={{ padding: "4px 10px", borderRadius: 99, background: "linear-gradient(135deg,#fef2f2,#fee2e2)", border: "1px solid #fecaca", fontSize: 11, color: "#ef4444", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>🎤 Voice</div>
            <div style={{ padding: "4px 10px", borderRadius: 99, background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", border: "1px solid #ddd6fe", fontSize: 11, color: "#7c3aed", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>📄 PDF AI</div>
          </div>

          {/* Phase pills */}
          <div style={{ padding: "10px 16px 8px" }}>
            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Workflow Phases</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {PHASES.map((p) => (
                <button key={p.id} onClick={() => switchPhase(p.id)} style={{ padding: "5px 11px", borderRadius: 8, border: `1.5px solid ${phase === p.id ? p.color : "rgba(0,0,0,0.06)"}`, background: phase === p.id ? p.bg : "transparent", color: phase === p.id ? p.color : "#64748b", fontSize: 11, fontWeight: phase === p.id ? 700 : 400, boxShadow: phase === p.id ? `0 2px 8px ${p.color}30` : "none" }}>
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat History */}
          <div style={{ flex: 1, overflowY: "auto", padding: "6px 10px" }}>
            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "6px 8px 8px" }}>Recent Chats</div>
            {sessions.map((s) => (
              <div key={s.id} className="session-item" onClick={() => setActiveSession(s.id)} style={{ padding: "10px 10px", borderRadius: 10, marginBottom: 3, cursor: "pointer", background: activeSession === s.id ? "linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.1))" : "transparent", border: `1px solid ${activeSession === s.id ? "rgba(99,102,241,0.2)" : "transparent"}`, transition: "all 0.18s" }}>
                <div style={{ fontSize: 13, color: "#334155", fontWeight: 500, marginBottom: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>💬 {s.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, background: `${phaseColors[s.phase]}15`, color: phaseColors[s.phase], fontWeight: 600, border: `1px solid ${phaseColors[s.phase]}30` }}>{s.phase}</span>
                  <span style={{ fontSize: 10, color: "#94a3b8" }}>{s.time}</span>
                </div>
              </div>
            ))}
          </div>

          {/* User Profile */}
          <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(139,92,246,0.1)" }}>
            <div onClick={() => setShowUserMenu(!showUserMenu)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 12, cursor: "pointer", background: showUserMenu ? "rgba(99,102,241,0.08)" : "transparent", transition: "all 0.18s" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0, boxShadow: "0 2px 10px rgba(99,102,241,0.3)" }}>{user.initials}</div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
              </div>
              <span style={{ fontSize: 14 }}>⚙️</span>
            </div>
            {showUserMenu && (
              <div style={{ marginTop: 8, padding: "6px", borderRadius: 12, background: "white", border: "1px solid rgba(139,92,246,0.15)", boxShadow: "0 8px 24px rgba(99,102,241,0.1)" }}>
                <button onClick={() => { setShowLogin(true); setShowUserMenu(false); }} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, background: "none", border: "none", color: "#6366f1", fontSize: 13, textAlign: "left", display: "flex", alignItems: "center", gap: 8, fontWeight: 500 }}>✏️ Edit Profile</button>
                <button onClick={() => { setUser({ name: "Guest", email: "guest@email.com", initials: "G" }); setShowUserMenu(false); }} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, background: "none", border: "none", color: "#ef4444", fontSize: 13, textAlign: "left", display: "flex", alignItems: "center", gap: 8, fontWeight: 500 }}>🚪 Sign Out</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MAIN AREA ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top Bar */}
        <div style={{ padding: "14px 24px", borderBottom: "1px solid rgba(139,92,246,0.1)", display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.8)", backdropFilter: "blur(20px)", flexShrink: 0, boxShadow: "0 2px 16px rgba(99,102,241,0.06)" }}>
          {!sidebarOpen && <button onClick={() => setSidebarOpen(true)} className="sidebar-btn" style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 22, padding: "0 4px", borderRadius: 8 }}>☰</button>}

          <div style={{ fontSize: 24, animation: "float 3s infinite" }}>🎬</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", letterSpacing: "-0.3px" }}>Documentary Creator</div>
            <div style={{ fontSize: 11, color: "#8b5cf6", fontWeight: 500 }}>LLaMA 3.3 · Groq · 🎤 Voice · 📄 PDF</div>
          </div>

          {/* Phase cards center */}
          <div style={{ display: "flex", gap: 8, marginLeft: "auto", marginRight: "auto" }}>
            {PHASES.map((p) => (
              <button key={p.id} className="phase-card" onClick={() => switchPhase(p.id)}
                onMouseEnter={() => setHoveredPhase(p.id)} onMouseLeave={() => setHoveredPhase(null)}
                style={{ padding: "7px 16px", borderRadius: 10, border: `1.5px solid ${phase === p.id ? p.color : "rgba(0,0,0,0.07)"}`, background: phase === p.id ? p.bg : "white", color: phase === p.id ? p.color : "#64748b", fontSize: 12, fontWeight: phase === p.id ? 700 : 500, display: "flex", alignItems: "center", gap: 6, boxShadow: phase === p.id ? `0 4px 16px ${p.color}25` : "0 2px 8px rgba(0,0,0,0.04)", transition: "all 0.18s" }}>
                <span style={{ fontSize: 15 }}>{p.icon}</span><span>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99, background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>Live</span>
            </div>
            <div onClick={() => setShowLogin(true)} style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 4px 14px rgba(99,102,241,0.35)", border: "2.5px solid white" }}>
              {user.initials}
            </div>
          </div>
        </div>

        {/* Recording Banner */}
        {isRecording && (
          <div style={{ background: "linear-gradient(135deg,#fef2f2,#fee2e2)", borderBottom: "1px solid #fecaca", padding: "10px 28px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", animation: "pulseRed 1s infinite", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 600 }}>🎤 Recording... {recordingTime}s — Speak now!</span>
            <div style={{ display: "flex", gap: 2, alignItems: "center", height: 20 }}>
              {[2,4,6,8,6,4,6,8,6,4,2,4,6].map((h, i) => (
                <div key={i} style={{ width: 3, height: h * 2, background: "#ef4444", borderRadius: 2, opacity: 0.7, animation: `wave 0.7s ${i * 0.08}s infinite` }} />
              ))}
            </div>
            <span style={{ marginLeft: "auto", fontSize: 12, color: "#ef4444", fontWeight: 500 }}>Press 🎤 to stop</span>
          </div>
        )}

        {/* Phase indicator strip */}
        <div style={{ padding: "10px 28px", background: currentPhase.bg, borderBottom: `1px solid ${currentPhase.color}20`, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 16 }}>{currentPhase.icon}</span>
          <span style={{ fontSize: 13, color: currentPhase.color, fontWeight: 600 }}>{currentPhase.label} Phase</span>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
          <span style={{ fontSize: 12, color: "#64748b" }}>{currentPhase.desc}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {PHASES.map((p, i) => (
              <div key={i} style={{ width: i <= phase ? 24 : 14, height: 5, borderRadius: 99, background: i <= phase ? p.color : "#e2e8f0", transition: "all 0.3s" }} />
            ))}
          </div>
        </div>

        {/* Chat */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", background: "transparent" }}>
          <div style={{ maxWidth: 820, margin: "0 auto" }}>
            {messages.map((m, i) => <Message key={i} msg={m} />)}
            {(loading || pdfUploading) && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#f8fafc,#e2e8f0)", border: "2px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎬</div>
                <div style={{ padding: "14px 18px", borderRadius: "20px 20px 20px 4px", background: "white", border: "1px solid #f1f5f9", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
                  {pdfUploading ? <span style={{ fontSize: 13, color: "#8b5cf6", fontWeight: 500 }}>📄 Analysing PDF...</span> : <TypingDots />}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Quick Prompts */}
        <div style={{ padding: "10px 28px 6px", borderTop: "1px solid rgba(139,92,246,0.08)", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(10px)" }}>
          <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", gap: 7, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
            {QUICK_PROMPTS.map((q) => (
              <button key={q.text} className="quick-chip" onClick={() => send(q.text)} style={{ whiteSpace: "nowrap", padding: "6px 14px", borderRadius: 99, border: "1.5px solid rgba(99,102,241,0.2)", background: "rgba(255,255,255,0.7)", color: "#6366f1", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 5, boxShadow: "0 2px 8px rgba(99,102,241,0.08)" }}>
                <span>{q.icon}</span><span>{q.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div style={{ padding: "10px 28px 20px", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(20px)" }}>
          <div style={{ maxWidth: 820, margin: "0 auto" }}>
            {/* PDF Upload row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <button onClick={() => fileInputRef.current?.click()} className="upload-btn" style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 10, border: "1.5px solid rgba(139,92,246,0.25)", background: "rgba(245,243,255,0.8)", color: "#7c3aed", fontSize: 12, fontWeight: 600, boxShadow: "0 2px 8px rgba(139,92,246,0.08)" }}>
                📄 Upload PDF Script
              </button>
              <input ref={fileInputRef} type="file" accept=".pdf" onChange={handlePdfUpload} style={{ display: "none" }} />
              <span style={{ fontSize: 11, color: "#94a3b8" }}>AI will analyse your documentary script</span>
            </div>

            {/* Input box */}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ flex: 1, background: isRecording ? "#fef2f2" : "white", border: `2px solid ${isRecording ? "#fca5a5" : "rgba(99,102,241,0.2)"}`, borderRadius: 18, padding: "12px 18px", boxShadow: isRecording ? "0 0 0 4px rgba(239,68,68,0.08)" : "0 4px 20px rgba(99,102,241,0.08)", transition: "all 0.2s" }}>
                <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder={isRecording ? "🎤 Listening... speak now!" : "Ask about your documentary... (Enter to send)"}
                  rows={1}
                  style={{ width: "100%", background: "transparent", border: "none", color: isRecording ? "#dc2626" : "#1e293b", fontSize: 14, lineHeight: 1.6, fontFamily: "inherit", maxHeight: 120 }} />
              </div>

              {/* Mic Button */}
              <button onClick={toggleVoice} className="mic-btn" style={{ width: 50, height: 50, borderRadius: 15, background: isRecording ? "linear-gradient(135deg,#ef4444,#dc2626)" : "linear-gradient(135deg,#fef2f2,#fee2e2)", border: isRecording ? "none" : "1.5px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, boxShadow: isRecording ? "0 0 24px rgba(239,68,68,0.5)" : "0 2px 10px rgba(239,68,68,0.15)", animation: isRecording ? "pulseRed 1s infinite" : "none" }}>
                {isRecording ? "⏹️" : "🎤"}
              </button>

              {/* Send Button */}
              <button onClick={() => send()} disabled={!input.trim() || loading} className="send-btn" style={{ width: 50, height: 50, borderRadius: 15, background: input.trim() && !loading ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(0,0,0,0.05)", border: "none", cursor: input.trim() && !loading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, boxShadow: input.trim() && !loading ? "0 4px 20px rgba(99,102,241,0.35)" : "none", transition: "all 0.18s" }}>
                <span style={{ color: input.trim() && !loading ? "white" : "#94a3b8" }}>➤</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── PROFILE MODAL ── */}
      {showLogin && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(8px)" }}>
          <div style={{ width: 380, background: "white", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 24, padding: 32, boxShadow: "0 25px 60px rgba(99,102,241,0.2)", animation: "fadeUp 0.25s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 26 }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 auto 14px", boxShadow: "0 6px 24px rgba(99,102,241,0.35)" }}>{user.initials}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#1e293b" }}>Your Profile</div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>Update your details</div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#6366f1", marginBottom: 6, fontWeight: 600 }}>Full Name</div>
              <input value={loginForm.name} onChange={(e) => setLoginForm(f => ({ ...f, name: e.target.value }))} placeholder={user.name} style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#1e293b", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: "#6366f1", marginBottom: 6, fontWeight: 600 }}>Email Address</div>
              <input value={loginForm.email} onChange={(e) => setLoginForm(f => ({ ...f, email: e.target.value }))} placeholder={user.email} style={{ width: "100%", padding: "11px 14px", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#1e293b", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowLogin(false)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize: 14, fontWeight: 500 }}>Cancel</button>
              <button onClick={handleLogin} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontSize: 14, fontWeight: 700, boxShadow: "0 4px 16px rgba(99,102,241,0.35)" }}>Save ✓</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


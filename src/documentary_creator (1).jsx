import { useState, useRef, useEffect } from "react";

const API_KEY = " ";

const SYSTEM_PROMPT = `You are an AI Documentary Creator assistant — a specialized storytelling guide that helps filmmakers, journalists, and content creators craft compelling documentaries.

Your role is to:
1. RESEARCH PHASE: Help users identify research angles, key themes, background information, historical context, and credible sources for their documentary topic. Generate research summaries and identify knowledge gaps.
2. STRUCTURE PHASE: Generate documentary structures — acts, sequences, scene breakdowns. Suggest narrative frameworks (linear, non-linear, parallel, essay-style). Provide timestamped outlines.
3. NARRATIVE PHASE: Guide storytelling — opening hooks, character arcs, conflict-resolution patterns, emotional beats, closing statements. Help write narration drafts.
4. REVIEW PHASE: Review and critique documentary structure, suggest improvements, identify weak points in narrative logic.

Always be concise, creative, and specific. Format responses clearly with line breaks. When suggesting structures, use numbered lists. Keep responses under 250 words unless asked for more. Be enthusiastic about documentary as a medium.`;

const PHASES = [
  { id: 0, label: "Research", icon: "🔍" },
  { id: 1, label: "Structure", icon: "📋" },
  { id: 2, label: "Narrative", icon: "✍️" },
  { id: 3, label: "Review", icon: "🎬" },
];

const QUICK_PROMPTS = [
  "Generate a documentary structure",
  "Suggest interview questions",
  "Write an opening narration",
  "Identify key research angles",
  "Create a 3-act outline",
  "Suggest b-roll ideas",
];

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "4px 0" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#a78bfa", animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
      ))}
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", flexDirection: isUser ? "row-reverse" : "row", alignItems: "flex-end", gap: 10, marginBottom: 20, animation: "fadeUp 0.3s ease" }}>
      <div style={{ width: 34, height: 34, borderRadius: "50%", background: isUser ? "linear-gradient(135deg,#7c3aed,#a78bfa)" : "linear-gradient(135deg,#1e1b4b,#3730a3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0, boxShadow: "0 2px 8px rgba(124,58,237,0.3)" }}>
        {isUser ? "U" : "🎬"}
      </div>
      <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
        <span style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: 500 }}>{isUser ? "You" : "Documentary AI"}</span>
        <div style={{ padding: "13px 17px", borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: isUser ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "rgba(255,255,255,0.07)", color: isUser ? "#fff" : "#e2e8f0", fontSize: 14, lineHeight: 1.7, border: isUser ? "none" : "1px solid rgba(167,139,250,0.2)", whiteSpace: "pre-wrap" }}>
          {msg.content}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState(0);
  const [messages, setMessages] = useState([{ role: "assistant", content: "Welcome to Documentary Creator ✨\n\nI'm your AI storytelling partner — trained to guide you through every phase of documentary filmmaking.\n\n🔍 Research → 📋 Structure → ✍️ Narrative → 🎬 Review\n\nWhat documentary are you working on?" }]);
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
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);
    const newHistory = [...history, { role: "user", content: `[Phase: ${PHASES[phase].label}] ${msg}` }];
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}` },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", max_tokens: 1000, messages: [{ role: "system", content: SYSTEM_PROMPT }, ...newHistory] }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const reply = data.choices?.[0]?.message?.content || "Sorry, something went wrong.";
      setHistory([...newHistory, { role: "assistant", content: reply }]);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      // Save to sessions
      const short = msg.slice(0, 30) + (msg.length > 30 ? "..." : "");
      setSessions((prev) => [{ id: Date.now(), title: short, phase: PHASES[phase].label, time: "Just now" }, ...prev.slice(0, 9)]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: `❌ Error: ${err.message}` }]);
    }
    setLoading(false);
  };

  const switchPhase = (idx) => {
    setPhase(idx);
    setMessages((prev) => [...prev, { role: "assistant", content: `${PHASES[idx].icon} Switched to ${PHASES[idx].label} phase.\n\nI'm ready to help with your documentary. What would you like to work on?` }]);
  };

  const newChat = () => {
    setMessages([{ role: "assistant", content: "New session started! 🎬\n\nWhat documentary topic are you working on?" }]);
    setHistory([]);
    setActiveSession(null);
  };

  const handleLogin = () => {
    if (loginForm.name && loginForm.email) {
      const initials = loginForm.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
      setUser({ name: loginForm.name, email: loginForm.email, initials });
      setShowLogin(false);
      setLoginForm({ name: "", email: "" });
    }
  };

  const phaseColors = { Research: "#3b82f6", Structure: "#8b5cf6", Narrative: "#f59e0b", Review: "#10b981" };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", background: "#0a0718", fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: "hidden" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:rgba(167,139,250,0.3);border-radius:4px}
        textarea{resize:none;outline:none;scrollbar-width:none} textarea::-webkit-scrollbar{display:none}
        input{outline:none} button{font-family:inherit;cursor:pointer}
        .session-item:hover{background:rgba(124,58,237,0.15) !important}
        .quick-btn:hover{background:rgba(124,58,237,0.2) !important; border-color:rgba(167,139,250,0.5) !important}
        .phase-btn:hover{background:rgba(124,58,237,0.15) !important}
      `}</style>

      {/* ── SIDEBAR ── */}
      {sidebarOpen && (
        <div style={{ width: 260, background: "rgba(10,7,30,0.98)", borderRight: "1px solid rgba(167,139,250,0.12)", display: "flex", flexDirection: "column", flexShrink: 0, animation: "slideIn 0.2s ease" }}>
          
          {/* Sidebar Header */}
          <div style={{ padding: "18px 16px 12px", borderBottom: "1px solid rgba(167,139,250,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎬</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>DocCreator</div>
                <div style={{ fontSize: 11, color: "#a78bfa" }}>AI Storytelling</div>
              </div>
              <button onClick={() => setSidebarOpen(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#6b7280", fontSize: 18, padding: 2 }}>‹</button>
            </div>
            <button onClick={newChat} style={{ width: "100%", padding: "9px 14px", borderRadius: 10, border: "1px solid rgba(167,139,250,0.3)", background: "rgba(124,58,237,0.15)", color: "#c4b5fd", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
              <span style={{ fontSize: 16 }}>✏️</span> New Chat
            </button>
          </div>

          {/* Phase Filter */}
          <div style={{ padding: "12px 16px 8px" }}>
            <div style={{ fontSize: 10, color: "#4b5563", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Phases</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {PHASES.map((p) => (
                <button key={p.id} className="phase-btn" onClick={() => switchPhase(p.id)} style={{ padding: "4px 10px", borderRadius: 6, border: phase === p.id ? "1px solid rgba(167,139,250,0.5)" : "1px solid rgba(255,255,255,0.06)", background: phase === p.id ? "rgba(124,58,237,0.25)" : "transparent", color: phase === p.id ? "#c4b5fd" : "#6b7280", fontSize: 11, transition: "all 0.15s" }}>
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat History */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
            <div style={{ fontSize: 10, color: "#4b5563", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 6px 8px" }}>Recent Chats</div>
            {sessions.map((s) => (
              <div key={s.id} className="session-item" onClick={() => setActiveSession(s.id)} style={{ padding: "9px 10px", borderRadius: 8, marginBottom: 3, cursor: "pointer", background: activeSession === s.id ? "rgba(124,58,237,0.2)" : "transparent", border: activeSession === s.id ? "1px solid rgba(167,139,250,0.2)" : "1px solid transparent", transition: "all 0.15s" }}>
                <div style={{ fontSize: 13, color: "#d1d5db", fontWeight: 500, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  💬 {s.title}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: `${phaseColors[s.phase]}22`, color: phaseColors[s.phase], fontWeight: 500 }}>{s.phase}</span>
                  <span style={{ fontSize: 10, color: "#4b5563" }}>{s.time}</span>
                </div>
              </div>
            ))}
          </div>

          {/* User Profile at bottom */}
          <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(167,139,250,0.1)" }}>
            <div onClick={() => setShowUserMenu(!showUserMenu)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, cursor: "pointer", background: showUserMenu ? "rgba(124,58,237,0.15)" : "transparent", transition: "all 0.15s" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                {user.initials}
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
                <div style={{ fontSize: 11, color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
              </div>
              <span style={{ color: "#6b7280", fontSize: 12 }}>⚙️</span>
            </div>
            {showUserMenu && (
              <div style={{ marginTop: 8, padding: "6px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(167,139,250,0.15)" }}>
                <button onClick={() => { setShowLogin(true); setShowUserMenu(false); }} style={{ width: "100%", padding: "8px 12px", borderRadius: 7, background: "none", border: "none", color: "#c4b5fd", fontSize: 13, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
                  ✏️ Edit Profile
                </button>
                <button onClick={() => { setUser({ name: "Guest", email: "guest@email.com", initials: "G" }); setShowUserMenu(false); }} style={{ width: "100%", padding: "8px 12px", borderRadius: 7, background: "none", border: "none", color: "#f87171", fontSize: 13, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MAIN AREA ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top Bar */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(167,139,250,0.12)", display: "flex", alignItems: "center", gap: 12, background: "rgba(10,7,30,0.8)", backdropFilter: "blur(10px)", flexShrink: 0 }}>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", color: "#6b7280", fontSize: 20, padding: "0 4px" }}>☰</button>
          )}
          <div style={{ fontSize: 20 }}>🎬</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>Documentary Creator</div>
            <div style={{ fontSize: 11, color: "#a78bfa" }}>Powered by LLaMA 3.3 · Free via Groq</div>
          </div>

          {/* Phase tabs - center */}
          <div style={{ display: "flex", gap: 6, marginLeft: "auto", marginRight: "auto" }}>
            {PHASES.map((p) => (
              <button key={p.id} onClick={() => switchPhase(p.id)} style={{ padding: "6px 14px", borderRadius: 8, border: phase === p.id ? "1px solid rgba(167,139,250,0.5)" : "1px solid rgba(255,255,255,0.06)", background: phase === p.id ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.03)", color: phase === p.id ? "#c4b5fd" : "#6b7280", fontSize: 12, fontWeight: phase === p.id ? 600 : 400, transition: "all 0.15s", display: "flex", alignItems: "center", gap: 5 }}>
                <span>{p.icon}</span><span>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Right side - status + user */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 12, color: "#6b7280" }}>Live</span>
            </div>
            <div onClick={() => setShowLogin(true)} style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 2px 10px rgba(124,58,237,0.4)", border: "2px solid rgba(167,139,250,0.4)" }}>
              {user.initials}
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            {messages.map((m, i) => <Message key={i} msg={m} />)}
            {loading && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 18 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#1e1b4b,#3730a3)", display: "flex", alignItems: "center", justifyContent: "center" }}>🎬</div>
                <div style={{ padding: "13px 17px", borderRadius: "18px 18px 18px 4px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(167,139,250,0.2)" }}>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Quick Prompts */}
        <div style={{ padding: "8px 28px", display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", borderTop: "1px solid rgba(167,139,250,0.08)" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", gap: 6, width: "100%" }}>
            {QUICK_PROMPTS.map((q) => (
              <button key={q} className="quick-btn" onClick={() => send(q)} style={{ whiteSpace: "nowrap", padding: "5px 13px", borderRadius: 99, border: "1px solid rgba(167,139,250,0.2)", background: "rgba(124,58,237,0.08)", color: "#a78bfa", fontSize: 12, transition: "all 0.15s" }}>
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div style={{ padding: "12px 28px 20px", background: "rgba(10,7,30,0.8)" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: 16, padding: "12px 16px", transition: "border-color 0.15s" }}>
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask about your documentary... (Enter to send, Shift+Enter for new line)"
                rows={1}
                style={{ width: "100%", background: "transparent", border: "none", color: "#f1f5f9", fontSize: 14, lineHeight: 1.6, fontFamily: "inherit", maxHeight: 120 }}
              />
            </div>
            <button onClick={() => send()} disabled={!input.trim() || loading} style={{ width: 48, height: 48, borderRadius: 14, background: input.trim() && !loading ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "rgba(255,255,255,0.05)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, boxShadow: input.trim() && !loading ? "0 4px 15px rgba(124,58,237,0.45)" : "none", transition: "all 0.15s" }}>
              ➤
            </button>
          </div>
        </div>
      </div>

      {/* ── LOGIN / PROFILE MODAL ── */}
      {showLogin && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }}>
          <div style={{ width: 360, background: "rgba(15,10,40,0.98)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 20, padding: 28, boxShadow: "0 25px 60px rgba(109,40,217,0.4)", animation: "fadeUp 0.2s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 auto 12px", boxShadow: "0 4px 20px rgba(124,58,237,0.4)" }}>
                {user.initials}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9" }}>Your Profile</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Update your details</div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#a78bfa", marginBottom: 6, fontWeight: 500 }}>Full Name</div>
              <input value={loginForm.name} onChange={(e) => setLoginForm(f => ({ ...f, name: e.target.value }))} placeholder={user.name}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(167,139,250,0.3)", background: "rgba(0,0,0,0.3)", color: "#f1f5f9", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "#a78bfa", marginBottom: 6, fontWeight: 500 }}>Email Address</div>
              <input value={loginForm.email} onChange={(e) => setLoginForm(f => ({ ...f, email: e.target.value }))} placeholder={user.email}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(167,139,250,0.3)", background: "rgba(0,0,0,0.3)", color: "#f1f5f9", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowLogin(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid rgba(167,139,250,0.25)", background: "transparent", color: "#6b7280", fontSize: 14 }}>Cancel</button>
              <button onClick={handleLogin} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", fontSize: 14, fontWeight: 600, boxShadow: "0 4px 15px rgba(124,58,237,0.4)" }}>Save ✓</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

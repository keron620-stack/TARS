'use client';
import { useState, useEffect, useRef, useCallback } from "react";

// ── AGENTS ────────────────────────────────────────────────────────────────────
const INIT_AGENTS = [
  { id: "vance", name: "VANCE", role: "Career Intel", color: "#A855F7", glow: "rgba(168,85,247,0.9)", dark: "#6D28D9", emoji: "⚡",
    connections: ["gmail"],
    tasks: ["Scanning IAM job boards", "Drafting outreach emails", "Analyzing salary data", "Reviewing interview prep", "Updating resume bullets"],
    systemPrompt: `You are VANCE, an elite career intelligence agent in TARS — Keron's AI command center. Direct, sharp, confident. Keron: Information Security Analyst at Reveleer, CyberArk EPM lead (~600 endpoints), federal SOC at Deloitte, Entra ID/AD expertise, Secret clearance. Certs: Security+, AZ-900, SC-900, AWS CCP, SC-300 in progress. Targeting IAM Engineer roles. Given a job description: extract top 5 requirements, map to his experience, write 3 STAR bullets, flag gaps, give 3 interview questions with answers. Help with interviews, negotiation, outreach.`,
    demoReplies: ["VANCE online. I've been monitoring IAM postings — 3 new Senior IAM Engineer roles dropped in the last 24hrs that match your profile. Want the breakdown?", "Market data: IAM Engineers with CyberArk + clearance pull $110k–$140k. You should negotiate higher."] },
  { id: "cipher", name: "CIPHER", role: "Security Mentor", color: "#38BDF8", glow: "rgba(56,189,248,0.9)", dark: "#0284C7", emoji: "🛡",
    connections: [],
    tasks: ["Generating SC-300 quiz", "Reviewing Entra ID updates", "Building IAM flashcards", "Analyzing CyberArk CVEs", "Monitoring threat intel"],
    systemPrompt: `You are CIPHER, a cybersecurity and IAM mentor in TARS — Keron's AI command center. Technical, methodical, encouraging. Keron is studying SC-300 (Christopher Nett's Udemy course), has hands-on CyberArk EPM experience, runs a homelab (VirtualBox, Windows Server, AD, Entra Connect, Sysmon, Wazuh). Quiz mode: ask a question, grade his answer, explain thoroughly. Explain mode: deep technical breakdowns with enterprise examples. Topics: PIM, Entitlement Management, Identity Protection, Conditional Access, SAML/OIDC/OAuth2, SCIM, CyberArk PAM/EPM, Ping Identity, Entra ID, AD.`,
    demoReplies: ["CIPHER online. Prepped a 10-question SC-300 drill on PIM — ready when you are.", "Microsoft dropped a Conditional Access update — GPS-based location policies. Likely on SC-300. Want a breakdown?"] },
  { id: "forge", name: "FORGE", role: "Project Lab", color: "#34D399", glow: "rgba(52,211,153,0.9)", dark: "#059669", emoji: "🔧",
    connections: ["drive"],
    tasks: ["Auditing Scentique code", "Optimizing Sharp Slip APIs", "Planning TARS roadmap", "Reviewing Next.js updates", "Drafting component library"],
    systemPrompt: `You are FORGE, a senior full-stack engineer in TARS — Keron's AI command center. Pragmatic, fast, ships real code. Keron's projects: Scentique (72-fragrance React app w/ Anthropic API), Sharp Slip (parlay advisor, Next.js + The Odds API), TARS (this app), budget tracker on Netlify. Stack: React, Next.js, Tailwind, TS. When he describes what to build: break into concrete steps and write real working code. When debugging: ask for the error and relevant code. No hand-waving.`,
    demoReplies: ["FORGE online. Found a perf issue in Scentique — redundant API calls in the rec engine. ~20 line fix. Want it?", "Sharp Slip makes 3 calls where 1 batched request would do. Here's the fix..."] },
  { id: "atlas", name: "ATLAS", role: "Finance Desk", color: "#FCD34D", glow: "rgba(252,211,77,0.9)", dark: "#D97706", emoji: "📊",
    connections: ["calendar"],
    tasks: ["Tracking PA mortgage rates", "Watching Harrisburg MLS", "Running K-FIT scenarios", "Monitoring loan news", "Reviewing budget"],
    systemPrompt: `You are ATLAS, a personal finance strategist in TARS — Keron's AI command center. Calm, analytical, always shows the math. Keron: first-time homebuyer in Harrisburg PA, FHA loan (3.5% down), loan officer Ethan at CrossCountry Mortgage, exploring PHFA K-FIT (660+ FICO), seller concessions up to 6%, Empower 401k. Student loans on SAVE forbearance — move to IBR/PAYE before Oct 2026. Married, young infant, factoring childcare. Given a home price: calculate 3.5% down, upfront MIP (1.75%), annual MIP (0.55%), monthly P&I at ~7%, closing costs (2-5%), K-FIT eligibility, total cash to close. Always show numbers.`,
    demoReplies: ["ATLAS online. FHA rates dipped to 6.87% — lowest in 6 weeks. On $280k that saves ~$42/month.", "Two new listings under $280k in Susquehanna Township. One 3BR/2BA at $265k — want the FHA breakdown?"] },
  { id: "maven", name: "MAVEN", role: "Etsy Ops", color: "#FB7185", glow: "rgba(251,113,133,0.9)", dark: "#E11D48", emoji: "🛍",
    connections: ["etsy", "printify"],
    tasks: ["Scanning Etsy trends", "Drafting new listings", "Analyzing competitor prices", "Writing customer replies", "Planning summer drop"],
    systemPrompt: `You are MAVEN, a full-service Etsy print-on-demand business operator in TARS — Keron's AI command center. Creative, data-driven, focused on passive income. You run Keron's Etsy shirt business (Etsy + Printify, multiple niches). Capabilities: (1) Generate AI image prompts for shirt designs with niche, colorway, placement. (2) Write complete SEO-optimized Etsy listings — title (140 char max), 13 tags, description, pricing (Printify cost + Etsy fees + margin; Bella+Canvas 3001 ~$9.50 cost, retail $26-28). (3) Niche/trend research. (4) Customer service replies. (5) Revenue tracking (Etsy fees: 6.5% + $0.20 listing + ~3% processing). Execute fully — don't just advise.`,
    demoReplies: ["MAVEN online. 'Father's Day' searches up 340% this week. Drafted 5 designs + listings — post in 48hrs to catch the wave.", "3 listings have zero sales in 30 days. I rewrote their titles + tags from current search trends. Ready to review?"] },
];

const CONNECTIONS = [
  { id: "gmail",    name: "Gmail",          icon: "✉️", color: "#EA4335", type: "oauth",  desc: "Read & draft emails", connected: true },
  { id: "calendar", name: "Google Calendar",icon: "📅", color: "#4285F4", type: "oauth",  desc: "Schedule & brief your day", connected: true },
  { id: "drive",    name: "Google Drive",   icon: "📁", color: "#0F9D58", type: "oauth",  desc: "Read & store files", connected: true },
  { id: "etsy",     name: "Etsy",           icon: "🛍", color: "#F1641E", type: "oauth",  desc: "Orders, listings, messages", connected: true },
  { id: "printify", name: "Printify",       icon: "👕", color: "#39B54A", type: "apikey", desc: "Auto-create & fulfill", connected: true },
  { id: "twilio",   name: "Twilio SMS",     icon: "💬", color: "#F22F46", type: "apikey", desc: "Text you agent updates", connected: false },
  { id: "odds",     name: "The Odds API",   icon: "🎲", color: "#22C55E", type: "apikey", desc: "Live betting odds (Sharp Slip)", connected: false },
  { id: "slack",    name: "Slack",          icon: "💼", color: "#4A154B", type: "oauth",  desc: "Post updates to channels", connected: false },
];

const WORLD_W = 900;
const WORLD_H = 480;

// ── PIXEL SPRITE ──────────────────────────────────────────────────────────────
function Sprite({ agent, walking, selected, onClick }) {
  const fRef = useRef(0);
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!walking) { setFrame(0); return; }
    const iv = setInterval(() => { fRef.current = (fRef.current + 1) % 4; setFrame(fRef.current); }, 150);
    return () => clearInterval(iv);
  }, [walking]);
  const bob = walking ? [0, -1, 0, 1][frame] : 0;
  const lL = walking ? [-1.5, -0.5, 0.5, 1.5][frame] : 0;
  const lR = walking ? [1.5, 0.5, -0.5, -1.5][frame] : 0;
  const aL = walking ? [1, 0.5, -1, -0.5][frame] : 0;
  const aR = walking ? [-1, -0.5, 1, 0.5][frame] : 0;
  const c = agent.color, d = agent.dark;
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      {selected && <circle cx="8" cy="8" r="11" fill="none" stroke={c} strokeWidth="1.2" opacity="0.7" style={{ animation: "selP 1.2s ease-in-out infinite" }} />}
      <ellipse cx="8" cy={16 + bob} rx="5.5" ry="1.5" fill="rgba(0,0,0,0.55)" />
      <rect x={5.5 + lL * 0.25} y={11 + bob} width="2" height="4" rx="1" fill={d} />
      <rect x={9 + lR * 0.25} y={11 + bob} width="2" height="4" rx="1" fill={d} />
      <rect x="4" y={7 + bob} width="8" height="6" rx="1.5" fill={c} />
      <rect x={2 + aL * 0.2} y={8 + bob} width="2.5" height="3.5" rx="1" fill={c} />
      <rect x={11.5 + aR * 0.2} y={8 + bob} width="2.5" height="3.5" rx="1" fill={c} />
      <rect x="4.5" y={2 + bob} width="7" height="6.5" rx="2" fill={c} />
      <rect x="5.5" y={3.5 + bob} width="1.5" height="1.5" rx="0.5" fill="rgba(255,255,255,0.95)" />
      <rect x="9" y={3.5 + bob} width="1.5" height="1.5" rx="0.5" fill="rgba(255,255,255,0.95)" />
      <ellipse cx="8" cy={5 + bob} rx="5.5" ry="5" fill={`${c}1a`} />
    </g>
  );
}

// ── CITY BRAIN ────────────────────────────────────────────────────────────────
function useCity(agents) {
  const [chars, setChars] = useState(() => agents.map(a => ({
    ...a, x: 100 + Math.random() * 700, y: 100 + Math.random() * 280,
    tx: 0, ty: 0, walking: false, dir: "down", taskIdx: 0,
  })));
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const pick = () => ({ x: 60 + Math.random() * 780, y: 50 + Math.random() * 380 });
    const timers = chars.map((c, i) => {
      const go = () => { const dst = pick(); setChars(prev => prev.map(ch => ch.id === c.id ? { ...ch, tx: dst.x, ty: dst.y } : ch)); };
      go();
      return setInterval(go, 3500 + i * 500 + Math.random() * 3500);
    });
    return () => timers.forEach(clearInterval);
  }, []);

  useEffect(() => {
    const raf = setInterval(() => {
      setChars(prev => prev.map(ch => {
        const dx = ch.tx - ch.x, dy = ch.ty - ch.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.5) return ch.walking ? { ...ch, walking: false } : ch;
        const spd = 0.85;
        const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
        return { ...ch, x: ch.x + (dx / dist) * Math.min(spd, dist), y: ch.y + (dy / dist) * Math.min(spd, dist), walking: true, dir };
      }));
    }, 40);
    return () => clearInterval(raf);
  }, []);

  useEffect(() => {
    const timers = agents.map((a, i) => setInterval(() => {
      setChars(prev => prev.map(ch => {
        if (ch.id !== a.id) return ch;
        const ni = (ch.taskIdx + 1) % a.tasks.length;
        setLogs(l => [{ id: Date.now() + i, name: ch.name, color: a.color, task: a.tasks[ni], time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }, ...l].slice(0, 30));
        return { ...ch, taskIdx: ni };
      }));
    }, 5000 + i * 1200 + Math.random() * 4000));
    return () => timers.forEach(clearInterval);
  }, []);

  const rename = useCallback((id, name) => setChars(prev => prev.map(ch => ch.id === id ? { ...ch, name } : ch)), []);
  return { chars, logs, rename };
}

// ── HAMBURGER MENU PANEL ──────────────────────────────────────────────────────
function MenuPanel({ open, onClose, onNav }) {
  const items = [
    { id: "connections", icon: "🔌", label: "Connections", desc: "Link Gmail, Etsy, Printify & more" },
    { id: "agents", icon: "🤖", label: "Manage Agents", desc: "Add, edit, or remove agents" },
    { id: "tasks", icon: "⚙️", label: "Autonomous Tasks", desc: "Set schedules & triggers" },
    { id: "settings", icon: "🎛", label: "Settings", desc: "Preferences & account" },
  ];
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 350, background: open ? "rgba(0,0,0,0.6)" : "transparent", backdropFilter: open ? "blur(4px)" : "none", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "all 0.3s" }} />
      <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: "min(300px, 85vw)", zIndex: 360, background: "rgba(6,9,18,0.98)", backdropFilter: "blur(20px)", borderRight: "1px solid rgba(124,58,237,0.3)", transform: open ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)", boxShadow: open ? "8px 0 40px rgba(124,58,237,0.15)" : "none", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #7C3AED, #0EA5E9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, boxShadow: "0 0 16px rgba(124,58,237,0.6)" }}>◈</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "0.12em", color: "#F1F5F9" }}>TARS</div>
              <div style={{ fontSize: 8, color: "#475569", letterSpacing: "0.15em" }}>COMMAND CENTER</div>
            </div>
          </div>
        </div>
        {/* Nav items */}
        <div style={{ flex: 1, padding: "12px", display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map(it => (
            <button key={it.id} onClick={() => { onNav(it.id); onClose(); }} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 13, cursor: "pointer", textAlign: "left", transition: "all 0.2s", width: "100%" }}>
              <div style={{ fontSize: 20, flexShrink: 0 }}>{it.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#E2E8F0", fontSize: 14, fontWeight: 600 }}>{it.label}</div>
                <div style={{ color: "#475569", fontSize: 11, marginTop: 1 }}>{it.desc}</div>
              </div>
              <div style={{ color: "#334155", fontSize: 16 }}>›</div>
            </button>
          ))}
        </div>
        {/* Footer */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 6px rgba(16,185,129,0.8)", animation: "pulse 2s infinite" }} />
          <span style={{ color: "#475569", fontSize: 10, letterSpacing: "0.05em" }}>5 agents · all systems nominal</span>
        </div>
      </div>
    </>
  );
}

// ── CONNECTIONS SCREEN ────────────────────────────────────────────────────────
function ConnectionsScreen({ onClose, agents }) {
  const [conns, setConns] = useState(CONNECTIONS);
  const [apiKeyModal, setApiKeyModal] = useState(null);
  const [keyInput, setKeyInput] = useState("");

  const toggle = (conn) => {
    if (conn.connected) {
      setConns(prev => prev.map(c => c.id === conn.id ? { ...c, connected: false } : c));
      return;
    }
    if (conn.type === "apikey") { setApiKeyModal(conn); setKeyInput(""); }
    else {
      // Simulate OAuth flow
      setConns(prev => prev.map(c => c.id === conn.id ? { ...c, connecting: true } : c));
      setTimeout(() => setConns(prev => prev.map(c => c.id === conn.id ? { ...c, connected: true, connecting: false } : c)), 1400);
    }
  };

  const saveKey = () => {
    if (!keyInput.trim()) return;
    setConns(prev => prev.map(c => c.id === apiKeyModal.id ? { ...c, connected: true } : c));
    setApiKeyModal(null);
  };

  const agentsUsing = (connId) => agents.filter(a => a.connections.includes(connId));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 320, background: "#03040a", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12, background: "rgba(3,4,10,0.95)", backdropFilter: "blur(16px)" }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 11, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8", cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "0.06em", color: "#F1F5F9" }}>CONNECTIONS</div>
          <div style={{ color: "#334155", fontSize: 10, letterSpacing: "0.1em" }}>{conns.filter(c => c.connected).length} ACTIVE</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "18px 16px 40px", maxWidth: 540, margin: "0 auto", width: "100%" }}>
        <p style={{ color: "#475569", fontSize: 13, lineHeight: 1.6, marginTop: 0, marginBottom: 22 }}>
          Connect services so your agents can act for you. Tap to link — OAuth services open a login, API services ask for a key.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {conns.map(conn => {
            const using = agentsUsing(conn.id);
            return (
              <div key={conn.id} style={{ background: conn.connected ? `${conn.color}0d` : "rgba(255,255,255,0.02)", border: `1px solid ${conn.connected ? conn.color + "44" : "rgba(255,255,255,0.07)"}`, borderRadius: 15, padding: "14px 16px", transition: "all 0.2s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: conn.connected ? `${conn.color}22` : "rgba(255,255,255,0.04)", border: `1px solid ${conn.connected ? conn.color + "55" : "rgba(255,255,255,0.08)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{conn.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#E2E8F0", fontSize: 14, fontWeight: 700 }}>{conn.name}</span>
                      {conn.type === "oauth" && <span style={{ fontSize: 8, color: "#475569", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "1px 5px", letterSpacing: "0.05em" }}>OAUTH</span>}
                      {conn.type === "apikey" && <span style={{ fontSize: 8, color: "#475569", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "1px 5px", letterSpacing: "0.05em" }}>API KEY</span>}
                    </div>
                    <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>{conn.desc}</div>
                  </div>
                  <button onClick={() => toggle(conn)} disabled={conn.connecting} style={{
                    padding: "8px 14px", borderRadius: 10, border: "none", cursor: "pointer", flexShrink: 0,
                    background: conn.connecting ? "rgba(255,255,255,0.08)" : conn.connected ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg, ${conn.color}, ${conn.color}cc)`,
                    color: conn.connected ? "#64748B" : "#fff",
                    fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
                    boxShadow: conn.connected || conn.connecting ? "none" : `0 0 14px ${conn.color}66`,
                    minWidth: 90,
                  }}>
                    {conn.connecting ? "..." : conn.connected ? "Disconnect" : "Connect"}
                  </button>
                </div>

                {/* Which agents use it */}
                {conn.connected && using.length > 0 && (
                  <div style={{ marginTop: 11, paddingTop: 11, borderTop: `1px solid ${conn.color}1a`, display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ color: "#334155", fontSize: 10 }}>Used by</span>
                    {using.map(a => (
                      <span key={a.id} style={{ display: "flex", alignItems: "center", gap: 4, background: `${a.color}1a`, border: `1px solid ${a.color}44`, borderRadius: 6, padding: "2px 7px" }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: a.color }} />
                        <span style={{ color: a.color, fontSize: 10, fontWeight: 700 }}>{a.name}</span>
                      </span>
                    ))}
                  </div>
                )}
                {conn.connected && using.length === 0 && (
                  <div style={{ marginTop: 11, paddingTop: 11, borderTop: `1px solid ${conn.color}1a` }}>
                    <span style={{ color: "#334155", fontSize: 10 }}>Connected · not assigned to an agent yet</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Status banner */}
        <div style={{ marginTop: 20, padding: "13px 15px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 14 }}>⚡</span>
          <span style={{ color: "#92400E", fontSize: 11, lineHeight: 1.5 }}>
            This is a visual preview. Real OAuth and API connections activate once deployed to Netlify with developer credentials configured.
          </span>
        </div>
      </div>

      {/* API Key modal */}
      {apiKeyModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setApiKeyModal(null)}>
          <div style={{ background: "#0A0E1A", border: `1px solid ${apiKeyModal.color}66`, borderRadius: 18, padding: 26, maxWidth: 340, width: "100%", boxShadow: `0 0 40px ${apiKeyModal.color}33` }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 18 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: `${apiKeyModal.color}22`, border: `1px solid ${apiKeyModal.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{apiKeyModal.icon}</div>
              <div>
                <div style={{ color: "#F1F5F9", fontSize: 15, fontWeight: 700 }}>Connect {apiKeyModal.name}</div>
                <div style={{ color: "#475569", fontSize: 11 }}>Paste your API key</div>
              </div>
            </div>
            <input value={keyInput} onChange={e => setKeyInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveKey(); }} placeholder="Paste API key here..." autoFocus style={{ width: "100%", padding: "11px 13px", background: "rgba(255,255,255,0.06)", border: `1px solid ${apiKeyModal.color}55`, borderRadius: 11, color: "#F1F5F9", fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 8, fontFamily: "monospace" }} />
            <div style={{ color: "#334155", fontSize: 10, marginBottom: 16, lineHeight: 1.5 }}>
              Find this in your {apiKeyModal.name} dashboard under API settings or developer tools.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setApiKeyModal(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#64748B", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={saveKey} style={{ flex: 2, padding: "10px 0", borderRadius: 10, background: `linear-gradient(135deg, ${apiKeyModal.color}, ${apiKeyModal.color}cc)`, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: `0 0 14px ${apiKeyModal.color}66` }}>Connect</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── PLACEHOLDER SCREENS ───────────────────────────────────────────────────────
function PlaceholderScreen({ title, icon, desc, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 320, background: "#03040a", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12, background: "rgba(3,4,10,0.95)" }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 11, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8", cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "0.06em", color: "#F1F5F9" }}>{title}</div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 30 }}>
        <div style={{ fontSize: 48, opacity: 0.5 }}>{icon}</div>
        <div style={{ color: "#475569", fontSize: 14, textAlign: "center", maxWidth: 300, lineHeight: 1.6 }}>{desc}</div>
      </div>
    </div>
  );
}

// ── RENAME MODAL ──────────────────────────────────────────────────────────────
function RenameModal({ agent, onSave, onClose }) {
  const [val, setVal] = useState(agent.name);
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "#0A0E1A", border: `1px solid ${agent.color}66`, borderRadius: 18, padding: 26, maxWidth: 300, width: "100%", boxShadow: `0 0 40px ${agent.glow}44` }} onClick={e => e.stopPropagation()}>
        <div style={{ color: "#F1F5F9", fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Rename Agent</div>
        <input ref={ref} value={val} onChange={e => setVal(e.target.value.toUpperCase())} onKeyDown={e => { if (e.key === "Enter" && val.trim()) onSave(val.trim()); if (e.key === "Escape") onClose(); }} maxLength={14} style={{ width: "100%", padding: "11px 13px", background: "rgba(255,255,255,0.06)", border: `1px solid ${agent.color}66`, borderRadius: 11, color: "#F1F5F9", fontSize: 16, fontWeight: 800, letterSpacing: "0.1em", outline: "none", boxSizing: "border-box", marginBottom: 14 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#64748B", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => val.trim() && onSave(val.trim())} style={{ flex: 2, padding: "10px 0", borderRadius: 10, background: `linear-gradient(135deg, ${agent.color}, ${agent.dark})`, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: `0 0 14px ${agent.glow}` }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── CHAT PANEL ────────────────────────────────────────────────────────────────
function ChatPanel({ agent, onClose, onRename }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [replyIdx, setReplyIdx] = useState(0);
  const [renaming, setRenaming] = useState(false);
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async (text) => {
    if (!text.trim() || loading) return;
    setInput("");
    const msgs = [...messages, { role: "user", content: text.trim() }];
    setMessages(msgs); setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: msgs.map(m => ({ role: m.role, content: m.content })),
          systemPrompt: agent.systemPrompt || `You are ${agent.name}, ${agent.role}, an agent in TARS. Help Keron directly and concisely.`,
          agentName: agent.name,
        }),
      });
      const data = await res.json();
      const reply = data.text || agent.demoReplies[replyIdx % agent.demoReplies.length];
      setMessages([...msgs, { role: "assistant", content: reply }]);
    } catch {
      // Fallback to demo reply if API unavailable
      setMessages([...msgs, { role: "assistant", content: agent.demoReplies[replyIdx % agent.demoReplies.length] }]);
    }
    setReplyIdx(i => i + 1); setLoading(false);
  };

  const agentConns = CONNECTIONS.filter(c => agent.connections.includes(c.id));

  return (
    <>
      {renaming && <RenameModal agent={agent} onSave={n => { onRename(agent.id, n); setRenaming(false); }} onClose={() => setRenaming(false)} />}
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(340px,100vw)", background: "rgba(3,4,10,0.97)", backdropFilter: "blur(20px)", borderLeft: `1px solid ${agent.color}44`, display: "flex", flexDirection: "column", zIndex: 300, boxShadow: `-6px 0 40px ${agent.glow}22` }}>
        <div style={{ padding: "13px 15px", borderBottom: `1px solid ${agent.color}33`, background: `linear-gradient(90deg, ${agent.color}15, transparent)`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: agent.color, boxShadow: `0 0 10px ${agent.glow}`, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#F1F5F9", fontWeight: 800, fontSize: 15, letterSpacing: "0.07em" }}>{agent.name}</span>
              <button onClick={() => setRenaming(true)} style={{ background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 5, padding: "1px 6px", color: "#334155", fontSize: 9, cursor: "pointer" }}>RENAME</button>
            </div>
            <div style={{ color: agent.color, fontSize: 9, letterSpacing: "0.1em", marginTop: 1, opacity: 0.8 }}>{agent.role.toUpperCase()} · ACTIVE</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#475569", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        {/* Connections strip */}
        {agentConns.length > 0 && (
          <div style={{ padding: "8px 14px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#334155", fontSize: 9 }}>Connected:</span>
            {agentConns.map(c => <span key={c.id} style={{ fontSize: 13 }} title={c.name}>{c.icon}</span>)}
          </div>
        )}

        {/* Task */}
        <div style={{ padding: "8px 14px", background: `${agent.color}0a`, borderBottom: `1px solid ${agent.color}22`, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981", animation: "pulse 1.5s infinite", flexShrink: 0 }} />
          <span style={{ color: "#475569", fontSize: 10 }}>Auto: {agent.tasks[agent.taskIdx % agent.tasks.length]}</span>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
          {messages.length === 0 && (
            <div style={{ height: "100%", minHeight: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <div style={{ width: 50, height: 50, borderRadius: "50%", background: `${agent.color}22`, border: `2px solid ${agent.color}66`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: `0 0 20px ${agent.glow}` }}>{agent.emoji}</div>
              <div style={{ color: "#F1F5F9", fontWeight: 900, fontSize: 17, letterSpacing: "0.07em", textShadow: `0 0 16px ${agent.glow}` }}>{agent.name}</div>
              <div style={{ color: "#334155", fontSize: 11 }}>Channel open · issue an order</div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", flexDirection: m.role === "user" ? "row-reverse" : "row", gap: 8, marginBottom: 12, alignItems: "flex-start" }}>
              {m.role === "assistant" && <div style={{ width: 20, height: 20, borderRadius: "50%", background: `${agent.color}33`, border: `1px solid ${agent.color}66`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0, marginTop: 2 }}>{agent.emoji}</div>}
              <div style={{ maxWidth: "82%", padding: "9px 12px", borderRadius: m.role === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px", background: m.role === "user" ? `${agent.color}2a` : "rgba(255,255,255,0.05)", border: `1px solid ${m.role === "user" ? agent.color + "44" : "rgba(255,255,255,0.07)"}`, color: "#CBD5E1", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.content}</div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: `${agent.color}33`, border: `1px solid ${agent.color}66`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>{agent.emoji}</div>
              <div style={{ padding: "9px 14px", background: "rgba(255,255,255,0.04)", borderRadius: "4px 12px 12px 12px", display: "flex", gap: 4 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: agent.color, animation: `dp 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: "10px 12px 18px", borderTop: `1px solid ${agent.color}22`, background: "rgba(0,0,0,0.4)" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }} placeholder={`Order ${agent.name}...`} rows={1} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: `1px solid ${input ? agent.color + "55" : "rgba(255,255,255,0.08)"}`, borderRadius: 11, padding: "9px 12px", color: "#E2E8F0", fontSize: 13, resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.5, maxHeight: 90, overflowY: "auto" }} onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 90) + "px"; }} />
            <button onClick={() => send(input)} disabled={!input.trim() || loading} style={{ width: 38, height: 38, borderRadius: 10, border: "none", flexShrink: 0, background: input.trim() && !loading ? `linear-gradient(135deg, ${agent.color}, ${agent.dark})` : "rgba(255,255,255,0.07)", color: input.trim() && !loading ? "#fff" : "#334155", cursor: input.trim() && !loading ? "pointer" : "not-allowed", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>↑</button>
          </div>
        </div>
      </div>
      <style>{`@keyframes dp{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}} @keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}`}</style>
    </>
  );
}

// ── MISSION BAR ───────────────────────────────────────────────────────────────
function MissionBar({ chars, logs, onSelect }) {
  const [tab, setTab] = useState("agents");
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 168, background: "rgba(3,4,10,0.97)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(255,255,255,0.07)", zIndex: 200, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "0 16px", height: 32, flexShrink: 0 }}>
        <span style={{ color: "#1E293B", fontSize: 8, letterSpacing: "0.18em", marginRight: 14 }}>MISSION CONTROL</span>
        {["agents", "log"].map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: "5px 12px", background: "none", border: "none", cursor: "pointer", color: tab === t ? "#F1F5F9" : "#334155", fontSize: 10, fontWeight: tab === t ? 700 : 400, letterSpacing: "0.08em", borderBottom: tab === t ? "2px solid #7C3AED" : "2px solid transparent" }}>{t === "agents" ? "AGENTS" : "ACTIVITY"}</button>)}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 6px rgba(16,185,129,0.8)", animation: "pulse 2s infinite" }} />
          <span style={{ color: "#10B981", fontSize: 8, letterSpacing: "0.1em" }}>ALL ACTIVE</span>
        </div>
      </div>
      {tab === "agents" && (
        <div style={{ flex: 1, overflowX: "auto", display: "flex", gap: 8, padding: "10px 16px" }}>
          {chars.map(ch => (
            <div key={ch.id} onClick={() => onSelect(ch.id)} style={{ flexShrink: 0, width: 148, background: `${ch.color}0d`, border: `1px solid ${ch.color}44`, borderRadius: 10, padding: "9px 11px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: ch.color, boxShadow: `0 0 6px ${ch.glow}`, flexShrink: 0 }} />
                <div><div style={{ color: ch.color, fontSize: 11, fontWeight: 800 }}>{ch.name}</div><div style={{ color: "#334155", fontSize: 8 }}>{ch.role}</div></div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 5 }}>
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#10B981", flexShrink: 0, marginTop: 3, animation: "pulse 1.8s infinite" }} />
                <div style={{ color: "#475569", fontSize: 9, lineHeight: 1.4 }}>{ch.tasks[ch.taskIdx % ch.tasks.length]}</div>
              </div>
              <div style={{ color: "#1E293B", fontSize: 8 }}>{ch.walking ? "🚶 Moving" : "⏸ Idle"}</div>
            </div>
          ))}
        </div>
      )}
      {tab === "log" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 16px" }}>
          {logs.length === 0 && <div style={{ color: "#1E293B", fontSize: 11, padding: "16px 0", textAlign: "center" }}>Waiting for activity...</div>}
          {logs.map(l => (
            <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <span style={{ color: "#1E293B", fontSize: 9, fontVariantNumeric: "tabular-nums", flexShrink: 0, width: 36 }}>{l.time}</span>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: l.color, flexShrink: 0 }} />
              <span style={{ color: l.color, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{l.name}</span>
              <span style={{ color: "#475569", fontSize: 10 }}>{l.task}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── DETAILED CITY RENDER ──────────────────────────────────────────────────────
function CityMap({ chars, selectedId, onSelect, pan, scale }) {
  // Generate a rich, detailed city procedurally but deterministically
  const SS = 2.3; // sprite scale

  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.012)" strokeWidth="0.5" />
        </pattern>
        <linearGradient id="bldA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2744" /><stop offset="100%" stopColor="#0c1322" />
        </linearGradient>
        <linearGradient id="bldB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16213d" /><stop offset="100%" stopColor="#0a0f1c" />
        </linearGradient>
        <linearGradient id="bldC" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e1b3a" /><stop offset="100%" stopColor="#0d0a1e" />
        </linearGradient>
        <radialGradient id="park" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#14432a" /><stop offset="100%" stopColor="#0a2418" />
        </radialGradient>
      </defs>

      <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
        {/* Base ground */}
        <rect x="-50" y="-50" width={WORLD_W + 100} height={WORLD_H + 100} fill="#05080f" />
        <rect x="-50" y="-50" width={WORLD_W + 100} height={WORLD_H + 100} fill="url(#grid)" />

        {/* Ambient district glows */}
        <ellipse cx="160" cy="180" rx="180" ry="140" fill="rgba(124,58,237,0.05)" />
        <ellipse cx="700" cy="200" rx="180" ry="140" fill="rgba(14,165,233,0.045)" />
        <ellipse cx="450" cy="380" rx="160" ry="120" fill="rgba(251,113,133,0.04)" />

        {/* ── ROADS (drawn first, under buildings) ── */}
        {/* Main avenues */}
        <g>
          <rect x="0" y="200" width={WORLD_W} height="34" fill="#0a0e16" />
          <rect x="0" y="380" width={WORLD_W} height="30" fill="#0a0e16" />
          <rect x="230" y="0" width="32" height={WORLD_H} fill="#0a0e16" />
          <rect x="540" y="0" width="32" height={WORLD_H} fill="#0a0e16" />
          {/* Lane dashes - horizontal */}
          {Array.from({ length: 22 }, (_, i) => <rect key={`h1${i}`} x={i * 42 + 10} y="216" width="18" height="2" rx="1" fill="rgba(252,211,77,0.25)" />)}
          {Array.from({ length: 22 }, (_, i) => <rect key={`h2${i}`} x={i * 42 + 10} y="394" width="18" height="2" rx="1" fill="rgba(252,211,77,0.25)" />)}
          {/* Lane dashes - vertical */}
          {Array.from({ length: 12 }, (_, i) => <rect key={`v1${i}`} x="245" y={i * 42 + 10} width="2" height="18" rx="1" fill="rgba(252,211,77,0.25)" />)}
          {Array.from({ length: 12 }, (_, i) => <rect key={`v2${i}`} x="555" y={i * 42 + 10} width="2" height="18" rx="1" fill="rgba(252,211,77,0.25)" />)}
          {/* Crosswalks */}
          {[230, 540].flatMap(rx => [200, 380].map(ry => (
            <g key={`cw${rx}${ry}`}>
              {Array.from({ length: 5 }, (_, i) => <rect key={i} x={rx + 2 + i * 6} y={ry + 2} width="3" height="30" fill="rgba(255,255,255,0.1)" />)}
            </g>
          )))}
        </g>

        {/* ── CENTRAL PARK ── */}
        <g>
          <rect x="290" y="250" width="210" height="110" rx="6" fill="url(#park)" stroke="#1a5c38" strokeWidth="0.75" />
          {/* Trees */}
          {[[315,275],[345,300],[320,335],[370,270],[400,310],[380,340],[430,280],[460,330],[440,300],[475,295],[350,335]].map(([tx,ty],i)=>(
            <g key={i}>
              <ellipse cx={tx} cy={ty+3} rx="6" ry="2" fill="rgba(0,0,0,0.4)" />
              <circle cx={tx} cy={ty} r="7" fill="#1a6b3e" />
              <circle cx={tx-2} cy={ty-2} r="5" fill="#23834d" />
              <circle cx={tx+2} cy={ty-1} r="4" fill="#2da35f" opacity="0.8" />
            </g>
          ))}
          {/* Park path */}
          <path d="M 290 305 Q 395 285 500 320" fill="none" stroke="rgba(180,150,100,0.2)" strokeWidth="4" />
          {/* Pond */}
          <ellipse cx="410" cy="335" rx="18" ry="10" fill="#0d3b52" opacity="0.7" />
          <ellipse cx="406" cy="332" rx="8" ry="4" fill="#1a6b8f" opacity="0.4" />
        </g>

        {/* ── BUILDINGS (procedural, layered for depth) ── */}
        {(() => {
          // Deterministic building layout across districts
          const blds = [];
          const grads = ["url(#bldA)", "url(#bldB)", "url(#bldC)"];
          const accents = ["#7C3AED", "#0EA5E9", "#10B981", "#F59E0B", "#F43F5E", "#06B6D4", "#8B5CF6"];
          // seeded pseudo-random
          let seed = 12345;
          const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

          const plots = [
            // [x, y, maxW, maxH] district blocks (avoiding roads & park)
            [10, 10, 210, 180], [275, 10, 255, 180], [585, 10, 305, 180],
            [10, 245, 210, 125], [585, 245, 305, 125],
            [10, 420, 520, 55], [585, 420, 305, 55],
          ];

          plots.forEach((plot, pi) => {
            const [px, py, pw, ph] = plot;
            let cx = px + 6;
            while (cx < px + pw - 20) {
              let cy = py + 6;
              const colW = 26 + rnd() * 36;
              while (cy < py + ph - 20) {
                const w = Math.min(colW, px + pw - cx - 6);
                const h = Math.min(20 + rnd() * (ph - (cy - py) - 10), py + ph - cy - 6);
                if (w < 14 || h < 14) break;
                const grad = grads[Math.floor(rnd() * 3)];
                const accent = accents[Math.floor(rnd() * accents.length)];
                const lit = rnd() > 0.4;
                blds.push({ x: cx, y: cy, w, h, grad, accent, lit, key: `${pi}-${cx}-${cy}`, rnd: rnd() });
                cy += h + 4 + rnd() * 6;
              }
              cx += colW + 4 + rnd() * 8;
            }
          });

          return blds.sort((a, b) => (a.y + a.h) - (b.y + b.h)).map(b => {
            const winCols = Math.max(1, Math.floor(b.w / 10));
            const winRows = Math.max(1, Math.floor(b.h / 11));
            return (
              <g key={b.key}>
                {/* Drop shadow for depth */}
                <rect x={b.x + 2.5} y={b.y + 2.5} width={b.w} height={b.h} rx="1.5" fill="rgba(0,0,0,0.5)" />
                {/* Body */}
                <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="1.5" fill={b.grad} stroke={`${b.accent}44`} strokeWidth="0.5" />
                {/* Top edge highlight */}
                <rect x={b.x} y={b.y} width={b.w} height="2.5" rx="1.5" fill={b.accent} opacity="0.35" />
                {/* Side shading (3D feel) */}
                <rect x={b.x + b.w - 3} y={b.y} width="3" height={b.h} fill="rgba(0,0,0,0.25)" />
                {/* Windows grid */}
                {Array.from({ length: winRows }, (_, r) =>
                  Array.from({ length: winCols }, (_, c) => {
                    const wx = b.x + 3 + c * ((b.w - 6) / winCols);
                    const wy = b.y + 5 + r * ((b.h - 8) / winRows);
                    const on = ((r * 7 + c * 3 + Math.floor(b.rnd * 100)) % 5) < 2;
                    return <rect key={`${r}-${c}`} x={wx} y={wy} width={Math.max(2.5, (b.w - 6) / winCols - 2)} height={Math.max(2.5, (b.h - 8) / winRows - 3)} rx="0.5" fill={on && b.lit ? `${b.accent}aa` : "rgba(120,140,180,0.06)"} />;
                  })
                )}
                {/* Rooftop antenna/light for tall buildings */}
                {b.h > 70 && <>
                  <rect x={b.x + b.w / 2 - 0.5} y={b.y - 6} width="1" height="6" fill={b.accent} opacity="0.7" />
                  <circle cx={b.x + b.w / 2} cy={b.y - 7} r="1.5" fill={b.accent} style={{ animation: "blink 2s infinite" }} />
                </>}
                {b.h > 100 && <rect x={b.x + 4} y={b.y - 3} width={b.w - 8} height="3" rx="1" fill={`${b.accent}33`} />}
              </g>
            );
          });
        })()}

        {/* ── STREETLIGHTS along roads ── */}
        {[40, 110, 180, 290, 360, 430, 610, 680, 750, 820].map((lx, i) => (
          <g key={`sl${i}`}>
            <rect x={lx} y="190" width="1.5" height="10" fill="rgba(255,255,255,0.2)" />
            <circle cx={lx + 0.75} cy="189" r="2.5" fill="rgba(255,220,130,0.6)" />
            <circle cx={lx + 0.75} cy="189" r="6" fill="rgba(255,220,130,0.08)" />
          </g>
        ))}
        {[40, 110, 180, 290, 360, 430, 610, 680, 750, 820].map((lx, i) => (
          <g key={`sl2${i}`}>
            <rect x={lx} y="370" width="1.5" height="10" fill="rgba(255,255,255,0.2)" />
            <circle cx={lx + 0.75} cy="369" r="2.5" fill="rgba(255,220,130,0.6)" />
            <circle cx={lx + 0.75} cy="369" r="6" fill="rgba(255,220,130,0.08)" />
          </g>
        ))}

        {/* ── MOVING TRAFFIC (cars) ── */}
        <g>
          <rect className="carH1" x="0" y="208" width="10" height="5" rx="1.5" fill="#dc2626" style={{ animation: "carRight 8s linear infinite" }} />
          <rect className="carH2" x="0" y="222" width="10" height="5" rx="1.5" fill="#2563eb" style={{ animation: "carRight 11s linear infinite" }} />
          <rect x="0" y="388" width="10" height="5" rx="1.5" fill="#eab308" style={{ animation: "carRight 9s linear infinite" }} />
          <rect x="0" y="396" width="9" height="4" rx="1.5" fill="#16a34a" style={{ animation: "carLeft 10s linear infinite" }} />
          <rect x="238" y="0" width="5" height="10" rx="1.5" fill="#e11d48" style={{ animation: "carDown 9s linear infinite" }} />
          <rect x="550" y="0" width="5" height="10" rx="1.5" fill="#0891b2" style={{ animation: "carDown 12s linear infinite" }} />
        </g>

        {/* ── AGENTS ── */}
        {chars.map(ch => {
          const sel = ch.id === selectedId;
          return (
            <g key={ch.id} transform={`translate(${ch.x - 8 * SS}, ${ch.y - 8 * SS}) scale(${SS})`}>
              <ellipse cx="8" cy="17" rx="7" ry="2.5" fill={ch.color} opacity="0.12" />
              {/* Name tag */}
              <g transform="translate(8, -7)">
                <rect x={-ch.name.length * 2.3} y="-5" width={ch.name.length * 4.6} height="6.5" rx="1.8" fill="rgba(0,0,0,0.88)" stroke={ch.color} strokeWidth="0.4" />
                <text x="0" y="-0.3" textAnchor="middle" fontSize="3.4" fill={ch.color} fontWeight="bold" fontFamily="monospace" letterSpacing="0.3">{ch.name}</text>
              </g>
              <Sprite agent={ch} walking={ch.walking} selected={sel} onClick={() => onSelect(sel ? null : ch.id)} />
            </g>
          );
        })}
      </g>

      <style>{`
        @keyframes selP{0%,100%{opacity:.4}50%{opacity:.9}}
        @keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes carRight{from{transform:translateX(-20px)}to{transform:translateX(920px)}}
        @keyframes carLeft{from{transform:translateX(920px)}to{transform:translateX(-20px)}}
        @keyframes carDown{from{transform:translateY(-20px)}to{transform:translateY(500px)}}
      `}</style>
    </svg>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function City() {
  const [agents] = useState(INIT_AGENTS);
  const { chars, logs, rename } = useCity(agents);
  const [selectedId, setSelectedId] = useState(null);
  const [time, setTime] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const [screen, setScreen] = useState(null); // connections | agents | tasks | settings
  const [pan, setPan] = useState({ x: -40, y: -10 });
  const dragging = useRef(false);
  const last = useRef(null);
  const moved = useRef(false);

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const selectedAgent = selectedId ? chars.find(c => c.id === selectedId) : null;

  const startDrag = (x, y) => { dragging.current = true; last.current = { x, y }; moved.current = false; };
  const moveDrag = (x, y) => {
    if (!dragging.current) return;
    const dx = x - last.current.x, dy = y - last.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved.current = true;
    last.current = { x, y };
    setPan(p => ({ x: Math.max(-380, Math.min(120, p.x + dx)), y: Math.max(-200, Math.min(80, p.y + dy)) }));
  };
  const endDrag = () => { dragging.current = false; };

  return (
    <div style={{ width: "100%", height: "100vh", background: "#03040a", fontFamily: "'Inter', -apple-system, sans-serif", color: "#E2E8F0", overflow: "hidden", position: "relative" }}>

      {/* TOP BAR with HAMBURGER */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 48, zIndex: 250, background: "rgba(3,4,10,0.95)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", padding: "0 14px", gap: 12 }}>
        {/* Hamburger */}
        <button onClick={() => setMenuOpen(true)} style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3.5, flexShrink: 0 }}>
          <div style={{ width: 16, height: 1.8, borderRadius: 2, background: "#94A3B8" }} />
          <div style={{ width: 16, height: 1.8, borderRadius: 2, background: "#94A3B8" }} />
          <div style={{ width: 16, height: 1.8, borderRadius: 2, background: "#94A3B8" }} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: "linear-gradient(135deg, #7C3AED, #0EA5E9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, boxShadow: "0 0 12px rgba(124,58,237,0.6)" }}>◈</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.12em", color: "#E2E8F0", lineHeight: 1 }}>TARS</div>
            <div style={{ fontSize: 6, color: "#334155", letterSpacing: "0.15em" }}>LIVING CITY</div>
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 4 }}>{chars.map(c => <div key={c.id} style={{ width: 5, height: 5, borderRadius: "50%", background: c.color, boxShadow: `0 0 5px ${c.glow}`, opacity: 0.85 }} />)}</div>
          <div style={{ color: "#334155", fontSize: 10, fontVariantNumeric: "tabular-nums" }}>{time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
        </div>
      </div>

      {/* CITY */}
      <div
        onMouseDown={e => startDrag(e.clientX, e.clientY)}
        onMouseMove={e => moveDrag(e.clientX, e.clientY)}
        onMouseUp={endDrag} onMouseLeave={endDrag}
        onTouchStart={e => e.touches.length === 1 && startDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={e => e.touches.length === 1 && moveDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={endDrag}
        style={{ position: "absolute", inset: 0, top: 48, bottom: 168, cursor: dragging.current ? "grabbing" : "grab", overflow: "hidden", touchAction: "none" }}>
        <CityMap chars={chars} selectedId={selectedId} onSelect={(id) => { if (!moved.current) setSelectedId(id); }} pan={pan} scale={1} />
        <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, padding: "4px 10px", color: "#1E293B", fontSize: 9, letterSpacing: "0.08em", pointerEvents: "none" }}>DRAG TO EXPLORE · TAP AGENT TO TALK</div>
      </div>

      {/* MISSION BAR */}
      <MissionBar chars={chars} logs={logs} onSelect={id => setSelectedId(prev => prev === id ? null : id)} />

      {/* CHAT */}
      {selectedAgent && <ChatPanel agent={selectedAgent} onClose={() => setSelectedId(null)} onRename={rename} />}

      {/* MENU */}
      <MenuPanel open={menuOpen} onClose={() => setMenuOpen(false)} onNav={setScreen} />

      {/* SCREENS */}
      {screen === "connections" && <ConnectionsScreen onClose={() => setScreen(null)} agents={agents} />}
      {screen === "agents" && <PlaceholderScreen title="MANAGE AGENTS" icon="🤖" desc="Add, edit, rename, or remove agents. This is where the create-agent flow lives — wired up in the full build." onClose={() => setScreen(null)} />}
      {screen === "tasks" && <PlaceholderScreen title="AUTONOMOUS TASKS" icon="⚙️" desc="Set schedules (daily briefings), timers, and triggers (new Etsy order → MAVEN acts). Configured per agent in the full build." onClose={() => setScreen(null)} />}
      {screen === "settings" && <PlaceholderScreen title="SETTINGS" icon="🎛" desc="Preferences, account, notifications, and appearance options." onClose={() => setScreen(null)} />}

      <style>{`* { box-sizing: border-box; } ::-webkit-scrollbar { width: 3px; height: 3px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; } @keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}`}</style>
    </div>
  );
}

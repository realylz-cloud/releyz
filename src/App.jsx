import { useState, useEffect, useRef } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = "/api"; // Points to our Vercel serverless functions

// ─── SPORTS & LEAGUES DATA ────────────────────────────────────────────────────
const SPORTS = [
  {
    id: "soccer", label: "Soccer", icon: "⚽", count: 24,
    leagues: [
      { id: "39",  apiId: "39",  name: "Premier League",   flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", season: 2024 },
      { id: "140", apiId: "140", name: "La Liga",           flag: "🇪🇸", season: 2024 },
      { id: "78",  apiId: "78",  name: "Bundesliga",        flag: "🇩🇪", season: 2024 },
      { id: "135", apiId: "135", name: "Serie A",           flag: "🇮🇹", season: 2024 },
      { id: "61",  apiId: "61",  name: "Ligue 1",           flag: "🇫🇷", season: 2024 },
      { id: "2",   apiId: "2",   name: "Champions League",  flag: "🌍", season: 2024 },
      { id: "253", apiId: "253", name: "MLS",               flag: "🇺🇸", season: 2025 },
    ]
  },
  {
    id: "basketball", label: "Basketball", icon: "🏀", count: 8,
    leagues: [
      { id: "12",  apiId: "12",  name: "NBA",        flag: "🇺🇸", season: 2024 },
      { id: "120", apiId: "120", name: "EuroLeague", flag: "🇪🇺", season: 2024 },
    ]
  },
  {
    id: "football", label: "Am. Football", icon: "🏈", count: 6,
    leagues: [
      { id: "1",   apiId: "1",   name: "NFL",          flag: "🇺🇸", season: 2025 },
      { id: "2nfl",apiId: "2",   name: "NCAA Football",flag: "🇺🇸", season: 2025 },
    ]
  },
  {
    id: "baseball", label: "Baseball", icon: "⚾", count: 12,
    leagues: [
      { id: "1mlb", apiId: "1",  name: "MLB",          flag: "🇺🇸", season: 2025 },
    ]
  },
  {
    id: "hockey", label: "Hockey", icon: "🏒", count: 5,
    leagues: [
      { id: "57",  apiId: "57",  name: "NHL",          flag: "🇺🇸", season: 2024 },
    ]
  },
  {
    id: "tennis", label: "Tennis", icon: "🎾", count: 18,
    leagues: [
      { id: "atp", apiId: "atp", name: "ATP Tour",     flag: "🌍", season: 2025 },
      { id: "wta", apiId: "wta", name: "WTA Tour",     flag: "🌍", season: 2025 },
    ]
  },
  {
    id: "mma", label: "MMA / Boxing", icon: "🥊", count: 3,
    leagues: [
      { id: "ufc",    apiId: "ufc",    name: "UFC",    flag: "🌍", season: 2025 },
      { id: "boxing", apiId: "boxing", name: "Boxing", flag: "🌍", season: 2025 },
    ]
  },
  {
    id: "golf", label: "Golf", icon: "⛳", count: 2,
    leagues: [
      { id: "pga", apiId: "pga", name: "PGA Tour", flag: "🇺🇸", season: 2025 },
    ]
  },
];

const ANALYSIS_TYPES = [
  { id: "full",        label: "Full Context",    icon: "📊" },
  { id: "h2h",         label: "Head to Head",    icon: "⚔️" },
  { id: "form",        label: "Recent Form",     icon: "📈" },
  { id: "injuries",    label: "Injuries",        icon: "🏥" },
  { id: "value",       label: "Value Bets",      icon: "💰" },
  { id: "predictions", label: "AI Predictions",  icon: "🤖" },
];

const TODAY_VALUE_BETS = [
  { match: "Arsenal vs Man City",     league: "Premier League ⚽", pick: "Over 2.5 Goals",    conf: 74, value: "Excellent" },
  { match: "Real Madrid vs Barcelona",league: "La Liga ⚽",        pick: "Both Teams Score",   conf: 81, value: "Good" },
  { match: "LA Lakers vs Golden State",league: "NBA 🏀",           pick: "Away Win",           conf: 69, value: "Good" },
  { match: "Kansas City vs Buffalo",  league: "NFL 🏈",            pick: "Home -3.5",          conf: 71, value: "Excellent" },
  { match: "NY Yankees vs Boston",    league: "MLB ⚾",            pick: "Home Win",           conf: 62, value: "Fair" },
];

function getConfColor(c) {
  if (c >= 75) return "#0057ff";
  if (c >= 60) return "#0088cc";
  return "#88aacc";
}

// ─── PAYWALL ──────────────────────────────────────────────────────────────────
function Paywall({ onSubscribe, loading }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f2f6ff", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Barlow+Condensed:wght@500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* Header */}
      <div style={{ background: "white", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eaedff" }}>
        <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 26, fontWeight: 800, color: "#0a0f1e", letterSpacing: 0.5 }}>
          Rel<span style={{ color: "#0057ff" }}>eyz</span>
        </div>
        <div style={{ background: "#eef3ff", color: "#0057ff", fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 20, letterSpacing: 1 }}>AI POWERED</div>
      </div>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0047dd 0%, #0088ee 60%, #00aaff 100%)", padding: "48px 24px 56px", position: "relative", overflow: "hidden", textAlign: "center" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
        <div style={{ position: "absolute", right: -40, top: -40, width: 200, height: 200, border: "40px solid rgba(255,255,255,0.06)", borderRadius: "50%" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>⚡ SPORTS BETTING INTELLIGENCE</div>
          <h1 style={{ fontFamily: "'Barlow Condensed'", fontSize: 44, fontWeight: 800, color: "white", lineHeight: 1.1, letterSpacing: 0.5, marginBottom: 12 }}>
            Bet Smarter.<br />Win More.
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.8, maxWidth: 300, margin: "0 auto" }}>
            Full AI analysis on every match across all major sports. Real data, real edge.
          </p>
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: "28px 20px 0", flex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          {[
            ["⚽", "All Sports", "Soccer, NBA, NFL, MLB, NHL, UFC & more"],
            ["🔍", "Real-Time Data", "Web search for current form & injuries"],
            ["🤖", "AI Analysis", "Claude AI generates full betting context"],
            ["💰", "Value Bets", "Daily top value picks across all leagues"],
            ["📊", "Confidence Score", "AI rates each bet from 0-100%"],
            ["🏆", "All Leagues", "500+ leagues and competitions"],
          ].map(([icon, title, desc], i) => (
            <div key={i} style={{ background: "white", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(0,50,200,0.06)" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 11, color: "#778", lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* Pricing card */}
        <div style={{ background: "white", borderRadius: 24, padding: 24, border: "2px solid #0057ff", boxShadow: "0 8px 32px rgba(0,87,255,0.12)", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#0057ff", marginBottom: 4 }}>RELEYZ PRO</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 48, fontWeight: 800, color: "#0a0f1e", lineHeight: 1 }}>$9</span>
                <span style={{ fontSize: 13, color: "#889" }}>/month</span>
              </div>
            </div>
            <div style={{ background: "#0057ff", color: "white", fontSize: 10, fontWeight: 800, padding: "6px 14px", borderRadius: 20, letterSpacing: 1 }}>FULL ACCESS</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {[
              "Unlimited AI analyses",
              "All sports & 500+ leagues",
              "Real-time web search data",
              "Full betting context reports",
              "Confidence scores & value ratings",
              "Red flags & risk analysis",
              "Cancel anytime",
            ].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#334" }}>
                <div style={{ width: 20, height: 20, background: "#eef3ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#0057ff", fontSize: 11, flexShrink: 0 }}>✓</div>
                {f}
              </div>
            ))}
          </div>
          <button
            onClick={onSubscribe}
            disabled={loading}
            style={{ width: "100%", padding: "18px", background: loading ? "#99b5ff" : "linear-gradient(135deg, #0047dd, #0099ff)", color: "white", border: "none", borderRadius: 14, fontFamily: "'Barlow Condensed'", fontSize: 22, fontWeight: 700, letterSpacing: 1, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 8px 28px rgba(0,87,255,0.28)", transition: "all 0.2s" }}>
            {loading ? "Loading..." : "⚡ GET STARTED — $9/month"}
          </button>
        </div>

        <div style={{ textAlign: "center", fontSize: 11, color: "#aab", lineHeight: 1.7, paddingBottom: 32 }}>
          Secured by Stripe · Cancel anytime<br />
          For entertainment purposes only. Gamble responsibly.
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function ReleyzApp() {
  // Auth state
  const [isSubscribed, setIsSubscribed]         = useState(false);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [userToken, setUserToken]               = useState(null);

  // App state
  const [drawerOpen, setDrawerOpen]             = useState(false);
  const [activeSport, setActiveSport]           = useState(SPORTS[0]);
  const [expandedSport, setExpandedSport]       = useState("soccer");
  const [activeLeague, setActiveLeague]         = useState(SPORTS[0].leagues[0]);
  const [matches, setMatches]                   = useState([]);
  const [loadingMatches, setLoadingMatches]     = useState(false);
  const [matchError, setMatchError]             = useState(null);
  const [selectedMatch, setSelectedMatch]       = useState(null);
  const [activeAnalysis, setActiveAnalysis]     = useState(["full"]);
  const [activePage, setActivePage]             = useState("matches");
  const [loadingAnalysis, setLoadingAnalysis]   = useState(false);
  const [analysisResult, setAnalysisResult]     = useState(null);
  const [analysisTab, setAnalysisTab]           = useState("overview");
  const [loadingMsg, setLoadingMsg]             = useState("");

  // Check if user already subscribed (stored in localStorage)
  useEffect(() => {
    const token = localStorage.getItem("releyz_token");
    if (token) {
      setUserToken(token);
      setIsSubscribed(true);
    }
    // Check if returning from Stripe success
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (sessionId) {
      localStorage.setItem("releyz_token", sessionId);
      setUserToken(sessionId);
      setIsSubscribed(true);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  // Load matches when league changes
  useEffect(() => {
    if (isSubscribed && activeLeague) {
      fetchMatches(activeLeague);
    }
  }, [activeLeague, isSubscribed]);

  const handleSubscribe = async () => {
    setSubscribeLoading(true);
    try {
      const res = await fetch(`${API_BASE}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: `user_${Date.now()}` }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe checkout
      } else {
        throw new Error(data.error || "Failed to create checkout");
      }
    } catch (err) {
      console.error("Subscribe error:", err);
      alert("Could not start checkout. Please try again.");
    }
    setSubscribeLoading(false);
  };

  const fetchMatches = async (league) => {
    setLoadingMatches(true);
    setMatches([]);
    setMatchError(null);
    setSelectedMatch(null);
    setAnalysisResult(null);

    try {
      const res = await fetch(`${API_BASE}/fixtures?leagueId=${league.apiId}&season=${league.season}&next=10`);
      const data = await res.json();

      if (data.matches && data.matches.length > 0) {
        setMatches(data.matches);
      } else {
        setMatchError("No upcoming matches found for this league.");
      }
    } catch (err) {
      setMatchError("Could not load matches. Please try again.");
    }
    setLoadingMatches(false);
  };

  const handleLeagueSelect = (sport, league) => {
    setActiveSport(sport);
    setActiveLeague(league);
    setDrawerOpen(false);
    setActivePage("matches");
  };

  const toggleAnalysis = (id) => {
    setActiveAnalysis(p =>
      p.includes(id) ? (p.length > 1 ? p.filter(x => x !== id) : p) : [...p, id]
    );
  };

  const runAnalysis = async () => {
    if (!selectedMatch) return;
    setLoadingAnalysis(true);
    setAnalysisResult(null);
    setActivePage("analysis");

    const msgs = [
      "Searching recent form...",
      "Checking head-to-head history...",
      "Scanning injury reports...",
      "Analysing betting markets...",
      "Building full context report...",
    ];
    let mi = 0;
    setLoadingMsg(msgs[0]);
    const interval = setInterval(() => {
      mi = (mi + 1) % msgs.length;
      setLoadingMsg(msgs[mi]);
    }, 2200);

    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          match: selectedMatch,
          league: activeLeague,
          sport: activeSport,
          analysisTypes: activeAnalysis,
        }),
      });

      const data = await res.json();
      clearInterval(interval);

      if (!res.ok) throw new Error(data.error || "Analysis failed");

      setAnalysisResult(data);
      setAnalysisTab("overview");
    } catch (err) {
      clearInterval(interval);
      setAnalysisResult({ error: err.message || "Analysis failed. Please try again." });
    }
    setLoadingAnalysis(false);
  };

  // ── PAYWALL ──
  if (!isSubscribed) {
    return <Paywall onSubscribe={handleSubscribe} loading={subscribeLoading} />;
  }

  // ── MAIN APP ──
  return (
    <div style={{ minHeight: "100vh", background: "#f2f6ff", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#0a0f1e", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Barlow+Condensed:wght@500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        .drawer-overlay { position:fixed;inset:0;background:rgba(10,15,30,.45);z-index:100;opacity:0;pointer-events:none;transition:opacity .3s;backdrop-filter:blur(2px); }
        .drawer-overlay.open { opacity:1;pointer-events:all; }
        .drawer { position:fixed;top:0;left:0;bottom:0;width:280px;background:white;z-index:101;transform:translateX(-100%);transition:transform .32s cubic-bezier(.4,0,.2,1);box-shadow:4px 0 40px rgba(0,50,200,.12);display:flex;flex-direction:column;overflow:hidden; }
        .drawer.open { transform:translateX(0); }
        .drawer-header { background:linear-gradient(135deg,#0047dd 0%,#0099ff 100%);padding:48px 20px 20px;flex-shrink:0; }
        .drawer-logo { font-family:'Barlow Condensed';font-size:32px;font-weight:800;color:white;letter-spacing:1px;margin-bottom:4px; }
        .drawer-tagline { font-size:11px;color:rgba(255,255,255,.6);font-weight:400; }
        .drawer-user { display:flex;align-items:center;gap:10px;margin-top:16px;background:rgba(255,255,255,.12);border-radius:12px;padding:10px 12px; }
        .drawer-avatar { width:32px;height:32px;background:rgba(255,255,255,.25);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px; }
        .drawer-username { font-size:13px;font-weight:700;color:white; }
        .drawer-plan { font-size:10px;color:rgba(255,255,255,.6); }
        .drawer-scroll { flex:1;overflow-y:auto;padding:12px 0 80px; }
        .drawer-section-label { font-size:9px;font-weight:700;letter-spacing:2px;color:#aab;padding:12px 20px 6px;text-transform:uppercase; }
        .drawer-sport-row { display:flex;align-items:center;padding:10px 20px;cursor:pointer;transition:background .15s; }
        .drawer-sport-row:hover { background:#f5f8ff; }
        .drawer-sport-row.active { background:#eef3ff; }
        .drawer-sport-icon { font-size:20px;margin-right:12px;width:28px;text-align:center; }
        .drawer-sport-name { font-size:14px;font-weight:600;flex:1;color:#1a2040; }
        .drawer-sport-count { font-size:10px;font-weight:700;background:#eef3ff;color:#0057ff;padding:2px 8px;border-radius:10px;margin-right:8px; }
        .drawer-sport-chevron { font-size:10px;color:#aab;transition:transform .2s; }
        .drawer-sport-chevron.expanded { transform:rotate(90deg); }
        .drawer-sport-row.active .drawer-sport-name { color:#0057ff; }
        .drawer-leagues { overflow:hidden;transition:max-height .3s ease;background:#fafbff; }
        .drawer-league-row { display:flex;align-items:center;padding:9px 20px 9px 52px;cursor:pointer;transition:background .15s; }
        .drawer-league-row:hover { background:#f0f4ff; }
        .drawer-league-row.active { background:#eef3ff; }
        .drawer-league-flag { font-size:14px;margin-right:8px; }
        .drawer-league-name { font-size:13px;font-weight:500;color:#445;flex:1; }
        .drawer-league-row.active .drawer-league-name { color:#0057ff;font-weight:700; }
        .drawer-active-dot { width:6px;height:6px;border-radius:50%;background:#0057ff; }
        .drawer-footer { position:absolute;bottom:0;left:0;right:0;padding:12px 20px;background:white;border-top:1px solid #f0f2ff;display:flex;gap:8px; }
        .drawer-footer-btn { flex:1;padding:9px;background:#f0f4ff;border:none;border-radius:8px;font-family:'Plus Jakarta Sans';font-size:12px;font-weight:600;color:#0057ff;cursor:pointer; }
        .topbar { background:white;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eaedff;position:sticky;top:0;z-index:50;box-shadow:0 2px 12px rgba(0,50,200,.06); }
        .topbar-logo { font-family:'Barlow Condensed';font-size:26px;font-weight:800;color:#0a0f1e;letter-spacing:.5px; }
        .topbar-logo span { color:#0057ff; }
        .menu-btn { width:38px;height:38px;background:#f0f4ff;border:none;border-radius:11px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;padding:10px 9px; }
        .menu-line { width:18px;height:2px;background:#0057ff;border-radius:2px; }
        .menu-line.mid { width:13px; }
        .topbar-icon-btn { width:38px;height:38px;background:#f0f4ff;border:none;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer; }
        .breadcrumb { display:flex;align-items:center;gap:6px;padding:10px 16px;background:white;border-bottom:1px solid #eaedff; }
        .hero-banner { background:linear-gradient(135deg,#0047dd 0%,#0088ee 60%,#00aaff 100%);padding:20px 16px;position:relative;overflow:hidden; }
        .hero-grid { position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:24px 24px; }
        .match-card { background:white;border-radius:18px;padding:16px;margin-bottom:10px;border:2px solid transparent;cursor:pointer;transition:all .22s;box-shadow:0 2px 14px rgba(0,50,200,.06); }
        .match-card:hover { box-shadow:0 6px 24px rgba(0,50,200,.11);transform:translateY(-1px); }
        .match-card.selected { border-color:#0057ff;box-shadow:0 6px 28px rgba(0,87,255,.18); }
        .analysis-chip { background:white;border:1.5px solid #e0e8ff;border-radius:10px;padding:10px 6px;text-align:center;cursor:pointer;transition:all .18s;box-shadow:0 1px 6px rgba(0,50,200,.04); }
        .analysis-chip.active { background:#eef3ff;border-color:#0057ff; }
        .run-btn { width:100%;padding:17px;background:linear-gradient(135deg,#0047dd,#0099ff);color:white;border:none;border-radius:14px;font-family:'Barlow Condensed';font-size:20px;font-weight:700;letter-spacing:1.5px;cursor:pointer;box-shadow:0 8px 28px rgba(0,87,255,.28);transition:all .2s; }
        .run-btn:hover:not(:disabled) { transform:translateY(-2px);box-shadow:0 14px 36px rgba(0,87,255,.38); }
        .run-btn:disabled { background:linear-gradient(135deg,#c0ccee,#a0b8dd);cursor:not-allowed;box-shadow:none; }
        .bottom-nav { position:fixed;bottom:0;left:0;right:0;background:white;border-top:1px solid #eaedff;display:flex;padding:10px 0 22px;box-shadow:0 -4px 24px rgba(0,50,200,.08);z-index:50; }
        .nav-tab { flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;padding:4px 0; }
        .nav-tab-icon { font-size:22px; }
        .nav-tab-label { font-size:9px;font-weight:700;color:#bbc;letter-spacing:.5px;text-transform:uppercase; }
        .nav-tab.active .nav-tab-label { color:#0057ff; }
        .nav-tab-line { width:20px;height:2px;border-radius:2px;background:transparent; }
        .nav-tab.active .nav-tab-line { background:#0057ff; }
        .section-card { background:white;border-radius:16px;padding:18px;margin-bottom:12px;box-shadow:0 2px 12px rgba(0,50,200,.05); }
        .bet-card { background:white;border-left:3px solid #0057ff;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 2px 10px rgba(0,50,200,.06); }
        .atab { font-size:12px;font-weight:700;padding:8px 16px;border-radius:8px;cursor:pointer;border:1.5px solid #e0e8ff;background:white;color:#556;white-space:nowrap;transition:all .18s; }
        .atab.active { background:#eef3ff;border-color:#0057ff;color:#0057ff; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.5} }
        .pulse { animation:pulse 1.4s ease-in-out infinite; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
        .fade-up { animation:fadeUp .35s ease forwards; }
        @keyframes spin { to{transform:rotate(360deg)} }
        .spinner { display:inline-block;width:12px;height:12px;border:2px solid #e0e8ff;border-top-color:#0057ff;border-radius:50%;animation:spin .7s linear infinite;vertical-align:middle;margin-right:8px; }
      `}</style>

      {/* DRAWER OVERLAY */}
      <div className={`drawer-overlay ${drawerOpen ? "open" : ""}`} onClick={() => setDrawerOpen(false)} />

      {/* DRAWER */}
      <div className={`drawer ${drawerOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <div className="drawer-logo">RELEYZ</div>
          <div className="drawer-tagline">AI Sports Betting Intelligence</div>
          <div className="drawer-user">
            <div className="drawer-avatar">⚡</div>
            <div>
              <div className="drawer-username">Pro Member</div>
              <div className="drawer-plan">Unlimited access · All sports</div>
            </div>
          </div>
        </div>
        <div className="drawer-scroll">
          <div className="drawer-section-label">All Sports</div>
          {SPORTS.map((sport) => (
            <div key={sport.id}>
              <div
                className={`drawer-sport-row ${activeSport.id === sport.id ? "active" : ""}`}
                onClick={() => setExpandedSport(expandedSport === sport.id ? null : sport.id)}
              >
                <div className="drawer-sport-icon">{sport.icon}</div>
                <div className="drawer-sport-name">{sport.label}</div>
                <div className="drawer-sport-count">{sport.count}</div>
                <div className={`drawer-sport-chevron ${expandedSport === sport.id ? "expanded" : ""}`}>▶</div>
              </div>
              <div className="drawer-leagues" style={{ maxHeight: expandedSport === sport.id ? `${sport.leagues.length * 42}px` : "0" }}>
                {sport.leagues.map((league) => (
                  <div
                    key={league.id}
                    className={`drawer-league-row ${activeLeague.id === league.id ? "active" : ""}`}
                    onClick={() => handleLeagueSelect(sport, league)}
                  >
                    <div className="drawer-league-flag">{league.flag}</div>
                    <div className="drawer-league-name">{league.name}</div>
                    {activeLeague.id === league.id && <div className="drawer-active-dot" />}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="drawer-section-label" style={{ marginTop: 8 }}>Account</div>
          {["⚙️  Settings", "❓  Help & Support", "📋  Terms & Privacy"].map((item, i) => (
            <div key={i} className="drawer-sport-row" onClick={() => setDrawerOpen(false)}>
              <div className="drawer-sport-name" style={{ marginLeft: 0 }}>{item}</div>
            </div>
          ))}
        </div>
        <div className="drawer-footer">
          <button className="drawer-footer-btn" onClick={() => setDrawerOpen(false)}>✕ Close</button>
          <button className="drawer-footer-btn" style={{ background: "#f0f4ff", color: "#0057ff" }} onClick={() => { localStorage.removeItem("releyz_token"); setIsSubscribed(false); setDrawerOpen(false); }}>Sign Out</button>
        </div>
      </div>

      {/* TOP BAR */}
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="menu-btn" onClick={() => setDrawerOpen(true)}>
            <div className="menu-line" />
            <div className="menu-line mid" />
            <div className="menu-line" />
          </button>
          <div className="topbar-logo">Rel<span>eyz</span></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="topbar-icon-btn">🔔</button>
          <button className="topbar-icon-btn">🔍</button>
        </div>
      </div>

      {/* ── MATCHES PAGE ── */}
      {activePage === "matches" && (
        <div style={{ paddingBottom: 90 }}>
          <div className="breadcrumb">
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0057ff" }}>{activeSport.icon} {activeSport.label}</span>
            <span style={{ fontSize: 10, color: "#ccd" }}>›</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#445" }}>{activeLeague.flag} {activeLeague.name}</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "#0057ff", fontWeight: 700, background: "#eef3ff", padding: "2px 10px", borderRadius: 10 }}>{matches.length} matches</span>
          </div>

          <div className="hero-banner">
            <div className="hero-grid" />
            <div style={{ position: "absolute", right: -40, top: -40, width: 160, height: 160, border: "30px solid rgba(255,255,255,.07)", borderRadius: "50%" }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2.5, color: "rgba(255,255,255,.55)", marginBottom: 8 }}>⚡ AI MATCH INTELLIGENCE</div>
              <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 30, fontWeight: 800, color: "white", lineHeight: 1.1, letterSpacing: .5, marginBottom: 16 }}>{activeLeague.name}<br />Upcoming Fixtures</div>
              <div style={{ display: "flex", gap: 10 }}>
                {[["Live", "Data"], ["AI", "Analysis"], [`${matches.length}`, "Matches"]].map(([v, l], i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,.13)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 10, padding: "10px 14px" }}>
                    <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 22, fontWeight: 800, color: "white" }}>{v}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,.5)", marginTop: 1 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: "16px 16px 8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 20, fontWeight: 700, letterSpacing: .5 }}>Fixtures</div>
              {loadingMatches && <span style={{ fontSize: 11, color: "#0057ff" }}><span className="spinner" />Loading...</span>}
            </div>

            {matchError && (
              <div style={{ background: "#fff0f5", border: "1px solid #ffccd8", borderRadius: 12, padding: 14, color: "#cc3344", fontSize: 12, marginBottom: 12 }}>⚠️ {matchError}</div>
            )}

            {!loadingMatches && matches.length === 0 && !matchError && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#aab" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🏟</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#334", marginBottom: 6 }}>No fixtures yet</div>
                <div style={{ fontSize: 12 }}>Open the menu to select a league</div>
              </div>
            )}

            {matches.map((m, i) => (
              <div key={i} className={`match-card ${selectedMatch === m ? "selected" : ""} fade-up`} style={{ animationDelay: `${i * 0.05}s` }} onClick={() => { setSelectedMatch(m); setAnalysisResult(null); }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: "#0057ff", background: "#eef3ff", padding: "3px 9px", borderRadius: 5 }}>{activeSport.icon} {activeLeague.name}</div>
                  <div style={{ fontSize: 10, color: "#889" }}>📅 {m.date} · {m.time}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{m.home}</div>
                    <div style={{ fontSize: 9, color: "#aab", marginTop: 2 }}>Home</div>
                  </div>
                  <div style={{ padding: "0 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#ccd", letterSpacing: 1 }}>VS</div>
                    <div style={{ fontSize: 9, color: "#aab" }}>{m.time}</div>
                  </div>
                  <div style={{ flex: 1, textAlign: "right" }}>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{m.away}</div>
                    <div style={{ fontSize: 9, color: "#aab", marginTop: 2 }}>Away</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: getConfColor(m.conf), minWidth: 28 }}>{m.conf}%</span>
                  <div style={{ flex: 1, height: 4, background: "#eef0f8", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${m.conf}%`, height: "100%", background: "linear-gradient(90deg,#0047dd,#00aaff)", borderRadius: 2 }} />
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, background: "#f0f6ff", color: "#0057ff", padding: "3px 9px", borderRadius: 5 }}>{m.verdict}</div>
                </div>
              </div>
            ))}
          </div>

          {selectedMatch && (
            <div style={{ padding: "0 16px 16px" }} className="fade-up">
              <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Analysis Scope</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                {ANALYSIS_TYPES.map((a) => (
                  <div key={a.id} className={`analysis-chip ${activeAnalysis.includes(a.id) ? "active" : ""}`} onClick={() => toggleAnalysis(a.id)}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{a.icon}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: activeAnalysis.includes(a.id) ? "#0057ff" : "#445" }}>{a.label}</div>
                  </div>
                ))}
              </div>
              <button className="run-btn" disabled={loadingAnalysis} onClick={runAnalysis}>
                {loadingAnalysis ? <span className="pulse">⚡ ANALYZING...</span> : "⚡ RUN FULL ANALYSIS"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── ANALYSIS PAGE ── */}
      {activePage === "analysis" && (
        <div style={{ padding: "16px 16px 100px" }} className="fade-up">
          {loadingAnalysis && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
              <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Analyzing Match...</div>
              <div className="pulse" style={{ fontSize: 13, color: "#889" }}>{loadingMsg}</div>
            </div>
          )}

          {analysisResult?.error && (
            <div style={{ background: "#fff0f0", border: "1px solid #ffcccc", borderRadius: 14, padding: 16, color: "#cc4444", fontSize: 13, marginBottom: 16 }}>
              ⚠️ {analysisResult.error}
              <div style={{ marginTop: 12 }}>
                <button onClick={() => setActivePage("matches")} style={{ background: "#0057ff", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>← Back to Matches</button>
              </div>
            </div>
          )}

          {analysisResult && !analysisResult.error && selectedMatch && (
            <>
              <div style={{ background: "linear-gradient(135deg,#0047dd,#0099ff)", borderRadius: 20, padding: 20, marginBottom: 16, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
                <div style={{ position: "relative" }}>
                  <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 22, fontWeight: 800, color: "white", letterSpacing: .5, marginBottom: 4 }}>{selectedMatch.home} vs {selectedMatch.away}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)", marginBottom: 14 }}>{activeLeague.flag} {activeLeague.name} · {selectedMatch.date}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", border: "3px solid rgba(255,255,255,.3)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,.1)", flexShrink: 0 }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 22, fontWeight: 800, color: "white" }}>{analysisResult.confidenceScore}</div>
                        <div style={{ fontSize: 7, color: "rgba(255,255,255,.5)", letterSpacing: 1 }}>CONF%</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,.9)", lineHeight: 1.6, flex: 1 }}>{analysisResult.verdict}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
                {["overview", "betting", "redflags"].map((tab) => (
                  <button key={tab} className={`atab ${analysisTab === tab ? "active" : ""}`} onClick={() => setAnalysisTab(tab)}>
                    {tab === "overview" ? "📊 Overview" : tab === "betting" ? "💰 Betting Angles" : "⚠️ Red Flags"}
                  </button>
                ))}
              </div>

              {analysisTab === "overview" && (
                <>
                  {analysisResult.sections?.map((s, i) => (
                    <div key={i} className="section-card">
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 18 }}>{s.icon}</span>
                        <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 18, fontWeight: 700 }}>{s.title}</span>
                      </div>
                      <p style={{ fontSize: 12, color: "#556", lineHeight: 1.8, marginBottom: s.stats?.length ? 12 : 0 }}>{s.content}</p>
                      {s.stats?.length > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: s.keyPoints?.length ? 12 : 0 }}>
                          {s.stats.map((st, j) => (
                            <div key={j} style={{ background: "#f5f7ff", border: "1px solid #e8eeff", borderRadius: 8, padding: "8px 10px", display: "flex", justifyContent: "space-between" }}>
                              <span style={{ fontSize: 10, color: "#889" }}>{st.label}</span>
                              <span style={{ fontSize: 12, fontWeight: 700 }}>{st.value} {st.trend === "up" ? "↑" : st.trend === "down" ? "↓" : "→"}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {s.keyPoints?.map((p, j) => (
                        <div key={j} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0057ff", marginTop: 5, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: "#445", lineHeight: 1.6 }}>{p}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  {analysisResult.summary && (
                    <div className="section-card">
                      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}><span style={{ fontSize: 18 }}>📝</span><span style={{ fontFamily: "'Barlow Condensed'", fontSize: 18, fontWeight: 700 }}>Summary</span></div>
                      <p style={{ fontSize: 12, color: "#556", lineHeight: 1.8 }}>{analysisResult.summary}</p>
                    </div>
                  )}
                </>
              )}

              {analysisTab === "betting" && analysisResult.bettingAngles?.map((a, i) => (
                <div key={i} className="bet-card">
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: "#889", marginBottom: 4 }}>{a.market}</div>
                  <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 20, fontWeight: 800, color: "#0057ff", marginBottom: 8 }}>{a.pick}</div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: a.risk === "Low" ? "#e8f8ee" : a.risk === "Medium" ? "#fff8e8" : "#fee8e8", color: a.risk === "Low" ? "#1a7a3a" : a.risk === "Medium" ? "#a06000" : "#cc2222" }}>{a.risk} Risk</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: "#eef3ff", color: "#0057ff" }}>{a.value} Value</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#556", lineHeight: 1.6 }}>{a.reasoning}</p>
                </div>
              ))}

              {analysisTab === "redflags" && (
                <div className="section-card">
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "#cc3344", marginBottom: 12 }}>⚠️ RISK FACTORS</div>
                  {analysisResult.redFlags?.map((flag, i) => (
                    <div key={i} style={{ background: "#fff8f8", border: "1px solid #ffd0d0", borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", gap: 10 }}>
                      <span style={{ color: "#dd4444", fontSize: 14 }}>⚠️</span>
                      <span style={{ fontSize: 12, color: "#774444", lineHeight: 1.6 }}>{flag}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 8, padding: "12px 14px", background: "#f5f7ff", borderRadius: 10, fontSize: 10, color: "#aab", lineHeight: 1.7, textAlign: "center" }}>
                ⚡ Releyz provides analytical context only. Not financial advice. Gamble responsibly.
              </div>
            </>
          )}

          {!loadingAnalysis && !analysisResult && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#aab" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
              <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 22, fontWeight: 700, color: "#0a0f1e", marginBottom: 8 }}>No Analysis Yet</div>
              <div style={{ fontSize: 13, marginBottom: 20 }}>Select a match and run analysis first.</div>
              <button onClick={() => setActivePage("matches")} style={{ background: "#0057ff", color: "white", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>← Go to Matches</button>
            </div>
          )}
        </div>
      )}

      {/* ── VALUE PAGE ── */}
      {activePage === "value" && (
        <div style={{ padding: "16px 16px 100px" }} className="fade-up">
          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Today's Value Bets</div>
          <div style={{ fontSize: 12, color: "#889", marginBottom: 16 }}>AI-identified top value across all sports</div>
          {TODAY_VALUE_BETS.map((v, i) => (
            <div key={i} style={{ background: "white", borderRadius: 18, padding: 16, marginBottom: 12, boxShadow: "0 2px 14px rgba(0,50,200,.06)", border: "2px solid #eef3ff" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "linear-gradient(135deg,#0047dd,#0099ff)", color: "white", fontSize: 9, fontWeight: 800, padding: "3px 10px", borderRadius: 5, letterSpacing: 1, marginBottom: 10 }}>⚡ {v.value.toUpperCase()} VALUE</div>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{v.match}</div>
              <div style={{ fontSize: 11, color: "#889", marginBottom: 8 }}>{v.league}</div>
              <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 18, fontWeight: 700, color: "#0057ff", marginBottom: 10 }}>{v.pick}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 80, height: 4, background: "#eef0f8", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${v.conf}%`, height: "100%", background: "linear-gradient(90deg,#0047dd,#00aaff)", borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#0057ff" }}>{v.conf}%</span>
                </div>
                <button onClick={() => setActivePage("matches")} style={{ background: "#eef3ff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 11, fontWeight: 700, color: "#0057ff", cursor: "pointer" }}>Analyze →</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PROFILE PAGE ── */}
      {activePage === "profile" && (
        <div style={{ padding: "16px 16px 100px" }} className="fade-up">
          <div style={{ background: "linear-gradient(135deg,#0047dd,#0099ff)", borderRadius: 20, padding: 22, marginBottom: 16, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, background: "rgba(255,255,255,.2)", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 12px" }}>⚡</div>
            <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 24, fontWeight: 800, color: "white", letterSpacing: .5 }}>Pro Member</div>
            <div style={{ display: "inline-block", background: "rgba(255,255,255,.2)", border: "1px solid rgba(255,255,255,.3)", borderRadius: 20, padding: "4px 14px", fontSize: 11, fontWeight: 700, color: "white", marginTop: 6 }}>$9 / month · Unlimited</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[["∞", "Analyses"], ["12", "Sports"], ["500+", "Leagues"]].map(([v, l], i) => (
              <div key={i} style={{ background: "white", borderRadius: 14, padding: "14px 10px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,50,200,.06)" }}>
                <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 24, fontWeight: 800, color: "#0057ff" }}>{v}</div>
                <div style={{ fontSize: 9, color: "#aab", marginTop: 2, fontWeight: 600 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Settings</div>
          {[["🌍 Language","English"],["🔔 Notifications","On"],["📊 Default Analysis","Full Context"],["🏆 Favourite Sport","Soccer"],["🔒 Privacy Policy","View"],["❓ Help & Support","Contact"]].map(([label, value], i) => (
            <div key={i} style={{ background: "white", borderRadius: 12, padding: "14px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 8px rgba(0,50,200,.04)", cursor: "pointer" }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
              <span style={{ fontSize: 12, color: "#0057ff", fontWeight: 600 }}>{value} ›</span>
            </div>
          ))}
          <button onClick={() => { localStorage.removeItem("releyz_token"); setIsSubscribed(false); }} style={{ width: "100%", marginTop: 8, padding: "14px", background: "white", border: "2px solid #ffcccc", borderRadius: 12, fontFamily: "'Plus Jakarta Sans'", fontSize: 13, fontWeight: 700, color: "#cc3344", cursor: "pointer" }}>Sign Out</button>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div className="bottom-nav">
        {[
          { id: "matches",  icon: "⚽", label: "Matches"  },
          { id: "analysis", icon: "📊", label: "Analysis" },
          { id: "value",    icon: "💰", label: "Value"    },
          { id: "profile",  icon: "👤", label: "Profile"  },
        ].map((tab) => (
          <div key={tab.id} className={`nav-tab ${activePage === tab.id ? "active" : ""}`} onClick={() => setActivePage(tab.id)}>
            <div className="nav-tab-line" />
            <div className="nav-tab-icon">{tab.icon}</div>
            <div className="nav-tab-label">{tab.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

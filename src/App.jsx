import { useState, useEffect, useRef } from "react";

const API_BASE = "/api";

const SPORTS = [
  {
    id: "soccer", label: "Soccer", icon: "⚽", count: 24,
    leagues: [
      { id: "wc2026", apiId: "wc2026", name: "World Cup 2026",  flag: "🏆", slug: "fifa.world",      season: 2026 },
      { id: "39",     apiId: "39",     name: "Premier League",  flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", slug: "eng.1",         season: 2025 },
      { id: "140",    apiId: "140",    name: "La Liga",          flag: "🇪🇸", slug: "esp.1",         season: 2025 },
      { id: "78",     apiId: "78",     name: "Bundesliga",       flag: "🇩🇪", slug: "ger.1",         season: 2025 },
      { id: "135",    apiId: "135",    name: "Serie A",          flag: "🇮🇹", slug: "ita.1",         season: 2025 },
      { id: "61",     apiId: "61",     name: "Ligue 1",          flag: "🇫🇷", slug: "fra.1",         season: 2025 },
      { id: "2",      apiId: "2",      name: "Champions League", flag: "🌍", slug: "uefa.champions", season: 2025 },
      { id: "253",    apiId: "253",    name: "MLS",              flag: "🇺🇸", slug: "usa.1",         season: 2025 },
    ]
  },
  { id: "basketball", label: "Basketball", icon: "🏀", count: 8, leagues: [{ id: "12", apiId: "12", name: "NBA", flag: "🇺🇸", season: 2025 },{ id: "120", apiId: "120", name: "EuroLeague", flag: "🇪🇺", season: 2025 }] },
  { id: "football", label: "Am. Football", icon: "🏈", count: 6, leagues: [{ id: "1nfl", apiId: "1nfl", name: "NFL", flag: "🇺🇸", season: 2025 },{ id: "2nfl", apiId: "2nfl", name: "NCAA Football", flag: "🇺🇸", season: 2025 }] },
  { id: "baseball", label: "Baseball", icon: "⚾", count: 12, leagues: [{ id: "1mlb", apiId: "1mlb", name: "MLB", flag: "🇺🇸", season: 2025 }] },
  { id: "hockey", label: "Hockey", icon: "🏒", count: 5, leagues: [{ id: "57", apiId: "57", name: "NHL", flag: "🇺🇸", season: 2025 }] },
  { id: "tennis", label: "Tennis", icon: "🎾", count: 18, leagues: [{ id: "atp", apiId: "atp", name: "ATP Tour", flag: "🌍", season: 2025 },{ id: "wta", apiId: "wta", name: "WTA Tour", flag: "🌍", season: 2025 }] },
  { id: "mma", label: "MMA / Boxing", icon: "🥊", count: 3, leagues: [{ id: "ufc", apiId: "ufc", name: "UFC", flag: "🌍", season: 2025 },{ id: "boxing", apiId: "boxing", name: "Boxing", flag: "🌍", season: 2025 }] },
  { id: "golf", label: "Golf", icon: "⛳", count: 2, leagues: [{ id: "pga", apiId: "pga", name: "PGA Tour", flag: "🇺🇸", season: 2025 }] },
];

const ANALYSIS_TYPES = [
  { id: "full", label: "Full Context", icon: "📊" },
  { id: "h2h", label: "Head to Head", icon: "⚔️" },
  { id: "form", label: "Recent Form", icon: "📈" },
  { id: "injuries", label: "Injuries", icon: "🏥" },
  { id: "value", label: "Value Bets", icon: "💰" },
  { id: "predictions", label: "AI Predictions", icon: "🤖" },
];

function getConfColor(c) {
  if (c >= 75) return "#0057ff";
  if (c >= 60) return "#0088cc";
  return "#88aacc";
}

function TeamLogo({ logo, name, size = 36 }) {
  const [err, setErr] = useState(false);
  if (err || !logo) {
    return <div style={{ width: size, height: size, borderRadius: size / 4, background: "#eef3ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4, flexShrink: 0 }}>⚽</div>;
  }
  return <img src={logo} alt={name} width={size} height={size} onError={() => setErr(true)} style={{ objectFit: "contain", borderRadius: size / 4, flexShrink: 0 }} />;
}

function ResultBadge({ result }) {
  const colors = { W: { bg: "#e8f8ee", color: "#00aa44" }, L: { bg: "#fee8e8", color: "#ff4444" }, D: { bg: "#fff8e8", color: "#ff9900" } };
  const c = colors[result] || colors.D;
  return <div style={{ width: 22, height: 22, borderRadius: 5, background: c.bg, color: c.color, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{result}</div>;
}

function Paywall({ onSubscribe, loading }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f2f6ff", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Barlow+Condensed:wght@500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <div style={{ background: "white", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eaedff" }}>
        <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 26, fontWeight: 800, color: "#0a0f1e" }}>Rel<span style={{ color: "#0057ff" }}>eyz</span></div>
        <div style={{ background: "#eef3ff", color: "#0057ff", fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 20, letterSpacing: 1 }}>AI POWERED</div>
      </div>
      <div style={{ background: "linear-gradient(135deg,#0047dd 0%,#0088ee 60%,#00aaff 100%)", padding: "48px 24px 56px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>SPORTS BETTING INTELLIGENCE</div>
          <h1 style={{ fontFamily: "'Barlow Condensed'", fontSize: 44, fontWeight: 800, color: "white", lineHeight: 1.1, marginBottom: 12 }}>Bet Smarter.<br />Win More.</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.8, maxWidth: 300, margin: "0 auto" }}>Full AI analysis on every match across all major sports.</p>
        </div>
      </div>
      <div style={{ padding: "28px 20px 0", flex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          {[["🏆","World Cup 2026","All 104 FIFA World Cup matches"],["⚽","All Sports","Soccer, NBA, NFL, MLB, NHL, UFC"],["🔍","Real-Time Data","Live fixtures and real injury data"],["🤖","AI Analysis","Claude AI generates full betting context"],["⚔️","H2H Stats","Full head to head with match timelines"],["📊","Confidence Score","AI rates each bet 0 to 100"]].map(([icon,title,desc],i) => (
            <div key={i} style={{ background: "white", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(0,50,200,0.06)" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 11, color: "#778", lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
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
            {["All 104 World Cup 2026 matches","Unlimited AI analyses","Full H2H with match timelines","Real-time fixture data","Full betting context reports","Confidence scores and value ratings","Cancel anytime"].map((f,i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#334" }}>
                <div style={{ width: 20, height: 20, background: "#eef3ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#0057ff", fontSize: 11, flexShrink: 0 }}>✓</div>
                {f}
              </div>
            ))}
          </div>
          <button onClick={onSubscribe} disabled={loading} style={{ width: "100%", padding: "18px", background: loading ? "#99b5ff" : "linear-gradient(135deg,#0047dd,#0099ff)", color: "white", border: "none", borderRadius: 14, fontFamily: "'Barlow Condensed'", fontSize: 22, fontWeight: 700, letterSpacing: 1, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 8px 28px rgba(0,87,255,0.28)" }}>
            {loading ? "Loading..." : "GET STARTED — $9/month"}
          </button>
        </div>
        <div style={{ textAlign: "center", fontSize: 11, color: "#aab", lineHeight: 1.7, paddingBottom: 32 }}>Secured by Stripe · Cancel anytime<br />For entertainment only. Gamble responsibly.</div>
      </div>
    </div>
  );
}

function MatchDetailModal({ game, leagueSlug, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/h2h?eventId=${game.id}&leagueSlug=${leagueSlug}`);
        const data = await res.json();
        setDetail(data);
      } catch (e) { setDetail(null); }
      setLoading(false);
    }
    load();
  }, [game.id]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,30,.6)", zIndex: 200, display: "flex", alignItems: "flex-end", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 40, height: 4, background: "#e0e4f0", borderRadius: 2 }} />
        </div>
        {/* Header */}
        <div style={{ padding: "12px 16px 14px", borderBottom: "1px solid #f0f2ff" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: "#889", fontWeight: 600 }}>{game.date}</div>
            <button onClick={onClose} style={{ background: "#f0f4ff", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 14, color: "#0057ff" }}>✕</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
              <TeamLogo logo={game.homeLogo} name={game.homeTeam} size={32} />
              <span style={{ fontSize: 13, fontWeight: 800 }}>{game.homeTeam}</span>
            </div>
            <div style={{ textAlign: "center", padding: "4px 12px", background: "#0057ff", borderRadius: 10, margin: "0 8px" }}>
              <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 24, fontWeight: 800, color: "white", letterSpacing: 2 }}>{game.homeScore} - {game.awayScore}</span>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
              <span style={{ fontSize: 13, fontWeight: 800, textAlign: "right" }}>{game.awayTeam}</span>
              <TeamLogo logo={game.awayLogo} name={game.awayTeam} size={32} />
            </div>
          </div>
        </div>
        {/* Content */}
        <div style={{ overflowY: "auto", flex: 1, padding: "16px" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#889" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⚽</div>
              <div style={{ fontSize: 13 }}>Loading match details...</div>
            </div>
          )}
          {!loading && (!detail || detail.error) && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#889" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
              <div style={{ fontSize: 13 }}>Match details not available for this game.</div>
            </div>
          )}
          {!loading && detail && !detail.error && (
            <>
              {detail.venue && (
                <div style={{ fontSize: 11, color: "#889", textAlign: "center", marginBottom: 16 }}>📍 {detail.venue}</div>
              )}
              {detail.timeline && detail.timeline.length > 0 ? (
                <>
                  <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 16, fontWeight: 700, marginBottom: 12, color: "#0a0f1e" }}>⚽ Goal Timeline</div>
                  <div style={{ position: "relative" }}>
                    {/* Centre line */}
                    <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "#e8eeff", transform: "translateX(-50%)" }} />
                    {detail.timeline.map((event, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: 12, position: "relative" }}>
                        {event.isHome ? (
                          <>
                            <div style={{ flex: 1, textAlign: "right", paddingRight: 12 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "#0a0f1e" }}>{event.player}</div>
                              {event.assist && <div style={{ fontSize: 10, color: "#889" }}>Assist: {event.assist}</div>}

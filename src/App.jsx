import { useState, useEffect, useRef } from "react";

const API_BASE = "/api";

const SPORTS = [
  {
    id: "soccer", label: "Soccer", icon: "⚽", count: 24,
    leagues: [
      { id: "wc2026", apiId: "wc2026", name: "World Cup 2026", flag: "🏆", season: 2026 },
      { id: "39",     apiId: "39",     name: "Premier League",  flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", season: 2025 },
      { id: "140",    apiId: "140",    name: "La Liga",          flag: "🇪🇸", season: 2025 },
      { id: "78",     apiId: "78",     name: "Bundesliga",       flag: "🇩🇪", season: 2025 },
      { id: "135",    apiId: "135",    name: "Serie A",          flag: "🇮🇹", season: 2025 },
      { id: "61",     apiId: "61",     name: "Ligue 1",          flag: "🇫🇷", season: 2025 },
      { id: "2",      apiId: "2",      name: "Champions League", flag: "🌍", season: 2025 },
      { id: "253",    apiId: "253",    name: "MLS",              flag: "🇺🇸", season: 2025 },
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
          {[["🏆","World Cup 2026","All 104 FIFA World Cup matches"],["⚽","All Sports","Soccer, NBA, NFL, MLB, NHL, UFC"],["🔍","Real-Time Data","Live fixtures and real injury data"],["🤖","AI Analysis","Claude AI generates full betting context"],["💰","Value Bets","Top value picks across all leagues"],["📊","Confidence Score","AI rates each bet 0 to 100"]].map(([icon,title,desc],i) => (
            <div key={i} style={{ background: "white", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(0,50,200,0.06)" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 11, color: "#778", lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "white", borderRa

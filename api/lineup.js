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
  { id: "basketball", label: "Basketball", icon: "🏀", count: 8,  leagues: [{ id: "12",   apiId: "12",   name: "NBA",          flag: "🇺🇸", season: 2025 },{ id: "120",  apiId: "120",  name: "EuroLeague",   flag: "🇪🇺", season: 2025 }] },
  { id: "football",   label: "Am. Football", icon: "🏈", count: 6, leagues: [{ id: "1nfl", apiId: "1nfl", name: "NFL",          flag: "🇺🇸", season: 2025 },{ id: "2nfl", apiId: "2nfl", name: "NCAA Football", flag: "🇺🇸", season: 2025 }] },
  { id: "baseball",   label: "Baseball",     icon: "⚾", count: 12, leagues: [{ id: "1mlb", apiId: "1mlb", name: "MLB",          flag: "🇺🇸", season: 2025 }] },
  { id: "hockey",     label: "Hockey",       icon: "🏒", count: 5,  leagues: [{ id: "57",   apiId: "57",   name: "NHL",          flag: "🇺🇸", season: 2025 }] },
  { id: "tennis",     label: "Tennis",       icon: "🎾", count: 18, leagues: [{ id: "atp",  apiId: "atp",  name: "ATP Tour",     flag: "🌍", season: 2025 },{ id: "wta",  apiId: "wta",  name: "WTA Tour",     flag: "🌍", season: 2025 }] },
  { id: "mma",        label: "MMA / Boxing", icon: "🥊", count: 3,  leagues: [{ id: "ufc",  apiId: "ufc",  name: "UFC",          flag: "🌍", season: 2025 },{ id: "boxing", apiId: "boxing", name: "Boxing",     flag: "🌍", season: 2025 }] },
  { id: "golf",       label: "Golf",         icon: "⛳", count: 2,  leagues: [{ id: "pga",  apiId: "pga",  name: "PGA Tour",     flag: "🇺🇸", season: 2025 }] },
];

const ANALYSIS_TYPES = [
  { id: "full",        label: "Full Context",   icon: "📊" },
  { id: "h2h",         label: "Head to Head",   icon: "⚔️" },
  { id: "form",        label: "Recent Form",    icon: "📈" },
  { id: "injuries",    label: "Injuries",       icon: "🏥" },
  { id: "value",       label: "Value Bets",     icon: "💰" },
  { id: "predictions", label: "AI Predictions", icon: "🤖" },
];

function getConfColor(c) {
  if (c >= 75) return "#0057ff";
  if (c >= 60) return "#0088cc";
  return "#88aacc";
}

function TeamLogo({ logo, name, size = 36 }) {
  const [err, setErr] = useState(false);
  if (err || !logo) return <div style={{ width: size, height: size, borderRadius: size/4, background: "#eef3ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size*0.4, flexShrink: 0 }}>⚽</div>;
  return <img src={logo} alt={name} width={size} height={size} onError={() => setErr(true)} style={{ objectFit: "contain", borderRadius: size/4, flexShrink: 0 }} />;
}

function ResultBadge({ result }) {
  const c = { W: { bg: "#e8f8ee", color: "#00aa44" }, L: { bg: "#fee8e8", color: "#ff4444" }, D: { bg: "#fff8e8", color: "#ff9900" } }[result] || { bg: "#fff8e8", color: "#ff9900" };
  return <div style={{ width: 22, height: 22, borderRadius: 5, background: c.bg, color: c.color, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{result}</div>;
}

// ── FORMATION PITCH ──────────────────────────────────────────────────────────
function FormationPitch({ teamData, side = "home" }) {
  if (!teamData?.players?.length) return null;

  const isHome = side === "home";
  const teamColor = teamData.color || (isHome ? "#0057ff" : "#cc0000");

  // Group players by row
  const byRow = {};
  for (const p of teamData.players) {
    const r = p.row ?? 0;
    if (!byRow[r]) byRow[r] = [];
    byRow[r].push(p);
  }

  // Sort rows: row 0 = GK. For home team show GK at bottom (attacking up).
  // We always render GK at bottom, forwards at top regardless of home/away.
  const sortedRowKeys = Object.keys(byRow)
    .map(Number)
    .sort((a, b) => a - b); // 0=GK, 1=DEF, 2=MID, 3=FWD

  // Reverse so GK is at bottom of the visual
  const renderRows = [...sortedRowKeys].reverse();

  return (
    <div style={{ background: "#2a7a3a", borderRadius: 14, overflow: "hidden", padding: "10px 8px 8px" }}>
      {/* Pitch lines SVG */}
      <svg style={{ display: "block", width: "100%", height: 28, marginBottom: 4 }} viewBox="0 0 300 28">
        <rect x="80" y="2" width="140" height="24" rx="2" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="1.5"/>
        <rect x="110" y="2" width="80" height="12" rx="1" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="1"/>
        <line x1="150" y1="2" x2="150" y2="26" stroke="rgba(255,255,255,.2)" strokeWidth="1" strokeDasharray="3,3"/>
      </svg>

      {/* Formation label */}
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: "white", background: "rgba(0,0,0,.25)", padding: "2px 12px", borderRadius: 10 }}>
          {teamData.team} · {teamData.formation}
        </span>
      </div>

      {/* Player rows — forwards at top, GK at bottom */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 4px" }}>
        {renderRows.map((rowKey) => {
          const players = [...(byRow[rowKey] || [])].sort((a, b) => (a.col ?? 0) - (b.col ?? 0));
          const isGK = rowKey === 0;
          return (
            <div key={rowKey} style={{ display: "flex", justifyContent: "space-evenly", alignItems: "center" }}>
              {players.map((p, pi) => (
                <div key={pi} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: `${Math.floor(90 / Math.max(players.length, 1))}%`, maxWidth: 60 }}>
                  <div style={{
                    width: isGK ? 34 : 30,
                    height: isGK ? 34 : 30,
                    borderRadius: "50%",
                    background: isGK ? "rgba(255,200,0,.9)" : teamColor,
                    border: "2px solid rgba(255,255,255,.8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: isGK ? 11 : 10,
                    fontWeight: 800,
                    color: "white",
                    boxShadow: "0 2px 6px rgba(0,0,0,.4)",
                    flexShrink: 0,
                  }}>
                    {p.jersey || (pi + 1)}
                  </div>
                  <div style={{ fontSize: 8, color: "white", fontWeight: 700, marginTop: 3, textAlign: "center", textShadow: "0 1px 3px rgba(0,0,0,.9)", lineHeight: 1.2, maxWidth: 52, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name.split(" ").pop()}
                  </div>
                  <div style={{ fontSize: 7, color: "rgba(255,255,255,.65)", lineHeight: 1 }}>{p.position}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Bottom pitch line */}
      <svg style={{ display: "block", width: "100%", height: 28, marginTop: 4 }} viewBox="0 0 300 28">
        <rect x="80" y="2" width="140" height="24" rx="2" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="1.5"/>
        <rect x="110" y="14" width="80" height="12" rx="1" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="1"/>
      </svg>

      {teamData.manager && (
        <div style={{ textAlign: "center", marginTop: 4 }}>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,.55)" }}>🧑‍💼 {teamData.manager}</span>
        </div>
      )}
    </div>
  );
}

// ── LINEUP SECTION ────────────────────────────────────────────────────────────
function LineupSection({ match, league }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTeam, setActiveTeam] = useState("both");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ home: match.home, away: match.away, date: match.date || "", competition: league?.name || "" });
        const res = await fetch(`${API_BASE}/lineup?${params}`);
        const d = await res.json();
        setData(d.error ? null : d);
      } catch { setData(null); }
      setLoading(false);
    }
    load();
  }, [match.home, match.away]);

  if (loading) return (
    <div style={{ textAlign: "center", padding: "50px 20px", color: "#889" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🔎</div>
      <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 18, fontWeight: 700, color: "#0a0f1e", marginBottom: 6 }}>Predicting Lineups</div>
      <div style={{ fontSize: 12 }}>Searching latest team news and injuries...</div>
    </div>
  );

  if (!data) return (
    <div style={{ textAlign: "center", padding: "50px 20px", color: "#889" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🔮</div>
      <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 18, fontWeight: 700, color: "#0a0f1e", marginBottom: 6 }}>Lineup Not Available</div>
      <div style={{ fontSize: 12 }}>Could not generate predicted lineup for this match.</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[["both", "Both Teams"], ["home", match.home], ["away", match.away]].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTeam(id)} style={{ fontSize: 10, fontWeight: 700, padding: "7px 12px", borderRadius: 8, cursor: "pointer", border: "1.5px solid", borderColor: activeTeam === id ? "#0057ff" : "#e0e8ff", background: activeTeam === id ? "#eef3ff" : "white", color: activeTeam === id ? "#0057ff" : "#556", whiteSpace: "nowrap", flex: id === "both" ? "none" : 1, transition: "all .18s" }}>
            {label}
          </button>
        ))}
      </div>

      {(activeTeam === "both" || activeTeam === "home") && data.home && (
        <div style={{ marginBottom: 16 }}><FormationPitch teamData={data.home} side="home" /></div>
      )}
      {(activeTeam === "both" || activeTeam === "away") && data.away && (
        <div style={{ marginBottom: 16 }}><FormationPitch teamData={data.away} side="away" /></div>
      )}

      {/* Bench */}
      {(activeTeam === "home" || activeTeam === "both") && data.home?.bench?.length > 0 && (
        <div style={{ background: "white", borderRadius: 14, padding: 14, marginBottom: 12, boxShadow: "0 2px 12px rgba(0,50,200,.05)" }}>
          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 16, fontWeight: 700, marginBottom: 10 }}>🪑 {data.home.team} Bench</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {data.home.bench.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f5f7ff", borderRadius: 8, padding: "5px 10px" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: data.home.color || "#0057ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "white", flexShrink: 0 }}>{p.jersey}</div>
                <div><div style={{ fontSize: 11, fontWeight: 700 }}>{p.name}</div><div style={{ fontSize: 9, color: "#889" }}>{p.position}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
      {(activeTeam === "away" || activeTeam === "both") && data.away?.bench?.length > 0 && (
        <div style={{ background: "white", borderRadius: 14, padding: 14, marginBottom: 12, boxShadow: "0 2px 12px rgba(0,50,200,.05)" }}>
          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 16, fontWeight: 700, marginBottom: 10 }}>🪑 {data.away.team} Bench</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {data.away.bench.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f5f7ff", borderRadius: 8, padding: "5px 10px" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: data.away.color || "#cc0000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "white", flexShrink: 0 }}>{p.jersey}</div>
                <div><div style={{ fontSize: 11, fontWeight: 700 }}>{p.name}</div><div style={{ fontSize: 9, color: "#889" }}>{p.position}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(data.home?.keyAbsences?.length > 0 || data.away?.keyAbsences?.length > 0) && (
        <div style={{ background: "#fff8f8", border: "1px solid #ffd0d0", borderRadius: 14, padding: 14, marginBottom: 12 }}>
          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 16, fontWeight: 700, marginBottom: 10, color: "#cc3344" }}>⚠️ Key Absences</div>
          {data.home?.keyAbsences?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#889", marginBottom: 4 }}>{data.home.team}</div>
              {data.home.keyAbsences.map((a, i) => <div key={i} style={{ fontSize: 12, color: "#774444", marginBottom: 3 }}>• {a}</div>)}
            </div>
          )}
          {data.away?.keyAbsences?.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#889", marginBottom: 4 }}>{data.away.team}</div>
              {data.away.keyAbsences.map((a, i) => <div key={i} style={{ fontSize: 12, color: "#774444", marginBottom: 3 }}>• {a}</div>)}
            </div>
          )}
        </div>
      )}

      <div style={{ fontSize: 10, color: "#aab", textAlign: "center", lineHeight: 1.6 }}>
        Predicted lineups based on recent team news. Subject to change.
      </div>
    </div>
  );
}

// ── MATCH DETAIL MODAL ────────────────────────────────────────────────────────
function MatchDetailModal({ game, leagueSlug, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      // If game has a real ESPN numeric ID, try ESPN first
      const isRealId = game.id && /^\d{6,}$/.test(String(game.id));

      if (isRealId) {
        try {
          const res = await fetch(`${API_BASE}/h2h?eventId=${game.id}&leagueSlug=${leagueSlug || "fifa.world"}`);
          const data = await res.json();
          if (data && !data.error && (data.timeline?.length > 0 || data.homeScore !== undefined)) {
            setDetail({ source: "espn", ...data });
            setLoading(false);
            return;
          }
        } catch {}
      }

      // Fall back to AI search for match details
      try {
        const matchDesc = `${game.homeTeam} vs ${game.awayTeam} ${game.date} ${game.competition || ""}`;
        const res = await fetch(`${API_BASE}/matchdetail?match=${encodeURIComponent(matchDesc)}&home=${encodeURIComponent(game.homeTeam)}&away=${encodeURIComponent(game.awayTeam)}&homeScore=${game.homeScore}&awayScore=${game.awayScore}`);
        const data = await res.json();
        if (data && !data.error) {
          setDetail({ source: "ai", ...data });
          setLoading(false);
          return;
        }
      } catch {}

      setDetail(null);
      setLoading(false);
    }
    load();
  }, [game.id]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,30,.65)", zIndex: 200, display: "flex", alignItems: "flex-end", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxHeight: "88vh", overflow: "hidden", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0" }}>
          <div style={{ width: 36, height: 4, background: "#e0e4f0", borderRadius: 2 }} />
        </div>
        {/* Header */}
        <div style={{ padding: "10px 16px 12px", borderBottom: "1px solid #f0f2ff" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: "#889", fontWeight: 600 }}>{game.date}{game.competition ? ` · ${game.competition}` : ""}</div>
            <button onClick={onClose} style={{ background: "#f0f4ff", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 14, color: "#0057ff", fontWeight: 700 }}>✕</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
              <TeamLogo logo={game.homeLogo} name={game.homeTeam} size={28} />
              <span style={{ fontSize: 13, fontWeight: 800 }}>{game.homeTeam}</span>
            </div>
            <div style={{ textAlign: "center", padding: "4px 14px", background: "#0057ff", borderRadius: 10, margin: "0 8px", flexShrink: 0 }}>
              <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 26, fontWeight: 800, color: "white", letterSpacing: 2 }}>{game.homeScore} - {game.awayScore}</span>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
              <span style={{ fontSize: 13, fontWeight: 800, textAlign: "right" }}>{game.awayTeam}</span>
              <TeamLogo logo={game.awayLogo} name={game.awayTeam} size={28} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ overflowY: "auto", flex: 1, padding: "16px" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#889" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⚽</div>
              <div style={{ fontSize: 13 }}>Loading match details...</div>
            </div>
          )}

          {!loading && !detail && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#889" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
              <div style={{ fontSize: 13 }}>Match details not available.</div>
            </div>
          )}

          {!loading && detail && (
            <>
              {detail.venue && (
                <div style={{ fontSize: 11, color: "#889", textAlign: "center", marginBottom: 16 }}>📍 {detail.venue}{detail.attendance ? ` · 👥 ${Number(detail.attendance).toLocaleString()}` : ""}</div>
              )}

              {/* Goals timeline */}
              {detail.goals?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 16, fontWeight: 700, marginBottom: 14 }}>⚽ Goals</div>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "#e8eeff", transform: "translateX(-50%)" }} />
                    {detail.goals.map((g, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
                        {g.isHome ? (
                          <>
                            <div style={{ flex: 1, textAlign: "right", paddingRight: 14 }}>
                              <div style={{ fontSize: 12, fontWeight: 800 }}>{g.scorer}</div>
                              {g.assist && <div style={{ fontSize: 10, color: "#889" }}>Assist: {g.assist}</div>}
                              {g.type && g.type !== "Goal" && <div style={{ fontSize: 9, color: "#0057ff", fontWeight: 600 }}>{g.type}</div>}
                              <div style={{ fontSize: 11, color: "#0057ff", fontWeight: 700, marginTop: 1 }}>{g.homeScore} - {g.awayScore}</div>
                            </div>
                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#0047dd,#0099ff)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1, boxShadow: "0 2px 8px rgba(0,87,255,.35)" }}>
                              <span style={{ fontSize: 9, fontWeight: 800, color: "white" }}>{g.minute}</span>
                            </div>
                            <div style={{ flex: 1, paddingLeft: 14 }} />
                          </>
                        ) : (
                          <>
                            <div style={{ flex: 1, paddingRight: 14 }} />
                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#cc0000,#ff4444)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1, boxShadow: "0 2px 8px rgba(255,68,68,.35)" }}>
                              <span style={{ fontSize: 9, fontWeight: 800, color: "white" }}>{g.minute}</span>
                            </div>
                            <div style={{ flex: 1, paddingLeft: 14 }}>
                              <div style={{ fontSize: 12, fontWeight: 800 }}>{g.scorer}</div>
                              {g.assist && <div style={{ fontSize: 10, color: "#889" }}>Assist: {g.assist}</div>}
                              {g.type && g.type !== "Goal" && <div style={{ fontSize: 9, color: "#ff4444", fontWeight: 600 }}>{g.type}</div>}
                              <div style={{ fontSize: 11, color: "#ff4444", fontWeight: 700, marginTop: 1 }}>{g.homeScore} - {g.awayScore}</div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cards */}
              {detail.cards?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 16, fontWeight: 700, marginBottom: 10 }}>🟨 Cards</div>
                  {detail.cards.map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid #f5f7ff" }}>
                      <div style={{ width: 14, height: 18, background: c.type === "Red" ? "#ff3333" : "#ffcc00", borderRadius: 2, flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{c.player}</span>
                        <span style={{ fontSize: 10, color: "#889", marginLeft: 6 }}>{c.team}</span>
                      </div>
                      <span style={{ fontSize: 11, color: "#889", fontWeight: 600 }}>{c.minute}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Substitutions */}
              {detail.substitutions?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 16, fontWeight: 700, marginBottom: 10 }}>🔄 Substitutions</div>
                  {detail.substitutions.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f5f7ff" }}>
                      <div style={{ flexShrink: 0, fontSize: 12 }}>🔄</div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 11, color: "#00aa44", fontWeight: 700 }}>↑ {s.playerIn}</span>
                        <span style={{ fontSize: 11, color: "#ff4444", fontWeight: 600 }}> ↓ {s.playerOut}</span>
                        <span style={{ fontSize: 10, color: "#889", marginLeft: 4 }}>· {s.team}</span>
                      </div>
                      <span style={{ fontSize: 11, color: "#889", fontWeight: 600 }}>{s.minute}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Lineups */}
              {(detail.homeLineup?.length > 0 || detail.awayLineup?.length > 0) && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 16, fontWeight: 700, marginBottom: 12 }}>👕 Lineups</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {/* Home */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#0057ff", marginBottom: 6 }}>{detail.home}</div>
                      {(detail.homeLineup || []).map((p, i) => (
                        <div key={i} style={{ fontSize: 11, padding: "3px 0", borderBottom: "1px solid #f5f7ff", display: "flex", gap: 4 }}>
                          <span style={{ color: "#aab", minWidth: 18, fontSize: 10 }}>{p.jersey}</span>
                          <span style={{ fontWeight: p.starter ? 700 : 400, color: p.starter ? "#0a0f1e" : "#778" }}>{p.name}</span>
                        </div>
                      ))}
                    </div>
                    {/* Away */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#cc0000", marginBottom: 6 }}>{detail.away}</div>
                      {(detail.awayLineup || []).map((p, i) => (
                        <div key={i} style={{ fontSize: 11, padding: "3px 0", borderBottom: "1px solid #f5f7ff", display: "flex", gap: 4 }}>
                          <span style={{ color: "#aab", minWidth: 18, fontSize: 10 }}>{p.jersey}</span>
                          <span style={{ fontWeight: p.starter ? 700 : 400, color: p.starter ? "#0a0f1e" : "#778" }}>{p.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Stats */}
              {detail.stats?.length > 0 && (
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 16, fontWeight: 700, marginBottom: 12 }}>📊 Match Stats</div>
                  {detail.stats.map((s, i) => {
                    const hNum = parseFloat(s.home) || 0;
                    const aNum = parseFloat(s.away) || 0;
                    const total = hNum + aNum || 1;
                    return (
                      <div key={i} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#0057ff" }}>{s.home}</span>
                          <span style={{ fontSize: 10, color: "#889" }}>{s.label}</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#cc0000" }}>{s.away}</span>
                        </div>
                        <div style={{ display: "flex", height: 5, borderRadius: 3, overflow: "hidden", background: "#f0f2ff" }}>
                          <div style={{ width: `${(hNum/total)*100}%`, background: "linear-gradient(90deg,#0047dd,#0088ff)" }} />
                          <div style={{ flex: 1, background: "linear-gradient(90deg,#ff4444,#cc0000)" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* No content fallback */}
              {!detail.goals?.length && !detail.cards?.length && !detail.substitutions?.length && !detail.homeLineup?.length && !detail.stats?.length && (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#889", fontSize: 12 }}>
                  No detailed match data available for this game.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── H2H SECTION ───────────────────────────────────────────────────────────────
function H2HSection({ match, leagueSlug }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("h2h");
  const [homeFilter, setHomeFilter] = useState("all");
  const [awayFilter, setAwayFilter] = useState("all");
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/h2h?home=${encodeURIComponent(match.home)}&away=${encodeURIComponent(match.away)}&leagueSlug=${leagueSlug || "fifa.world"}`);
        const d = await res.json();
        setData(d);
      } catch { setData(null); }
      setLoading(false);
    }
    if (match.home && match.away) load();
    else { setData(null); setLoading(false); }
  }, [match.home, match.away]);

  if (loading) return (
    <div style={{ textAlign: "center", padding: "50px 20px", color: "#889" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚔️</div>
      <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 18, fontWeight: 700, color: "#0a0f1e", marginBottom: 6 }}>Loading H2H Data</div>
      <div style={{ fontSize: 12 }}>Searching recent match history...</div>
    </div>
  );

  if (!data || (!data.homeForm?.length && !data.awayForm?.length && !data.h2h?.length)) return (
    <div style={{ textAlign: "center", padding: "50px 20px", color: "#889" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚔️</div>
      <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 18, fontWeight: 700, color: "#0a0f1e", marginBottom: 6 }}>No H2H Data Found</div>
      <div style={{ fontSize: 12 }}>Could not find recent match history for these teams.</div>
    </div>
  );

  const filterGames = (games, f) => f === "home" ? games.filter(g => g.isHome) : f === "away" ? games.filter(g => !g.isHome) : games;
  const homeGames = filterGames(data.homeForm || [], homeFilter);
  const awayGames = filterGames(data.awayForm || [], awayFilter);
  const h2hGames = data.h2h || [];

  function StatsSummary({ games }) {
    const w = games.filter(g => g.result === "W").length;
    const d = games.filter(g => g.result === "D").length;
    const l = games.filter(g => g.result === "L").length;
    if (!games.length) return null;
    return (
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[["W", w, "#e8f8ee", "#00aa44"], ["D", d, "#fff8e8", "#ff9900"], ["L", l, "#fee8e8", "#ff4444"]].map(([label, count, bg, color]) => (
          <div key={label} style={{ flex: 1, background: bg, borderRadius: 10, padding: "10px 0", textAlign: "center" }}>
            <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 24, fontWeight: 800, color }}>{count}</div>
            <div style={{ fontSize: 9, color, fontWeight: 700 }}>{label}</div>
          </div>
        ))}
      </div>
    );
  }

  function GameRow({ game }) {
    return (
      <div onClick={() => setSelectedGame(game)}
        style={{ background: "white", borderRadius: 12, padding: "11px 12px", marginBottom: 8, boxShadow: "0 1px 8px rgba(0,50,200,.05)", cursor: "pointer", border: "1.5px solid #f0f2ff", transition: "border-color .15s" }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "#0057ff"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "#f0f2ff"}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ResultBadge result={game.result} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3, flexWrap: "wrap" }}>
              <TeamLogo logo={game.homeLogo} name={game.homeTeam} size={16} />
              <span style={{ fontSize: 12, fontWeight: 700 }}>{game.homeTeam}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#0057ff", margin: "0 3px" }}>{game.homeScore} - {game.awayScore}</span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{game.awayTeam}</span>
              <TeamLogo logo={game.awayLogo} name={game.awayTeam} size={16} />
            </div>
            <div style={{ fontSize: 10, color: "#aab" }}>{game.date} · {game.isHome ? "Home" : "Away"} · {game.competition}</div>
          </div>
          <div style={{ fontSize: 14, color: "#ccd", flexShrink: 0 }}>›</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {selectedGame && <MatchDetailModal game={selectedGame} leagueSlug={leagueSlug} onClose={() => setSelectedGame(null)} />}

      {activeTab === "h2h" && h2hGames.length > 0 && (
        <div style={{ background: "white", borderRadius: 14, padding: 14, marginBottom: 12, boxShadow: "0 2px 12px rgba(0,50,200,.05)" }}>
          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Head to Head Summary</div>
          <div style={{ display: "flex", gap: 8 }}>
            {(() => {
              const hw = h2hGames.filter(g => (g.homeTeam === match.home && parseInt(g.homeScore) > parseInt(g.awayScore)) || (g.awayTeam === match.home && parseInt(g.awayScore) > parseInt(g.homeScore))).length;
              const aw = h2hGames.filter(g => (g.homeTeam === match.away && parseInt(g.homeScore) > parseInt(g.awayScore)) || (g.awayTeam === match.away && parseInt(g.awayScore) > parseInt(g.homeScore))).length;
              const draws = h2hGames.filter(g => parseInt(g.homeScore || 0) === parseInt(g.awayScore || 0)).length;
              return [[match.home, hw, "#eef3ff", "#0057ff"], ["Draws", draws, "#fff8e8", "#ff9900"], [match.away, aw, "#f5eeff", "#7722ff"]].map(([label, count, bg, color]) => (
                <div key={label} style={{ flex: 1, background: bg, borderRadius: 10, padding: "10px 4px", textAlign: "center" }}>
                  <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 22, fontWeight: 800, color }}>{count}</div>
                  <div style={{ fontSize: 9, color: "#889", fontWeight: 600, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
        {[["h2h", "⚔️ H2H"], ["home", `🔵 ${match.home}`], ["away", `🔴 ${match.away}`]].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ fontSize: 11, fontWeight: 700, padding: "8px 14px", borderRadius: 8, cursor: "pointer", border: "1.5px solid", borderColor: activeTab === tab ? "#0057ff" : "#e0e8ff", background: activeTab === tab ? "#eef3ff" : "white", color: activeTab === tab ? "#0057ff" : "#556", whiteSpace: "nowrap", transition: "all .18s", flexShrink: 0 }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === "h2h" && (h2hGames.length > 0 ? h2hGames.map((g, i) => <GameRow key={i} game={g} />) : <div style={{ textAlign: "center", padding: "30px 20px", color: "#889", fontSize: 12 }}>No recent H2H meetings found.</div>)}
      {activeTab === "home" && (<><div style={{ display: "flex", gap: 6, marginBottom: 12 }}>{[["all", "All"], ["home", "Home"], ["away", "Away"]].map(([f, label]) => (<button key={f} onClick={() => setHomeFilter(f)} style={{ fontSize: 10, fontWeight: 700, padding: "5px 12px", borderRadius: 6, cursor: "pointer", border: "1.5px solid", borderColor: homeFilter === f ? "#0057ff" : "#e0e8ff", background: homeFilter === f ? "#eef3ff" : "white", color: homeFilter === f ? "#0057ff" : "#556" }}>{label}</button>))}</div><StatsSummary games={homeGames} />{homeGames.length > 0 ? homeGames.map((g, i) => <GameRow key={i} game={g} />) : <div style={{ textAlign: "center", padding: "30px 20px", color: "#889", fontSize: 12 }}>No results for this filter.</div>}</>)}
      {activeTab === "away" && (<><div style={{ display: "flex", gap: 6, marginBottom: 12 }}>{[["all", "All"], ["home", "Home"], ["away", "Away"]].map(([f, label]) => (<button key={f} onClick={() => setAwayFilter(f)} style={{ fontSize: 10, fontWeight: 700, padding: "5px 12px", borderRadius: 6, cursor: "pointer", border: "1.5px solid", borderColor: awayFilter === f ? "#0057ff" : "#e0e8ff", background: awayFilter === f ? "#eef3ff" : "white", color: awayFilter === f ? "#0057ff" : "#556" }}>{label}</button>))}</div><StatsSummary games={awayGames} />{awayGames.length > 0 ? awayGames.map((g, i) => <GameRow key={i} game={g} />) : <div style={{ textAlign: "center", padding: "30px 20px", color: "#889", fontSize: 12 }}>No results for this filter.</div>}</>)}
    </>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function ReleyzApp() {
  const [isSubscribed, setIsSubscribed]         = useState(true);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [userToken, setUserToken]               = useState("test");
  const [drawerOpen, setDrawerOpen]             = useState(false);
  const [activeSport, setActiveSport]           = useState(SPORTS[0]);
  const [expandedSport, setExpandedSport]       = useState("soccer");
  const [activeLeague, setActiveLeague]         = useState(SPORTS[0].leagues[0]);
  const [matches, setMatches]                   = useState([]);
  const [loadingMatches, setLoadingMatches]     = useState(false);
  const [matchError, setMatchError]             = useState(null);
  const [offSeason, setOffSeason]               = useState(null);
  const [noFixturesMsg, setNoFixturesMsg]       = useState(null);
  const [selectedMatch, setSelectedMatch]       = useState(null);
  const [activeAnalysis, setActiveAnalysis]     = useState(["full"]);
  const [activePage, setActivePage]             = useState("matches");
  const [loadingAnalysis, setLoadingAnalysis]   = useState(false);
  const [analysisResult, setAnalysisResult]     = useState(null);
  const [analysisTab, setAnalysisTab]           = useState("overview");
  const [loadingMsg, setLoadingMsg]             = useState("");
  const [valueHistory, setValueHistory]         = useState([]);
  const analysisRef = useRef(null);

  useEffect(() => { if (activeLeague) fetchMatches(activeLeague); }, [activeLeague]);

  const handleSubscribe = async () => {
    setSubscribeLoading(true);
    try {
      const res = await fetch(`${API_BASE}/subscribe`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: `user_${Date.now()}` }) });
      const data = await res.json();
      if (data.url) window.location.href = data.url; else throw new Error(data.error || "Failed");
    } catch { alert("Could not start checkout."); }
    setSubscribeLoading(false);
  };

  const fetchMatches = async (league) => {
    setLoadingMatches(true); setMatches([]); setMatchError(null); setOffSeason(null); setNoFixturesMsg(null); setSelectedMatch(null); setAnalysisResult(null);
    try {
      const res = await fetch(`${API_BASE}/fixtures?leagueId=${league.apiId}`);
      const data = await res.json();
      if (data.offseason) setOffSeason(data.message);
      else if (data.noFixtures) setNoFixturesMsg(data.message);
      else if (data.matches?.length > 0) setMatches(data.matches);
      else setNoFixturesMsg("No upcoming fixtures right now. Check back soon.");
    } catch { setMatchError("Could not load fixtures."); }
    setLoadingMatches(false);
  };

  const handleLeagueSelect = (sport, league) => { setActiveSport(sport); setActiveLeague(league); setDrawerOpen(false); setActivePage("matches"); };
  const toggleAnalysis = (id) => { setActiveAnalysis(p => p.includes(id) ? (p.length > 1 ? p.filter(x => x !== id) : p) : [...p, id]); };

  const runAnalysis = async () => {
    if (!selectedMatch) return;
    setLoadingAnalysis(true); setAnalysisResult(null); setActivePage("analysis");
    const msgs = ["Searching recent form...", "Checking head-to-head history...", "Scanning injury reports...", "Analysing betting markets...", "Building full context report..."];
    let mi = 0; setLoadingMsg(msgs[0]);
    const interval = setInterval(() => { mi = (mi + 1) % msgs.length; setLoadingMsg(msgs[mi]); }, 2200);
    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${userToken}` },
        body: JSON.stringify({ match: selectedMatch, league: activeLeague, sport: activeSport, analysisTypes: activeAnalysis }),
      });
      const data = await res.json();
      clearInterval(interval);
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setAnalysisResult(data); setAnalysisTab("overview");
      if (data.bettingAngles) {
        const newBets = data.bettingAngles.map(a => ({ match: selectedMatch.home + " vs " + selectedMatch.away, league: activeLeague.name + " " + activeSport.icon, pick: a.pick, reasoning: a.reasoning, conf: data.confidenceScore || 70, value: a.value || "Good", risk: a.risk || "Medium" }));
        setValueHistory(prev => [...newBets, ...prev].slice(0, 20));
      }
      setTimeout(() => analysisRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) { clearInterval(interval); setAnalysisResult({ error: err.message || "Analysis failed." }); }
    setLoadingAnalysis(false);
  };

  const rc = r => r === "Low" ? "#00aa44" : r === "Medium" ? "#ff9900" : "#ff4444";
  const isWC = activeLeague.id === "wc2026";

  const Paywall = () => (
    <div style={{ minHeight: "100vh", background: "#f2f6ff", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Barlow+Condensed:wght@500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <div style={{ background: "white", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eaedff" }}>
        <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 26, fontWeight: 800 }}>Rel<span style={{ color: "#0057ff" }}>eyz</span></div>
        <div style={{ background: "#eef3ff", color: "#0057ff", fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>AI POWERED</div>
      </div>
      <div style={{ background: "linear-gradient(135deg,#0047dd,#0088ee,#00aaff)", padding: "48px 24px 56px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: "rgba(255,255,255,.6)", marginBottom: 12 }}>SPORTS BETTING INTELLIGENCE</div>
          <h1 style={{ fontFamily: "'Barlow Condensed'", fontSize: 44, fontWeight: 800, color: "white", lineHeight: 1.1, marginBottom: 12 }}>Bet Smarter.<br />Win More.</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.75)", lineHeight: 1.8, maxWidth: 300, margin: "0 auto" }}>Full AI analysis on every match across all major sports.</p>
        </div>
      </div>
      <div style={{ padding: "28px 20px 0", flex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          {[["🏆","World Cup 2026","All 104 FIFA matches"],["⚽","All Sports","Soccer, NBA, NFL, MLB, NHL"],["🔍","Real-Time Data","Live fixtures and results"],["🤖","AI Analysis","Full betting context"],["⚔️","H2H Stats","Full head to head history"],["📊","Confidence Score","AI rates each bet 0-100"]].map(([icon,title,desc],i) => (
            <div key={i} style={{ background: "white", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(0,50,200,.06)" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 11, color: "#778", lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "white", borderRadius: 24, padding: 24, border: "2px solid #0057ff", boxShadow: "0 8px 32px rgba(0,87,255,.12)", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#0057ff", marginBottom: 4 }}>RELEYZ PRO</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 48, fontWeight: 800, color: "#0a0f1e", lineHeight: 1 }}>$9</span>
                <span style={{ fontSize: 13, color: "#889" }}>/month</span>
              </div>
            </div>
            <div style={{ background: "#0057ff", color: "white", fontSize: 10, fontWeight: 800, padding: "6px 14px", borderRadius: 20 }}>FULL ACCESS</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {["All 104 World Cup 2026 matches","Unlimited AI analyses","Full H2H with match details","Predicted lineups with formations","Confidence scores and value ratings","Cancel anytime"].map((f,i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#334" }}>
                <div style={{ width: 20, height: 20, background: "#eef3ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#0057ff", fontSize: 11, flexShrink: 0 }}>✓</div>
                {f}
              </div>
            ))}
          </div>
          <button onClick={handleSubscribe} disabled={subscribeLoading} style={{ width: "100%", padding: "18px", background: subscribeLoading ? "#99b5ff" : "linear-gradient(135deg,#0047dd,#0099ff)", color: "white", border: "none", borderRadius: 14, fontFamily: "'Barlow Condensed'", fontSize: 22, fontWeight: 700, letterSpacing: 1, cursor: subscribeLoading ? "not-allowed" : "pointer", boxShadow: "0 8px 28px rgba(0,87,255,.28)" }}>
            {subscribeLoading ? "Loading..." : "GET STARTED — $9/month"}
          </button>
        </div>
        <div style={{ textAlign: "center", fontSize: 11, color: "#aab", lineHeight: 1.7, paddingBottom: 32 }}>Secured by Stripe · Cancel anytime<br />For entertainment only. Gamble responsibly.</div>
      </div>
    </div>
  );

  if (!isSubscribed) return <Paywall />;

  return (
    <div style={{ minHeight: "100vh", background: "#f2f6ff", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#0a0f1e" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Barlow+Condensed:wght@500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}::-webkit-scrollbar{width:0;height:0;}
        .drawer-overlay{position:fixed;inset:0;background:rgba(10,15,30,.45);z-index:100;opacity:0;pointer-events:none;transition:opacity .3s;backdrop-filter:blur(2px);}.drawer-overlay.open{opacity:1;pointer-events:all;}
        .drawer{position:fixed;top:0;left:0;bottom:0;width:280px;background:white;z-index:101;transform:translateX(-100%);transition:transform .32s cubic-bezier(.4,0,.2,1);box-shadow:4px 0 40px rgba(0,50,200,.12);display:flex;flex-direction:column;overflow:hidden;}.drawer.open{transform:translateX(0);}
        .drawer-header{background:linear-gradient(135deg,#0047dd 0%,#0099ff 100%);padding:48px 20px 20px;flex-shrink:0;}
        .drawer-logo{font-family:'Barlow Condensed';font-size:32px;font-weight:800;color:white;letter-spacing:1px;margin-bottom:4px;}
        .drawer-tagline{font-size:11px;color:rgba(255,255,255,.6);}
        .drawer-user{display:flex;align-items:center;gap:10px;margin-top:16px;background:rgba(255,255,255,.12);border-radius:12px;padding:10px 12px;}
        .drawer-avatar{width:32px;height:32px;background:rgba(255,255,255,.25);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;}
        .drawer-username{font-size:13px;font-weight:700;color:white;}.drawer-plan{font-size:10px;color:rgba(255,255,255,.6);}
        .drawer-scroll{flex:1;overflow-y:auto;padding:12px 0 80px;}
        .drawer-section-label{font-size:9px;font-weight:700;letter-spacing:2px;color:#aab;padding:12px 20px 6px;text-transform:uppercase;}
        .drawer-sport-row{display:flex;align-items:center;padding:10px 20px;cursor:pointer;transition:background .15s;}.drawer-sport-row:hover{background:#f5f8ff;}.drawer-sport-row.active{background:#eef3ff;}
        .drawer-sport-icon{font-size:20px;margin-right:12px;width:28px;text-align:center;}
        .drawer-sport-name{font-size:14px;font-weight:600;flex:1;color:#1a2040;}.drawer-sport-row.active .drawer-sport-name{color:#0057ff;}
        .drawer-sport-count{font-size:10px;font-weight:700;background:#eef3ff;color:#0057ff;padding:2px 8px;border-radius:10px;margin-right:8px;}
        .drawer-sport-chevron{font-size:10px;color:#aab;transition:transform .2s;}.drawer-sport-chevron.expanded{transform:rotate(90deg);}
        .drawer-leagues{overflow:hidden;transition:max-height .3s ease;background:#fafbff;}
        .drawer-league-row{display:flex;align-items:center;padding:9px 20px 9px 52px;cursor:pointer;transition:background .15s;}.drawer-league-row:hover{background:#f0f4ff;}.drawer-league-row.active{background:#eef3ff;}
        .drawer-league-flag{font-size:14px;margin-right:8px;}
        .drawer-league-name{font-size:13px;font-weight:500;color:#445;flex:1;}.drawer-league-row.active .drawer-league-name{color:#0057ff;font-weight:700;}
        .drawer-active-dot{width:6px;height:6px;border-radius:50%;background:#0057ff;}
        .drawer-footer{position:absolute;bottom:0;left:0;right:0;padding:12px 20px;background:white;border-top:1px solid #f0f2ff;display:flex;gap:8px;}
        .drawer-footer-btn{flex:1;padding:9px;background:#f0f4ff;border:none;border-radius:8px;font-family:'Plus Jakarta Sans';font-size:12px;font-weight:600;color:#0057ff;cursor:pointer;}
        .topbar{background:white;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eaedff;position:sticky;top:0;z-index:50;box-shadow:0 2px 12px rgba(0,50,200,.06);}
        .topbar-logo{font-family:'Barlow Condensed';font-size:26px;font-weight:800;color:#0a0f1e;letter-spacing:.5px;}.topbar-logo span{color:#0057ff;}
        .menu-btn{width:38px;height:38px;background:#f0f4ff;border:none;border-radius:11px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;padding:10px 9px;}
        .menu-line{width:18px;height:2px;background:#0057ff;border-radius:2px;}.menu-line.mid{width:13px;}
        .topbar-icon-btn{width:38px;height:38px;background:#f0f4ff;border:none;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;}
        .match-card{background:white;border-radius:18px;padding:16px;margin-bottom:10px;border:2px solid transparent;cursor:pointer;transition:all .22s;box-shadow:0 2px 14px rgba(0,50,200,.06);}.match-card:hover{box-shadow:0 6px 24px rgba(0,50,200,.11);transform:translateY(-1px);}.match-card.selected{border-color:#0057ff;box-shadow:0 6px 28px rgba(0,87,255,.18);}.match-card.wc.selected{border-color:#FFB800;}
        .analysis-chip{background:white;border:1.5px solid #e0e8ff;border-radius:10px;padding:10px 6px;text-align:center;cursor:pointer;transition:all .18s;}.analysis-chip.active{background:#eef3ff;border-color:#0057ff;}
        .run-btn{width:100%;padding:17px;background:linear-gradient(135deg,#0047dd,#0099ff);color:white;border:none;border-radius:14px;font-family:'Barlow Condensed';font-size:20px;font-weight:700;letter-spacing:1.5px;cursor:pointer;box-shadow:0 8px 28px rgba(0,87,255,.28);transition:all .2s;}.run-btn:hover:not(:disabled){transform:translateY(-2px);}.run-btn:disabled{background:linear-gradient(135deg,#c0ccee,#a0b8dd);cursor:not-allowed;box-shadow:none;}
        .bottom-nav{position:fixed;bottom:0;left:0;right:0;background:white;border-top:1px solid #eaedff;display:flex;padding:10px 0 22px;box-shadow:0 -4px 24px rgba(0,50,200,.08);z-index:50;}
        .nav-tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;padding:4px 0;}.nav-tab-icon{font-size:22px;}.nav-tab-label{font-size:9px;font-weight:700;color:#bbc;letter-spacing:.5px;text-transform:uppercase;}.nav-tab.active .nav-tab-label{color:#0057ff;}.nav-tab-line{width:20px;height:2px;border-radius:2px;background:transparent;}.nav-tab.active .nav-tab-line{background:#0057ff;}
        .section-card{background:white;border-radius:16px;padding:18px;margin-bottom:12px;box-shadow:0 2px 12px rgba(0,50,200,.05);}
        .atab{font-size:12px;font-weight:700;padding:8px 16px;border-radius:8px;cursor:pointer;border:1.5px solid #e0e8ff;background:white;color:#556;white-space:nowrap;transition:all .18s;}.atab.active{background:#eef3ff;border-color:#0057ff;color:#0057ff;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}.pulse{animation:pulse 1.4s ease-in-out infinite;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.fade-up{animation:fadeUp .35s ease forwards;}
        @keyframes spin{to{transform:rotate(360deg)}}.spinner{display:inline-block;width:12px;height:12px;border:2px solid #e0e8ff;border-top-color:#0057ff;border-radius:50%;animation:spin .7s linear infinite;vertical-align:middle;margin-right:8px;}
      `}</style>

      <div className={`drawer-overlay ${drawerOpen ? "open" : ""}`} onClick={() => setDrawerOpen(false)} />
      <div className={`drawer ${drawerOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <div className="drawer-logo">RELEYZ</div>
          <div className="drawer-tagline">AI Sports Betting Intelligence</div>
          <div className="drawer-user">
            <div className="drawer-avatar">⚡</div>
            <div><div className="drawer-username">Pro Member</div><div className="drawer-plan">Unlimited access · All sports</div></div>
          </div>
        </div>
        <div className="drawer-scroll">
          <div className="drawer-section-label">Featured</div>
          <div className={`drawer-league-row ${isWC ? "active" : ""}`} style={{ paddingLeft: 20, background: isWC ? "#fff8e6" : "#fffbf0", borderLeft: isWC ? "3px solid #FFB800" : "none" }} onClick={() => handleLeagueSelect(SPORTS[0], SPORTS[0].leagues[0])}>
            <div className="drawer-league-flag">🏆</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: "#cc8800" }}>FIFA World Cup 2026</div><div style={{ fontSize: 10, color: "#aaa" }}>USA · Canada · Mexico</div></div>
            {isWC && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFB800" }} />}
          </div>
          <div className="drawer-section-label">All Sports</div>
          {SPORTS.map(sport => (
            <div key={sport.id}>
              <div className={`drawer-sport-row ${activeSport.id === sport.id ? "active" : ""}`} onClick={() => setExpandedSport(expandedSport === sport.id ? null : sport.id)}>
                <div className="drawer-sport-icon">{sport.icon}</div>
                <div className="drawer-sport-name">{sport.label}</div>
                <div className="drawer-sport-count">{sport.count}</div>
                <div className={`drawer-sport-chevron ${expandedSport === sport.id ? "expanded" : ""}`}>▶</div>
              </div>
              <div className="drawer-leagues" style={{ maxHeight: expandedSport === sport.id ? `${sport.leagues.length * 42}px` : "0" }}>
                {sport.leagues.filter(l => l.id !== "wc2026").map(league => (
                  <div key={league.id} className={`drawer-league-row ${activeLeague.id === league.id ? "active" : ""}`} onClick={() => handleLeagueSelect(sport, league)}>
                    <div className="drawer-league-flag">{league.flag}</div>
                    <div className="drawer-league-name">{league.name}</div>
                    {activeLeague.id === league.id && <div className="drawer-active-dot" />}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="drawer-section-label" style={{ marginTop: 8 }}>Account</div>
          {["Settings", "Help and Support", "Terms and Privacy"].map((item, i) => (
            <div key={i} className="drawer-sport-row" onClick={() => setDrawerOpen(false)}><div className="drawer-sport-name">{item}</div></div>
          ))}
        </div>
        <div className="drawer-footer">
          <button className="drawer-footer-btn" onClick={() => setDrawerOpen(false)}>Close</button>
          <button className="drawer-footer-btn" onClick={() => { localStorage.removeItem("releyz_token"); setIsSubscribed(false); setDrawerOpen(false); }}>Sign Out</button>
        </div>
      </div>

      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="menu-btn" onClick={() => setDrawerOpen(true)}><div className="menu-line" /><div className="menu-line mid" /><div className="menu-line" /></button>
          <div className="topbar-logo">Rel<span>eyz</span></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="topbar-icon-btn">🔔</button>
          <button className="topbar-icon-btn">🔍</button>
        </div>
      </div>

      {activePage === "matches" && (
        <div style={{ paddingBottom: 90 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", background: "white", borderBottom: "1px solid #eaedff" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: isWC ? "#cc8800" : "#0057ff" }}>{isWC ? "🏆 World Cup 2026" : `${activeSport.icon} ${activeSport.label}`}</span>
            {!isWC && <><span style={{ fontSize: 10, color: "#ccd" }}>›</span><span style={{ fontSize: 12, fontWeight: 600, color: "#445" }}>{activeLeague.flag} {activeLeague.name}</span></>}
            <span style={{ marginLeft: "auto", fontSize: 11, color: isWC ? "#cc8800" : "#0057ff", fontWeight: 700, background: isWC ? "#fff8e6" : "#eef3ff", padding: "2px 10px", borderRadius: 10 }}>{matches.length} matches</span>
          </div>
          <div style={{ background: isWC ? "linear-gradient(135deg,#cc8800,#FFB800,#FFD700)" : "linear-gradient(135deg,#0047dd 0%,#0088ee 60%,#00aaff 100%)", padding: "20px 16px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2.5, color: "rgba(255,255,255,.7)", marginBottom: 8 }}>{isWC ? "FIFA WORLD CUP 2026 · USA · CANADA · MEXICO" : "AI MATCH INTELLIGENCE"}</div>
              <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 30, fontWeight: 800, color: "white", lineHeight: 1.1, marginBottom: 16 }}>{isWC ? "World Cup 2026" : activeLeague.name}<br />{isWC ? "104 Matches · 48 Teams" : "Upcoming Fixtures"}</div>
              <div style={{ display: "flex", gap: 10 }}>
                {(isWC ? [["104", "Matches"], ["48", "Teams"], ["AI", "Analysis"]] : [["Live", "Data"], ["AI", "Analysis"], [`${matches.length}`, "Matches"]]).map(([v, l], i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,.13)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 10, padding: "10px 14px" }}>
                    <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 22, fontWeight: 800, color: "white" }}>{v}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,.6)", marginTop: 1 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ padding: "16px 16px 8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 20, fontWeight: 700 }}>Fixtures</div>
              {loadingMatches && <span style={{ fontSize: 11, color: "#0057ff" }}><span className="spinner" />Loading...</span>}
            </div>
            {matchError && <div style={{ background: "#fff0f5", border: "1px solid #ffccd8", borderRadius: 12, padding: 14, color: "#cc3344", fontSize: 12, marginBottom: 12 }}>{matchError}</div>}
            {offSeason && <div style={{ textAlign: "center", padding: "40px 20px" }}><div style={{ fontSize: 40, marginBottom: 12 }}>🏈</div><div style={{ fontFamily: "'Barlow Condensed'", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Off Season</div><div style={{ fontSize: 13, color: "#889" }}>{offSeason}</div></div>}
            {noFixturesMsg && !offSeason && <div style={{ textAlign: "center", padding: "40px 20px" }}><div style={{ fontSize: 40, marginBottom: 12 }}>🏟</div><div style={{ fontFamily: "'Barlow Condensed'", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>No Upcoming Fixtures</div><div style={{ fontSize: 13, color: "#889" }}>{noFixturesMsg}</div></div>}
            {!loadingMatches && matches.length === 0 && !matchError && !offSeason && !noFixturesMsg && <div style={{ textAlign: "center", padding: "40px 20px", color: "#aab" }}><div style={{ fontSize: 32, marginBottom: 10 }}>🏟</div><div style={{ fontSize: 14, fontWeight: 700, color: "#334", marginBottom: 6 }}>No fixtures yet</div><div style={{ fontSize: 12 }}>Open the menu to select a league</div></div>}
            {matches.map((m, i) => (
              <div key={i} className={`match-card ${isWC ? "wc" : ""} ${selectedMatch === m ? "selected" : ""} fade-up`} style={{ animationDelay: `${i * 0.05}s` }} onClick={() => { setSelectedMatch(m); setAnalysisResult(null); }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: isWC ? "#cc8800" : "#0057ff", background: isWC ? "#fff8e6" : "#eef3ff", padding: "3px 9px", borderRadius: 5 }}>{isWC ? "🏆 FIFA WORLD CUP" : `${activeSport.icon} ${activeLeague.name}`}</div>
                  <div style={{ fontSize: 10, color: "#889" }}>📅 {m.date} · {m.time}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                    <TeamLogo logo={m.homeLogo} name={m.home} size={36} />
                    <div><div style={{ fontSize: 14, fontWeight: 800 }}>{m.home}</div><div style={{ fontSize: 9, color: "#aab" }}>Home</div></div>
                  </div>
                  <div style={{ padding: "0 8px", textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#ccd", letterSpacing: 1 }}>VS</div>
                    <div style={{ fontSize: 9, color: "#aab" }}>{m.time}</div>
                  </div>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                    <div style={{ textAlign: "right" }}><div style={{ fontSize: 14, fontWeight: 800 }}>{m.away}</div><div style={{ fontSize: 9, color: "#aab" }}>Away</div></div>
                    <TeamLogo logo={m.awayLogo} name={m.away} size={36} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: getConfColor(m.conf), minWidth: 28 }}>{m.conf}%</span>
                  <div style={{ flex: 1, height: 4, background: "#eef0f8", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${m.conf}%`, height: "100%", background: isWC ? "linear-gradient(90deg,#cc8800,#FFD700)" : "linear-gradient(90deg,#0047dd,#00aaff)", borderRadius: 2 }} />
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, background: isWC ? "#fff8e6" : "#f0f6ff", color: isWC ? "#cc8800" : "#0057ff", padding: "3px 9px", borderRadius: 5 }}>{m.verdict}</div>
                </div>
              </div>
            ))}
          </div>
          {selectedMatch && (
            <div style={{ padding: "0 16px 16px" }} className="fade-up">
              <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Analysis Scope</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                {ANALYSIS_TYPES.map(a => (
                  <div key={a.id} className={`analysis-chip ${activeAnalysis.includes(a.id) ? "active" : ""}`} onClick={() => toggleAnalysis(a.id)}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{a.icon}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: activeAnalysis.includes(a.id) ? "#0057ff" : "#445" }}>{a.label}</div>
                  </div>
                ))}
              </div>
              <button className="run-btn" disabled={loadingAnalysis} onClick={runAnalysis}>
                {loadingAnalysis ? <span className="pulse">ANALYZING...</span> : "RUN FULL ANALYSIS"}
              </button>
            </div>
          )}
        </div>
      )}

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
              {analysisResult.error}
              <div style={{ marginTop: 12 }}><button onClick={() => setActivePage("matches")} style={{ background: "#0057ff", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Back to Matches</button></div>
            </div>
          )}
          {analysisResult && !analysisResult.error && selectedMatch && (
            <>
              <div ref={analysisRef} style={{ background: isWC ? "linear-gradient(135deg,#cc8800,#FFB800)" : "linear-gradient(135deg,#0047dd,#0099ff)", borderRadius: 20, padding: 20, marginBottom: 16, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
                <div style={{ position: "relative" }}>
                  {isWC && <div style={{ fontSize: 9, color: "rgba(255,255,255,.8)", letterSpacing: 2, marginBottom: 4, fontWeight: 700 }}>🏆 FIFA WORLD CUP 2026</div>}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    {selectedMatch.homeLogo && <TeamLogo logo={selectedMatch.homeLogo} name={selectedMatch.home} size={28} />}
                    <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 20, fontWeight: 800, color: "white" }}>{selectedMatch.home} vs {selectedMatch.away}</div>
                    {selectedMatch.awayLogo && <TeamLogo logo={selectedMatch.awayLogo} name={selectedMatch.away} size={28} />}
                  </div>
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
                {[["overview", "📊 Overview"], ["h2h", "⚔️ Head to Head"], ["lineups", "👕 Lineups"]].map(([tab, label]) => (
                  <button key={tab} className={`atab ${analysisTab === tab ? "active" : ""}`} onClick={() => setAnalysisTab(tab)}>{label}</button>
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
                            <div key={j} style={{ background: "#f5f7ff", border: "1px solid #e8eeff", borderRadius: 8, padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 10, color: "#889" }}>{st.label}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, textAlign: "right", maxWidth: "60%" }}>{st.value}</span>
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
                  <div style={{ padding: "12px 14px", background: "#f5f7ff", borderRadius: 10, fontSize: 10, color: "#aab", lineHeight: 1.7, textAlign: "center" }}>
                    Releyz provides analytical context only. Not financial advice. Gamble responsibly.
                  </div>
                </>
              )}

              {analysisTab === "h2h" && <H2HSection match={selectedMatch} leagueSlug={activeLeague.slug || "fifa.world"} />}
              {analysisTab === "lineups" && <LineupSection match={selectedMatch} league={activeLeague} />}
            </>
          )}
          {!loadingAnalysis && !analysisResult && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#aab" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
              <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 22, fontWeight: 700, color: "#0a0f1e", marginBottom: 8 }}>No Analysis Yet</div>
              <div style={{ fontSize: 13, marginBottom: 20 }}>Select a match and run analysis first.</div>
              <button onClick={() => setActivePage("matches")} style={{ background: "#0057ff", color: "white", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Go to Matches</button>
            </div>
          )}
        </div>
      )}

      {activePage === "value" && (
        <div style={{ padding: "16px 16px 100px" }} className="fade-up">
          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Today's Value Bets</div>
          <div style={{ fontSize: 12, color: "#889", marginBottom: 16 }}>Betting angles from your recent analyses</div>
          {valueHistory.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
              <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 22, fontWeight: 700, color: "#0a0f1e", marginBottom: 8 }}>No Value Bets Yet</div>
              <div style={{ fontSize: 13, color: "#889", marginBottom: 24, lineHeight: 1.7 }}>Run an analysis on any match to populate value bets here.</div>
              <button onClick={() => setActivePage("matches")} style={{ background: "#0057ff", color: "white", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Browse Matches</button>
            </div>
          ) : valueHistory.map((item, i) => (
            <div key={i} style={{ background: "white", borderRadius: 18, padding: 16, marginBottom: 12, boxShadow: "0 2px 14px rgba(0,50,200,.06)", border: "2px solid #eef3ff" }}>
              <div style={{ display: "inline-flex", background: "linear-gradient(135deg,#0047dd,#0099ff)", color: "white", fontSize: 9, fontWeight: 800, padding: "3px 10px", borderRadius: 5, letterSpacing: 1, marginBottom: 10 }}>{item.value.toUpperCase()} VALUE</div>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{item.match}</div>
              <div style={{ fontSize: 11, color: "#889", marginBottom: 8 }}>{item.league}</div>
              <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 18, fontWeight: 700, color: "#0057ff", marginBottom: 10 }}>{item.pick}</div>
              <div style={{ fontSize: 12, color: "#556", marginBottom: 10, lineHeight: 1.6 }}>{item.reasoning}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 80, height: 4, background: "#eef0f8", borderRadius: 2, overflow: "hidden" }}><div style={{ width: `${item.conf}%`, height: "100%", background: "linear-gradient(90deg,#0047dd,#00aaff)", borderRadius: 2 }} /></div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#0057ff" }}>{item.conf}%</span>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: item.risk === "Low" ? "#e8f8ee" : item.risk === "Medium" ? "#fff8e8" : "#fee8e8", color: rc(item.risk) }}>{item.risk} Risk</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activePage === "profile" && (
        <div style={{ padding: "16px 16px 100px" }} className="fade-up">
          <div style={{ background: "linear-gradient(135deg,#0047dd,#0099ff)", borderRadius: 20, padding: 22, marginBottom: 16, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, background: "rgba(255,255,255,.2)", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 12px" }}>⚡</div>
            <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 24, fontWeight: 800, color: "white" }}>Pro Member</div>
            <div style={{ display: "inline-block", background: "rgba(255,255,255,.2)", border: "1px solid rgba(255,255,255,.3)", borderRadius: 20, padding: "4px 14px", fontSize: 11, fontWeight: 700, color: "white", marginTop: 6 }}>$9 / month - Unlimited</div>
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
          {[["Language", "English"], ["Notifications", "On"], ["Default Analysis", "Full Context"], ["Favourite Sport", "Soccer"], ["Privacy Policy", "View"], ["Help and Support", "Contact"]].map(([label, value], i) => (
            <div key={i} style={{ background: "white", borderRadius: 12, padding: "14px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 8px rgba(0,50,200,.04)", cursor: "pointer" }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
              <span style={{ fontSize: 12, color: "#0057ff", fontWeight: 600 }}>{value} ›</span>
            </div>
          ))}
          <button onClick={() => { localStorage.removeItem("releyz_token"); setIsSubscribed(false); }} style={{ width: "100%", marginTop: 8, padding: "14px", background: "white", border: "2px solid #ffcccc", borderRadius: 12, fontFamily: "'Plus Jakarta Sans'", fontSize: 13, fontWeight: 700, color: "#cc3344", cursor: "pointer" }}>Sign Out</button>
        </div>
      )}

      <div className="bottom-nav">
        {[{ id: "matches", icon: "⚽", label: "Matches" }, { id: "analysis", icon: "📊", label: "Analysis" }, { id: "value", icon: "💰", label: "Value" }, { id: "profile", icon: "👤", label: "Profile" }].map(tab => (
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

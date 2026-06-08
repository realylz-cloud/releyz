module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { leagueId } = req.query;
  if (!leagueId) return res.status(400).json({ error: "leagueId is required" });

  const KEY = process.env.API_SPORTS_KEY;
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const soccerSeason = month >= 8 ? year : year - 1;
  const americanSeason = month >= 9 ? year : year - 1;
  const today = now.toISOString().split("T")[0];
  const future3 = new Date(now); future3.setDate(now.getDate() + 3);
  const future14 = new Date(now); future14.setDate(now.getDate() + 14);
  const date3 = future3.toISOString().split("T")[0];
  const date14 = future14.toISOString().split("T")[0];

  try {

    // ── SOCCER (v3.football.api-sports.io) ──────────────────────────
    if (["39","140","78","135","61","2","253","wc2026"].includes(leagueId)) {
      const leagueNum = leagueId === "wc2026" ? "1" : leagueId;
      const season = leagueId === "wc2026" ? "2026" : leagueId === "253" ? year : soccerSeason;
      const next = leagueId === "wc2026" ? "20" : "10";
      const url = `https://v3.football.api-sports.io/fixtures?league=${leagueNum}&season=${season}&next=${next}`;
      const data = await apiCall(url, KEY);
      if (data && data.response && data.response.length > 0) {
        const matches = data.response
          .filter(f => f.fixture.status.short !== "CANC" && f.fixture.status.short !== "PST")
          .map((f, i) => ({
            id: f.fixture.id || i,
            home: f.teams.home.name,
            away: f.teams.away.name,
            date: fmtDate(f.fixture.date),
            time: fmtTime(f.fixture.date),
            venue: f.fixture.venue?.name || "TBD",
            status: f.fixture.status.long,
            conf: randConf(),
            verdict: "Analyzing...",
          }));
        if (matches.length > 0) return res.status(200).json({ matches });
      }
      return res.status(200).json({ matches: [], noFixtures: true, message: "No upcoming fixtures found for this league right now." });
    }

    // ── NBA (v2.nba.api-sports.io) ───────────────────────────────────
    if (leagueId === "12") {
      const url = `https://v2.nba.api-sports.io/games?season=${americanSeason}&date=${today}`;
      const data = await apiCall(url, KEY, "v2.nba.api-sports.io");
      if (data && data.response && data.response.length > 0) {
        const matches = data.response
          .filter(g => g.status?.long !== "Finished")
          .map((g, i) => ({
            id: g.id || i,
            home: g.teams.home.name,
            away: g.teams.visitors.name,
            date: fmtDate(g.date.start),
            time: fmtTime(g.date.start),
            venue: g.arena?.name || "TBD",
            conf: randConf(),
            verdict: "Analyzing...",
          }));
        if (matches.length > 0) return res.status(200).json({ matches });
      }
      return res.status(200).json({ matches: [], noFixtures: true, message: "No NBA games today. Check back tomorrow." });
    }

    // ── BASKETBALL EuroLeague (v1.basketball.api-sports.io) ──────────
    if (leagueId === "120") {
      const season = `${soccerSeason}-${soccerSeason + 1}`;
      const url = `https://v1.basketball.api-sports.io/games?league=120&season=${season}&date=${today}`;
      const data = await apiCall(url, KEY, "v1.basketball.api-sports.io");
      if (data && data.response && data.response.length > 0) {
        const matches = data.response
          .filter(g => g.status?.long !== "Finished")
          .map((g, i) => ({
            id: g.id || i,
            home: g.teams.home.name,
            away: g.teams.away.name,
            date: fmtDate(g.date),
            time: fmtTime(g.date),
            venue: g.arena?.name || "TBD",
            conf: randConf(),
            verdict: "Analyzing...",
          }));
        if (matches.length > 0) return res.status(200).json({ matches });
      }
      return res.status(200).json({ matches: [], noFixtures: true, message: "No EuroLeague games today." });
    }

    // ── NFL (v1.american-football.api-sports.io) ─────────────────────
    if (leagueId === "1nfl" || leagueId === "2nfl") {
      const leagueNum = leagueId === "1nfl" ? "1" : "2";
      const url = `https://v1.american-football.api-sports.io/games?league=${leagueNum}&season=${americanSeason}&date=${today}`;
      const data = await apiCall(url, KEY, "v1.american-football.api-sports.io");
      if (data && data.response && data.response.length > 0) {
        const matches = data.response
          .filter(g => g.game?.status?.short !== "FT")
          .map((g, i) => ({
            id: g.game?.id || i,
            home: g.teams.home.name,
            away: g.teams.away.name,
            date: g.game?.date?.date ? new Date(g.game.date.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "TBD",
            time: g.game?.date?.time || "TBD",
            venue: g.game?.venue?.name || "TBD",
            conf: randConf(),
            verdict: "Analyzing...",
          }));
        if (matches.length > 0) return res.status(200).json({ matches });
      }
      return res.status(200).json({ matches: [], offseason: true, message: leagueId === "1nfl" ? "NFL season starts September " + year : "NCAA Football starts August " + year });
    }

    // ── MLB (v1.baseball.api-sports.io) ──────────────────────────────
    if (leagueId === "1mlb") {
      const url = `https://v1.baseball.api-sports.io/games?league=1&season=${year}&date=${today}`;
      const data = await apiCall(url, KEY, "v1.baseball.api-sports.io");
      if (data && data.response && data.response.length > 0) {
        const matches = data.response
          .filter(g => g.status?.short !== "FT")
          .map((g, i) => ({
            id: g.id || i,
            home: g.teams.home.name,
            away: g.teams.away.name,
            date: fmtDate(g.date),
            time: g.time || fmtTime(g.date),
            venue: g.venue?.name || "TBD",
            conf: randConf(),
            verdict: "Analyzing...",
          }));
        if (matches.length > 0) return res.status(200).json({ matches });
      }
      return res.status(200).json({ matches: [], noFixtures: true, message: "No MLB games today. Check back tomorrow." });
    }

    // ── NHL (v1.hockey.api-sports.io) ────────────────────────────────
    if (leagueId === "57") {
      const season = `${americanSeason}-${americanSeason + 1}`;
      const url = `https://v1.hockey.api-sports.io/games?league=57&season=${season}&date=${today}`;
      const data = await apiCall(url, KEY, "v1.hockey.api-sports.io");
      if (data && data.response && data.response.length > 0) {
        const matches = data.response
          .filter(g => g.status?.short !== "FT")
          .map((g, i) => ({
            id: g.id || i,
            home: g.teams.home.name,
            away: g.teams.away.name,
            date: fmtDate(g.date),
            time: g.time || fmtTime(g.date),
            venue: g.arena?.name || "TBD",
            conf: randConf(),
            verdict: "Analyzing...",
          }));
        if (matches.length > 0) return res.status(200).json({ matches });
      }
      return res.status(200).json({ matches: [], noFixtures: true, message: "No NHL games today." });
    }

    // ── MMA / UFC (v1.mma.api-sports.io) ────────────────────────────
    if (leagueId === "ufc" || leagueId === "boxing") {
      const leagueNum = leagueId === "ufc" ? "1" : "2";
      const url = `https://v1.mma.api-sports.io/fights?league=${leagueNum}&date_from=${today}&date_to=${date14}`;
      const data = await apiCall(url, KEY, "v1.mma.api-sports.io");
      if (data && data.response && data.response.length > 0) {
        const matches = data.response.map((f, i) => ({
          id: f.id || i,
          home: f.fighters?.first?.name || "TBD",
          away: f.fighters?.second?.name || "TBD",
          date: fmtDate(f.date),
          time: fmtTime(f.date),
          venue: f.event?.name || f.arena?.name || "TBD",
          conf: randConf(),
          verdict: "Analyzing...",
        })).filter(m => m.home !== "TBD");
        if (matches.length > 0) return res.status(200).json({ matches });
      }
      return res.status(200).json({ matches: [], noFixtures: true, message: "No upcoming fights in the next 2 weeks." });
    }

    // ── TENNIS (v1.tennis.api-sports.io) ─────────────────────────────
    if (leagueId === "atp" || leagueId === "wta") {
      const leagueNum = leagueId === "atp" ? "1" : "2";
      const url = `https://v1.tennis.api-sports.io/games?league=${leagueNum}&season=${year}&date_from=${today}&date_to=${date3}`;
      const data = await apiCall(url, KEY, "v1.tennis.api-sports.io");
      if (data && data.response && data.response.length > 0) {
        const matches = data.response
          .filter(g => g.status?.short !== "FT")
          .map((g, i) => ({
            id: g.id || i,
            home: g.players?.home?.name || "TBD",
            away: g.players?.away?.name || "TBD",
            date: fmtDate(g.date),
            time: fmtTime(g.date),
            venue: g.tournament?.name || "TBD",
            conf: randConf(),
            verdict: "Analyzing...",
          })).filter(m => m.home !== "TBD");
        if (matches.length > 0) return res.status(200).json({ matches });
      }
      return res.status(200).json({ matches: [], noFixtures: true, message: "No tennis matches in the next 3 days." });
    }

    return res.status(200).json({ matches: [], noFixtures: true, message: "No fixtures available." });

  } catch (error) {
    console.error("Fixtures error:", error.message);
    return res.status(200).json({ matches: [], noFixtures: true, message: "Could not load fixtures. Please try again." });
  }
};

async function apiCall(url, key, host) {
  const headers = { "x-apisports-key": key };
  if (host) headers["x-rapidapi-host"] = host;
  const res = await fetch(url, { headers });
  if (!res.ok) { console.error("HTTP error", res.status, url); return null; }
  const data = await res.json();
  if (data.errors && Object.keys(data.errors).length > 0) { console.error("API errors", JSON.stringify(data.errors)); return null; }
  return data;
}

function fmtDate(d) {
  if (!d) return "TBD";
  try { return new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }); } catch { return "TBD"; }
}

function fmtTime(d) {
  if (!d) return "TBD";
  try { return new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); } catch { return "TBD"; }
}

function randConf() { return Math.floor(Math.random() * 25) + 60; }

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
  const future7 = new Date(now); future7.setDate(now.getDate() + 7);
  const future3 = new Date(now); future3.setDate(now.getDate() + 3);
  const future14 = new Date(now); future14.setDate(now.getDate() + 14);
  const date7 = future7.toISOString().split("T")[0];
  const date3 = future3.toISOString().split("T")[0];
  const date14 = future14.toISOString().split("T")[0];

  const SPORT_CONFIG = {
    // ── SOCCER ──────────────────────────────────────────────────────
    "39":    { url: "https://v3.football.api-sports.io/fixtures",         params: `league=39&season=${soccerSeason}&next=10` },
    "140":   { url: "https://v3.football.api-sports.io/fixtures",         params: `league=140&season=${soccerSeason}&next=10` },
    "78":    { url: "https://v3.football.api-sports.io/fixtures",         params: `league=78&season=${soccerSeason}&next=10` },
    "135":   { url: "https://v3.football.api-sports.io/fixtures",         params: `league=135&season=${soccerSeason}&next=10` },
    "61":    { url: "https://v3.football.api-sports.io/fixtures",         params: `league=61&season=${soccerSeason}&next=10` },
    "2":     { url: "https://v3.football.api-sports.io/fixtures",         params: `league=2&season=${soccerSeason}&next=10` },
    "253":   { url: "https://v3.football.api-sports.io/fixtures",         params: `league=253&season=${year}&next=10` },
    "wc2026":{ url: "https://v3.football.api-sports.io/fixtures",         params: `league=1&season=2026&next=20` },
    // ── BASKETBALL ──────────────────────────────────────────────────
    "12":    { url: "https://v1.basketball.api-sports.io/games",          params: `league=12&season=${americanSeason}-${americanSeason+1}&date_from=${today}&date_to=${date3}` },
    "120":   { url: "https://v1.basketball.api-sports.io/games",          params: `league=120&season=${soccerSeason}-${soccerSeason+1}&date_from=${today}&date_to=${date3}` },
    // ── AMERICAN FOOTBALL ───────────────────────────────────────────
    "1nfl":  { url: "https://v1.american-football.api-sports.io/games",   params: `league=1&season=${americanSeason}&date_from=${today}&date_to=${date7}` },
    "2nfl":  { url: "https://v1.american-football.api-sports.io/games",   params: `league=2&season=${americanSeason}&date_from=${today}&date_to=${date7}` },
    // ── BASEBALL ────────────────────────────────────────────────────
    "1mlb":  { url: "https://v1.baseball.api-sports.io/games",            params: `league=1&season=${year}&date_from=${today}&date_to=${date3}` },
    // ── HOCKEY ──────────────────────────────────────────────────────
    "57":    { url: "https://v1.hockey.api-sports.io/games",              params: `league=57&season=${americanSeason}-${americanSeason+1}&date_from=${today}&date_to=${date3}` },
    // ── MMA ─────────────────────────────────────────────────────────
    "ufc":   { url: "https://v1.mma.api-sports.io/fights",                params: `league=1&date_from=${today}&date_to=${date14}` },
    "boxing":{ url: "https://v1.mma.api-sports.io/fights",                params: `league=2&date_from=${today}&date_to=${date14}` },
    // ── TENNIS ──────────────────────────────────────────────────────
    "atp":   { url: "https://v1.tennis.api-sports.io/games",              params: `league=1&season=${year}&date_from=${today}&date_to=${date3}` },
    "wta":   { url: "https://v1.tennis.api-sports.io/games",              params: `league=2&season=${year}&date_from=${today}&date_to=${date3}` },
  };

  const config = SPORT_CONFIG[leagueId];
  if (!config) {
    return res.status(200).json({ matches: getFallback(leagueId), fallback: true });
  }

  try {
    const response = await fetch(`${config.url}?${config.params}`, {
      headers: { "x-apisports-key": KEY },
    });

    if (!response.ok) {
      console.error("API-Sports HTTP error:", response.status);
      return res.status(200).json({ matches: getFallback(leagueId), fallback: true });
    }

    const data = await response.json();

    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error("API-Sports errors:", JSON.stringify(data.errors));
      return res.status(200).json({ matches: getFallback(leagueId), fallback: true });
    }

    if (!data.response || data.response.length === 0) {
      console.log("No results from API-Sports for", leagueId);
      return res.status(200).json({ matches: getFallback(leagueId), fallback: true });
    }

    const matches = parseMatches(data.response, leagueId);

    if (!matches || matches.length === 0) {
      return res.status(200).json({ matches: getFallback(leagueId), fallback: true });
    }

    return res.status(200).json({ matches });

  } catch (error) {
    console.error("Fixtures error for", leagueId, ":", error.message);
    return res.status(200).json({ matches: getFallback(leagueId), fallback: true });
  }
};

function parseMatches(response, leagueId) {
  try {
    // Soccer and World Cup
    if (["39","140","78","135","61","2","253","wc2026"].includes(leagueId)) {
      return response.map((f, i) => ({
        id: f.fixture?.id || i,
        home: f.teams?.home?.name || "TBD",
        away: f.teams?.away?.name || "TBD",
        date: new Date(f.fixture?.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
        time: new Date(f.fixture?.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        venue: f.fixture?.venue?.name || "TBD",
        conf: Math.floor(Math.random() * 25) + 60,
        verdict: "Analyzing...",
      })).filter(m => m.home !== "TBD" || m.away !== "TBD");
    }

    // Basketball
    if (["12","120"].includes(leagueId)) {
      return response.map((g, i) => ({
        id: g.id || i,
        home: g.teams?.home?.name || "TBD",
        away: g.teams?.away?.name || "TBD",
        date: new Date(g.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
        time: new Date(g.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        venue: g.arena?.name || "TBD",
        conf: Math.floor(Math.random() * 25) + 60,
        verdict: "Analyzing...",
      })).filter(m => m.home !== "TBD");
    }

    // American Football
    if (["1nfl","2nfl"].includes(leagueId)) {
      return response.map((g, i) => ({
        id: g.game?.id || i,
        home: g.teams?.home?.name || "TBD",
        away: g.teams?.away?.name || "TBD",
        date: new Date(g.game?.date?.date + "T" + (g.game?.date?.time || "00:00") + ":00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
        time: g.game?.date?.time || "TBD",
        venue: g.game?.venue?.name || "TBD",
        conf: Math.floor(Math.random() * 25) + 60,
        verdict: "Analyzing...",
      })).filter(m => m.home !== "TBD");
    }

    // Baseball
    if (leagueId === "1mlb") {
      return response.map((g, i) => ({
        id: g.id || i,
        home: g.teams?.home?.name || "TBD",
        away: g.teams?.away?.name || "TBD",
        date: new Date(g.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
        time: new Date(g.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        venue: g.venue?.name || "TBD",
        conf: Math.floor(Math.random() * 25) + 60,
        verdict: "Analyzing...",
      })).filter(m => m.home !== "TBD");
    }

    // Hockey
    if (leagueId === "57") {
      return response.map((g, i) => ({
        id: g.id || i,
        home: g.teams?.home?.name || "TBD",
        away: g.teams?.away?.name || "TBD",
        date: new Date(g.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
        time: new Date(g.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        venue: g.arena?.name || "TBD",
        conf: Math.floor(Math.random() * 25) + 60,
        verdict: "Analyzing...",
      })).filter(m => m.home !== "TBD");
    }

    // MMA and Boxing
    if (["ufc","boxing"].includes(leagueId)) {
      return response.map((f, i) => ({
        id: f.id || i,
        home: f.fighters?.first?.name || "TBD",
        away: f.fighters?.second?.name || "TBD",
        date: new Date(f.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
        time: new Date(f.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        venue: f.arena?.name || f.event?.name || "TBD",
        conf: Math.floor(Math.random() * 25) + 60,
        verdict: "Analyzing...",
      })).filter(m => m.home !== "TBD");
    }

    // Tennis
    if (["atp","wta"].includes(leagueId)) {
      return response.map((g, i) => ({
        id: g.id || i,
        home: g.players?.home?.name || "TBD",
        away: g.players?.away?.name || "TBD",
        date: new Date(g.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
        time: new Date(g.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        venue: g.tournament?.name || "TBD",
        conf: Math.floor(Math.random() * 25) + 60,
        verdict: "Analyzing...",
      })).filter(m => m.home !== "TBD");
    }

    return [];
  } catch (e) {
    console.error("Parse error:", e.message);
    return [];
  }
}

function getFallback(leagueId) {
  const base = new Date();
  const d = [];
  for (let i = 0; i < 14; i++) {
    const dt = new Date(base);
    dt.setDate(base.getDate() + i);
    d.push(dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }));
  }
  const fallbacks = {
    "wc2026": [{id:1,home:"USA",away:"Canada",date:d[0],time:"21:00",venue:"SoFi Stadium",conf:72,verdict:"Home Win"},{id:2,home:"Brazil",away:"Mexico",date:d[0],time:"18:00",venue:"AT&T Stadium",conf:78,verdict:"Home Win"},{id:3,home:"France",away:"Argentina",date:d[1],time:"21:00",venue:"MetLife Stadium",conf:75,verdict:"Draw"},{id:4,home:"England",away:"Germany",date:d[1],time:"18:00",venue:"Rose Bowl",conf:68,verdict:"Home Win"},{id:5,home:"Spain",away:"Portugal",date:d[2],time:"21:00",venue:"Estadio Azteca",conf:71,verdict:"BTTS"},{id:6,home:"Netherlands",away:"Belgium",date:d[3],time:"21:00",venue:"Allegiant Stadium",conf:69,verdict:"Home Win"}],
    "39":  [{id:7,home:"Arsenal",away:"Man City",date:d[0],time:"16:30",venue:"Emirates Stadium",conf:74,verdict:"Home Win"},{id:8,home:"Liverpool",away:"Chelsea",date:d[2],time:"17:30",venue:"Anfield",conf:68,verdict:"Over 2.5"},{id:9,home:"Man Utd",away:"Tottenham",date:d[4],time:"15:00",venue:"Old Trafford",conf:61,verdict:"BTTS"}],
    "140": [{id:10,home:"Real Madrid",away:"Barcelona",date:d[0],time:"21:00",venue:"Santiago Bernabeu",conf:81,verdict:"Away Win"},{id:11,home:"Atletico",away:"Sevilla",date:d[3],time:"19:00",venue:"Wanda Metropolitano",conf:66,verdict:"Home Win"}],
    "78":  [{id:12,home:"Bayern",away:"Dortmund",date:d[1],time:"18:30",venue:"Allianz Arena",conf:78,verdict:"Home Win"},{id:13,home:"Leverkusen",away:"RB Leipzig",date:d[4],time:"15:30",venue:"BayArena",conf:63,verdict:"Over 2.5"}],
    "135": [{id:14,home:"Inter Milan",away:"AC Milan",date:d[2],time:"20:45",venue:"San Siro",conf:76,verdict:"Home Win"},{id:15,home:"Juventus",away:"Napoli",date:d[5],time:"20:45",venue:"Juventus Stadium",conf:64,verdict:"Over 2.5"}],
    "61":  [{id:16,home:"PSG",away:"Marseille",date:d[1],time:"21:00",venue:"Parc des Princes",conf:79,verdict:"Home Win"},{id:17,home:"Lyon",away:"Monaco",date:d[4],time:"19:00",venue:"Groupama Stadium",conf:61,verdict:"BTTS"}],
    "2":   [{id:18,home:"Real Madrid",away:"Bayern Munich",date:d[2],time:"21:00",venue:"Santiago Bernabeu",conf:77,verdict:"Over 2.5"},{id:19,home:"Man City",away:"PSG",date:d[2],time:"21:00",venue:"Etihad Stadium",conf:70,verdict:"Home Win"}],
    "253": [{id:20,home:"LA Galaxy",away:"LAFC",date:d[1],time:"21:30",venue:"Dignity Health Park",conf:58,verdict:"BTTS"},{id:21,home:"Inter Miami",away:"Atlanta Utd",date:d[3],time:"20:30",venue:"Chase Stadium",conf:65,verdict:"Home Win"}],
    "12":  [{id:22,home:"LA Lakers",away:"Golden State",date:d[0],time:"22:30",venue:"Crypto.com Arena",conf:69,verdict:"Away Win"},{id:23,home:"Boston",away:"Miami Heat",date:d[1],time:"00:30",venue:"TD Garden",conf:72,verdict:"Home Win"}],
    "1mlb":[{id:24,home:"NY Yankees",away:"Boston",date:d[0],time:"23:05",venue:"Yankee Stadium",conf:62,verdict:"Home Win"},{id:25,home:"LA Dodgers",away:"SF Giants",date:d[1],time:"02:10",venue:"Dodger Stadium",conf:70,verdict:"Home -1.5"}],
    "57":  [{id:26,home:"Toronto",away:"Boston",date:d[0],time:"00:00",venue:"Scotiabank Arena",conf:67,verdict:"Home Win"},{id:27,home:"Colorado",away:"Vegas",date:d[2],time:"03:00",venue:"Ball Arena",conf:71,verdict:"Away Win"}],
    "1nfl":[{id:28,home:"Season starts",away:"September 2026",date:d[0],time:"TBD",venue:"TBD",conf:60,verdict:"Coming Soon"}],
    "2nfl":[{id:29,home:"Season starts",away:"August 2026",date:d[0],time:"TBD",venue:"TBD",conf:60,verdict:"Coming Soon"}],
    "atp": [{id:30,home:"Jannik Sinner",away:"Carlos Alcaraz",date:d[0],time:"14:00",venue:"Roland Garros",conf:72,verdict:"Away Win"},{id:31,home:"Novak Djokovic",away:"Daniil Medvedev",date:d[1],time:"12:00",venue:"Roland Garros",conf:68,verdict:"Home Win"}],
    "wta": [{id:32,home:"Iga Swiatek",away:"Aryna Sabalenka",date:d[0],time:"15:00",venue:"Roland Garros",conf:70,verdict:"Home Win"},{id:33,home:"Coco Gauff",away:"Elena Rybakina",date:d[1],time:"13:00",venue:"Roland Garros",conf:64,verdict:"Away Win"}],
    "ufc": [{id:34,home:"Khamzat Chimaev",away:"Sean Strickland",date:d[3],time:"02:00",venue:"Prudential Center",conf:71,verdict:"Home Win"},{id:35,home:"Ilia Topuria",away:"Justin Gaethje",date:d[5],time:"02:00",venue:"TBD",conf:73,verdict:"Home Win"}],
    "boxing":[{id:36,home:"Canelo Alvarez",away:"Terence Crawford",date:d[5],time:"03:00",venue:"T-Mobile Arena",conf:67,verdict:"Home Win"}],
    "120": [{id:37,home:"Real Madrid",away:"CSKA Moscow",date:d[0],time:"21:00",venue:"WiZink Center",conf:73,verdict:"Home Win"}],
    "pga": [{id:38,home:"PGA Tour Event",away:"Check PGA.com",date:d[0],time:"13:00",venue:"TBD",conf:60,verdict:"Check Schedule"}],
  };
  return fallbacks[leagueId] || [{id:99,home:"No fixtures",away:"available",date:d[0],time:"TBD",venue:"TBD",conf:60,verdict:"Soon"}];
}

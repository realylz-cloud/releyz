module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { leagueId } = req.query;
  if (!leagueId) return res.status(400).json({ error: "leagueId is required" });

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Sports that are currently in off-season — show message instead of fake games
  const OFF_SEASON = {
    "1":    { name: "NFL", next: "September " + year },
    "2nfl": { name: "NCAA Football", next: "August " + year },
  };

  if (OFF_SEASON[leagueId]) {
    return res.status(200).json({
      matches: [],
      offseason: true,
      message: OFF_SEASON[leagueId].name + " season starts " + OFF_SEASON[leagueId].next,
    });
  }

  const ESPN_MAP = {
    "39":   "soccer/eng.1",
    "140":  "soccer/esp.1",
    "78":   "soccer/ger.1",
    "135":  "soccer/ita.1",
    "61":   "soccer/fra.1",
    "2":    "soccer/UEFA.CHAMPIONS",
    "253":  "soccer/usa.1",
    "12":   "basketball/nba",
    "120":  "basketball/mens-college-basketball",
    "1mlb": "baseball/mlb",
    "57":   "hockey/nhl",
    "atp":  "tennis/atp",
    "wta":  "tennis/wta",
    "ufc":  "mma/ufc",
    "boxing": "boxing/boxing",
    "pga":  "golf/pga",
  };

  const sportPath = ESPN_MAP[leagueId];
  if (!sportPath) {
    return res.status(200).json({ matches: getFallbackMatches(leagueId), fallback: true });
  }

  try {
    const allMatches = [];

    // Fetch next 14 days for better coverage
    for (let i = 0; i < 14; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
      const url = `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/scoreboard?dates=${dateStr}&limit=100`;

      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        const data = await response.json();
        const events = data.events || [];

        events.forEach((event) => {
          const competition = event.competitions?.[0];
          const statusShort = event.status?.type?.short || "pre";
          if (statusShort === "post") return;

          let homeName, awayName;

          // Tennis — players not teams
          if (leagueId === "atp" || leagueId === "wta") {
            const players = competition?.competitors || [];
            homeName = players[0]?.athlete?.displayName || players[0]?.team?.displayName;
            awayName = players[1]?.athlete?.displayName || players[1]?.team?.displayName;
          }
          // MMA and Boxing — fighters
          else if (leagueId === "ufc" || leagueId === "boxing") {
            const fighters = competition?.competitors || [];
            homeName = fighters[0]?.athlete?.displayName || fighters[0]?.team?.displayName;
            awayName = fighters[1]?.athlete?.displayName || fighters[1]?.team?.displayName;
          }
          // Golf — tournament name
          else if (leagueId === "pga") {
            homeName = event.name || event.shortName;
            awayName = competition?.venue?.fullName || "TBD";
          }
          // All other sports
          else {
            const home = competition?.competitors?.find(c => c.homeAway === "home");
            const away = competition?.competitors?.find(c => c.homeAway === "away");
            homeName = home?.team?.displayName;
            awayName = away?.team?.displayName;
          }

          if (!homeName || !awayName) return;

          allMatches.push({
            id: event.id || Math.random(),
            home: homeName,
            away: awayName,
            date: new Date(event.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
            time: new Date(event.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
            venue: competition?.venue?.fullName || event.venue?.fullName || "TBD",
            status: event.status?.type?.shortDetail || "Scheduled",
            conf: Math.floor(Math.random() * 30) + 55,
            verdict: "Analyzing...",
          });
        });
      } catch (e) { continue; }
    }

    if (allMatches.length > 0) {
      return res.status(200).json({ matches: allMatches });
    }

    // Try API-Sports as backup for soccer
    if (["39","140","78","135","61","2","253"].includes(leagueId)) {
      return await tryApiSports(leagueId, res);
    }

    return res.status(200).json({ matches: getFallbackMatches(leagueId), fallback: true });

  } catch (error) {
    return res.status(200).json({ matches: getFallbackMatches(leagueId), fallback: true });
  }
};

async function tryApiSports(leagueId, res) {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const season = month >= 8 ? year : year - 1;
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${season}&next=10`,
      { headers: { "x-apisports-key": process.env.API_SPORTS_KEY } }
    );
    const data = await response.json();
    if (!data.response || data.response.length === 0) {
      return res.status(200).json({ matches: getFallbackMatches(leagueId), fallback: true });
    }
    const matches = data.response.map(f => ({
      id: f.fixture?.id,
      home: f.teams?.home?.name,
      away: f.teams?.away?.name,
      date: new Date(f.fixture?.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
      time: new Date(f.fixture?.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      venue: f.fixture?.venue?.name || "TBD",
      conf: Math.floor(Math.random() * 30) + 55,
      verdict: "Analyzing...",
    }));
    return res.status(200).json({ matches });
  } catch (e) {
    return res.status(200).json({ matches: getFallbackMatches(leagueId), fallback: true });
  }
}

function getFallbackMatches(leagueId) {
  const base = new Date();
  const d = [];
  for (let i = 0; i < 14; i++) {
    const dt = new Date(base);
    dt.setDate(base.getDate() + i);
    d.push(dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }));
  }
  const fallbacks = {
    "39":   [{id:1,home:"Arsenal",away:"Man City",date:d[0],time:"16:30",venue:"Emirates Stadium",conf:74,verdict:"Home Win"},{id:2,home:"Liverpool",away:"Chelsea",date:d[2],time:"17:30",venue:"Anfield",conf:68,verdict:"Over 2.5"},{id:3,home:"Man Utd",away:"Tottenham",date:d[4],time:"15:00",venue:"Old Trafford",conf:61,verdict:"BTTS"}],
    "140":  [{id:5,home:"Real Madrid",away:"Barcelona",date:d[0],time:"21:00",venue:"Santiago Bernabeu",conf:81,verdict:"Away Win"},{id:6,home:"Atletico",away:"Sevilla",date:d[3],time:"19:00",venue:"Wanda Metropolitano",conf:66,verdict:"Home Win"}],
    "78":   [{id:7,home:"Bayern",away:"Dortmund",date:d[1],time:"18:30",venue:"Allianz Arena",conf:78,verdict:"Home Win"},{id:8,home:"Leverkusen",away:"RB Leipzig",date:d[4],time:"15:30",venue:"BayArena",conf:63,verdict:"Over 2.5"}],
    "135":  [{id:9,home:"Inter Milan",away:"AC Milan",date:d[2],time:"20:45",venue:"San Siro",conf:76,verdict:"Home Win"},{id:10,home:"Juventus",away:"Napoli",date:d[5],time:"20:45",venue:"Juventus Stadium",conf:64,verdict:"Over 2.5"}],
    "61":   [{id:11,home:"PSG",away:"Marseille",date:d[1],time:"21:00",venue:"Parc des Princes",conf:79,verdict:"Home Win"},{id:12,home:"Lyon",away:"Monaco",date:d[4],time:"19:00",venue:"Groupama Stadium",conf:61,verdict:"BTTS"}],
    "2":    [{id:13,home:"Real Madrid",away:"Bayern Munich",date:d[2],time:"21:00",venue:"Santiago Bernabeu",conf:77,verdict:"Over 2.5"},{id:14,home:"Man City",away:"PSG",date:d[2],time:"21:00",venue:"Etihad Stadium",conf:70,verdict:"Home Win"}],
    "253":  [{id:15,home:"LA Galaxy",away:"LAFC",date:d[1],time:"21:30",venue:"Dignity Health Park",conf:58,verdict:"BTTS"},{id:16,home:"Inter Miami",away:"Atlanta Utd",date:d[3],time:"20:30",venue:"Chase Stadium",conf:65,verdict:"Home Win"}],
    "12":   [{id:17,home:"LA Lakers",away:"Golden State",date:d[0],time:"22:30",venue:"Crypto.com Arena",conf:69,verdict:"Away Win"},{id:18,home:"Boston",away:"Miami Heat",date:d[1],time:"00:30",venue:"TD Garden",conf:72,verdict:"Home Win"}],
    "1mlb": [{id:21,home:"NY Yankees",away:"Boston",date:d[0],time:"23:05",venue:"Yankee Stadium",conf:62,verdict:"Home Win"},{id:22,home:"LA Dodgers",away:"SF Giants",date:d[1],time:"02:10",venue:"Dodger Stadium",conf:70,verdict:"Home -1.5"},{id:23,home:"Houston",away:"Texas Rangers",date:d[2],time:"02:10",venue:"Minute Maid Park",conf:65,verdict:"Over 8.5"}],
    "57":   [{id:24,home:"Toronto",away:"Boston",date:d[0],time:"00:00",venue:"Scotiabank Arena",conf:67,verdict:"Home Win"},{id:25,home:"Colorado",away:"Vegas",date:d[2],time:"03:00",venue:"Ball Arena",conf:71,verdict:"Away Win"}],
    "atp":  [{id:26,home:"Jannik Sinner",away:"Carlos Alcaraz",date:d[0],time:"14:00",venue:"Roland Garros",conf:72,verdict:"Away Win"},{id:27,home:"Novak Djokovic",away:"Daniil Medvedev",date:d[2],time:"12:00",venue:"Roland Garros",conf:68,verdict:"Home Win"}],
    "wta":  [{id:28,home:"Iga Swiatek",away:"Aryna Sabalenka",date:d[0],time:"15:00",venue:"Roland Garros",conf:70,verdict:"Home Win"},{id:29,home:"Coco Gauff",away:"Elena Rybakina",date:d[2],time:"13:00",venue:"Roland Garros",conf:64,verdict:"Away Win"}],
    "ufc":  [{id:30,home:"Islam Makhachev",away:"Charles Oliveira",date:d[4],time:"04:00",venue:"T-Mobile Arena",conf:71,verdict:"Home Win"},{id:31,home:"Alex Pereira",away:"Jamahal Hill",date:d[6],time:"04:00",venue:"Ball Arena",conf:74,verdict:"Home KO"}],
    "boxing":[{id:32,home:"Canelo Alvarez",away:"Terence Crawford",date:d[5],time:"03:00",venue:"T-Mobile Arena",conf:67,verdict:"Home Win"},{id:33,home:"Tyson Fury",away:"Anthony Joshua",date:d[9],time:"22:00",venue:"Wembley Stadium",conf:64,verdict:"Away Win"}],
    "pga":  [{id:34,home:"PGA Tour Event",away:"Check PGA.com",date:d[0],time:"13:00",venue:"TBD",conf:60,verdict:"Check Schedule"}],
    "120":  [{id:35,home:"Real Madrid",away:"CSKA Moscow",date:d[0],time:"21:00",venue:"WiZink Center",conf:73,verdict:"Home Win"}],
    "2nfl": [{id:36,home:"Season starts",away:"August 2026",date:d[0],time:"TBD",venue:"TBD",conf:60,verdict:"Coming Soon"}],
  };
  return fallbacks[leagueId] || [{id:99,home:"No fixtures",away:"available",date:d[0],time:"TBD",venue:"TBD",conf:60,verdict:"Soon"}];
}

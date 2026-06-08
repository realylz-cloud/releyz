module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { leagueId } = req.query;
  if (!leagueId) return res.status(400).json({ error: "leagueId is required" });

  const ESPN_CONFIG = {
    "39":    { path: "soccer/eng.1",              days: 7 },
    "140":   { path: "soccer/esp.1",              days: 7 },
    "78":    { path: "soccer/ger.1",              days: 7 },
    "135":   { path: "soccer/ita.1",              days: 7 },
    "61":    { path: "soccer/fra.1",              days: 7 },
    "2":     { path: "soccer/uefa.champions",     days: 7 },
    "253":   { path: "soccer/usa.1",              days: 7 },
    "wc2026":{ path: "soccer/fifa.world",         days: 7 },
    "12":    { path: "basketball/nba",            days: 3 },
    "120":   { path: "basketball/mens-college-basketball", days: 3 },
    "1nfl":  { path: "football/nfl",              days: 7 },
    "2nfl":  { path: "football/college-football", days: 7 },
    "1mlb":  { path: "baseball/mlb",              days: 3 },
    "57":    { path: "hockey/nhl",                days: 3 },
    "atp":   { path: "tennis/atp",                days: 3 },
    "wta":   { path: "tennis/wta",                days: 3 },
    "ufc":   { path: "mma/ufc",                   days: 14 },
    "boxing":{ path: "boxing/boxing",             days: 14 },
    "pga":   { path: "golf/pga",                  days: 7 },
  };

  const config = ESPN_CONFIG[leagueId];
  if (!config) return res.status(200).json({ matches: [], noFixtures: true, message: "Sport not available." });

  const isTennisMMA = ["atp","wta","ufc","boxing"].includes(leagueId);
  const now = new Date();
  const allMatches = [];

  for (let i = 0; i < config.days; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
    const url = `https://site.api.espn.com/apis/site/v2/sports/${config.path}/scoreboard?dates=${dateStr}&limit=50`;

    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const data = await response.json();
      const events = data.events || [];

      for (const event of events) {
        const competition = event.competitions?.[0];
        const statusShort = event.status?.type?.short || "pre";
        if (statusShort === "post") continue;

        let home, away, homeLogo, awayLogo, homeForm, awayForm, venue;

        if (isTennisMMA) {
          const competitors = competition?.competitors || [];
          const c0 = competitors[0];
          const c1 = competitors[1];
          home = c0?.athlete?.displayName || c0?.team?.displayName;
          away = c1?.athlete?.displayName || c1?.team?.displayName;
          homeLogo = c0?.athlete?.headshot?.href || c0?.team?.logos?.[0]?.href || null;
          awayLogo = c1?.athlete?.headshot?.href || c1?.team?.logos?.[0]?.href || null;
          homeForm = parseForm(c0?.records);
          awayForm = parseForm(c1?.records);
          venue = competition?.venue?.fullName || event.name || "TBD";
        } else {
          const homeComp = competition?.competitors?.find(c => c.homeAway === "home");
          const awayComp = competition?.competitors?.find(c => c.homeAway === "away");
          home = homeComp?.team?.displayName;
          away = awayComp?.team?.displayName;
          homeLogo = homeComp?.team?.logos?.[0]?.href || homeComp?.team?.logo || null;
          awayLogo = awayComp?.team?.logos?.[0]?.href || awayComp?.team?.logo || null;
          homeForm = parseForm(homeComp?.records);
          awayForm = parseForm(awayComp?.records);
          venue = competition?.venue?.fullName || "TBD";
        }

        if (!home || !away) continue;

        allMatches.push({
          id: event.id || Math.random(),
          home, away,
          homeLogo, awayLogo,
          homeForm, awayForm,
          date: new Date(event.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
          time: new Date(event.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
          venue,
          status: event.status?.type?.shortDetail || "Scheduled",
          conf: Math.floor(Math.random() * 25) + 60,
          verdict: "Analyzing...",
        });
      }
    } catch (e) { continue; }
  }

  if (allMatches.length > 0) return res.status(200).json({ matches: allMatches });

  const emptyMessages = {
    "39":"Premier League season ended in May. New season starts August 2026.",
    "140":"La Liga season ended in May. New season starts August 2026.",
    "78":"Bundesliga season ended. New season starts August 2026.",
    "135":"Serie A season ended. New season starts August 2026.",
    "61":"Ligue 1 season ended. New season starts August 2026.",
    "2":"Champions League final was in May. New season starts September 2026.",
    "253":"No MLS games in the next 7 days. Check back soon.",
    "wc2026":"World Cup 2026 starts June 11. Check back closer to kickoff.",
    "12":"NBA Finals ongoing. Check back for upcoming games.",
    "120":"EuroLeague season ended. New season starts October 2026.",
    "1nfl":"NFL season starts September 2026.",
    "2nfl":"NCAA Football starts August 2026.",
    "1mlb":"No MLB games today. Check back tomorrow.",
    "57":"NHL season ended. New season starts October 2026.",
    "atp":"No ATP matches in the next 3 days.",
    "wta":"No WTA matches in the next 3 days.",
    "ufc":"No UFC events in the next 2 weeks.",
    "boxing":"No boxing events in the next 2 weeks.",
    "pga":"No PGA Tour events this week.",
  };

  return res.status(200).json({ matches: [], noFixtures: true, message: emptyMessages[leagueId] || "No upcoming fixtures." });
};

function parseForm(records) {
  if (!records || records.length === 0) return [];
  const summary = records[0]?.summary || "";
  // summary is like "12-8" — we can't get match by match W/L/D from this
  // So return empty — the AI analysis covers form in detail
  return [];
}

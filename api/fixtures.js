export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { leagueId, season, next } = req.query;

  if (!leagueId) {
    return res.status(400).json({ error: "leagueId is required" });
  }

  try {
    const params = new URLSearchParams({
      league: leagueId,
      season: season || new Date().getFullYear().toString(),
      next: next || "10",
    });

    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?${params}`,
      {
        headers: {
          "x-apisports-key": process.env.API_SPORTS_KEY,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || data.errors?.length > 0) {
      throw new Error(JSON.stringify(data.errors) || "API-Sports error");
    }

    const matches = (data.response || []).map(fixture => ({
      id: fixture.fixture.id,
      home: fixture.teams.home.name,
      away: fixture.teams.away.name,
      date: new Date(fixture.fixture.date).toLocaleDateString("en-GB", {
        weekday: "short", day: "numeric", month: "short"
      }),
      time: new Date(fixture.fixture.date).toLocaleTimeString("en-GB", {
        hour: "2-digit", minute: "2-digit"
      }),
      venue: fixture.fixture.venue?.name || "TBD",
      status: fixture.fixture.status?.short || "NS",
      conf: Math.floor(Math.random() * 30) + 55,
      verdict: "Analyzing...",
    }));

    return res.status(200).json({ matches });

  } catch (error) {
    console.error("Fixtures error:", error);
    return res.status(200).json({
      matches: getFallbackMatches(leagueId),
      fallback: true,
    });
  }
}

function getFallbackMatches(leagueId) {
  const fallbacks = {
    "39": [
      { id: 1, home: "Arsenal",    away: "Man City",    date: "Tue 6 May",  time: "16:30", venue: "Emirates Stadium", conf: 74, verdict: "Home Win" },
      { id: 2, home: "Liverpool",  away: "Chelsea",     date: "Wed 7 May",  time: "17:30", venue: "Anfield",          conf: 68, verdict: "Over 2.5" },
      { id: 3, home: "Man Utd",    away: "Tottenham",   date: "Thu 8 May",  time: "15:00", venue: "Old Trafford",     conf: 61, verdict: "BTTS"     },
      { id: 4, home: "Newcastle",  away: "Aston Villa", date: "Fri 9 May",  time: "15:00", venue: "St. James' Park",  conf: 55, verdict: "Draw"     },
    ],
    "140": [
      { id: 5, home: "Real Madrid", away: "Barcelona", date: "Wed 7 May", time: "21:00", venue: "Santiago Bernabéu",   conf: 81, verdict: "Away Win" },
      { id: 6, home: "Atletico",    away: "Sevilla",   date: "Thu 8 May", time: "19:00", venue: "Wanda Metropolitano", conf: 66, verdict: "Home Win" },
    ],
    "78": [
      { id: 7, home: "Bayern",     away: "Dortmund",   date: "Sat 10 May", time: "18:30", venue: "Allianz Arena", conf: 78, verdict: "Home Win" },
      { id: 8, home: "Leverkusen", away: "RB Leipzig", date: "Sat 10 May", time: "15:30", venue: "BayArena",      conf: 63, verdict: "Over 2.5" },
    ],
    "12": [
      { id: 9,  home: "LA Lakers", away: "Golden State", date: "Tue 6 May", time: "22:30", venue: "Crypto.com Arena", conf: 69, verdict: "Away Win" },
      { id: 10, home: "Boston",    away: "Miami Heat",   date: "Wed 7 May", time: "00:30", venue: "TD Garden",         conf: 72, verdict: "Home Win" },
    ],
  };
  return fallbacks[leagueId] || [];
}

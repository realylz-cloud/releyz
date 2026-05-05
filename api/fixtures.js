module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { leagueId } = req.query;
  if (!leagueId) return res.status(400).json({ error: "leagueId is required" });

  const ESPN_ENDPOINTS = {
    "39":  "soccer/eng.1",
    "140": "soccer/esp.1",
    "78":  "soccer/ger.1",
    "135": "soccer/ita.1",
    "61":  "soccer/fra.1",
    "2":   "soccer/UEFA.CHAMPIONS",
    "253": "soccer/usa.1",
    "12":  "basketball/nba",
    "1":   "football/nfl",
    "1mlb":"baseball/mlb",
    "57":  "hockey/nhl",
    "ufc": "mma/ufc",
  };

  const sportPath = ESPN_ENDPOINTS[leagueId];

  if (!sportPath) {
    return res.status(200).json({
      matches: getFallbackMatches(leagueId),
      fallback: true,
    });
  }

  try {
    // Fetch next 7 days of fixtures
    const today = new Date();
    const allMatches = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");

      const url = `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/scoreboard?dates=${dateStr}`;

      try {
        const response = await fetch(url);
        const data = await response.json();
        const events = data.events || [];

        events.forEach((event) => {
          const competition = event.competitions?.[0];
          const home = competition?.competitors?.find(c => c.homeAway === "home");
          const away = competition?.competitors?.find(c => c.homeAway === "away");
          const eventDate = new Date(event.date);
          const statusShort = event.status?.type?.short || "pre";

          // Only include future or today's matches not finished ones
          if (statusShort === "post") return;

          allMatches.push({
            id: event.id,
            home: home?.team?.displayName || "Home Team",
            away: away?.team?.displayName || "Away Team",
            date: eventDate.toLocaleDateString("en-GB", {
              weekday: "short", day: "numeric", month: "short"
            }),
            time: eventDate.toLocaleTimeString("en-GB", {
              hour: "2-digit", minute: "2-digit"
            }),
            venue: competition?.venue?.fullName || "TBD",
            status: event.status?.type?.shortDetail || "Scheduled",
            conf: Math.floor(Math.random() * 30) + 55,
            verdict: "Analyzing...",
          });
        });
      } catch (dayError) {
        // Skip this day if it fails
        continue;
      }
    }

    if (allMatches.length === 0) {
      // Try API-Sports as backup for soccer
      if (["39","140","78","135","61","2","253"].includes(leagueId)) {
        return await tryApiSports(leagueId, res);
      }
      return res.status(200).json({
        matches: getFallbackMatches(leagueId),
        fallback: true,
      });
    }

    return res.status(200).json({ matches: allMatches });

  } catch (error) {
    console.error("ESPN error:", error);
    return res.status(200).json({
      matches: getFallbackMatches(leagueId),
      fallback: true,
    });
  }
};

async function tryApiSports(leagueId, res) {
  try {
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=2025&next=10`,
      { headers: { "x-apisports-key": process.env.API_SPORTS_KEY } }
    );
    const data = await response.json();

    if (!data.response || data.response.length === 0) {
      return res.status(200).json({
        matches: getFallbackMatches(leagueId),
        fallback: true,
      });
    }

    const matches = data.response.map(fixture => ({
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
      conf: Math.floor(Math.random() * 30) + 55,
      verdict: "Analyzing...",
    }));

    return res.status(200).json({ matches });
  } catch (e) {
    return res.status(200).json({
      matches: getFallbackMatches(leagueId),
      fallback: true,
    });
  }
}

function getDynamicDates() {
  const base = new Date();
  const dates = [];
  for (let i = 0; i < 20; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    dates.push(d.toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short"
    }));
  }
  return dates;
}

function getFallbackMatches(leagueId) {
  const d = getDynamicDates();
  const fallbacks = {
    "39":  [
      { id: 1, home: "Arsenal",      away: "Man City",      date: d[0], time: "16:30", venue: "Emirates Stadium",    conf: 74, verdict: "Home Win" },
      { id: 2, home: "Liverpool",    away: "Chelsea",       date: d[2], time: "17:30", venue: "Anfield",             conf: 68, verdict: "Over 2.5" },
      { id: 3, home: "Man Utd",      away: "Tottenham",     date: d[4], time: "15:00", venue: "Old Trafford",        conf: 61, verdict: "BTTS"     },
      { id: 4, home: "Newcastle",    away: "Aston Villa",   date: d[6], time: "15:00", venue: "St. James' Park",     conf: 55, verdict: "Draw"     },
    ],
    "140": [
      { id: 5, home: "Real Madrid",  away: "Barcelona",     date: d[0], time: "21:00", venue: "Santiago Bernabéu",   conf: 81, verdict: "Away Win" },
      { id: 6, home: "Atletico",     away: "Sevilla",       date: d[3], time: "19:00", venue: "Wanda Metropolitano", conf: 66, verdict: "Home Win" },
    ],
    "78":  [
      { id: 7, home: "Bayern",       away: "Dortmund",      date: d[1], time: "18:30", venue: "Allianz Arena",       conf: 78, verdict: "Home Win" },
      { id: 8, home: "Leverkusen",   away: "RB Leipzig",    date: d[4], time: "15:30", venue: "BayArena",            conf: 63, verdict: "Over 2.5" },
    ],
    "135": [
      { id: 9,  home: "Inter Milan", away: "AC Milan",      date: d[2], time: "20:45", venue: "San Siro",            conf: 76, verdict: "Home Win" },
      { id: 10, home: "Juventus",    away: "Napoli",        date: d[5], time: "20:45", venue: "Juventus Stadium",    conf: 64, verdict: "Over 2.5" },
    ],
    "61":  [
      { id: 11, home: "PSG",         away: "Marseille",     date: d[1], time: "21:00", venue: "Parc des Princes",    conf: 79, verdict: "Home Win" },
      { id: 12, home: "Lyon",        away: "Monaco",        date: d[4], time: "19:00", venue: "Groupama Stadium",    conf: 61, verdict: "BTTS"     },
    ],
    "2":   [
      { id: 13, home: "Real Madrid", away: "Bayern Munich", date: d[2], time: "21:00", venue: "Santiago Bernabéu",   conf: 77, verdict: "Over 2.5" },
      { id: 14, home: "Man City",    away: "PSG",           date: d[2], time: "21:00", venue: "Etihad Stadium",      conf: 70, verdict: "Home Win" },
    ],
    "253": [
      { id: 15, home: "LA Galaxy",   away: "LAFC",          date: d[1], time: "21:30", venue: "Dignity Health Sports Park", conf: 58, verdict: "BTTS" },
      { id: 16, home: "Inter Miami", away: "Atlanta Utd",   date: d[3], time: "20:30", venue: "Chase Stadium",       conf: 65, verdict: "Home Win" },
    ],
    "12":  [
      { id: 17, home: "LA Lakers",   away: "Golden State",  date: d[0], time: "22:30", venue: "Crypto.com Arena",    conf: 69, verdict: "Away Win" },
      { id: 18, home: "Boston",      away: "Miami Heat",    date: d[1], time: "00:30", venue: "TD Garden",           conf: 72, verdict: "Home Win" },
    ],
    "1":   [
      { id: 19, home: "Kansas City", away: "Buffalo Bills", date: d[3], time: "21:25", venue: "GEHA Field Arrowhead",conf: 71, verdict: "Home Win" },
      { id: 20, home: "SF 49ers",    away: "Dallas Cowboys",date: d[3], time: "21:25", venue: "Levi's Stadium",      conf: 65, verdict: "Away Cover"},
    ],
    "1mlb":[
      { id: 21, home: "NY Yankees",  away: "Boston",        date: d[0], time: "23:05", venue: "Yankee Stadium",      conf: 62, verdict: "Home Win" },
      { id: 22, home: "LA Dodgers",  away: "SF Giants",     date: d[1], time: "02:10", venue: "Dodger Stadium",      conf: 70, verdict: "Home -1.5"},
    ],
    "57":  [
      { id: 23, home: "Toronto",     away: "Boston",        date: d[0], time: "00:00", venue: "Scotiabank Arena",    conf: 67, verdict: "Home Win" },
      { id: 24, home: "Colorado",    away: "Vegas",         date: d[2], time: "03:00", venue: "Ball Arena",          conf: 71, verdict: "Away Win" },
    ],
    "ufc": [
      { id: 25, home: "Jon Jones",   away: "Stipe Miocic",  date: d[4], time: "04:00", venue: "T-Mobile Arena",      conf: 73, verdict: "Jones KO/TKO" },
    ],
  };
  return fallbacks[leagueId] || [
    { id: 99, home: "No fixtures available", away: "", date: d[0], time: "TBD", venue: "TBD", conf: 60, verdict: "Soon" },
  ];
}

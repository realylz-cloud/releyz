module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { leagueId } = req.query;
  if (!leagueId) return res.status(400).json({ error: "leagueId is required" });

  // ESPN endpoint mapping for each league
  const ESPN_ENDPOINTS = {
    // Soccer
    "39":  "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard",
    "140": "https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard",
    "78":  "https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/scoreboard",
    "135": "https://site.api.espn.com/apis/site/v2/sports/soccer/ita.1/scoreboard",
    "61":  "https://site.api.espn.com/apis/site/v2/sports/soccer/fra.1/scoreboard",
    "2":   "https://site.api.espn.com/apis/site/v2/sports/soccer/UEFA.CHAMPIONS/scoreboard",
    "253": "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard",
    // Basketball
    "12":  "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
    "120": "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard",
    // American Football
    "1":   "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
    "2nfl":"https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard",
    // Baseball
    "1mlb":"https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard",
    // Hockey
    "57":  "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard",
    // MMA
    "ufc": "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard",
  };

  const endpoint = ESPN_ENDPOINTS[leagueId];

  // If no ESPN endpoint use API-Sports for soccer or fallback
  if (!endpoint) {
    return res.status(200).json({
      matches: getFallbackMatches(leagueId),
      fallback: true,
    });
  }

  try {
    const response = await fetch(endpoint);
    const data = await response.json();

    const events = data.events || [];

    if (events.length === 0) {
      // Try API-Sports as backup for soccer leagues
      if (["39","140","78","135","61","2","253"].includes(leagueId)) {
        return await tryApiSports(leagueId, res);
      }
      return res.status(200).json({
        matches: getFallbackMatches(leagueId),
        fallback: true,
      });
    }

    const matches = events.map((event, i) => {
      const competition = event.competitions?.[0];
      const home = competition?.competitors?.find(c => c.homeAway === "home");
      const away = competition?.competitors?.find(c => c.homeAway === "away");
      const date = new Date(event.date);

      return {
        id: event.id || i,
        home: home?.team?.displayName || "Home Team",
        away: away?.team?.displayName || "Away Team",
        date: date.toLocaleDateString("en-GB", {
          weekday: "short", day: "numeric", month: "short"
        }),
        time: date.toLocaleTimeString("en-GB", {
          hour: "2-digit", minute: "2-digit"
        }),
        venue: competition?.venue?.fullName || "TBD",
        status: event.status?.type?.shortDetail || "Scheduled",
        conf: Math.floor(Math.random() * 30) + 55,
        verdict: "Analyzing...",
      };
    });

    return res.status(200).json({ matches });

  } catch (error) {
    console.error("ESPN error:", error);
    return res.status(200).json({
      matches: getFallbackMatches(leagueId),
      fallback: true,
    });
  }
};

// Backup: try API-Sports for soccer
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
  const base = new Date("2026-05-05");
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
      { id: 1, home: "Arsenal",        away: "Man City",       date: d[0], time: "16:30", venue: "Emirates Stadium",       conf: 74, verdict: "Home Win" },
      { id: 2, home: "Liverpool",      away: "Chelsea",        date: d[1], time: "17:30", venue: "Anfield",                conf: 68, verdict: "Over 2.5" },
      { id: 3, home: "Man Utd",        away: "Tottenham",      date: d[2], time: "15:00", venue: "Old Trafford",           conf: 61, verdict: "BTTS"     },
      { id: 4, home: "Newcastle",      away: "Aston Villa",    date: d[3], time: "15:00", venue: "St. James' Park",        conf: 55, verdict: "Draw"     },
    ],
    "140": [
      { id: 5, home: "Real Madrid",    away: "Barcelona",      date: d[0], time: "21:00", venue: "Santiago Bernabéu",      conf: 81, verdict: "Away Win" },
      { id: 6, home: "Atletico",       away: "Sevilla",        date: d[1], time: "19:00", venue: "Wanda Metropolitano",    conf: 66, verdict: "Home Win" },
    ],
    "78":  [
      { id: 7, home: "Bayern",         away: "Dortmund",       date: d[0], time: "18:30", venue: "Allianz Arena",          conf: 78, verdict: "Home Win" },
      { id: 8, home: "Leverkusen",     away: "RB Leipzig",     date: d[1], time: "15:30", venue: "BayArena",               conf: 63, verdict: "Over 2.5" },
    ],
    "135": [
      { id: 9,  home: "Inter Milan",   away: "AC Milan",       date: d[0], time: "20:45", venue: "San Siro",               conf: 76, verdict: "Home Win" },
      { id: 10, home: "Juventus",      away: "Napoli",         date: d[1], time: "20:45", venue: "Juventus Stadium",       conf: 64, verdict: "Over 2.5" },
    ],
    "61":  [
      { id: 11, home: "PSG",           away: "Marseille",      date: d[0], time: "21:00", venue: "Parc des Princes",       conf: 79, verdict: "Home Win" },
      { id: 12, home: "Lyon",          away: "Monaco",         date: d[1], time: "19:00", venue: "Groupama Stadium",       conf: 61, verdict: "BTTS"     },
    ],
    "2":   [
      { id: 13, home: "Real Madrid",   away: "Bayern Munich",  date: d[0], time: "21:00", venue: "Santiago Bernabéu",      conf: 77, verdict: "Over 2.5" },
      { id: 14, home: "Man City",      away: "PSG",            date: d[0], time: "21:00", venue: "Etihad Stadium",         conf: 70, verdict: "Home Win" },
    ],
    "253": [
      { id: 15, home: "LA Galaxy",     away: "LAFC",           date: d[0], time: "21:30", venue: "Dignity Health Sports Park", conf: 58, verdict: "BTTS" },
      { id: 16, home: "Inter Miami",   away: "Atlanta Utd",    date: d[1], time: "20:30", venue: "Chase Stadium",          conf: 65, verdict: "Home Win" },
    ],
    "12":  [
      { id: 17, home: "LA Lakers",     away: "Golden State",   date: d[0], time: "22:30", venue: "Crypto.com Arena",       conf: 69, verdict: "Away Win" },
      { id: 18, home: "Boston",        away: "Miami Heat",     date: d[0], time: "00:30", venue: "TD Garden",              conf: 72, verdict: "Home Win" },
    ],
    "1":   [
      { id: 19, home: "Kansas City",   away: "Buffalo Bills",  date: d[0], time: "21:25", venue: "GEHA Field Arrowhead",   conf: 71, verdict: "Home Win" },
      { id: 20, home: "SF 49ers",      away: "Dallas Cowboys", date: d[0], time: "21:25", venue: "Levi's Stadium",         conf: 65, verdict: "Away Cover"},
    ],
    "1mlb":[
      { id: 21, home: "NY Yankees",    away: "Boston",         date: d[0], time: "23:05", venue: "Yankee Stadium",         conf: 62, verdict: "Home Win" },
      { id: 22, home: "LA Dodgers",    away: "SF Giants",      date: d[0], time: "02:10", venue: "Dodger Stadium",         conf: 70, verdict: "Home -1.5"},
    ],
    "57":  [
      { id: 23, home: "Toronto",       away: "Boston",         date: d[0], time: "00:00", venue: "Scotiabank Arena",       conf: 67, verdict: "Home Win" },
      { id: 24, home: "Colorado",      away: "Vegas",          date: d[0], time: "03:00", venue: "Ball Arena",             conf: 71, verdict: "Away Win" },
    ],
    "ufc": [
      { id: 25, home: "Jon Jones",     away: "Stipe Miocic",   date: d[4], time: "04:00", venue: "T-Mobile Arena, Vegas",  conf: 73, verdict: "Jones KO/TKO" },
      { id: 26, home: "Islam Makhachev",away: "C. Oliveira",   date: d[6], time: "04:00", venue: "Etihad Arena, Abu Dhabi",conf: 70, verdict: "Home Win" },
    ],
  };
  return fallbacks[leagueId] || [
    { id: 99, home: "Fixtures Coming Soon", away: "", date: d[0], time: "TBD", venue: "TBD", conf: 60, verdict: "Soon" },
  ];
}

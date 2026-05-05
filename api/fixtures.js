module.export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { leagueId } = req.query;

  try {
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=2024&next=10`,
      {
        method: "GET",
        headers: {
          "x-apisports-key": process.env.API_SPORTS_KEY,
          "x-rapidapi-key": process.env.API_SPORTS_KEY,
        },
      }
    );

    const data = await response.json();
    console.log("API Response:", JSON.stringify(data).substring(0, 500));

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
      { id: 1, home: "Arsenal",   away: "Man City",    date: "Tue 6 May",  time: "16:30", venue: "Emirates Stadium", conf: 74, verdict: "Home Win" },
      { id: 2, home: "Liverpool", away: "Chelsea",     date: "Wed 7 May",  time: "17:30", venue: "Anfield",          conf: 68, verdict: "Over 2.5" },
      { id: 3, home: "Man Utd",   away: "Tottenham",   date: "Thu 8 May",  time
}

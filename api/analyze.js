module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { match, league, sport, analysisTypes } = req.body;
  if (!match || !league) return res.status(400).json({ error: "Missing data" });

  const now = new Date();
  const today = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const seasonStart = month >= 8 ? year : year - 1;
  const currentSeason = seasonStart + "/" + (seasonStart + 1);
  const americanSeason = month >= 9 ? year : year - 1;

  const homeTeam = match.home;
  const awayTeam = match.away;
  const leagueName = league.name;
  const matchDate = match.date;
  const matchTime = match.time || "TBD";
  const matchVenue = match.venue || "TBD";
  const sportLabel = sport ? sport.label : "Soccer";

  const prompt =
    "You are Releyz, an elite sports betting analyst. Today is " + today + ".\n\n" +
    "Search the web for current information about this match then write an analysis.\n\n" +
    "Match: " + homeTeam + " vs " + awayTeam + "\n" +
    "League: " + leagueName + "\n" +
    "Sport: " + sportLabel + "\n" +
    "Date: " + matchDate + " at " + matchTime + "\n" +
    "Venue: " + matchVenue + "\n" +
    "Season: " + cu

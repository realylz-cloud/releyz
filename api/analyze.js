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
  const prompt = "You are Releyz, an elite sports betting analyst. Today is " + today + ". Season: " + currentSeason + " (American sports: " + americanSeason + ").\n\nSearch the web for current information then analyze this match:\nMatch: " + homeTeam + " vs " + awayTeam + "\nLeague: " + leagueName + "\nSport: " + sportLabel + "\nDate: " + matchDate + " at " + matchTime + "\nVenue: " + matchVenue + "\n\nSearch for current form, injuries, head to head, squad news. Use only what you find. Do not use outdated training data. Do not mention players who have left the club.\n\nReturn your analysis using EXACTLY these labels on separate lines:\nVERDICT: [one sharp sentence]\nCONFIDENCE: [number 50-90]\nFORM_CONTENT: [3-4 sentences about current form. No apostrophes.]\nFORM_HOME_LAST5: [e.g. W W D W L]\nFORM_AWAY_LAST5: [e.g. L W W L W]\nFORM_HOME_POS: [e.g. 4th]\nFORM_AWAY_POS: [e.g. 8th]\nFORM_POINT1: [insight about home team]\nFORM_POINT2: [insight about away team]\nFORM_POINT3: [how form affects matchup]\nH2H_CONTENT: [2-3 sentences. No apostrophes.]\nH2H_LAST5: [e.g. 3W 1D 1L]\nH2H_LAST_MATCH: [e.g. 2-1 Home Win]\nH2H_AVG_GOALS: [e.g. 2.6 per game]\nH2H_POINT1: [H2H insight]\nH2H_POINT2: [what record suggests]\nH2H_POINT3: [recent context]\nNEWS_CONTENT: [2-3 sentences current squad. No apostrophes.]\nNEWS_HOME_INJURIES: [e.g. 2 doubts]\nNEWS_AWAY_INJURIES: [e.g. 3 out]\nNEWS_POINT1: [key home player]\nNEWS_POINT2: [key away concern]\nNEWS_POINT3: [team news impact on betting]\nTACTICS_CONTENT: [3-4 sentences tactical breakdown. No apostrophes.]\nTACTICS_HOME_GOALS: [e.g. 1.8 per game]\nTACTICS_AWAY_GOALS: [e.g. 1.3 per game]\nTACTICS_HOME_CS: [e.g. 7 in 17]\nTACTICS_AWAY_CS: [e.g. 4 in 17]\nTACTICS_POINT1: [home setup]\nTACTICS_POINT2: [away approach on road]\nTACTICS_POINT3: [tactical implication for bettors]\nBET1_MARKET: [e.g. Match Winner]\nBET1_PICK: [specific pick]\nBET1_REASONING: [2 sentences. No apostrophes.]\nBET1_RISK: [Low or Medium or High]\nBET1_VALUE: [Fair or Good or Excellent]\nBET2_MARKET: [e.g. Total Goals]\nBET2_PICK: [e.g. Over 2.5 Goals]\nBET2_REASONING: [2 sentences. No apostrophes.]\nBET2_RISK: [Low or Medium or High]\nBET2_VALUE: [Fair or Good or Excellent]\nBET3_MARKET: [e.g. Both Teams to Score]\nBET3_PICK: [Yes or No]\nBET3_REASONING: [2 sentences. No apostrophes.]\nBET3_RISK: [Low or Medium or High]\nBET3_VALUE: [Fair or Good or Excellent]\nREDFLAG1: [specific risk factor]\nREDFLAG2: [injury or rotation concern]\nREDFLAG3: [external factor]\nSUMMARY: [3 sentences. Strongest bet first. Key reason. Main risk. No apostrophes.]";
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "web-search-2025-03-05",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 6 }],
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const rawText = await response.text();
    var data;
    try { data = JSON.parse(rawText); }
    catch (e) { return res.status(500).json({ error: "Failed to parse API response" }); }
    if (data.error) return res.status(500).json({ error: data.error.message });
    if (!data.content || data.content.length === 0) return res.status(500).json({ error: "Empty response" });

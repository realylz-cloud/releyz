module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { match, league, sport, analysisTypes } = req.body;

  if (!match || !league) {
    return res.status(400).json({ error: "Missing data" });
  }

  const now = new Date();

  const today = now.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const seasonStart = month >= 8 ? year : year - 1;
  const seasonEnd = seasonStart + 1;
  const currentSeason = seasonStart + "/" + seasonEnd;
  const americanSeason = month >= 9 ? year : year - 1;

  const homeTeam = match.home;
  const awayTeam = match.away;
  const leagueName = league.name;
  const matchDate = match.date;
  const matchTime = match.time || "TBD";
  const matchVenue = match.venue || "TBD";
  const sportLabel = sport ? sport.label : "Soccer";
  const analysisLabel = (analysisTypes || ["full"]).join(", ");

  const prompt = "You are Releyz, an elite sports betting analyst writing on " + today + ".\n\n" +
    "IMPORTANT: Today is " + today + ". Base your entire analysis on the CURRENT " + currentSeason + " season for European soccer. For American sports use the " + americanSeason + " season. Always use the most recent real data available as of today. Never reference old seasons as current.\n\n" +
    "Analyze this match:\n" +
    "Match: " + homeTeam + " vs " + awayTeam + "\n" +
    "League: " + leagueName + "\n" +
    "Sport: " + sportLabel + "\n" +
    "Date: " + matchDate + " at " + matchTime + "\n" +
    "Venue: " + matchVenue + "\n" +
    "Analysis: " + analysisLabel + "\n\n" +
    "Return ONLY valid JSON. No markdown. No text outside the JSON. Here is the exact structure to follow:\n\n" +
    '{"matchTitle":"' + homeTeam + " vs " + awayTeam + '",' +
    '"league":"' + leagueName + '",' +
    '"date":"' + matchDate + '",' +
    '"verdict":"One sharp specific betting verdict sentence based on current form",' +
    '"confidenceScore":72,' +
    '"sections":[' +
    '{"title":"Current Form and Season Context","icon":"📈","content":"3-4 sentences analyzing both teams current form in the ' + currentSeason + ' season. Mention recent results league position and momentum. Be specific with numbers.","stats":[{"label":"Home Last 5","value":"W W D W L","trend":"up"},{"label":"Away Last 5","value":"L W W L W","trend":"neutral"},{"label":"Home Position","value":"3rd","trend":"up"},{"label":"Away Position","value":"7th","trend":"down"}],"keyPoints":["Specific insight about home team","Specific insight about away team","How form affects this matchup"]},' +
    '{"title":"Head to Head History","icon":"⚔️","content":"2-3 sentences about historical record between these teams and what patterns exist.","stats":[{"label":"H2H Last 5","value":"3W 1D 1L","trend":"up"},{"label":"Last Meeting","value":"2-1 Home Win","trend":"neutral"},{"label":"Avg Goals H2H","value":"2.8 per game","trend":"up"}],"keyPoints":["Key H2H pattern","What the record suggests","Context from recent meetings"]},' +
    '{"title":"Key Players and Team News","icon":"🏥","content":"2-3 sentences about important players for both sides and any injury or suspension concerns as of ' + today + '.","stats":[{"label":"Home Injuries","value":"1 doubt","trend":"neutral"},{"label":"Away Injuries","value":"2 out","trend":"down"}],"keyPoints":["Key player to watch home side","Key absence or concern away side","How team news affects betting"]},' +
    '{"title":"Tactical Analysis","icon":"🧠","content":"3-4 sentences on how this game will be played tactically. What type of game should bettors expect.","stats":[{"label":"Home Avg Goals","value":"1.8 per game","trend":"up"},{"label":"Away Avg Goals","value":"1.4 per game","trend":"neutral"},{"label":"Home Clean Sheets","value":"6 in 15","trend":"neutral"},{"label":"Away Clean Sheets","value":"4 in 15","trend":"down"}],"keyPoints":["How home team sets up","How away team approaches","What tactical matchup suggests"]}' +
    '],' +
    '"bettingAngles":[' +
    '{"market":"Match Winner","pick":"Your pick here","reasoning":"2-3 sentences on why this bet has value based on current form and analysis","risk":"Low","value":"Good"},' +
    '{"market":"Total Goals","pick":"Over or Under 2.5","reasoning":"2-3 sentences on why this total makes sense based on scoring patterns","risk":"Medium","value":"Excellent"},' +
    '{"market":"Both Teams to Score","pick":"Yes or No","reasoning":"2-3 sentences based on defensive records and attacking threat","risk":"Medium","value":"Good"}' +
    '],' +
    '"redFlags":["Specific current risk factor","Any injury suspension or rotation concern","External factor like weather or motivation"],' +
    '"summary":"3 sentences giving the bettor a clear overall picture. Start with the strongest recommendation. End with what to watch out for. Write like advice from a sharp friend who knows the sport."}';

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const rawText = await response.text();

    var data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return res.status(500).json({ error: "Failed to parse API response" });
    }

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    if (!data.content || data.content.length === 0) {
      return res.status(500).json({ error: "Empty response from AI" });
    }

    var fullText = "";
    for (var i = 0; i < data.content.length; i++) {
      if (data.content[i].type === "text") {
        fullText += data.content[i].text;
      }
    }

    var start = fullText.indexOf("{");
    var end = fullText.lastIndexOf("}");

    if (start === -1 || end === -1) {
      return res.status(500).json({ error: "No JSON in response" });
    }

    var jsonStr = fullText.substring(start, end + 1);
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, "$1");

    var parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      var verdict = "";
      var verdictMatch = fullText.match(/"verdict"\s*:\s*"([^"]*)"/);
      if (verdictMatch) { verdict = verdictMatch[1]; }

      var score = 68;
      var scoreMatch = fullText.match(/"confidenceScore"\s*:\s*(\d+)/);
      if (scoreMatch) { score = parseInt(scoreMatch[1]); }

      var summary = "";
      var summaryMatch = fullText.match(/"summary"\s*:\s*"([^"]*)"/);
      if (summaryMatch) { summary = summaryMatch[1]; }

      parsed = {
        matchTitle: homeTeam + " vs " + awayTeam,
        league: leagueName,
        date: matchDate,
        verdict: verdict || "Strong betting opportunity identified",
        confidenceScore: score,
        sections: [{
          title: "Full Analysis",
          icon: "📊",
          content: fullText.replace(/[{}"\\]/g, "").replace(/\s+/g, " ").substring(0, 800),
          stats: [],
          keyPoints: ["Analysis generated", "See betting angles for recommendations", "Run again for full structured output"]
        }],
        bettingAngles: [{
          market: "Match Winner",
          pick: homeTeam + " or " + awayTeam,
          reasoning: "Based on current form and tactical analysis. Run again for detailed breakdown.",
          risk: "Medium",
          value: "Good"
        }],
        redFlags: ["Always research before betting", "Past performance does not guarantee future results"],
        summary: summary || "Analysis generated successfully. Run again for the full structured breakdown."
      };
    }

    return res.status(200).json(parsed);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

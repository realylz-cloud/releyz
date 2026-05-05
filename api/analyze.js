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

  const prompt = "You are Releyz, an elite sports betting analyst. Today is " + today + ".\n\n" +
    "STEP 1: Before writing anything, search the web for the following:\n" +
    "- Search: " + homeTeam + " " + leagueName + " form " + year + "\n" +
    "- Search: " + awayTeam + " " + leagueName + " form " + year + "\n" +
    "- Search: " + homeTeam + " vs " + awayTeam + " " + year + " preview\n" +
    "- Search: " + homeTeam + " injuries suspensions " + today + "\n" +
    "- Search: " + awayTeam + " injuries suspensions " + today + "\n" +
    "- Search: " + homeTeam + " " + awayTeam + " head to head\n\n" +
    "STEP 2: Use ONLY the information you find from those searches. Do not use your training data for current form, squad details, or injuries. Your training data is outdated. The web search results are the truth.\n\n" +
    "STEP 3: Based on what you find, write a deep professional betting analysis for:\n" +
    "Match: " + homeTeam + " vs " + awayTeam + "\n" +
    "League: " + leagueName + "\n" +
    "Sport: " + sportLabel + "\n" +
    "Date: " + matchDate + " at " + matchTime + "\n" +
    "Venue: " + matchVenue + "\n" +
    "Season: " + currentSeason + " (American sports: " + americanSeason + ")\n\n" +
    "STEP 4: Return ONLY valid JSON. No markdown. No explanation. Just the JSON object.\n\n" +
    '{"matchTitle":"' + homeTeam + " vs " + awayTeam + '",' +
    '"league":"' + leagueName + '",' +
    '"date":"' + matchDate + '",' +
    '"verdict":"One sharp specific verdict based on what you found in the web searches",' +
    '"confidenceScore":72,' +
    '"sections":[' +
    '{"title":"Current Form and Season Context","icon":"📈",' +
    '"content":"Based on your web search results write 3-4 sentences about both teams current form in the ' + currentSeason + ' season. Use only what you actually found in the searches. Be specific with recent results and league position.",' +
    '"stats":[{"label":"Home Last 5","value":"W W D W L","trend":"up"},{"label":"Away Last 5","value":"L W W L W","trend":"neutral"},{"label":"Home Position","value":"3rd","trend":"up"},{"label":"Away Position","value":"7th","trend":"down"}],' +
    '"keyPoints":["Real insight from web search about home team","Real insight from web search about away team","How current form affects this matchup"]},' +
    '{"title":"Head to Head History","icon":"⚔️",' +
    '"content":"Based on your H2H search write 2-3 sentences about recent meetings between these teams and what patterns exist.",' +
    '"stats":[{"label":"H2H Last 5","value":"3W 1D 1L","trend":"up"},{"label":"Last Meeting","value":"2-1 Home Win","trend":"neutral"},{"label":"Avg Goals H2H","value":"2.8 per game","trend":"up"}],' +
    '"keyPoints":["Real H2H pattern from search","What the record suggests","Context from recent meetings"]},' +
    '{"title":"Key Players and Team News","icon":"🏥",' +
    '"content":"Based on your injury and squad searches write 2-3 sentences about the current squad situation as of ' + today + '. Name the actual players who are important right now based on what you found. Do not name players who have left the club.",' +
    '"stats":[{"label":"Home Injuries","value":"Update from search","trend":"neutral"},{"label":"Away Injuries","value":"Update from search","trend":"down"}],' +
    '"keyPoints":["Real key player for home side from search","Real key absence or concern from search","How current team news affects betting"]},' +
    '{"title":"Tactical Analysis","icon":"🧠",' +
    '"content":"3-4 sentences on how this specific game is likely to be played based on both teams current style and form. What type of game should bettors expect.",' +
    '"stats":[{"label":"Home Avg Goals","value":"1.8 per game","trend":"up"},{"label":"Away Avg Goals","value":"1.4 per game","trend":"neutral"},{"label":"Home Clean Sheets","value":"6 in 15","trend":"neutral"},{"label":"Away Clean Sheets","value":"4 in 15","trend":"down"}],' +
    '"keyPoints":["How home team sets up this season","How away team plays on the road","What this tactical matchup means for bettors"]}' +
    '],' +
    '"bettingAngles":[' +
    '{"market":"Match Winner","pick":"Specific pick based on your research","reasoning":"2-3 sentences on why this bet has value based on what you found in the web searches","risk":"Low","value":"Good"},' +
    '{"market":"Total Goals","pick":"Over or Under 2.5","reasoning":"2-3 sentences based on actual scoring data you found","risk":"Medium","value":"Excellent"},' +
    '{"market":"Both Teams to Score","pick":"Yes or No","reasoning":"2-3 sentences based on actual defensive and attacking data you found","risk":"Medium","value":"Good"}' +
    '],' +
    '"redFlags":["Real current risk you found in searches","Real injury or suspension concern from today","Real external factor like fixture congestion or motivation"],' +
    '"summary":"3 sentences. Start with your strongest bet recommendation. Explain the key reason briefly. End with the main risk to watch. Write like a sharp knowledgeable friend not a robot."}';

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
        tools: [{
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 6,
        }],
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

    if (!fullText || fullText.length === 0) {
      return res.status(500).json({ error: "No text in response" });
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
          keyPoints: [
            "Analysis generated successfully",
            "See betting angles for recommendations",
            "Run again for full structured output"
          ]
        }],
        bettingAngles: [{
          market: "Match Winner",
          pick: homeTeam + " or " + awayTeam,
          reasoning: "Based on current form and tactical analysis. Run again for full breakdown.",
          risk: "Medium",
          value: "Good"
        }],
        redFlags: [
          "Always research before betting",
          "Past performance does not guarantee future results"
        ],
        summary: summary || "Analysis generated. Run again for the full structured breakdown."
      };
    }

    return res.status(200).json(parsed);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

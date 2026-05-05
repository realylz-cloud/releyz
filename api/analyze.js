module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  var match = req.body.match;
  var league = req.body.league;
  var sport = req.body.sport;
  var analysisTypes = req.body.analysisTypes;
  if (!match || !league) return res.status(400).json({ error: "Missing data" });

  var now = new Date();
  var today = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  var month = now.getMonth() + 1;
  var year = now.getFullYear();
  var seasonStart = month >= 8 ? year : year - 1;
  var currentSeason = seasonStart + "/" + (seasonStart + 1);
  var americanSeason = month >= 9 ? year : year - 1;
  var homeTeam = match.home;
  var awayTeam = match.away;
  var leagueName = league.name;
  var matchDate = match.date;
  var matchTime = match.time || "TBD";
  var matchVenue = match.venue || "TBD";
  var sportLabel = sport ? sport.label : "Soccer";
  var analysisLabel = analysisTypes ? analysisTypes.join(", ") : "full";

  var prompt = "You are Releyz, an elite sports betting analyst. Today is " + today + ". Current season: " + currentSeason + ". American sports season: " + americanSeason + ".\n\n";
  prompt += "IMPORTANT: Search the web before writing anything. Do not use training data for current form or squad details. Training data is outdated.\n\n";
  prompt += "Match: " + homeTeam + " vs " + awayTeam + "\n";
  prompt += "League: " + leagueName + "\n";
  prompt += "Sport: " + sportLabel + "\n";
  prompt += "Date: " + matchDate + " at " + matchTime + "\n";
  prompt += "Venue: " + matchVenue + "\n\n";
  prompt += "Search for these before analyzing:\n";
  prompt += "1. " + homeTeam + " " + leagueName + " form " + year + "\n";
  prompt += "2. " + awayTeam + " " + leagueName + " form " + year + "\n";
  prompt += "3. " + homeTeam + " vs " + awayTeam + " preview " + year + "\n";
  prompt += "4. " + homeTeam + " injuries " + today + "\n";
  prompt += "5. " + awayTeam + " injuries " + today + "\n";
  prompt += "6. " + homeTeam + " " + awayTeam + " head to head\n\n";
  prompt += "Use ONLY what you find. Do not mention players who have left the club.\n\n";
  prompt += "Write your response using EXACTLY these labels. Each label on its own line. No apostrophes in text.\n\n";
  prompt += "VERDICT: one sharp betting verdict sentence\n";
  prompt += "CONFIDENCE: number between 50 and 90\n";
  prompt += "FORM_CONTENT: 3-4 sentences about current form this season\n";
  prompt += "FORM_HOME_LAST5: last 5 results e.g. W W D W L\n";
  prompt += "FORM_AWAY_LAST5: last 5 results e.g. L W W L W\n";
  prompt += "FORM_HOME_POS: league position e.g. 4th\n";
  prompt += "FORM_AWAY_POS: league position e.g. 8th\n";
  prompt += "FORM_POINT1: key insight about home team\n";
  prompt += "FORM_POINT2: key insight about away team\n";
  prompt += "FORM_POINT3: how current form affects this matchup\n";
  prompt += "H2H_CONTENT: 2-3 sentences about head to head history\n";
  prompt += "H2H_LAST5: H2H record e.g. 3W 1D 1L\n";
  prompt += "H2H_LAST_MATCH: last meeting result e.g. 2-1 Home Win\n";
  prompt += "H2H_AVG_GOALS: average goals e.g. 2.6 per game\n";
  prompt += "H2H_POINT1: one H2H insight\n";
  prompt += "H2H_POINT2: what the record suggests\n";
  prompt += "H2H_POINT3: relevant recent context\n";
  prompt += "NEWS_CONTENT: 2-3 sentences about current squad and injuries today. Only players currently at the club.\n";
  prompt += "NEWS_HOME_INJURIES: injury situation e.g. 2 doubts\n";
  prompt += "NEWS_AWAY_INJURIES: injury situation e.g. 3 out\n";
  prompt += "NEWS_POINT1: key player to watch home side\n";
  prompt += "NEWS_POINT2: key absence or concern away side\n";
  prompt += "NEWS_POINT3: how team news affects betting\n";
  prompt += "TACTICS_CONTENT: 3-4 sentences on tactical matchup and what type of game to expect\n";
  prompt += "TACTICS_HOME_GOALS: average goals scored e.g. 1.8 per game\n";
  prompt += "TACTICS_AWAY_GOALS: average goals scored e.g. 1.3 per game\n";
  prompt += "TACTICS_HOME_CS: clean sheets e.g. 7 in 17\n";
  prompt += "TACTICS_AWAY_CS: clean sheets e.g. 4 in 17\n";
  prompt += "TACTICS_POINT1: how home team sets up\n";
  prompt += "TACTICS_POINT2: how away team plays on the road\n";
  prompt += "TACTICS_POINT3: what tactical matchup means for bettors\n";
  prompt += "BET1_MARKET: market name e.g. Match Winner\n";
  prompt += "BET1_PICK: specific pick\n";
  prompt += "BET1_REASONING: 2 sentences why this bet has value\n";
  prompt += "BET1_RISK: Low or Medium or High\n";
  prompt += "BET1_VALUE: Fair or Good or Excellent\n";
  prompt += "BET2_MARKET: market name e.g. Total Goals\n";
  prompt += "BET2_PICK: specific pick e.g. Over 2.5 Goals\n";
  prompt += "BET2_REASONING: 2 sentences based on scoring data\n";
  prompt += "BET2_RISK: Low or Medium or High\n";
  prompt += "BET2_VALUE: Fair or Good or Excellent\n";
  prompt += "BET3_MARKET: market name e.g. Both Teams to Score\n";
  prompt += "BET3_PICK: Yes or No\n";
  prompt += "BET3_REASONING: 2 sentences based on defensive and attacking records\n";
  prompt += "BET3_RISK: Low or Medium or High\n";
  prompt += "BET3_VALUE: Fair or Good or Excellent\n";
  prompt += "REDFLAG1: one specific current risk factor\n";
  prompt += "REDFLAG2: one injury suspension or rotation concern\n";
  prompt += "REDFLAG3: one external factor like motivation or fixture congestion\n";
  prompt += "SUMMARY: 3 sentences. Strongest bet first. Key reason. Main risk. Write like advice from a sharp friend.";

  try {
    var response = await fetch("https://api.anthropic.com/v1/messages", {
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

    var rawText = await response.text();
    var data;
    try { data = JSON.parse(rawText); }
    catch (e) { return res.status(500).json({ error: "Failed to parse API response" }); }

    if (data.error) return res.status(500).json({ error: data.error.message });
    if (!data.content || data.content.length === 0) return res.status(500).json({ error: "Empty response" });

    var fullText = "";
    for (var i = 0; i < data.content.length; i++) {
      if (data.content[i].type === "text") fullText += data.content[i].text;
    }
    if (!fullText) return res.status(500).json({ error: "No text in response" });

    function extract(key) {
      var regex = new RegExp(key + ":\\s*(.+?)(?=\\n[A-Z0-9_]+:|$)", "s");
      var m = fullText.match(regex);
      return m ? m[1].trim().replace(/\n/g, " ").replace(/\s+/g, " ") : "";
    }

    var confidence = parseInt(extract("CONFIDENCE")) || 70;
    if (isNaN(confidence) || confidence < 50 || confidence > 99) confidence = 70;

    var result = {
      matchTitle: homeTeam + " vs " + awayTeam,
      league: leagueName,
      date: matchDate,
      verdict: extract("VERDICT") || "Strong opportunity identified",
      confidenceScore: confidence,
      sections: [
        {
          title: "Current Form and Season Context",
          icon: "📈",
          content: extract("FORM_CONTENT") || "Analysis based on current season data.",
          stats: [
            { label: "Home Last 5", value: extract("FORM_HOME_LAST5") || "See analysis", trend: "up" },
            { label: "Away Last 5", value: extract("FORM_AWAY_LAST5") || "See analysis", trend: "neutral" },
            { label: "Home Position", value: extract("FORM_HOME_POS") || "See analysis", trend: "up" },
            { label: "Away Position", value: extract("FORM_AWAY_POS") || "See analysis", trend: "down" }
          ],
          keyPoints: [
            extract("FORM_POINT1") || "Home team analysis",
            extract("FORM_POINT2") || "Away team analysis",
            extract("FORM_POINT3") || "Form context"
          ]
        },
        {
          title: "Head to Head History",
          icon: "⚔️",
          content: extract("H2H_CONTENT") || "Historical record between these sides.",
          stats: [
            { label: "H2H Last 5", value: extract("H2H_LAST5") || "See analysis", trend: "up" },
            { label: "Last Meeting", value: extract("H2H_LAST_MATCH") || "See analysis", trend: "neutral" },
            { label: "Avg Goals H2H", value: extract("H2H_AVG_GOALS") || "See analysis", trend: "up" }
          ],
          keyPoints: [
            extract("H2H_POINT1") || "H2H pattern",
            extract("H2H_POINT2") || "What record suggests",
            extract("H2H_POINT3") || "Recent context"
          ]
        },
        {
          title: "Key Players and Team News",
          icon: "🏥",
          content: extract("NEWS_CONTENT") || "Current squad and injury situation.",
          stats: [
            { label: "Home Injuries", value: extract("NEWS_HOME_INJURIES") || "Check latest", trend: "neutral" },
            { label: "Away Injuries", value: extract("NEWS_AWAY_INJURIES") || "Check latest", trend: "down" }
          ],
          keyPoints: [
            extract("NEWS_POINT1") || "Key home player",
            extract("NEWS_POINT2") || "Key away concern",
            extract("NEWS_POINT3") || "Team news impact"
          ]
        },
        {
          title: "Tactical Analysis",
          icon: "🧠",
          content: extract("TACTICS_CONTENT") || "Tactical breakdown of this fixture.",
          stats: [
            { label: "Home Avg Goals", value: extract("TACTICS_HOME_GOALS") || "See analysis", trend: "up" },
            { label: "Away Avg Goals", value: extract("TACTICS_AWAY_GOALS") || "See analysis", trend: "neutral" },
            { label: "Home Clean Sheets", value: extract("TACTICS_HOME_CS") || "See analysis", trend: "neutral" },
            { label: "Away Clean Sheets", value: extract("TACTICS_AWAY_CS") || "See analysis", trend: "down" }
          ],
          keyPoints: [
            extract("TACTICS_POINT1") || "Home setup",
            extract("TACTICS_POINT2") || "Away approach",
            extract("TACTICS_POINT3") || "Tactical implication"
          ]
        }
      ],
      bettingAngles: [
        {
          market: extract("BET1_MARKET") || "Match Winner",
          pick: extract("BET1_PICK") || homeTeam,
          reasoning: extract("BET1_REASONING") || "Based on current form and analysis.",
          risk: extract("BET1_RISK") || "Medium",
          value: extract("BET1_VALUE") || "Good"
        },
        {
          market: extract("BET2_MARKET") || "Total Goals",
          pick: extract("BET2_PICK") || "Over 2.5 Goals",
          reasoning: extract("BET2_REASONING") || "Based on scoring patterns.",
          risk: extract("BET2_RISK") || "Medium",
          value: extract("BET2_VALUE") || "Good"
        },
        {
          market: extract("BET3_MARKET") || "Both Teams to Score",
          pick: extract("BET3_PICK") || "Yes",
          reasoning: extract("BET3_REASONING") || "Based on defensive records.",
          risk: extract("BET3_RISK") || "Medium",
          value: extract("BET3_VALUE") || "Good"
        }
      ],
      redFlags: [
        extract("REDFLAG1") || "Always research before betting",
        extract("REDFLAG2") || "Check latest injury news",
        extract("REDFLAG3") || "Past results do not guarantee future outcomes"
      ],
      summary: extract("SUMMARY") || "Strong analysis generated. Check overview and betting angles for full context."
    };

    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

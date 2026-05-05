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

  // ── AUTO DATE & SEASON CALCULATION ──────────────────────────
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
        messages: [{
          role: "user",
          content: `You are Releyz, an elite sports betting analyst writing on ${today}.

IMPORTANT: Today is ${today}. Base your entire analysis on the CURRENT ${currentSeason} season for European soccer and leagues that run across two calendar years. For American sports (NBA, NFL, MLB, NHL, UFC) use the ${americanSeason} season. Always use the most recent real data available as of today. Never reference old seasons as if they are current.

Analyze this upcoming match with the depth and quality of a professional betting analyst:

Match: ${match.home} vs ${match.away}
League: ${league.name}
Sport: ${sport ? sport.label : "Soccer"}
Date: ${match.date} at ${match.time}
Venue: ${match.venue || "TBD"}
Analysis requested: ${(analysisTypes || ["full"]).join(", ")}

Write a thorough, insightful analysis covering:
- Current form of both teams in the ${currentSeason} season
- Head to head record and what it tells us
- Key players, injuries and suspensions as of ${today}
- Tactical matchup and how the game is likely to play out
- The best betting angles with clear reasoning
- What could go wrong

Return ONLY this exact JSON structure with no markdown and no text outside it:
{
  "matchTitle": "${match.home} vs ${match.away}",
  "league": "${league.name}",
  "date": "${match.date}",
  "verdict": "One sharp specific betting verdict sentence based on current form",
  "confidenceScore": 72,
  "sections": [
    {
      "title": "Current Form & Season Context",
      "icon": "📈",
      "content": "Write 3-4 sentences analyzing both teams current form in the ${currentSeason} season. Mention their recent results, where they sit in the table, momentum, and any context that matters for this specific game. Be specific with results and numbers.",
      "stats": [
        {"label": "Home Last 5", "value": "W W D W L", "trend": "up"},
        {"label": "Away Last 5", "value": "L W W L W", "trend": "neutral"},
        {"label": "Home Position", "value": "3rd", "trend": "up"},
        {"label": "Away Position", "value": "7th", "trend": "down"}
      ],
      "keyPoints": [
        "Specific insight about home team current form",
        "Specific insight about away team current form",
        "How their current form makes this matchup interesting"
      ]
    },
    {
      "title": "Head to Head History",
      "icon": "⚔️",
      "content": "Write 2-3 sentences about the historical record between these teams. What does the H2H tell us about likely outcomes? Are there any notable patterns in how these teams play each other?",
      "stats": [
        {"label": "H2H Last 5", "value": "3W 1D 1L", "trend": "up"},
        {"label": "Last Meeting", "value": "2-1 Home Win", "trend": "neutral"},
        {"label": "Avg Goals H2H", "value": "2.8 per game", "trend": "up"}
      ],
      "keyPoints": [
        "Key H2H pattern or trend",
        "What the record suggests about this fixture",
        "Any relevant context from recent meetings"
      ]
    },
    {
      "title": "Key Players & Team News",
      "icon": "🏥",
      "content": "Write 2-3 sentences about the most important players for both sides and any injury or suspension concerns as of ${today}. Who are the players that will make the difference in this game?",
      "stats": [
        {"label": "Home Injuries", "value": "1 doubt", "trend": "neutral"},
        {"label": "Away Injuries", "value": "2 out", "trend": "down"}
      ],
      "keyPoints": [
        "Key player to watch for home side",
        "Key player or absence for away side",
        "How team news affects the betting picture"
      ]
    },
    {
      "title": "Tactical Analysis",
      "icon": "🧠",
      "content": "Write 3-4 sentences breaking down how this game is likely to be played tactically. What are each teams strengths and weaknesses? How do their styles match up? What type of game should bettors expect — open tight high scoring or defensive?",
      "stats": [
        {"label": "Home Avg Goals", "value": "1.8 per game", "trend": "up"},
        {"label": "Away Avg Goals", "value": "1.4 per game", "trend": "neutral"},
        {"label": "Home Clean Sheets", "value": "6 in 15", "trend": "neutral"},
        {"label": "Away Clean Sheets", "value": "4 in 15", "trend": "down"}
      ],
      "keyPoints": [
        "How home team is likely to set up",
        "How away team is likely to approach this game",
        "What type of match this tactical matchup suggests"
      ]
    }
  ],
  "bettingAngles": [
    {
      "market": "Match Winner",
      "pick": "Specific pick here",
      "reasoning": "2-3 sentences explaining exactly why this bet has value based on current form H2H and tactical analysis",
      "risk": "Low",
      "value": "Good"
    },
    {
      "market": "Total Goals",
      "pick": "Over or Under 2.5 Goals",
      "reasoning": "2-3 sentences explaining why this total makes sense based on both teams scoring patterns and how the game is likely to play out",
      "risk": "Medium",
      "value": "Excellent"
    },
    {
      "market": "Both Teams to Score",
      "pick": "Yes or No",
      "reasoning": "2-3 sentences explaining the reasoning based on defensive records and attacking threat",
      "risk": "Medium",
      "value": "Good"
    }
  ],
  "redFlags": [
    "Specific current risk factor that could affect the result",
    "Any injury suspension or rotation concern as of ${today}",
    "Any external factor like weather fixture congestion or motivation"
  ],
  "summary": "Write 3 sentences giving the bettor a clear overall picture. Start with the strongest betting recommendation explain the reasoning briefly and end with what to watch out for. Make it feel like advice from a sharp friend who really knows their sport."
}`
        }],
      }),
    });

    const rawText = await response.text();

    let data;
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

    const fullText = data.content
      .filter(function(b) { return b.type === "text"; })
      .map(function(b) { return b.text; })
      .join("");

    const start = fullText.indexOf("{");
    const end = fullText.lastIndexOf("}");

    if (start === -1 || end === -1) {
      return res.status(500).json({ error: "No JSON in response" });
    }

    let jsonStr = fullText.substring(start, end + 1);

// Aggressive JSON repair
jsonStr = jsonStr
  .replace(/,(\s*[}\]])/g, "$1")           // Remove trailing commas
  .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":') // Quote unquoted keys
  .replace(/:\s*'([^']*?)'/g, ': "$1"')     // Single to double quotes
  .replace(/\n/g, " ")                       // Remove newlines inside strings
  .replace(/\r/g, "")                        // Remove carriage returns
  .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ") // Remove control characters
  .replace(/"\s*:\s*"/g, '": "')             // Fix spacing around colons
  .replace(/,\s*,/g, ",")                    // Remove double commas
  .replace(/\[\s*,/g, "[")                   // Remove leading commas in arrays
  .replace(/,\s*\]/g, "]");                  // Remove trailing commas in arrays

let parsed;
try {
  parsed = JSON.parse(jsonStr);
} catch (e) {
  // Last resort — try to extract just the fields we need manually
  try {
    const getField = (field) => {
      const regex = new RegExp('"' + field + '"\\s*:\\s*"([^"]*)"');
      const match = fullText.match(regex);
      return match ? match[1] : "";
    };
    const getNumber = (field) => {
      const regex = new RegExp('"' + field + '"\\s*:\\s*(\\d+)');
      const match = fullText.match(regex);
      return match ? parseInt(match[1]) : 68;
    };

    parsed = {
      matchTitle: match.home + " vs " + match.away,
      league: league.name,
      date: match.date,
      verdict: getField("verdict") || "Strong betting opportunity identified",
      confidenceScore: getNumber("confidenceScore") || 68,
      sections: [{
        title: "Full Analysis",
        icon: "📊",
        content: fullText
          .replace(/[{}"\\]/g, "")
          .replace(/\s+/g, " ")
          .substring(0, 800),
        stats: [],
        keyPoints: [
          "Analysis successfully generated",
          "Detailed breakdown available above",
          "Check betting angles tab for recommendations"
        ]
      }],
      bettingAngles: [{
        market: getField("market") || "Match Winner",
        pick: getField("pick") || match.home + " or " + match.away,
        reasoning: getField("reasoning") || "Based on current form and tactical analysis",
        risk: "Medium",
        value: "Good"
      }],
      redFlags: ["Always research before betting", "Past performance does not guarantee future results"],
      summary: getField("summary") || "Analysis generated. Check the overview tab for full context and betting recommendations."
    };
  } catch (finalErr) {
    return res.status(500).json({ error: "Analysis could not be parsed. Please try again." });
  }
        matchTitle: match.home + " vs " + match.away,
        league: league.name,
        date: match.date,
        verdict: "Analysis completed — see summary below",
        confidenceScore: 68,
        sections: [{
          title: "Match Analysis",
          icon: "📊",
          content: fullText.substring(0, 600),
          stats: [],
          keyPoints: [
            "Analysis generated successfully",
            "Run again for full structured output"
          ]
        }],
        bettingAngles: [{
          market: "Match Winner",
          pick: "See analysis above",
          reasoning: "Full analysis generated. Run again for structured betting angles.",
          risk: "Medium",
          value: "Good"
        }],
        redFlags: ["Always do your own research before placing bets"],
        summary: "Analysis was generated successfully. Run again for the full structured breakdown."
      });
    }

    return res.status(200).json(parsed);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

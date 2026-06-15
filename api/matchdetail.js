module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { match, home, away, homeScore, awayScore } = req.query;
  if (!home || !away) return res.status(400).json({ error: "home and away required" });

  try {
    const prompt = `Search for the full match report and details for this soccer game: ${match || `${home} vs ${away}`}.
The final score was ${home} ${homeScore} - ${awayScore} ${away}.

Return ONLY a valid JSON object, no markdown, no backticks:
{
  "home": "${home}",
  "away": "${away}",
  "homeScore": "${homeScore}",
  "awayScore": "${awayScore}",
  "venue": "Stadium Name",
  "attendance": 45000,
  "goals": [
    {
      "minute": "23'",
      "scorer": "Player Name",
      "assist": "Player Name or null",
      "type": "Goal",
      "isHome": true,
      "homeScore": "1",
      "awayScore": "0"
    }
  ],
  "cards": [
    {
      "minute": "55'",
      "player": "Player Name",
      "team": "Team Name",
      "type": "Yellow"
    }
  ],
  "substitutions": [
    {
      "minute": "65'",
      "playerIn": "Player Name",
      "playerOut": "Player Name",
      "team": "Team Name"
    }
  ],
  "homeLineup": [
    { "name": "Player Name", "jersey": 1, "position": "GK", "starter": true }
  ],
  "awayLineup": [
    { "name": "Player Name", "jersey": 1, "position": "GK", "starter": true }
  ],
  "stats": [
    { "label": "Possession", "home": "58%", "away": "42%" },
    { "label": "Shots", "home": "14", "away": "7" },
    { "label": "Shots on Target", "home": "6", "away": "3" },
    { "label": "Corners", "home": "5", "away": "3" },
    { "label": "Fouls", "home": "11", "away": "14" }
  ]
}

Rules:
- Use only real verified data from the actual match
- If you cannot find something leave it as empty array or null
- goals must be in chronological order with running score
- Return only raw JSON`;

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
        max_tokens: 3000,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const fullText = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");

    let parsed = null;
    try { parsed = JSON.parse(fullText.trim()); }
    catch {
      const m = fullText.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch {} }
    }

    if (parsed) return res.status(200).json(parsed);
    return res.status(200).json({ error: "Could not find match details" });

  } catch (error) {
    return res.status(200).json({ error: error.message });
  }
};

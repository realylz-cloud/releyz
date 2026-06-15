module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { home, away, date, competition } = req.query;
  if (!home || !away) return res.status(400).json({ error: "home and away required" });

  try {
    const prompt = `Search for the predicted/expected starting lineup for the upcoming match: ${home} vs ${away} on ${date || "soon"} in ${competition || "soccer"}.

Return ONLY a valid JSON object, no markdown, no backticks, no other text:
{
  "home": {
    "team": "${home}",
    "formation": "4-3-3",
    "manager": "Manager Name",
    "color": "#ff0000",
    "players": [
      { "name": "Player Name", "position": "GK", "jersey": 1, "row": 0, "col": 0 },
      { "name": "Player Name", "position": "RB", "jersey": 2, "row": 1, "col": 0 },
      { "name": "Player Name", "position": "CB", "jersey": 5, "row": 1, "col": 1 },
      { "name": "Player Name", "position": "CB", "jersey": 4, "row": 1, "col": 2 },
      { "name": "Player Name", "position": "LB", "jersey": 3, "row": 1, "col": 3 },
      { "name": "Player Name", "position": "CM", "jersey": 8, "row": 2, "col": 0 },
      { "name": "Player Name", "position": "CM", "jersey": 6, "row": 2, "col": 1 },
      { "name": "Player Name", "position": "CM", "jersey": 10, "row": 2, "col": 2 },
      { "name": "Player Name", "position": "RW", "jersey": 7, "row": 3, "col": 0 },
      { "name": "Player Name", "position": "ST", "jersey": 9, "row": 3, "col": 1 },
      { "name": "Player Name", "position": "LW", "jersey": 11, "row": 3, "col": 2 }
    ],
    "bench": [
      { "name": "Player Name", "position": "GK", "jersey": 13 }
    ],
    "keyAbsences": ["Player Name - Injured", "Player Name - Suspended"]
  },
  "away": {
    "team": "${away}",
    "formation": "4-4-2",
    "manager": "Manager Name",
    "color": "#0000ff",
    "players": [],
    "bench": [],
    "keyAbsences": []
  }
}

Rules:
- Use real expected players based on recent form, injuries and suspensions
- row 0 = goalkeeper, row 1 = defenders, row 2 = midfielders, row 3 = forwards (add more rows if needed for formation)
- col numbers start from 0 and go left to right across the pitch
- formation must match the number of players in each row
- include exactly 11 starters per team
- include 6-7 bench players per team
- keyAbsences: list known injured or suspended key players
- return only raw JSON`;

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
    catch (e) {
      const m = fullText.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch (e2) {} }
    }

    if (parsed?.home && parsed?.away) return res.status(200).json(parsed);
    return res.status(200).json({ error: "Could not generate lineup" });
  } catch (error) {
    return res.status(200).json({ error: error.message });
  }
};

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
          content: `You are an elite sports betting analyst. Analyze this match and return ONLY valid JSON, no markdown, no extra text.

Match: ${match.home} vs ${match.away}
League: ${league.name}
Date: ${match.date} at ${match.time}

Return this exact JSON structure:
{
  "matchTitle": "${match.home} vs ${match.away}",
  "league": "${league.name}",
  "date": "${match.date}",
  "verdict": "One sharp betting verdict sentence",
  "confidenceScore": 72,
  "sections": [
    {
      "title": "Team Form",
      "icon": "📊",
      "content": "Detailed analysis paragraph about both teams recent form and performance",
      "stats": [
        {"label": "Home Form", "value": "W W L W W", "trend": "up"},
        {"label": "Away Form", "value": "L W W L W", "trend": "neutral"}
      ],
      "keyPoints": ["Key insight 1", "Key insight 2", "Key insight 3"]
    },
    {
      "title": "Head to Head",
      "icon": "⚔️",
      "content": "Analysis of historical meetings between these teams",
      "stats": [
        {"label": "Last 5 H2H", "value": "3-1-1", "trend": "up"}
      ],
      "keyPoints": ["H2H insight 1", "H2H insight 2"]
    }
  ],
  "bettingAngles": [
    {
      "market": "Match Winner",
      "pick": "${match.home} Win",
      "reasoning": "Detailed reason why this bet has value",
      "risk": "Medium",
      "value": "Good"
    },
    {
      "market": "Total Goals",
      "pick": "Over 2.5 Goals",
      "reasoning": "Both teams have been scoring freely",
      "risk": "Low",
      "value": "Excellent"
    }
  ],
  "redFlags": [
    "Potential injury concerns",
    "Recent poor form",
    "Historical weakness"
  ],
  "summary": "2-3 sentence overall summary for the bettor covering the key points and recommended approach"
}`
        }],
      }),
    });

    const rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return res.status(500).json({ error: "API parse error: " + rawText.substring(0, 100) });
    }

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const fullText = data.content
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("");

    const clean = fullText.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");

    if (start === -1 || end === -1) {
      return res.status(500).json({ error: "No JSON found in response" });
    }

    const parsed = JSON.parse(clean.substring(start, end + 1));
    return res.status(200).json(parsed);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

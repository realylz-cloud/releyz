module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { match, league, sport, analysisTypes } = req.body;

  if (!match || !league) {
    return res.status(400).json({ error: "Missing match or league data." });
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
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: "You are Releyz, an elite sports betting analyst. Search the web for current real information before analyzing. Always respond with valid JSON only — no markdown fences, no text outside the JSON object.",
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{
          role: "user",
          content: `Analyze this match for sports bettors. Search for current form, injuries, head-to-head history, and betting context.

Match: ${match.home} vs ${match.away}
League: ${league.name} (${sport.label})
Date: ${match.date} at ${match.time}
Venue: ${match.venue || "TBD"}
Analysis requested: ${(analysisTypes || ["full"]).join(", ")}

Return ONLY this exact JSON structure:
{
  "matchTitle": "${match.home} vs ${match.away}",
  "league": "${league.name}",
  "date": "${match.date}",
  "verdict": "One sharp betting verdict sentence",
  "confidenceScore": 72,
  "sections": [
    {
      "title": "Section title",
      "icon": "emoji",
      "content": "Detailed analysis paragraph",
      "stats": [{"label": "Stat", "value": "Value", "trend": "up|down|neutral"}],
      "keyPoints": ["Point 1", "Point 2", "Point 3"]
    }
  ],
  "bettingAngles": [
    {
      "market": "Market name",
      "pick": "Specific pick",
      "reasoning": "Why this has value",
      "risk": "Low|Medium|High",
      "value": "Fair|Good|Excellent"
    }
  ],
  "redFlags": ["Risk 1", "Risk 2", "Risk 3"],
  "summary": "2-3 sentence summary"
}`
        }],
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || "Anthropic API error");

    const fullText = data.content
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("");

    const clean = fullText.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Invalid response format");

    const parsed = JSON.parse(clean.substring(start, end + 1));
    return res.status(200).json(parsed);

  } catch (error) {
    console.error("Analysis error:", error);
    return res.status(500).json({ error: "Analysis failed. Please try again." });
  }
}

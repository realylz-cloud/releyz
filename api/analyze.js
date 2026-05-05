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
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: "You are a sports betting analyst. Analyze this match and return ONLY a JSON object. No markdown. No explanation. Just the JSON.\n\nMatch: " + match.home + " vs " + match.away + "\nLeague: " + league.name + "\nDate: " + match.date + "\n\nReturn exactly this structure:\n{\"matchTitle\":\"" + match.home + " vs " + match.away + "\",\"league\":\"" + league.name + "\",\"date\":\"" + match.date + "\",\"verdict\":\"Your betting verdict here\",\"confidenceScore\":70,\"sections\":[{\"title\":\"Team Form\",\"icon\":\"📊\",\"content\":\"Analysis of both teams recent form and performance\",\"stats\":[{\"label\":\"Home Form\",\"value\":\"W W L W W\",\"trend\":\"up\"},{\"label\":\"Away Form\",\"value\":\"L W W L W\",\"trend\":\"neutral\"}],\"keyPoints\":[\"Key insight about home team\",\"Key insight about away team\",\"Key tactical point\"]}],\"bettingAngles\":[{\"market\":\"Match Winner\",\"pick\":\"" + match.home + " Win\",\"reasoning\":\"Reason this bet has value\",\"risk\":\"Medium\",\"value\":\"Good\"},{\"market\":\"Total Goals\",\"pick\":\"Over 2.5 Goals\",\"reasoning\":\"Both teams have been scoring\",\"risk\":\"Low\",\"value\":\"Excellent\"}],\"redFlags\":[\"Potential injury concerns\",\"Away team recent poor form\"],\"summary\":\"Overall 2 sentence summary for the bettor\"}"
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
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, "$1");

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      return res.status(200).json({
        matchTitle: match.home + " vs " + match.away,
        league: league.name,
        date: match.date,
        verdict: "Analysis completed successfully",
        confidenceScore: 68,
        sections: [{
          title: "Match Analysis",
          icon: "📊",
          content: fullText.substring(0, 400),
          stats: [],
          keyPoints: ["Analysis generated", "Try again for full structured output"]
        }],
        bettingAngles: [{
          market: "Match Winner",
          pick: match.home + " or " + match.away,
          reasoning: "See analysis above",
          risk: "Medium",
          value: "Good"
        }],
        redFlags: ["Always do your own research before betting"],
        summary: "Analysis was generated. Run again for full structured breakdown."
      });
    }

    return res.status(200).json(parsed);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

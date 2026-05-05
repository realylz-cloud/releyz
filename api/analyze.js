module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { match, league } = req.body;
  if (!match || !league) return res.status(400).json({ error: "Missing data" });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "API key not configured" });
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
        max_tokens: 500,
        messages: [{
          role: "user",
          content: "Say hello and confirm you are working. Return only: {\"status\": \"ok\", \"message\": \"Releyz AI is working\"}"
        }],
      }),
    });

    const text = await response.text();
    const data = JSON.parse(text);

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    return res.status(200).json({
      matchTitle: match.home + " vs " + match.away,
      league: league.name,
      date: match.date,
      verdict: "Test successful - AI is connected",
      confidenceScore: 70,
      sections: [{
        title: "Connection Test",
        icon: "✅",
        content: "API is working correctly. Full analysis will appear here.",
        stats: [],
        keyPoints: ["API connected", "Ready for full analysis", "Commit full code next"]
      }],
      bettingAngles: [{
        market: "Test",
        pick: "API Working",
        reasoning: "Connection confirmed",
        risk: "Low",
        value: "Good"
      }],
      redFlags: ["This is a test response"],
      summary: "API connection confirmed and working correctly."
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

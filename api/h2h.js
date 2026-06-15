module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { homeId, awayId, leagueSlug, eventId, home, away } = req.query;

  // ── MATCH DETAIL (goal timeline) ────────────────────────────────
  if (eventId) {
    try {
      const slugsToTry = [
        leagueSlug || "fifa.world",
        "fifa.world", "eng.1", "esp.1", "ger.1", "ita.1",
        "fra.1", "usa.1", "uefa.champions"
      ];
      let detail = null;
      for (const slug of slugsToTry) {
        try {
          const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/summary?event=${eventId}`;
          const r = await fetch(url);
          if (!r.ok) continue;
          const d = await r.json();
          if (d.header?.competitions?.[0]) { detail = d; break; }
        } catch (e) { continue; }
      }
      if (!detail) return res.status(200).json({ error: "Match detail not found" });
      const competition = detail.header?.competitions?.[0];
      const homeTeam = competition?.competitors?.find(c => c.homeAway === "home");
      const awayTeam = competition?.competitors?.find(c => c.homeAway === "away");
      const timeline = (detail.scoringPlays || []).map(play => ({
        minute: play.clock?.displayValue || play.period?.displayValue || "?",
        type: play.scoringType?.displayName || "Goal",
        team: play.team?.displayName || "",
        player: play.athletesInvolved?.[0]?.displayName || "Unknown",
        assist: play.athletesInvolved?.[1]?.displayName || null,
        homeScore: play.homeScore,
        awayScore: play.awayScore,
        isHome: play.team?.id === homeTeam?.id,
      }));
      return res.status(200).json({
        home: homeTeam?.team?.displayName,
        away: awayTeam?.team?.displayName,
        homeScore: homeTeam?.score,
        awayScore: awayTeam?.score,
        date: competition?.date,
        venue: competition?.venue?.fullName,
        status: competition?.status?.type?.description,
        timeline,
      });
    } catch (error) {
      return res.status(200).json({ error: error.message });
    }
  }

  // ── H2H + FORM via Claude AI web search ─────────────────────────
  if (!home || !away) {
    return res.status(400).json({ error: "home and away team names required" });
  }

  try {
    const prompt = `Search for the most recent football/soccer results for these two teams and return ONLY a JSON object, no other text, no markdown, no backticks.

Find:
1. Last 10 completed matches for ${home} (including all competitions: league, cup, international)
2. Last 10 completed matches for ${away} (including all competitions: league, cup, international)
3. Last 10 head to head matches between ${home} and ${away}

Return this exact JSON structure:
{
  "homeForm": [
    {
      "id": "unique_id_1",
      "date": "15 Jun 2025",
      "homeTeam": "Team A",
      "awayTeam": "Team B",
      "homeScore": "2",
      "awayScore": "1",
      "homeLogo": null,
      "awayLogo": null,
      "isHome": true,
      "result": "W",
      "competition": "Premier League"
    }
  ],
  "awayForm": [...same structure...],
  "h2h": [...same structure...]
}

Rules:
- result must be W, L or D from the perspective of ${home} for homeForm, ${away} for awayForm
- isHome means whether the team we are tracking was playing at home
- Use real recent results only, do not invent scores
- dates in format "DD Mon YYYY"
- if you cannot find enough results return what you find
- id must be unique for each game`;

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
        max_tokens: 4000,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    // Extract text from response
    const fullText = (data.content || [])
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("");

    // Parse JSON from response
    let parsed = null;
    try {
      // Try direct parse first
      parsed = JSON.parse(fullText.trim());
    } catch (e) {
      // Try extracting JSON from text
      const match = fullText.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch (e2) { parsed = null; }
      }
    }

    if (parsed && (parsed.homeForm || parsed.awayForm)) {
      return res.status(200).json({
        homeForm: parsed.homeForm || [],
        awayForm: parsed.awayForm || [],
        h2h: parsed.h2h || [],
      });
    }

    return res.status(200).json({ homeForm: [], awayForm: [], h2h: [] });

  } catch (error) {
    console.error("H2H error:", error.message);
    return res.status(200).json({ homeForm: [], awayForm: [], h2h: [] });
  }
};

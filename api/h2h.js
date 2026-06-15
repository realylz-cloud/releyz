module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { leagueSlug, eventId, home, away } = req.query;

  // ── MATCH DETAIL ────────────────────────────────────────────────
  if (eventId) {
    try {
      const slugsToTry = [
        leagueSlug || "fifa.world",
        "fifa.world","eng.1","esp.1","ger.1","ita.1","fra.1","usa.1","uefa.champions"
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

      const comp = detail.header?.competitions?.[0];
      const homeTeam = comp?.competitors?.find(c => c.homeAway === "home");
      const awayTeam = comp?.competitors?.find(c => c.homeAway === "away");

      // Goals timeline
      const timeline = (detail.scoringPlays || []).map(play => ({
        minute: play.clock?.displayValue || "?",
        type: play.scoringType?.displayName || "Goal",
        team: play.team?.displayName || "",
        player: play.athletesInvolved?.[0]?.displayName || "Unknown",
        assist: play.athletesInvolved?.[1]?.displayName || null,
        homeScore: play.homeScore,
        awayScore: play.awayScore,
        isHome: play.team?.id === homeTeam?.id,
      }));

      // All match events (cards, subs, goals) from plays
      const allEvents = [];
      const plays = detail.plays || detail.gamepackageJSON?.plays || [];
      for (const play of plays) {
        const typeText = play.type?.text || play.type?.abbreviation || "";
        const typeId = play.type?.id;
        if (typeText.includes("Yellow") || typeText.includes("Red") || typeText.includes("Card") ||
            typeText.includes("Sub") || typeText.includes("Goal") || typeText.includes("Penalty") ||
            [57, 58, 93, 94, 95, 96, 99].includes(Number(typeId))) {
          allEvents.push({
            minute: play.clock?.displayValue || play.wallclock || "?",
            type: typeText || "Event",
            player: play.participants?.[0]?.athlete?.displayName || play.text || "Unknown",
            team: play.team?.displayName || "",
            isHome: play.team?.id === homeTeam?.id,
          });
        }
      }

      // Lineups from rosters
      const homeLineup = (homeTeam?.roster || []).map(p => ({
        name: p.athlete?.displayName || p.displayName || "Unknown",
        position: p.position?.abbreviation || p.position?.displayName || "",
        jersey: p.jersey || "",
        starter: p.starter || false,
        subIn: p.subbedIn || false,
        subOut: p.subbedOut || false,
        subMinute: p.subMinute || null,
      }));
      const awayLineup = (awayTeam?.roster || []).map(p => ({
        name: p.athlete?.displayName || p.displayName || "Unknown",
        position: p.position?.abbreviation || p.position?.displayName || "",
        jersey: p.jersey || "",
        starter: p.starter || false,
        subIn: p.subbedIn || false,
        subOut: p.subbedOut || false,
        subMinute: p.subMinute || null,
      }));

      // Stats
      const homeStats = {};
      const awayStats = {};
      const boxscore = detail.boxscore || {};
      if (boxscore.teams) {
        for (const team of boxscore.teams) {
          const isHome = team.team?.id === homeTeam?.id;
          const statsObj = isHome ? homeStats : awayStats;
          for (const stat of (team.statistics || [])) {
            statsObj[stat.name] = stat.displayValue || stat.value;
          }
        }
      }

      return res.status(200).json({
        home: homeTeam?.team?.displayName,
        away: awayTeam?.team?.displayName,
        homeLogo: homeTeam?.team?.logos?.[0]?.href || null,
        awayLogo: awayTeam?.team?.logos?.[0]?.href || null,
        homeScore: homeTeam?.score,
        awayScore: awayTeam?.score,
        date: comp?.date,
        venue: comp?.venue?.fullName,
        status: comp?.status?.type?.description,
        attendance: comp?.attendance,
        timeline,
        allEvents,
        homeLineup,
        awayLineup,
        homeStats,
        awayStats,
      });
    } catch (error) {
      return res.status(200).json({ error: error.message });
    }
  }

  // ── H2H + FORM via Claude AI ────────────────────────────────────
  if (!home || !away) {
    return res.status(400).json({ error: "home and away team names required" });
  }

  try {
    const prompt = `Search for the most recent football/soccer results for ${home} and ${away} and return ONLY a valid JSON object with no other text, no markdown, no backticks.

Find:
1. Last 10 completed matches for ${home} (all competitions)
2. Last 10 completed matches for ${away} (all competitions)
3. Last 10 head to head matches between ${home} and ${away}

Return this exact JSON structure:
{
  "homeForm": [
    {
      "id": "hf1",
      "date": "15 Jun 2025",
      "homeTeam": "Team A",
      "awayTeam": "Team B",
      "homeScore": "2",
      "awayScore": "1",
      "homeLogo": null,
      "awayLogo": null,
      "isHome": true,
      "result": "W",
      "competition": "World Cup 2026"
    }
  ],
  "awayForm": [],
  "h2h": []
}

Rules:
- result: W, L or D from perspective of ${home} for homeForm, ${away} for awayForm, ${home} for h2h
- isHome: true if the tracked team played at home
- Real verified results only, do not invent scores
- dates: "DD Mon YYYY"
- unique ids: hf1, hf2, af1, af2, hh1, hh2 etc
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
        max_tokens: 4000,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 }],
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

    if (parsed && (parsed.homeForm || parsed.awayForm)) {
      return res.status(200).json({
        homeForm: Array.isArray(parsed.homeForm) ? parsed.homeForm : [],
        awayForm: Array.isArray(parsed.awayForm) ? parsed.awayForm : [],
        h2h: Array.isArray(parsed.h2h) ? parsed.h2h : [],
      });
    }
    return res.status(200).json({ homeForm: [], awayForm: [], h2h: [] });
  } catch (error) {
    return res.status(200).json({ homeForm: [], awayForm: [], h2h: [] });
  }
};

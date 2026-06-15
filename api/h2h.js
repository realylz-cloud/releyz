module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { homeId, awayId, leagueSlug, eventId } = req.query;

  // ── MATCH DETAIL (goal timeline) ────────────────────────────────
  if (eventId) {
    try {
      // Try multiple slugs to find the match summary
      const slugsToTry = [
        leagueSlug || "fifa.world",
        "fifa.world", "eng.1", "esp.1", "ger.1", "ita.1", "fra.1",
        "usa.1", "uefa.champions"
      ];

      let detail = null;
      for (const slug of slugsToTry) {
        try {
          const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/summary?event=${eventId}`;
          const response = await fetch(url);
          if (!response.ok) continue;
          const data = await response.json();
          if (data.header?.competitions?.[0]) { detail = data; break; }
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

  // ── H2H + FORM ──────────────────────────────────────────────────
  if (!homeId || !awayId) {
    return res.status(400).json({ error: "homeId and awayId required" });
  }

  // For international teams (World Cup etc), use the general team endpoint
  // ESPN stores national team history under their team page, not a league slug
  const isWorldCup = !leagueSlug || leagueSlug === "fifa.world";

  async function getTeamSchedule(teamId) {
    // Try multiple URL patterns — ESPN is inconsistent for international teams
    const urlsToTry = isWorldCup ? [
      // National team recent games — no league slug needed
      `https://site.api.espn.com/apis/site/v2/sports/soccer/teams/${teamId}/schedule`,
      `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/teams/${teamId}/schedule`,
      `https://site.web.api.espn.com/apis/site/v2/sports/soccer/teams/${teamId}/schedule?limit=20`,
    ] : [
      `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueSlug}/teams/${teamId}/schedule`,
      `https://site.api.espn.com/apis/site/v2/sports/soccer/teams/${teamId}/schedule`,
    ];

    for (const url of urlsToTry) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        const data = await response.json();
        const events = data.events || [];
        if (events.length === 0) continue;

        return events
          .filter(e => e.competitions?.[0]?.status?.type?.completed === true)
          .slice(-15)
          .map(e => {
            const comp = e.competitions[0];
            const home = comp.competitors?.find(c => c.homeAway === "home");
            const away = comp.competitors?.find(c => c.homeAway === "away");
            const isHome = home?.team?.id === String(teamId);
            const us = isHome ? home : away;
            const them = isHome ? away : home;
            const usScore = parseInt(us?.score || "0");
            const themScore = parseInt(them?.score || "0");
            const result = usScore > themScore ? "W" : usScore < themScore ? "L" : "D";
            return {
              id: e.id,
              date: new Date(comp.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
              homeTeam: home?.team?.displayName,
              awayTeam: away?.team?.displayName,
              homeLogo: home?.team?.logos?.[0]?.href || null,
              awayLogo: away?.team?.logos?.[0]?.href || null,
              homeScore: home?.score,
              awayScore: away?.score,
              isHome,
              result,
              competition: e.season?.slug || e.name || "International",
            };
          });
      } catch (e) { continue; }
    }
    return [];
  }

  try {
    const [homeSchedule, awaySchedule] = await Promise.all([
      getTeamSchedule(homeId),
      getTeamSchedule(awayId),
    ]);

    // Find H2H by matching event IDs across both schedules
    const homeEventIds = new Set(homeSchedule.map(g => g.id));
    const h2h = awaySchedule.filter(g => homeEventIds.has(g.id)).slice(-10);

    return res.status(200).json({
      homeForm: homeSchedule.slice(-10),
      awayForm: awaySchedule.slice(-10),
      h2h,
    });
  } catch (error) {
    return res.status(200).json({ error: error.message });
  }
};

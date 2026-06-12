module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { homeId, awayId, leagueSlug, eventId } = req.query;

  // ── GET MATCH DETAIL (timeline + scorers) ────────────────────────
  if (eventId) {
    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueSlug || "eng.1"}/summary?event=${eventId}`;
      const response = await fetch(url);
      if (!response.ok) return res.status(200).json({ error: "Match not found" });
      const data = await response.json();

      const competition = data.header?.competitions?.[0];
      const homeTeam = competition?.competitors?.find(c => c.homeAway === "home");
      const awayTeam = competition?.competitors?.find(c => c.homeAway === "away");

      // Build timeline from scoring plays
      const timeline = [];
      const plays = data.scoringPlays || [];
      for (const play of plays) {
        timeline.push({
          minute: play.period?.displayValue + " " + (play.clock?.displayValue || ""),
          type: play.scoringType?.displayName || "Goal",
          team: play.team?.displayName || "",
          player: play.athletesInvolved?.[0]?.displayName || "Unknown",
          assist: play.athletesInvolved?.[1]?.displayName || null,
          homeScore: play.homeScore,
          awayScore: play.awayScore,
          isHome: play.team?.id === homeTeam?.id,
        });
      }

      // Also get cards from drives/plays if available
      const incidents = [];
      const gamePackage = data.gamepackageJSON || {};
      const allPlays = gamePackage?.plays || [];
      for (const play of allPlays) {
        const type = play.type?.text || "";
        if (type.includes("Yellow") || type.includes("Red") || type.includes("Card")) {
          incidents.push({
            minute: play.clock?.displayValue || "",
            type: type,
            player: play.participants?.[0]?.athlete?.displayName || "Unknown",
            team: play.team?.displayName || "",
          });
        }
      }

      return res.status(200).json({
        home: homeTeam?.team?.displayName,
        away: awayTeam?.team?.displayName,
        homeScore: homeTeam?.score,
        awayScore: awayTeam?.score,
        date: competition?.date,
        venue: competition?.venue?.fullName,
        status: competition?.status?.type?.description,
        timeline,
        incidents,
      });
    } catch (error) {
      return res.status(200).json({ error: error.message });
    }
  }

  // ── GET H2H + TEAM FORM ──────────────────────────────────────────
  if (!homeId || !awayId) {
    return res.status(400).json({ error: "homeId and awayId required" });
  }

  const slug = leagueSlug || "eng.1";

  async function getTeamSchedule(teamId) {
    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/teams/${teamId}/schedule`;
      const response = await fetch(url);
      if (!response.ok) return [];
      const data = await response.json();
      const events = data.events || [];
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
          const usScore = parseInt(us?.score || 0);
          const themScore = parseInt(them?.score || 0);
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
            competition: e.season?.type === 3 ? "Cup" : "League",
          };
        });
    } catch (e) {
      return [];
    }
  }

  async function getH2H(teamAId, teamBId) {
    try {
      // Fetch both schedules and cross-reference
      const scheduleA = await getTeamSchedule(teamAId);
      const results = [];
      for (const game of scheduleA) {
        const oppName = game.isHome ? game.awayTeam : game.homeTeam;
        // We look for games where both teams played
        // ESPN doesnt have a direct H2H endpoint so we filter by opponent
        const awaySchedule = await getTeamSchedule(teamBId);
        const match = awaySchedule.find(g => g.id === game.id);
        if (match) results.push(game);
      }
      return results.slice(-10);
    } catch (e) {
      return [];
    }
  }

  try {
    const [homeSchedule, awaySchedule] = await Promise.all([
      getTeamSchedule(homeId),
      getTeamSchedule(awayId),
    ]);

    // Find H2H by matching event IDs
    const homeIds = new Set(homeSchedule.map(g => g.id));
    const h2h = awaySchedule.filter(g => homeIds.has(g.id)).slice(-10);

    return res.status(200).json({
      homeForm: homeSchedule.slice(-10),
      awayForm: awaySchedule.slice(-10),
      h2h,
    });
  } catch (error) {
    return res.status(200).json({ error: error.message });
  }
};

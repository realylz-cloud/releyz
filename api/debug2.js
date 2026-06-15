module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { homeId, awayId, leagueSlug } = req.query;

  if (!homeId || !awayId) {
    return res.status(200).json({ error: "Pass ?homeId=X&awayId=Y&leagueSlug=eng.1" });
  }

  const slug = leagueSlug || "eng.1";

  try {
    // Test 1: home team schedule
    const urlA = `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/teams/${homeId}/schedule`;
    const resA = await fetch(urlA);
    const dataA = await resA.json();

    // Test 2: away team schedule
    const urlB = `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/teams/${awayId}/schedule`;
    const resB = await fetch(urlB);
    const dataB = await resB.json();

    return res.status(200).json({
      homeUrl: urlA,
      awayUrl: urlB,
      homeStatus: resA.status,
      awayStatus: resB.status,
      homeEventsCount: dataA.events?.length || 0,
      awayEventsCount: dataB.events?.length || 0,
      homeFirstEvent: dataA.events?.[0] || null,
      awayFirstEvent: dataB.events?.[0] || null,
      homeRawKeys: Object.keys(dataA),
      awayRawKeys: Object.keys(dataB),
    });
  } catch (error) {
    return res.status(200).json({ error: error.message });
  }
};

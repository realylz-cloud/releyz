module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const KEY = process.env.API_SPORTS_KEY;

  if (!KEY) {
    return res.status(200).json({ error: "API_SPORTS_KEY is not set in Vercel environment variables" });
  }

  try {
    const response = await fetch("https://v3.football.api-sports.io/fixtures?league=253&season=2026&next=5", {
      headers: { "x-apisports-key": KEY }
    });

    const text = await response.text();

    return res.status(200).json({
      keyFound: true,
      keyPrefix: KEY.substring(0, 8) + "...",
      httpStatus: response.status,
      rawResponse: text.substring(0, 1000)
    });

  } catch (error) {
    return res.status(200).json({ keyFound: true, error: error.message });
  }
};

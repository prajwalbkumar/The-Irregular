// Vercel serverless function — proxies Spotify so the Client Secret and
// refresh token never reach the browser. The client (90-panels.js) just
// fetches /api/nowplaying and gets back {isPlaying, title, artist, album, image}.
//
// Requires three env vars (see README → "Spotify Now Playing" for how to get
// them): SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN.

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;

async function getAccessToken() {
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: SPOTIFY_REFRESH_TOKEN })
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('token refresh failed: ' + JSON.stringify(j));
  return j.access_token;
}

function trackToJson(t, isPlaying) {
  return {
    isPlaying,
    title: t.name,
    artist: (t.artists || []).map(a => a.name).join(', '),
    album: t.album && t.album.name,
    image: t.album && t.album.images && t.album.images[0] && t.album.images[0].url
  };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    return res.status(200).json({ isPlaying: false, title: null, reason: 'not configured' });
  }
  try {
    const token = await getAccessToken();
    const headers = { Authorization: `Bearer ${token}` };

    const cur = await fetch('https://api.spotify.com/v1/me/player/currently-playing', { headers });
    if (cur.status === 200) {
      const j = await cur.json();
      if (j && j.item) return res.status(200).json(trackToJson(j.item, !!j.is_playing));
    }

    // Nothing currently playing (204/no item) — fall back to the last played track.
    const recent = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', { headers });
    const rj = await recent.json();
    const t = rj.items && rj.items[0] && rj.items[0].track;
    if (t) return res.status(200).json(trackToJson(t, false));

    return res.status(200).json({ isPlaying: false, title: null });
  } catch (e) {
    return res.status(500).json({ isPlaying: false, title: null, error: 'spotify unavailable' });
  }
};

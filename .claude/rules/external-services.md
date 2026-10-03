---
paths:
  - "src/js/**"
  - "api/**"
---
# External services (all optional; each has an offline path)

| Service | Use | Failure |
|---|---|---|
| unpkg three@0.160.0 + globe.gl@2.34.5 (pinned) | globe | `GLOBE OFFLINE` notice |
| raw.githubusercontent vasturiano ne_110m geojson | hex continents | plain sphere |
| api.github.com (events + user) | CV activity | "GITHUB UNREACHABLE" |
| aviationweather.gov METAR | `metar` cmd | command error |
| api.open-meteo.com | topbar temp | `—°C` |
| ipapi.co | status-bar tz | tz hidden |
| dummyjson.com/quotes | WIRE quote | baked ARCHIVE quotes |
| ws.audioscrobbler.com (needs key) | Now-Playing | `config.nowPlaying` → SILENCE |
| picsum.photos | placeholder images | real `src` in photos.yml |
| fonts.googleapis.com | type | system fallback |

## Caching
Live fetches cache to `localStorage` with a TTL:
```js
async function cached(key, ttl, fetcher){
  try{ const hit = JSON.parse(localStorage.getItem(key) || 'null');
       if (hit && Date.now() - hit.ts < ttl) return hit.data; }catch{}
  const data = await fetcher();
  try{ localStorage.setItem(key, JSON.stringify({ ts:Date.now(), data })); }catch{}
  return data;
}
```
- Weather: `window.__FIELD.weather`, TTL 1h, key `field_wx`, WMO code → short label; on error leave `—°C`, never throw into UI.
- GitHub: TTL 1h, key `field_gh_{u}`; derive 7-day bars, streak, 30-day commits, followers, repos; honest empty states, never a bare 0.
- WIRE / METAR / ipapi: no cache (fresh per pull / on-demand / once per load); failures silent + fallback.
- `fieldbooted` boot flag also lives in localStorage.

## Caveats
Last.fm needs an API key (proxy via `api/nowplaying.js` to hide it); GitHub `/events` spans ~90 days so the 12-week heatmap is honest, longer needs auth; photos are picsum placeholders until real `src` lands.

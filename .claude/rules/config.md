---
paths:
  - "field.config.js"
  - "eleventy.config.js"
  - "src/_data/**"
  - "src/index.njk"
---
# field.config.js & Eleventy wiring

Key names are EXACT — the client consumes them.

```js
module.exports = {
  identity:{ name, title, tagline, email, base, github, stats:{years,projects,countries} }, // github drives CV activity
  birthday:'1999-10-03', lastUpdated:'YYYY.MM.DD',
  based:{ label:'DUBAI', lat:25.2048, lon:55.2708 },
  cv:{ blurb, experience:[{period,role,org,mode}], education:[{period,role,org,mode}],
       specializations:[{name,count,desc}] /*3*/, skills:[{name,level /*1–5*/}], testimonial:{quote,attr} },
  airports:{ DXB:{name,lat,lon,icao,home:true}, … },     // IATA → detail; EXACTLY one home:true (10 total)
  flights:[{fl:'EK 650', from:'DXB', to:'CMB', date:'2026.03'}],
    // one line feeds: globe arc, plane, legend chip, stats, logbook, dossier
  hobbies:'HTML string', nowPlaying:{title,artist,genre}, lastfmUser:'',
  reading:{title,author,page,total}, challenge:{name,day,total,startDate,active},
  bucket:[{text,done}], toys:[{st:'active|shipped|paused|shelved', name, note}],
  site:{ title, tagline, description, url /*no trailing slash*/, lang, vol, rev, est },
  social:{ email, github, linkedin, instagram }, seo:{ ogImage, twitterCard },
  tokens:{ bg, bg2, fg, ink, accRgb, acc, card, panelBg, overlayBg },
};
```

## Config → browser
`src/_data/config.js` re-exports the config (`config` in every template). `index.njk` injects, before the main script:
```js
window.__FIELD = { github:{username}, weather:{lat,lon,tz:"Asia/Dubai",cacheTTL:3600000}, based:{label,lat,lon} };
```
All live-data JS reads `window.__FIELD` — never literals. Changing `based` re-anchors weather, wind, visitor-distance, globe home.

## Tokens
`fieldTokens` shortcode in `eleventy.config.js` writes the `<style>:root{…}</style>` block from `config.tokens`
(derived vars `--dim/--faint/--line/--acc-dim/--grid` + fonts included). Single theme only.

## Eleventy (`eleventy.config.js`)
- Dirs: input `src`, output `dist`, includes `_includes`, data `_data`; njk for html + markdown. Passthrough `src/assets`.
- Collections: `posts` (date desc), `travel` (posts with `tag:travel`, date desc), `morgue` (date desc).
- Filters: `isoDate`, `num3` (pad 3), `dump` (JSON.stringify), `absUrl` (`site.url` + path).
- Collections serialize into `00-data.js` constants (POSTS/BRIEFS/QUOTES/MORGUE/PHOTOS/FLOW) whose shapes MUST match the prototype.
- Markdown bodies become `body:[...paragraphs]` (split on blank lines).
- Server watch: `src/assets/**`, `field.config.js`.

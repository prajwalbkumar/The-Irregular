---
paths:
  - "src/index.njk"
  - "src/css/**"
  - "src/js/10-render.js"
  - "src/js/40-globe.js"
  - "src/js/50-activity.js"
  - "src/js/90-panels.js"
---
# Page anatomy, sections, panels

## Anatomy — ORDER IS LAW
```
<body>
  cursor layer: #cur-ring #cur-label #cur-dot #cur-coords · .ch×4 #pickbox #osnap #osnap-lbl · .cline×4 · #plot-titleblock
  #cmdline   always visible, pinned above status bar
  #boot      overlay (once EVER)
  <header#topbar role=banner> vol block · masthead · date/time/temp · <nav.filters> · #ticker
  <main#paper>
    #lead-slot  → #pinned-panels (ABOUT + NOW, 2-up) → #sec-flow 01 DISPATCHES (masonry)
    #sec-travel 02 · #sec-photo 03 · #sec-exp 04 · #sec-cv 05 PERSONNEL FILE · #morgue
  <footer#statusbar role=contentinfo> LIVE · clock · /Command · OSNAP · tz · UPD | coords · count · scroll%
  #reader-back / #reader · #plight
```
Dispatches lead (writing before diagnostics). Nav: `01 Dispatches · 02 Travel · 03 Photography · 04 Experiments · 05 Personnel · Morgue`;
hint "FILTER & SEARCH VIA / COMMAND"; scrollspy sets `.here`. Required semantics: header/nav/main/footer, real h1/h2, `<article>` per post.

## Masthead / topbar
`.masthead-name` "THE IRREGULAR" + acid `_`, clamp(2rem,4.8vw,3.6rem), 700, click→top, snappable. Left `VOL.II · REV.24 · EST 2026 / FIELD EDITION — TEXT ONLY`;
right date · Asia/Dubai time (1s tick) · live temp. **Ticker**: first 10 posts as `tag: title`, ×2, JS marquee (translateX .55px/frame, wrap at scrollWidth/2,
re-measure on resize + fonts.ready + 2.5s), hover pauses via flag. NOT a CSS animation (that was the bug).

## Travel (02)
Grid `1.05fr .95fr`; left sticky `top:165px`; stacks ≤900px.
- **Globe** (globe.gl+three): transparent bg; material `#101216` emissive `#0a0b0d`; hex-dot continents from ne_110m geojson (res 3, margin .72, `rgba(var(--ink),.5)`) in try/catch → plain sphere;
  arcs from `flights` (dash .35/.65, 3400ms, altitude .32, `routeHi`); planes = customLayer cones on slerp arcs (40ms tick, optional try/catch); IATA labels (home bigger + acid);
  drag-orbit, autoRotate .55 (pause on grab, resume 5s), **zoom disabled**; init in try/catch → `#globe-offline`.
- **Stats** derived: flights · KM (haversine) · NM · unique airports.
- **Legend chips**: home first, then `CMB · EK 650 · 3 REFS` (omit refs at 0); hover → highlight arc + dossier; tap (mobile) toggles.
- **Dossier** `#dossier` (absolute overlay in globe card): `CODE · CITY | coords` → flight line (`✈ EK 650 · DXB → CMB · date` / `⌂ HOME BASE`) → city posts → truncated briefs → 52×40 photo thumbs (grayscale→color, click→lightbox).
  Empty: `NO DISPATCHES FILED YET — THE DOSSIER AWAITS`. 250ms leave-grace. All data derives from `city:` fields — nothing authored.
- **Feed**: travel posts (desc) then travel briefs, 4/page, `← Prev / Next →` + `PAGE n/N · X DISPATCHES`; rebind title-scramble per render.

## Photography (03)
`#photo-grid`: 2 rows, `grid-auto-flow:column`, columns `clamp(220px,23vw,300px)` (mobile `min(64vw,250px)`), horizontal scroll-snap. Drag-to-scroll (>6px drag swallows click).
Frames 4/3, grayscale→color+scale on hover, corner brackets, caption slides up. Click → `#plight`. Meta `CONTACT STRIP · DRAG / SCROLL →`.

## Experiments (04)
Grid `70px 1.1fr 1fr auto`; hover raises bg, slides padding, brackets, id→acid; status chip colored by `st`.

## Personnel (05) — from `config.cv`
Left: identity · EXPERIENCE (`92px 1fr`) · EDUCATION · OPEN-SOURCE ACTIVITY (`#cv-activity`). Right: SPECIALIZATIONS (3 cards, big count + "PRJ") · TECH STACK (5-seg bar per `level`) · FIELD REFERENCE (testimonial, acid left border).
`.cv-block`/`.spec-card` snappable + construction-lined; mobile 1-col.
**GitHub activity**: `/users/{gh}/events/public?per_page=100` + `/users/{gh}`; 7-day bars (38px) + SMTWTFS · rows Commits·7d / Active Streak / Followers / Public Repos · 12-week heatmap (84 7px squares) · profile link.
Honest empties: `total===0` → "QUIET WEEK", `streak===0` → "NO PUSHES", offline → "GITHUB UNREACHABLE".

## Panels
Shell: acid border .45, near-flat gradient (`rgba(var(--acc-rgb),.028)`→`--panel-bg` at 32%), 1.8rem pad, all-four corner brackets (pseudo + `.p-h2/.p-h4`), soft acid shadow, mouse-tilt ±5° (FINE_PTR), body `rgba(var(--ink),.82)`. Pinned band: 2-up, larger.

| key | label | source |
|---|---|---|
| about / now | ABOUT / NOW · date (pinned) | authored copy |
| projects | PROJECTS · TRACKED | status-dot rows (active pulses acid / shipped blue / paused amber / shelved faint) |
| hobbies | HOBBIES · OFF-MODEL | `config.hobbies` |
| nowplaying | NOW PLAYING | Last.fm if `lastfmUser` → `config.nowPlaying` → "SILENCE" |
| currentread | CURRENTLY READING | `config.reading` + progress bar |
| streak | CHALLENGE | `config.challenge`: `DAY n` + bar + "STARTED … · k DAYS REMAINING" → "COMPLETED ✔" |
| bucket | BUCKET LIST | `config.bucket`; done ⇒ strike + acid DONE |
| toys | CURRENTLY USING | `config.toys` |
| contact | CONTACT | pitch + acid mailto |

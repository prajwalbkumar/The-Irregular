# The Irregular — Field Edition

A personal site that behaves like a CAD viewport: near-black ground, one acid-green
accent, mono chrome, object snapping, a command line, a WebGL globe of real flights —
set from Markdown the way a newspaper is set from copy. Built with
[Eleventy](https://www.11ty.dev/), compiled to a single dark `index.html` plus a
standalone page per dispatch.

`reference/field-broadsheet.html` is the original hand-built prototype and the
visual/behavioral source of truth for this whole rebuild — if something looks
wrong, open it side by side and diff.

This document is the one-stop reference for running, editing, and shipping the
site. Everything you'd need to change — copy, colors, flights, panels, routing —
is described here with the exact file and key to touch.

## Contents

1. [Quickstart](#quickstart)
2. [Dependencies](#dependencies)
3. [Project structure](#project-structure)
4. [Editing guide — "I want to…"](#editing-guide--i-want-to)
5. [`field.config.js` reference](#fieldconfigjs-reference)
6. [Content types reference](#content-types-reference)
7. [Design tokens & theming](#design-tokens--theming)
8. [Publishing, routing & URLs](#publishing-routing--urls)
9. [JS module architecture](#js-module-architecture)
10. [Command line reference](#command-line-reference)
11. [Testing](#testing)
12. [Deploy](#deploy)
13. [Caveats](#caveats)

---

## Quickstart

```bash
npx create-field-broadsheet my-site   # scaffold a new copy of this template
cd my-site
npm install
npm run dev      # eleventy --serve — live reload at http://localhost:3000
npm run build    # → dist/index.html (single file, assets inlined) + dist/posts/*/
npm test         # jsdom behavioral suite (test/suite.js)
npm run clean    # rm -rf dist
```

Already inside this repo (not scaffolding a new one)? Skip the `npx`/`cd` lines
and just run `npm install` once, then the same `npm run dev`/`build`/`test`.

---

## Dependencies

### Runtime (npm, `dependencies` in `package.json`)

| Package | Used for |
|---|---|
| `@11ty/eleventy` (^3.0.0) | The static site generator — collections, templating, the whole build |
| `gray-matter` (^4.0.3) | Parses frontmatter out of content Markdown so `eleventy.config.js` can pull the raw body text for the `body:[...paragraphs]` arrays |
| `js-yaml` (^4.1.0) | Parses `content/photos.yml` and `content/flow.yml` |
| `markdown-it` (^14.0.0) | Markdown → HTML for the standalone post pages (Eleventy's built-in renderer) |

### Dev-only (`devDependencies`)

| Package | Used for |
|---|---|
| `jsdom` (^29.1.1) | Headless DOM for `npm test` — loads the built page, runs its scripts, asserts on the result |

### CDN scripts (loaded in `<head>`, not npm packages)

| Script | Purpose | Failure mode |
|---|---|---|
| `unpkg.com/three@0.160.0` | 3D engine backing the globe | — |
| `unpkg.com/globe.gl@2.34.5` | The WebGL globe itself | If either fails to load, `initGlobe()`'s own try/catch shows `#globe-offline` instead |
| `fonts.googleapis.com` (Space Grotesk + JetBrains Mono) | Display + mono typefaces | Falls back to system fonts |

### External APIs called at runtime (all optional, all fail gracefully)

| Service | Feature | On failure |
|---|---|---|
| `raw.githubusercontent.com` (vasturiano/globe.gl geojson) | Hex-dot continents on the globe | Globe still renders as a plain sphere |
| `api.github.com` | Personnel File → Open-Source Activity (7-day bars, streak, heatmap) | Shows "GITHUB UNREACHABLE"; cached 1h in `localStorage` |
| `api.open-meteo.com` | Topbar temperature | Shows `—°C`; cached 1h |
| `aviationweather.gov` | The `metar` command | Command prints an error |
| `dummyjson.com/quotes` | The live WIRE quote card | Falls back to a 5-quote baked archive |
| `ws.audioscrobbler.com` (Last.fm) | Now Playing panel, only if `lastfmUser` is set | Falls back to `config.nowPlaying`, then "SILENCE" |
| `picsum.photos` | Photo placeholders when `photos.yml` has no real `src` | — |

Nothing above is required for `npm run dev`/`build`/`test` to work — the site
degrades honestly offline, exactly as designed.

---

## Project structure

```
field.config.js              masthead & standing info — see full reference below
eleventy.config.js           Eleventy config: collections, filters, shortcodes
cli.js                       the `npx create-field-broadsheet` scaffolder
package.json                 scripts + dependencies

src/
  index.njk                  the field — assembles collections into DOM + client-side data
  _includes/
    head-seo.njk             shared <head> SEO block (meta/OG/Twitter/JSON-LD)
    layouts/post.njk          standalone-post page shell (used by every dispatch)
  _data/
    config.js                exposes field.config.js as `config` in templates
    photos.js                loads + resolves content/photos.yml (real src or picsum fallback)
    flow.js                  loads content/flow.yml
    homeCode.js              derives the home airport's IATA code from field.config.js
    sameAs.js                non-empty social links, for the Person JSON-LD
  css/
    field.css                the stylesheet — ported verbatim from the prototype
  js/                        client-side modules, concatenated into ONE inline <script>
                             by the `fieldJS` shortcode, in this exact load order:
    10-render.js             lead/flow/pinned-panels/ticker/travel-feed/photo-grid/
                             experiments/CV/morgue render + status clock/temp
    20-cursor.js             CAD cursor, osnap engine, crosshair, construction lines
    40-globe.js              globe.gl init, flight math, city dossiers, legend chips
    50-activity.js           GitHub activity fetch (cached)
    60-cmdline.js            the command line — all 19 commands
    70-reader.js             reader overlay, lightbox, deep links, pushState routing
    80-fx.js                 reveal-on-scroll, panel tilt, nav, boot gate, scrollspy, WIRE quote
    90-panels.js             now-playing / reading / streak panel fills
  content/                   ← you write here (see Content types reference)
    posts/*.md                dispatches (16 sample entries + _template.md)
    briefs/*.md                short-form briefs (8 + _template.md)
    quotes/*.md                 pull-quotes (3 + _template.md)
    morgue/*.md                killed drafts (3 + _template.md)
    experiments/*.md            the log rows in §04 (7 + _template.md)
    photos.yml                  the contact-strip / photography manifest
    flow.yml                    the ordered dispatch column — posts/briefs/quotes/panels
    posts.json, briefs.json, … directory data files (permalinks, layouts — see below)
  sitemap.njk                 → /sitemap.xml
  robots.njk                  → /robots.txt

test/
  suite.js                    jsdom behavioral suite — `npm test`

reference/
  field-broadsheet.html       the original prototype — ground truth for behavior/visuals

dist/                         build output (gitignored) — index.html + posts/*/ + sitemap/robots
```

---

## Editing guide — "I want to…"

| I want to… | Do this |
|---|---|
| Write a new dispatch | `cp src/content/posts/_template.md src/content/posts/YYYY-MM-DD-my-title.md`, fill in the frontmatter, write the body, then add a line to `src/content/flow.yml` so it appears in the dispatch column |
| Make a post the lead (top of the page) | Give it `num: "001"` — whichever post has the lowest `num` leads. Renumber the others if needed |
| Add a travel dispatch | Set `tag: travel` and a `city:` (an IATA code from `field.config.js` → `airports`) on a post or brief — it routes to the Travel feed and that city's dossier automatically, and is *excluded* from the main dispatch flow |
| Add a photo | Add an entry to `src/content/photos.yml`; set `city:` to link it into that city's dossier; set `src:` to a real image path, or omit it for a picsum placeholder |
| Add a flight | One line in `field.config.js` → `flights`. The globe, plane animation, legend chips, flight stats, `logbook` command, and every city dossier all derive from this array — nothing else to touch |
| Add a new destination airport | Add it to `field.config.js` → `airports` (needs `name`, `lat`, `lon`, `icao`) before referencing it in `flights` |
| Move your home base | Change `field.config.js` → `based` (lat/lon) *and* move `home: true` to the matching entry in `airports` — weather, the globe's default view, the topbar city code, and the map-note copy all re-anchor from this one change |
| Change the accent color / palette | Edit `field.config.js` → `tokens` (never edit hex values in `field.css` directly — it only contains rules *derived from* these tokens) |
| Update your CV / experience / skills | `field.config.js` → `cv` (blurb, experience, education, specializations, skills, testimonial) |
| Update a panel (Now Playing, Reading, Challenge, Bucket List, Toys, Projects) | The matching key in `field.config.js` (`nowPlaying`, `reading`, `challenge`, `bucket`, `toys`, `projects`) |
| Change the About/Now pinned panels | `field.config.js` → `about` / `now` (HTML strings — `<span class="fg">…</span>` for the brighter inline color) |
| Reorder the dispatch column | Edit `src/content/flow.yml` — it's read top to bottom |
| Retire a post without deleting it | Move it into `src/content/morgue/` with a `stamp` of `UNPUBLISHED`/`ABANDONED`/`UNFINISHED` |
| Log a new experiment | Add a file to `src/content/experiments/` |
| Change the site's SEO title/description/domain | `field.config.js` → `site` (title, tagline, description, url — `url` feeds canonical links, the sitemap, and JSON-LD, so set it before deploying) |
| Add social links | `field.config.js` → `social` (empty strings are omitted automatically from the Person JSON-LD's `sameAs`) |
| Change the OG image / Twitter card type | `field.config.js` → `seo` |
| Enable live Now Playing | Set `field.config.js` → `lastfmUser` and add a Last.fm API key where the fetch happens in `src/js/90-panels.js` (see [Caveats](#caveats)) |

---

## `field.config.js` reference

Every key the site reads, in one file, grouped as they appear:

| Key | Shape | Drives |
|---|---|---|
| `identity` | `{name, title, tagline, email, base, github, stats:{years,projects,countries}}` | Masthead byline, CV header, mailto links, GitHub activity username, CV stat line |
| `birthday` | ISO date string | Reserved for age-driven copy (not currently rendered) |
| `lastUpdated` | `'YYYY.MM.DD'` | The "Now" panel's month badge (truncated to `YYYY.MM`) |
| `based` | `{label, lat, lon}` | Weather fetch origin, globe default view anchor, visitor-distance-style features |
| `cv` | `{blurb, experience[], education[], specializations[], skills[], testimonial}` | The entire Personnel File section |
| `airports` | `{IATA: {name, lat, lon, icao, home?}}` | Globe labels, dossiers, `city`/`fly`/`metar` commands — exactly one entry needs `home: true` |
| `flights` | `[{fl, from, to, date}]` | Globe arcs + planes, legend chips, flight stats, `logbook` command, dossiers |
| `projects` | `[{st, name}]` | The "Projects · Tracked" panel (`st` is `active`/`shipped`/`paused`/`shelved`) |
| `about` / `now` | HTML strings | The two pinned panels above the dispatch flow |
| `hobbies` | HTML string | The Hobbies panel |
| `nowPlaying` | `{title, artist, genre}` | Now Playing panel fallback (used when `lastfmUser` is empty or the fetch fails) |
| `lastfmUser` | string | Last.fm username for a live Now Playing (needs an API key — see Caveats) |
| `reading` | `{title, author, page, total}` | Currently Reading panel + progress bar |
| `challenge` | `{name, day, total, startDate, active}` | Challenge/streak panel + progress bar |
| `bucket` | `[{text, done}]` | Bucket List panel |
| `toys` | `[{st, name, note}]` | Currently Using panel |
| `site` | `{title, tagline, description, url, lang, vol, rev, est}` | `<title>`, meta description, canonical URLs, sitemap, JSON-LD, masthead volume/rev/est line |
| `social` | `{email, github, linkedin, instagram}` | Contact panel, CV mailto, Person JSON-LD `sameAs` (blanks are dropped) |
| `seo` | `{ogImage, twitterCard}` | Open Graph / Twitter card image and type |
| `tokens` | `{bg, bg2, fg, ink, accRgb, acc, card, panelBg, overlayBg}` | The **entire** color palette — the `fieldTokens` Eleventy shortcode emits these into a `<style>:root>` block; `field.css` only ever contains rules derived from them |

---

## Content types reference

All content lives under `src/content/`. Every type has a `_template.md` to copy.
Body text is split on **blank lines** into paragraphs — no other Markdown
formatting is applied to it inside the in-page reader (inline HTML like
`<strong>` is fine and passes through); the standalone post pages (`/posts/…/`)
render the body through Eleventy's real Markdown-to-HTML pipeline instead.

| Type | Frontmatter | Notes |
|---|---|---|
| **posts** (`posts/*.md`) | `id, num, tag, city?, date, size, title, excerpt` | `num` is fixed forever (deep-link stability). `tag: travel` + a `city` routes to the Travel feed instead of the main flow. `size` is `lg`/`md`/`sm` (title scale in the flow). Lowest `num` = lead post. Also builds a standalone page at `/posts/<slug>/` |
| **briefs** (`briefs/*.md`) | `tag, city?, order` | `order` is the 1-based position referenced from `flow.yml`. Label ("CODE · BRIEF") is derived from `tag`, not authored |
| **quotes** (`quotes/*.md`) | `attr, tag?` | Referenced from `flow.yml` by file order (1-based) |
| **morgue** (`morgue/*.md`) | `num, stamp, title` | `stamp` is `UNPUBLISHED`/`ABANDONED`/`UNFINISHED`. Morgue entries never get standalone pages and are excluded from the sitemap |
| **experiments** (`experiments/*.md`) | `id, name, st` | `st` is `active`/`parked`/`shipped`/`live`. Body is the one-line description |
| **photos** (`photos.yml`) | `s, src?, city?, cap` | `s` is a picsum seed used as a fallback when `src` is omitted; `cap` format is `F-### · PLACE · LAT LON` |
| **flow** (`flow.yml`) | `{type, ref}[]` | The ordered dispatch column. `type` is `post`/`brief`/`quote`/`panel`. `ref` is a post's `id`, a brief's `order`, a quote's file order, or a panel key (`projects`/`hobbies`/`nowplaying`/`currentread`/`streak`/`bucket`/`toys`/`contact`) |

---

## Design tokens & theming

The palette lives **only** in `field.config.js` → `tokens`. The `fieldTokens`
shortcode in `eleventy.config.js` writes these into an inline `<style>:root>`
block at build time; `field.css` never contains a hardcoded hex value for the
core palette (a handful of semantic status colors — amber/blue/green for
paused/shipped/active states, plus the white osnap marker — are literal by
design, since they're not part of the token indirection).

Type follows a deliberate two-bucket system — don't flatten it:

- **Content** (anything a visitor *reads* — reader prose, CV blurb, excerpts,
  titles) stays legible: `.7rem`–`1.6rem`, never shrunk for density.
- **Chrome** (labels, tags, kickers, coordinates, nav, the command line) stays
  small and mono-uppercase-tracked on purpose: `.44rem`–`.6rem`. It reads as an
  instrument readout, not text — don't "fix" it to a uniform accessible size.

There is **no light mode** — it was built and deliberately removed. Don't
reintroduce a `body.dark`/theme toggle.

---

## Publishing, routing & URLs

The site ships two kinds of pages from one `npm run build`:

1. **The field** (`/`, `dist/index.html`) — the whole single-page experience.
   Every dispatch, brief, quote, and panel is rendered client-side from a data
   block Eleventy generates at build time (`window.DATA`, `POSTS`, `BRIEFS`,
   `QUOTES`, `MORGUE`, `EXPS`, `PHOTOS`, `FLOW`) plus the concatenated
   `src/js/*.js` modules — see [JS module architecture](#js-module-architecture).
2. **Standalone post pages** (`/posts/<slug>/`) — one real, crawlable, fully
   SEO'd page per dispatch, built via `src/_includes/layouts/post.njk`. The
   slug is the filename with any leading `YYYY-MM-DD-` date stripped
   (Eleventy's default `fileSlug` behavior).

They're linked together:

- Opening a post from the field (click, ticker, search, deep link) calls
  `history.pushState` to the canonical `/posts/<slug>/` URL, so the address bar
  is always shareable. Closing the reader restores `/`. Back/forward
  (`popstate`) re-syncs the overlay instead of reloading.
- `#open=004` (hash) on load jumps straight to that post number — a fallback
  deep-link format still handled by `src/js/70-reader.js`.
- `#goto=travel` / `dispatches` / `photography` / `experiments` / `personnel` /
  `morgue` / `top` scrolls to that section on load.
- `/sitemap.xml` lists `/` plus every post (lead = priority 0.9, `size: lg` =
  0.8, everything else 0.7) — morgue is excluded on purpose.
- `/robots.txt` allows everything except `/assets/` and points at the sitemap.

---

## JS module architecture

Everything in `src/js/` is concatenated by the `fieldJS` Eleventy shortcode
into **one** inline `<script>`, in ascending filename order — so it's all one
execution context (a function declared in `10-render.js` is callable from
`90-panels.js`), but keep new code in the file matching its concern:

| File | Responsibility |
|---|---|
| `10-render.js` | Builds nearly everything from the data block: lead post, the flow column, pinned panels, ticker marquee, paged travel feed, photo grid, experiments list, CV (incl. the GitHub-activity DOM scaffold), morgue list, plus the status-bar clock/date/temperature |
| `20-cursor.js` | The CAD cursor: dot/ring/label, coordinate readout, End/Mid/Near osnap engine, crosshair, construction lines. Entirely gated on `FINE_PTR && !REDUCED` (desktop, motion-enabled only) |
| `40-globe.js` | Haversine/slerp flight math, flight-stat totals, `globe.gl` init (wrapped in try/catch → offline notice), city dossiers, legend chips with live ref counts |
| `50-activity.js` | GitHub activity fetch, cached 1h in `localStorage` |
| `60-cmdline.js` | The command line — all 19 commands (see below), history, tab-complete |
| `70-reader.js` | Reader overlay, lightbox, deep-link resolution, reading-depth tracking, the pushState/popstate routing described above |
| `80-fx.js` | Reveal-on-scroll, panel tilt, nav + filter, the once-ever boot gate, scrollspy, the live WIRE quote |
| `90-panels.js` | Fills in Now Playing / Currently Reading / Challenge — the dynamic bits inside panels `10-render.js` already built the shell for |

---

## Command line reference

Press `/` anywhere to focus it (Esc to blur, ↑/↓ for history, Tab to complete).
This set is deliberately trimmed — don't re-bloat it:

| Command | Does |
|---|---|
| `help` | List commands |
| `open <n>` | Open dispatch number `n` in the reader |
| `search <term>` / `find <term>` | Full-text search across posts + morgue, clickable results |
| `city <IATA>` | Print that city's dossier to the console output |
| `fly <IATA>` | Highlight that route on the globe for 7s + print distance |
| `logbook` | Print the full flight history |
| `metar <IATA\|ICAO>` | Live METAR from aviationweather.gov, raw + decoded |
| `cv` | Scroll to the Personnel File |
| `quote` | Pull a fresh WIRE quote |
| `plot` | `window.print()` — the CAD title-block print stylesheet |
| `email` | Opens a `mailto:` to your configured email |
| `morgue` | Scroll to the Morgue |
| `boot` | Replay the boot sequence (clears the once-ever flag + reloads) |
| `clear` | Reset filters, selection, and command history |
| `rhino` / `sudo` / `hello` / `coffee` | Easter eggs |

---

## Testing

```bash
npm test
```

Runs `test/suite.js`: loads the *built* `dist/index.html` into jsdom (stubbing
`matchMedia`, `fetch`, `IntersectionObserver`, `scrollIntoView`, `PointerEvent`,
canvas contexts, etc.), executes every script, and asserts:

- Zero window errors under both `FINE_PTR`/`REDUCED` permutations.
- Render counts (flow items, pinned panels = 2, travel-feed pager, photo strip
  = 10, CV = 2 columns, GitHub activity block present).
- Dossier ref-counts for every city, plus open/empty/home dossier states.
- The command registry is exactly the 19 above, and every removed command name
  is confirmed absent.
- Search → reader flow, the full Esc chain, a duplicate-ID scan, a
  stale-reference scan for removed features (theme toggle, telemetry,
  particle field, CSS-animated marquee), and heading structure (exactly one
  `<h1>`, the masthead).

Run `npm run build` first if you've changed anything — the suite tests the
compiled output, not the source.

---

## Deploy

| Host | Build command | Output dir | Node | Notes |
|---|---|---|---|---|
| Cloudflare Pages | `npm run build` | `dist` | 20 | Simplest option; add a `GITHUB_TOKEN` env var only if you want richer activity stats than the public rate limit allows |
| Vercel | `npm run build` | `dist` | 20 | Can also host a small serverless function to proxy Last.fm (keeps the API key off the client) |

Before going live:

1. Set `field.config.js` → `site.url` to your real domain — it feeds canonical
   URLs, `sitemap.xml`, and the JSON-LD.
2. Generate `/assets/og-default.png` (1200×630) and a favicon (see Caveats).
3. If you want GitHub activity beyond the public API's rate limit, add a
   `GITHUB_TOKEN`-backed proxy in front of the `api.github.com` calls in
   `src/js/50-activity.js`.
4. If you want live Now Playing, get a Last.fm API key and either put it
   directly in `src/js/90-panels.js` (fine for a personal site) or proxy it
   through a serverless function (hides the key).

---

## Caveats

1. **Last.fm** needs an API key. `field.config.js`'s `lastfmUser` is blank by
   default, so the Now Playing panel falls back to `config.nowPlaying`, then
   "SILENCE" — inert until you add a key (see Deploy above).
2. **Photos** render from `photos.yml`'s `src` if you set one; otherwise they
   fall back to a picsum.photos placeholder seeded from `s`.
3. **GitHub activity** (Personnel File) reads the public Events API, which only
   spans ~90 days — the 12-week heatmap is honest about that; a longer history
   needs an authenticated proxy.
4. **`/assets/og-default.png`** (1200×630) and a favicon aren't generated by the
   build — add real ones before deploying, or social shares will 404 the image.
5. The sample content (Prajwal's dispatches, CV, flights) is a working example
   to build and preview against — replace it with your own before shipping.

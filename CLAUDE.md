# THE IRREGULAR · FIELD EDITION

Personal site of Prajwal (architect / computational designer, Dar · Sidara, Dubai; aviation, DJ). Behaves like a
CAD viewport: near-black ground, one acid-green accent (`#ccff00`), mono chrome, object snapping, command line,
WebGL globe of real flights. Authored in Markdown + one config, compiled by Eleventy into ONE `index.html`.
Voice of all copy: dry, precise, self-aware; posts read like field reports.

**Ground truth: `reference/field-broadsheet.html`. If a rule and the prototype disagree, the prototype wins.**

## Non-negotiables
1. **Dark only.** No light mode / theme toggle — built and deliberately removed.
2. Vanilla only: no framework, jQuery, Tailwind. Runtime deps: three.js + globe.gl (CDN, pinned).
3. Single-page output; reader & lightbox are overlays; hash-based navigation.
4. Every module degrades gracefully: offline, no-WebGL, reduced-motion, touch/mobile.
5. All content from Markdown + `field.config.js`. No personal copy hardcoded in templates.
6. Never hardcode hex in `field.css` — tokens come from `config.tokens`.

## Deliberately removed — do NOT resurrect
Light/theme toggle · telemetry section (Whoop/Life-in-Weeks/System/Sky) · particle field · day/night terminator ·
globe measure tool · marquee selection · topography overlay · hover-scramble on flow titles · boot fortune line ·
auto-typed help · ~16 extra commands (command set is fixed at 19) · `{redact}` markdown plugin · `body.dark` variant.

## Commands
`npm run dev` (eleventy --serve :3000) · `npm run build` (→ `dist/index.html`, assets inlined) · `npm test` (jsdom suite)

## Layout
`field.config.js` (standing data) · `eleventy.config.js` · `src/index.njk` (page) · `src/_includes/` (head-seo, layouts/post) ·
`src/_data/` · `src/content/{posts,briefs,quotes,morgue,experiments}/*.md` + `photos.yml` + `flow.yml` ·
`src/css/field.css` · `src/js/NN-*.js` (concatenated at build) · `api/nowplaying.js` · `test/suite.js` · `reference/`

## Rules (`.claude/rules/`, auto-loaded by path)
| File | Scope |
|---|---|
| `design-tokens.md` | palette, two-bucket type, grid, motion |
| `config.md` | `field.config.js` schema, `window.__FIELD`, token shortcode, eleventy wiring |
| `content.md` | frontmatter schemas for posts/briefs/quotes/morgue/experiments/photos/flow + authoring workflow |
| `page-layout.md` | page anatomy, sections, panels |
| `interaction.md` | cursor, osnap, boot, cmdline, plot, reader, deep links |
| `external-services.md` | APIs, fallbacks, caching |
| `seo-routing.md` | meta/OG/JSON-LD, sitemap, standalone post pages |
| `testing-deploy.md` | jsdom suite, budget, mobile, deploy |

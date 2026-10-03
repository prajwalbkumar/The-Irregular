---
paths:
  - "test/**"
  - "package.json"
  - "vercel.json"
  - "cli.js"
---
# Testing, budget, deploy

## Testing (`npm test` → `test/suite.js`, Node + jsdom)
Strip CDN scripts; stub matchMedia/rAF/canvas-ctx-proxy/IO/MO/scrollIntoView/fetch-reject/Blob/print/PointerEvent; execute the BUILT page; assert **zero window errors** plus:
- renders: flow items, pinned=2, feed page=4+pager, strip=10, cv 2-col, activity block present
- dossier refCounts (CMB=3 DXB=4 MCT=2 NRT=1 DOH=0) + open/empty/home states
- every command, incl. unknown-command for removed ones · search→reader flow · Esc chain
- duplicate-ID scan · stale-reference scan for removed features (theme/telemetry/particle/marquee)

Hard-won rules: assert every string codemod matches exactly once; never regex-count blindly; validate JS after every write; the two SELECTED/clearSelection call sites must be globally safe on touch.

## Budget & mobile
Output ≤ ~140KB (prototype ≈125KB) · 60fps idle · rAF loops gate on visibility.
Mobile ≤900px: cursor/osnap/clines OFF · nav wraps · pinned 1-col · travel stacks (touch-orbit) · dossier via tap · strip `min(64vw)` · cv 1-col · flow 2→1 col · boot gate answers to tap · cmdline + statusbar remain.

## Deploy
Scripts: `dev` eleventy --serve · `build` eleventy · `clean` rm -rf dist · `test` node test/suite.js. Deps: `@11ty/eleventy ^3`, `markdown-it ^14`.
Cloudflare Pages or Vercel: `npm run build`, output `dist`, Node 20. Optional `GITHUB_TOKEN` for richer stats; Vercel enables the Last.fm proxy (`api/nowplaying.js`).
Post-deploy: `/assets/og-default.png` (1200×630, dark + acid wordmark), favicon.

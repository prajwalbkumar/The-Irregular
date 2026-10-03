---
paths:
  - "src/js/20-cursor.js"
  - "src/js/60-cmdline.js"
  - "src/js/70-reader.js"
  - "src/js/80-fx.js"
---
# Interaction (the CAD soul — port, don't reinvent)

Desktop-only bits gate on `FINE_PTR = matchMedia('(hover:hover) and (pointer:fine)')`; motion respects `REDUCED = prefers-reduced-motion`.

- **Cursor + crosshair.** `cursor:none`; acid 5px dot (instant) · ring 32px lerp .16 (→56px + label from `data-cursor`; vocab READ DEVELOP EXHUME GO TOP TYPE PULL ROUTE BASE MAIL FEED SPEC) · mono `X Y` coords (mirrored in status bar) · 4-segment crosshair, 9px center gap, edge-fading · 12px pickbox.
- **Osnap End/Mid/Near.** Registry rebuilt on `snapDirty` (scroll/resize/1s/`transitionend` of `.rv` — fixes the reveal-offset bug; exclude `.rv:not(.in)` and `.dim`).
  Snappables: `.story .brief .quote .panel .lead .exp-row .ph .mg-entry #map-wrap .masthead-name .cv-block .spec-card`. Priority End(≤13)→Mid(≤13)→Near(≤9, project onto segment). Marker: white square/triangle/diamond + status `OSNAP: END ◉`.
- **Construction lines.** Hover snappable → 4 dashed acid lines to viewport edges, `z-index:120`; hide on leave/scroll.
- **Boot gate — ONCE EVER** (localStorage `fieldbooted`). Rhino-history lines staggered 260ms: `_Open "theirregular.3dm"` · `File loaded: 32 objects, 5 layers, 1 viewport.` · `_Osnap End=On …` · `_ZoomExtents position {based}` · `_Print press online_` · blinking `▸ PRESS ENTER TO ENTER THE FIELD_` (Enter/click/touch) → sets flag, masthead scrambles in.
  12s / any-error force-dismiss so it never traps clicks. `boot` command clears flag + reloads.
- **WIRE quote.** Generated `.quote` at flow ~pos 6: `// QUOTED · WIRE`, text, attr, `PULL ↻`. `pullWire()`: dummyjson random → `AUTHOR · WIRE`; any fail → baked 5-quote archive (Rams/Gall/Saarinen/Eames/Johnson) `· ARCHIVE`. Never empty.
- **Scramble & tilt.** Glyph-noise decode on masthead post-boot and travel-feed titles per render. Flow/story titles do NOT scramble.
- **Command line — pinned above status bar.** `/` focuses, Esc blurs, ↑/↓ history, Tab completes, live hint. Outputs `.c-in/.c-ok/.c-err/.c-res` (clickable).
  **Registry (19 — do NOT re-bloat):** `help` · `open <n>` · `search <term>` (posts+morgue clickable; briefs/quotes as info) · `find` (alias) · `city <IATA>` · `fly <IATA>` (highlight arc 7s + distance) · `logbook` · `metar <IATA|ICAO>` (raw + decoded) · `cv` · `quote` · `plot` · `email` · `morgue` · `boot` · `clear` (filter off, selection released, history wiped) · eggs `rhino sudo hello coffee`.
  Removed: about/now/bucket/goto/filter/skills/stats/whoop/life/music/reading/isolate/visitor/debug/ls/theme. `filter`/`goto` logic stays internal for deep links.
- **Plot.** `plot` → `window.print()`. `@media print`: white sheet, chrome/globe hidden, black type, reveals forced visible, `#plot-titleblock` shown (PROJECT / DRAWN BY / SCALE 1:1 · REV 24 / DATE auto).
- **Reader.** `#reader` 720px: label bar (ESC/close) · meta `004 · OPINION · 2026.01.14 · 3 MIN READ` (~220wpm; revisited → append `· READ n% · m MIN LEFT`) · title 1.4rem · `<p>` body .92rem/1.78 · prev/next with neighbor titles, ←/→ keys.
  Open writes `#open=NUM`; close clears; on-load `#open=`/`#goto=` resolves after 400ms. Reader scroll → per-post max % in session memory.
- **Esc chain (one ordered handler):** cmdline focused → blur ▸ selection → clear ▸ lightbox → close ▸ reader → close.
  `.dim`/`.sel` state must be globally defined even without the marquee module so touch is safe.
- **Scrollspy.** IO rootMargin `-35% 0 -55%` → `.here`.

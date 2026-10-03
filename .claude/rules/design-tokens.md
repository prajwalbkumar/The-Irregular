---
paths:
  - "src/css/**"
  - "src/index.njk"
---
# Design tokens (dark, exact — do not "improve")

```css
:root{
  --bg:#0a0b0d; --bg2:#0f1114; --fg:#e9ebe6;
  --ink:233,235,230;          /* neutral triplet → rgba(var(--ink),a) for all greys */
  --acc-rgb:204,255,0;        /* accent triplet → rgba(var(--acc-rgb),a) for glows/borders */
  --dim:rgba(var(--ink),.72); --faint:rgba(var(--ink),.42); --line:rgba(var(--ink),.1);
  --acc:#ccff00; --acc-dim:rgba(var(--acc-rgb),.12); --grid:rgba(var(--ink),.1);
  --card:rgba(15,17,20,.5); --panel-bg:rgba(15,17,20,.85); --overlay-bg:rgba(10,11,13,.92);
  --mono:'JetBrains Mono',monospace;  /* 300/400/500 */
  --disp:'Space Grotesk',sans-serif;  /* 300/400/500/700 */
}
```
- Keep the `--ink`/`--acc-rgb` triplet indirection even with one theme.
- `:root` is emitted from `config.tokens` (see config.md); `field.css` holds only derived rules, never raw hex.
- Status colors: live/active `--acc` · warn/paused `#e8a33d` · info/shipped `#57b0ff` · danger `#ff5c57` · osnap markers `#fff`.
- CAD grid: `body::before`, 110px cells of `--line`, radial mask, pans with cursor (`--gpx/--gpy`, ×.018) + scroll (×.05), opacity .3.
- Reveal: `.rv`→`.in` via IntersectionObserver (rootMargin -6%, .65s, stagger 50ms×(i%6)). All motion gated by `prefers-reduced-motion`.

## Type = two buckets (deliberate — honor it)
- **CONTENT — legible.** Anything read: reader prose .92rem, CV blurb .85, excerpts .82, briefs .8, experiment/spec text .8,
  titles .9–1.6rem. Floor ≈ .7rem. Never shrink for density.
- **CHROME — codified, tight.** Labels/tags/kickers/coords/index numbers/nav/cmdline: mono + UPPERCASE + letter-spaced,
  .44–.6rem on purpose (instrument readouts). Do NOT inflate to a uniform accessible size. A flat `.62rem` floor is a bug.

---
paths:
  - "src/content/**"
---
# Content schemas (author like newspaper copy)

`num` is fixed in frontmatter (NOT auto-derived) so deep links `#open=004` stay stable forever.

| Collection | Path | Frontmatter | Body |
|---|---|---|---|
| posts | `posts/*.md` | `id` (p04) · `num` ("004") · `tag` architecture\|code\|travel\|dispatch\|opinion · `city` (optional IATA → dossier) · `date` YYYY.MM.DD · `size` lg\|md\|sm · `title` · `excerpt` | paragraphs; each blank-line block → one `<p>` |
| briefs | `briefs/*.md` | `tag` (→ "CODE · BRIEF") · `city` (opt) · `order` (position in flow interleave) | one paragraph, inline HTML allowed |
| quotes | `quotes/*.md` | `attr` ("FROM ENTRY 004") | the quote text |
| morgue | `morgue/*.md` | `num` (M-01) · `stamp` UNPUBLISHED\|ABANDONED\|UNFINISHED · `title` | paragraphs |
| experiments | `experiments/*.md` | `id` (EXP-04) · `name` · `st` live\|active\|parked\|shipped | one-line description |

- `tag: travel` posts AND briefs are pulled OUT of the dispatch flow into the Travel feed.
- The live "WIRE" quote is generated at runtime — never authored.
- Each dir has `_template.md`; copy it.

**photos.yml** — `- {s: slug, src: /img/x.jpg (omit → picsum seed s), city: CMB (opt → dossier), cap: "F-001 · PLACE · 5.96N 80.70E"}`

**flow.yml** — the compositor's stone; ordered dispatch column. Items `{type: post|brief|panel|quote, ref}`.
Panels: `projects hobbies nowplaying currentread streak bucket toys contact` (about & now are the pinned band, not in flow).

## Workflow
- New dispatch: copy `posts/_template.md` → `posts/YYYY-MM-DD-slug.md`, fill frontmatter + body, `npm run dev`, commit + push (auto-deploy).
- Lead slot: set via flow.yml position. Photo into a dossier: add to photos.yml with `city:`.
- Flight: one line in `config.flights`. Accent: `config.tokens.acc` + `accRgb`. Move home: `config.based`. Panels: edit config.

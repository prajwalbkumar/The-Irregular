---
id: p17
num: "017"
tag: code
date: 2026-08-03
size: md
title: "A Note on Markdown"
excerpt: "The press now sets bold, tables, callouts, footnotes, wikilinks. This entry exists to prove it."
---
%% This line is a comment. If you can see this sentence, the comment stripping broke. %%

Every dispatch is still just a Markdown file, but the press now understands considerably more of the alphabet: **bold**, *italic*, ***both at once***, ~~struck through~~, and ==highlighted== — the last one styled the way a strip of masking tape would sit on the page.

## A second-level heading

### And a third

Headings inside a dispatch body render at a smaller, content-appropriate scale — the two-bucket type system doesn't let them compete with the actual page structure.

- Unordered lists
- Nest them
  - like this
  - and this
- Ordered lists work too

1. First
2. Second
3. Third

Task lists, unchecked and checked:

- [ ] Port the rest of the Obsidian syntax page
- [x] Ship the ones that actually make sense for a public site

> A plain blockquote — someone else's words, set apart, no styling opinion beyond the acid rule down the left edge.

> [!note] Wikilinks
> A link to another dispatch by title — [[The City That Forgot What Streets Are For]] — resolves automatically to its real URL. [[A Post That Does Not Exist]] renders as plain, unlinked text instead of a broken link, the way Obsidian itself handles it.

> [!tip] Inline code and fenced blocks
> Use `pp.slug` for the file's stable identifier. A fenced block gets its language tag for free:
> ```js
> function refCount(code) {
>   return cityRefs(code).posts.length;
> }
> ```

Footnotes still work mid-sentence[^1] — the marker is a live link to the definition at the bottom of the piece.

> [!warning] One caveat
> A footnote *inside a callout's title line* won't number itself correctly — put footnote references in ordinary prose instead, like the sentence above.

> [!danger] Callouts fold, optionally
> Add a `-` after the type to make it collapsed by default, or a `+` to make it foldable but open. No suffix at all — like the four above — renders as a plain, always-visible block.

A table, because a log occasionally wants one:

| Feature | Source | Renders as |
|---|---|---|
| Callout | `> [!note]` | Styled block, this file has four |
| Wikilink | `[[Title]]` | Real link, or plain text if unresolved |
| Footnote | `[^1]` | Numbered, linked to the definition |

---

An external link still works the ordinary way: [the spec this whole build follows](https://www.11ty.dev/). And a horizontal rule, above, still means what it always meant — a hard cut between two thoughts.

[^1]: The definition lives here, at the end, exactly where a footnote is supposed to.

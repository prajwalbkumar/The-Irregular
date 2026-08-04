---
id: p17
num: "017"
tag: code
date: 2026-08-03
size: md
title: "A Note on Markdown"
excerpt: "The press now sets bold, tables, callouts, footnotes, wikilinks, images, and bookmark cards. Long enough to need its own table of contents — which it also demonstrates."
---
%% This line is a comment. If you can see this sentence, the comment stripping broke. %%

Every dispatch is still just a Markdown file, but the press now understands considerably more of the alphabet. This entry is deliberately long enough to need the table-of-contents rail — open it as its own page, or from the reader's new "Contents" toggle, to see it in action.

## Text formatting

**Bold**, *italic*, ***both at once***, ~~struck through~~, and ==highlighted== — the last one styled the way a strip of masking tape would sit on the page.

### A nested heading

The rail indents h3s under their parent h2, like this one.

## Structure

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

## Quotes and callouts

> A plain blockquote — someone else's words, set apart, no styling opinion beyond the acid rule down the left edge.

> [!note] Wikilinks
> A link to another dispatch by title — [[The City That Forgot What Streets Are For]] — resolves automatically to its real URL. [[A Post That Does Not Exist]] renders as plain, unlinked text instead of a broken link, the way Obsidian itself handles it.

> [!warning] One caveat about footnotes
> A footnote reference *inside a callout's title line* won't number itself correctly — put footnote references in ordinary prose instead.

> [!danger] Callouts fold, optionally
> Add a `-` after the type to make it collapsed by default, or a `+` to make it foldable but open. No suffix at all — like the callouts above — renders as a plain, always-visible block.

## Code

Use `pp.slug` for the file's stable identifier. A fenced block gets its language tag for free:

```js
function refCount(code) {
  return cityRefs(code).posts.length;
}
```

## Footnotes and tables

Footnotes still work mid-sentence[^1] — the marker is a live link to the definition at the bottom of the piece.

A table, because a log occasionally wants one:

| Feature | Source | Renders as |
|---|---|---|
| Callout | `> [!note]` | Styled block, this file has three |
| Wikilink | `[[Title]]` | Real link, or plain text if unresolved |
| Footnote | `[^1]` | Numbered, linked to the definition |

## Images

![A placeholder frame, not a real photograph](https://picsum.photos/seed/note-on-markdown/900/500 "A caption — the optional third argument to the image syntax renders as a figcaption below it.")

## Bookmark cards

A bare URL, alone on its own line with blank lines on either side, becomes a rich preview card — fetched once at build time and cached, the way pasting a link works in Ghost's editor. A URL inside a sentence, or written as `[text](url)`, stays a normal link either way.

https://ghost.org/

---

An external link still works the ordinary way: [the spec this whole build follows](https://www.11ty.dev/). And a horizontal rule, above, still means what it always meant — a hard cut between two thoughts.

[^1]: The definition lives here, at the end, exactly where a footnote is supposed to.

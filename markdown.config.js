// Shared markdown-it instance — used both for the in-page reader's body
// arrays (via eleventy.config.js's renderBody) and for the standalone
// /posts/<slug>/ pages (via eleventyConfig.setLibrary('md', ...)), so a post
// renders identically in both places.
//
// Covers everything on https://obsidian.md/help/syntax except:
//  - Obsidian URIs (obsidian://...) — meaningless for a public site, no reader
//    has the Obsidian app pointed at this vault.
//  - Inline footnotes (^[text]) — no established markdown-it plugin; use
//    standard reference footnotes ([^1] / [^1]: text) instead.
//
// Also adds (beyond the Obsidian syntax page): heading anchors + a table of
// contents extractor, a figure/figcaption image renderer, and Ghost-style
// bookmark cards for a bare URL on its own line.
//
// Bookmark cards need a network fetch, but both render paths — Eleventy's own
// per-file `md.render()` for standalone pages, and this file's `renderBody()`
// for the in-page reader's data — call into markdown-it synchronously, and
// Eleventy doesn't await a markdown library's .render(). So bookmark
// resolution is split in two: an async *prefetch* pass (prefetchBookmarks,
// called once from eleventy.config.js before any rendering happens) that
// populates a disk cache, and a synchronous *substitution* pass (folded into
// every render path below) that only ever does cache lookups — never a fetch
// — so it's safe to call from a sync context. A URL that failed to prefetch
// (offline, 404, timeout) just stays a plain link; nothing throws.
const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');
const mark = require('markdown-it-mark');
const footnote = require('markdown-it-footnote');
const taskLists = require('markdown-it-task-lists');
const anchor = require('markdown-it-anchor');

const CALLOUT_TYPES = {
  note: 'info', info: 'info', todo: 'warn',
  tip: 'acc', hint: 'acc', important: 'acc', success: 'acc', check: 'acc', done: 'acc',
  question: 'acc', help: 'acc', faq: 'acc', example: 'acc',
  warning: 'warn', caution: 'warn', attention: 'warn',
  danger: 'danger', error: 'danger', failure: 'danger', fail: 'danger', missing: 'danger', bug: 'danger',
  abstract: 'dim', summary: 'dim', tldr: 'dim', quote: 'dim', cite: 'dim'
};

// ── Bookmark cards ──────────────────────────────────────────────────────

const CACHE_PATH = path.join(__dirname, '.cache', 'bookmarks.json');

function loadBookmarkCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')); } catch { return {}; }
}
function saveBookmarkCache(cache) {
  const clean = { ...cache };
  delete clean.__dirty;
  fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(clean, null, 2) + '\n');
}

function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
}

function metaTag(html, attr, key) {
  const a = html.match(new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]*content=["']([^"']*)["']`, 'i'));
  if (a) return a[1];
  const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*${attr}=["']${key}["']`, 'i'));
  return b ? b[1] : null;
}

async function fetchOg(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FieldBroadsheetBot/1.0; +https://github.com/)' }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const html = await res.text();
    const titleTag = html.match(/<title>([^<]*)<\/title>/i);
    const title = metaTag(html, 'property', 'og:title') || (titleTag ? titleTag[1] : url);
    const description = metaTag(html, 'property', 'og:description') || metaTag(html, 'name', 'description') || '';
    let image = metaTag(html, 'property', 'og:image');
    if (image) { try { image = new URL(image, url).href; } catch { image = null; } }
    const siteName = metaTag(html, 'property', 'og:site_name') || new URL(url).hostname.replace(/^www\./, '');
    return {
      url,
      title: decodeEntities(title).trim().slice(0, 200),
      description: decodeEntities(description).trim().slice(0, 300),
      image,
      siteName: decodeEntities(siteName).trim()
    };
  } finally {
    clearTimeout(timer);
  }
}

// A paragraph that is *only* a bare URL (blank line before and after) is a
// bookmark candidate — mirrors how pasting a bare URL on its own line
// behaves in Ghost's editor. Anything else (`[text](url)`, a URL inside a
// sentence) is never touched.
function findBareUrlLines(src) {
  const lines = src.split('\n');
  const found = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const m = /^<?(https?:\/\/\S+?)>?$/.exec(line);
    const blankBefore = i === 0 || lines[i - 1].trim() === '';
    const blankAfter = i === lines.length - 1 || lines[i + 1].trim() === '';
    if (m && blankBefore && blankAfter) found.push(m[1]);
  }
  return found;
}

/** Async — call once, before any rendering, for every raw content string that
 *  might contain a bookmark. Fetches whatever isn't already cached; never
 *  throws (a failed fetch just means that URL stays a plain link later). */
async function prefetchBookmarks(rawSources, cache) {
  const urls = new Set();
  rawSources.forEach(src => findBareUrlLines(src).forEach(u => urls.add(u)));
  for (const url of urls) {
    if (cache[url]) continue;
    try { cache[url] = await fetchOg(url); cache.__dirty = true; } catch { /* leave unresolved */ }
  }
}

function renderBookmarkHtml(md, data) {
  const domain = data.siteName || (() => { try { return new URL(data.url).hostname; } catch { return data.url; } })();
  // The outer tag must be block-level for markdown-it to treat this as an
  // html_block (opaque passthrough) instead of wrapping it in a <p> — an <a>
  // alone on a line doesn't qualify, a <div> does.
  return `<div class="bookmark-card-wrap"><a class="bookmark-card" href="${data.url}" target="_blank" rel="noopener noreferrer">` +
    `<span class="bookmark-content">` +
    `<span class="bookmark-title">${md.utils.escapeHtml(data.title)}</span>` +
    (data.description ? `<span class="bookmark-desc">${md.utils.escapeHtml(data.description)}</span>` : '') +
    `<span class="bookmark-meta">${md.utils.escapeHtml(domain)}</span>` +
    `</span>` +
    (data.image ? `<span class="bookmark-thumb" style="background-image:url('${data.image.replace(/'/g, '%27')}')"></span>` : '') +
    `</a></div>`;
}

// Synchronous — cache lookups only, safe to call from md.render (which
// Eleventy calls synchronously). Anything not already cached (prefetch
// failed, or was never run) is left as a plain bare-URL line, which
// markdown-it's `linkify` then auto-links as ordinary text.
function substituteBookmarks(md, src, cache) {
  const lines = src.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const m = /^<?(https?:\/\/\S+?)>?$/.exec(line);
    const blankBefore = i === 0 || lines[i - 1].trim() === '';
    const blankAfter = i === lines.length - 1 || lines[i + 1].trim() === '';
    if (m && blankBefore && blankAfter && cache[m[1]]) {
      out.push('', renderBookmarkHtml(md, cache[m[1]]), '');
    } else {
      out.push(lines[i]);
    }
  }
  return out.join('\n');
}

// ── Callouts ────────────────────────────────────────────────────────────

// Obsidian callouts (`> [!type] Title` blockquotes) are extracted from the
// raw source and re-rendered recursively *before* the main parse, rather than
// hooked in as a markdown-it block rule — token-level surgery on an
// already-parsed blockquote is fragile; this is simpler and just as correct
// for the common (non-nested) case.
function extractCallouts(md, src) {
  const lines = src.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const m = /^>\s?\[!([\w-]+)\]([+-]?)\s*(.*)$/.exec(lines[i]);
    if (!m) { out.push(lines[i]); i++; continue; }
    const [, rawType, fold, titleText] = m;
    const type = rawType.toLowerCase();
    const bodyLines = [];
    let j = i + 1;
    while (j < lines.length && /^>( ?)/.test(lines[j])) {
      bodyLines.push(lines[j].replace(/^>\s?/, ''));
      j++;
    }
    const innerHtml = md.render(bodyLines.join('\n'));
    const tone = CALLOUT_TYPES[type] || 'acc';
    const label = titleText || (type.charAt(0).toUpperCase() + type.slice(1));
    // renderInline, not escapeHtml — titles get bold/italic/highlight/wikilinks
    // too. Not footnotes: those render with a fresh, isolated env here, so a
    // footnote ref in a title would number itself independently of the body's
    // — put footnotes in prose, not callout titles.
    const labelHtml = md.renderInline(label);
    const tag = fold ? 'details' : 'div';
    const headerTag = fold ? 'summary' : 'div';
    const openAttr = fold === '+' ? ' open' : '';
    out.push(
      '',
      `<${tag} class="callout callout-${tone}"${fold ? openAttr : ''}>` +
      `<${headerTag} class="callout-title">${labelHtml}</${headerTag}>` +
      `<div class="callout-body">${innerHtml}</div></${tag}>`,
      ''
    );
    i = j;
  }
  return out.join('\n');
}

// [[Post Title]] or [[Post Title|display text]] — resolves to a matching
// post's standalone URL by title or id; unresolved links render as plain
// (visually distinct) text, matching Obsidian's own "unresolved link" cue.
function wikilinksPlugin(md, postIndex) {
  md.inline.ruler.before('link', 'wikilink', (state, silent) => {
    const src = state.src, pos = state.pos;
    if (src.slice(pos, pos + 2) !== '[[') return false;
    const end = src.indexOf(']]', pos + 2);
    if (end === -1) return false;
    const inner = src.slice(pos + 2, end);
    const [targetRaw, aliasRaw] = inner.split('|');
    const target = (targetRaw || '').trim();
    const alias = (aliasRaw || targetRaw || '').trim();
    if (!target) return false;
    if (!silent) {
      const match = postIndex.find(p =>
        p.title.toLowerCase() === target.toLowerCase() || p.id === target || p.slug === target);
      const token = state.push('wikilink', '', 0);
      token.meta = { href: match ? `/posts/${match.slug}/` : null, label: alias };
    }
    state.pos = end + 2;
    return true;
  });
  md.renderer.rules.wikilink = (tokens, idx) => {
    const { href, label } = tokens[idx].meta;
    return href
      ? `<a class="wikilink" href="${href}">${md.utils.escapeHtml(label)}</a>`
      : `<span class="wikilink wikilink-unresolved" title="No matching post">${md.utils.escapeHtml(label)}</span>`;
  };
}

// ![alt](src "caption") → <figure><img><figcaption> when a title is present,
// a plain (still responsive) <img> otherwise.
function figureImagePlugin(md) {
  const defaultRule = md.renderer.rules.image;
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const caption = token.attrGet('title');
    const rendered = (defaultRule || self.renderToken.bind(self))(tokens, idx, options, env, self);
    if (!caption) return rendered;
    return `<figure class="md-figure">${rendered}<figcaption>${md.utils.escapeHtml(caption)}</figcaption></figure>`;
  };
}

/**
 * @param {{id:string, title:string, slug:string}[]} postIndex
 * @param {object} bookmarkCache — pre-populated via prefetchBookmarks()
 */
function createMarkdownIt(postIndex = [], bookmarkCache = {}) {
  const md = new MarkdownIt({ html: true, linkify: true, typographer: true })
    .use(mark)
    .use(footnote)
    .use(taskLists, { enabled: true, label: true })
    .use(anchor, { level: [2, 3], slugify: s => String(s).trim().toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '') });
  wikilinksPlugin(md, postIndex);
  figureImagePlugin(md);

  // Shared preprocessing chain — used by both md.render (Eleventy's own
  // per-file rendering, i.e. the standalone pages) and renderBody below (the
  // in-page reader's data), so a post is byte-for-byte identical either way.
  md.preprocess = src => extractCallouts(md, substituteBookmarks(md, src.replace(/%%[\s\S]*?%%/g, ''), bookmarkCache));

  const rawRender = md.render.bind(md);
  md.render = (src, env) => rawRender(md.preprocess(src), env);

  return md;
}

// Groups a token stream into top-level block units (one array entry per
// paragraph / heading / list / blockquote / callout / table / fence / hr /
// footnote section, etc.) — a plain blank-line split can't be used once real
// markdown is in play (a list with a blank line between loose items is still
// ONE list, not two blocks; the same is true of tables and multi-paragraph
// blockquotes), so this walks markdown-it's own nesting instead.
function splitTopLevelBlocks(tokens) {
  const blocks = [];
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (t.nesting === 1) {
      let depth = 1, j = i + 1;
      while (j < tokens.length && depth > 0) {
        if (tokens[j].level === t.level) {
          if (tokens[j].nesting === 1) depth++;
          else if (tokens[j].nesting === -1) depth--;
        }
        j++;
      }
      blocks.push(tokens.slice(i, j));
      i = j;
    } else {
      blocks.push([t]);
      i++;
    }
  }
  return blocks;
}

// Pulls {level, id, text} for every h2/h3 out of a token stream — the anchor
// plugin has already stamped `id` onto each heading_open token by this point
// (it runs as a core rule during md.parse()).
function extractTocFromTokens(tokens) {
  const toc = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type !== 'heading_open') continue;
    const level = Number(t.tag.slice(1));
    if (level !== 2 && level !== 3) continue;
    const inline = tokens[i + 1];
    toc.push({ level, id: t.attrGet('id'), text: inline ? inline.content : '' });
  }
  return toc;
}

/** Renders `src` into {blocks, toc}. Fully synchronous — bookmark cards
 *  resolve from whatever prefetchBookmarks() already cached. */
function renderBody(md, src) {
  const cleaned = md.preprocess(src);
  const tokens = md.parse(cleaned, {});
  const blocks = splitTopLevelBlocks(tokens)
    .map(block => md.renderer.render(block, md.options, {}))
    .map(html => html.trim())
    .filter(Boolean);
  return { blocks, toc: extractTocFromTokens(tokens) };
}

/** For single-line fields (brief text, quote text, experiment descriptions) —
 *  inline markdown only (bold/italic/highlight/wikilinks/strikethrough/links),
 *  no block wrapper, no callouts/bookmarks (those need a standalone paragraph). */
function renderInlineText(md, src) {
  return md.renderInline(src.replace(/%%[\s\S]*?%%/g, '').replace(/\s+/g, ' ').trim());
}

module.exports = {
  createMarkdownIt, renderBody, renderInlineText,
  loadBookmarkCache, saveBookmarkCache, prefetchBookmarks
};

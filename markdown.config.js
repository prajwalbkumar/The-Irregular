// Shared markdown-it instance — used both for the in-page reader's body
// arrays (via eleventy.config.js's renderBodyBlocks) and for the standalone
// /posts/<slug>/ pages (via eleventyConfig.setLibrary('md', ...)), so a post
// renders identically in both places.
//
// Covers everything on https://obsidian.md/help/syntax except:
//  - Obsidian URIs (obsidian://...) — meaningless for a public site, no reader
//    has the Obsidian app pointed at this vault.
//  - Inline footnotes (^[text]) — no established markdown-it plugin; use
//    standard reference footnotes ([^1] / [^1]: text) instead.
const MarkdownIt = require('markdown-it');
const mark = require('markdown-it-mark');
const footnote = require('markdown-it-footnote');
const taskLists = require('markdown-it-task-lists');

const CALLOUT_TYPES = {
  note: 'info', info: 'info', todo: 'warn',
  tip: 'acc', hint: 'acc', important: 'acc', success: 'acc', check: 'acc', done: 'acc',
  question: 'acc', help: 'acc', faq: 'acc', example: 'acc',
  warning: 'warn', caution: 'warn', attention: 'warn',
  danger: 'danger', error: 'danger', failure: 'danger', fail: 'danger', missing: 'danger', bug: 'danger',
  abstract: 'dim', summary: 'dim', tldr: 'dim', quote: 'dim', cite: 'dim'
};

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

/**
 * @param {{id:string, title:string, slug:string}[]} postIndex
 */
function createMarkdownIt(postIndex = []) {
  const md = new MarkdownIt({ html: true, linkify: true, typographer: true })
    .use(mark)
    .use(footnote)
    .use(taskLists, { enabled: true, label: true });
  wikilinksPlugin(md, postIndex);

  const rawRender = md.render.bind(md);
  md.render = (src, env) => rawRender(extractCallouts(md, src.replace(/%%[\s\S]*?%%/g, '')), env);

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

/** Renders `src` (already comment/callout-preprocessed by md.render's override
 *  isn't reused here since we need the token stream, not the final HTML) into
 *  an array of standalone HTML block strings. */
function renderBodyBlocks(md, src) {
  const cleaned = extractCallouts(md, src.replace(/%%[\s\S]*?%%/g, ''));
  const tokens = md.parse(cleaned, {});
  return splitTopLevelBlocks(tokens)
    .map(block => md.renderer.render(block, md.options, {}))
    .map(html => html.trim())
    .filter(Boolean);
}

/** For single-line fields (brief text, quote text, experiment descriptions) —
 *  inline markdown only (bold/italic/highlight/wikilinks/strikethrough/links),
 *  no block wrapper, no callouts (blockquote-only syntax doesn't apply to a
 *  one-line field). */
function renderInlineText(md, src) {
  return md.renderInline(src.replace(/%%[\s\S]*?%%/g, '').replace(/\s+/g, ' ').trim());
}

module.exports = { createMarkdownIt, renderBodyBlocks, renderInlineText };

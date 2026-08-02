const fs = require('fs');
const matter = require('gray-matter');
const cfg = require('./field.config.js');

// Raw pre-render markdown body, split on blank lines — the shape the reader
// (and every content array in the prototype) expects: body:[...paragraphs].
// Eleventy's reserved `date` frontmatter key must be a real Date (or one of
// its special keywords) — content authors write plain ISO, we reformat to
// the dotted display string (2026.01.14) the prototype/spec both use.
function dotDate(d) {
  return d.toISOString().slice(0, 10).replace(/-/g, '.');
}

function paragraphsFor(item) {
  const raw = fs.readFileSync(item.inputPath, 'utf8');
  const { content } = matter(raw);
  return content
    .trim()
    .split(/\r?\n\s*\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);
}

module.exports = function (ec) {
  ec.addPassthroughCopy('src/assets');

  // ── Collections from content/ — plain objects, shapes match the prototype ──
  ec.addCollection('posts', c => c
    .getFilteredByGlob('src/content/posts/*.md')
    .map(item => ({
      id: item.data.id,
      num: item.data.num,
      tag: item.data.tag,
      city: item.data.city || null,
      date: dotDate(item.data.date),
      size: item.data.size,
      title: item.data.title,
      excerpt: item.data.excerpt,
      slug: item.fileSlug,
      body: paragraphsFor(item)
    }))
    .sort((a, b) => a.num.localeCompare(b.num)));

  ec.addCollection('travel', c => c
    .getFilteredByGlob('src/content/posts/*.md')
    .filter(item => item.data.tag === 'travel')
    .map(item => ({
      id: item.data.id,
      num: item.data.num,
      tag: item.data.tag,
      city: item.data.city || null,
      date: dotDate(item.data.date),
      size: item.data.size,
      title: item.data.title,
      excerpt: item.data.excerpt,
      slug: item.fileSlug,
      body: paragraphsFor(item)
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1)));

  ec.addCollection('briefs', c => c
    .getFilteredByGlob('src/content/briefs/*.md')
    .map(item => ({
      tag: item.data.tag,
      label: `${String(item.data.tag).toUpperCase()} · BRIEF`,
      city: item.data.city || null,
      order: item.data.order,
      text: paragraphsFor(item).join(' ')
    }))
    .sort((a, b) => a.order - b.order));

  ec.addCollection('quotes', c => c
    .getFilteredByGlob('src/content/quotes/*.md')
    .map((item, i) => ({
      n: i + 1,
      tag: item.data.tag || null,
      attr: item.data.attr,
      text: paragraphsFor(item).join(' ')
    })));

  ec.addCollection('morgue', c => c
    .getFilteredByGlob('src/content/morgue/*.md')
    .map(item => ({
      num: item.data.num,
      stamp: item.data.stamp,
      title: item.data.title,
      body: paragraphsFor(item)
    }))
    .sort((a, b) => a.num.localeCompare(b.num)));

  ec.addCollection('experiments', c => c
    .getFilteredByGlob('src/content/experiments/*.md')
    .map(item => ({
      id: item.data.id,
      name: item.data.name,
      st: item.data.st,
      desc: paragraphsFor(item).join(' ')
    }))
    .sort((a, b) => a.id.localeCompare(b.id)));

  // ── Filters ──
  ec.addFilter('isoDate', d => new Date(d).toISOString().split('T')[0]);
  ec.addFilter('num3', n => String(n).padStart(3, '0'));
  ec.addFilter('dump', v => JSON.stringify(v));
  ec.addFilter('absUrl', p => `${cfg.site.url}${p}`);
  ec.addFilter('dotDate', d => dotDate(new Date(d)));
  // Nunjucks' selectattr has no Jinja2-style test args ("equalto" etc.) — it
  // silently ignores them, so flow.yml ref lookups need a real exact-match filter.
  ec.addFilter('findBy', (arr, key, val) => (arr || []).find(x => x[key] === val));

  // ── Config-driven design tokens (§3.2) — the ONLY source of the palette ──
  ec.addShortcode('fieldTokens', () => {
    const t = cfg.tokens;
    return `<style>:root{--bg:${t.bg};--bg2:${t.bg2};--fg:${t.fg};--ink:${t.ink};`
      + `--acc-rgb:${t.accRgb};--dim:rgba(var(--ink),.72);--faint:rgba(var(--ink),.42);`
      + `--line:rgba(var(--ink),.1);--acc:${t.acc};--acc-dim:rgba(var(--acc-rgb),.12);`
      + `--grid:rgba(var(--ink),.1);--card:${t.card};--panel-bg:${t.panelBg};`
      + `--overlay-bg:${t.overlayBg};--mono:'JetBrains Mono',monospace;--disp:'Space Grotesk',sans-serif}</style>`;
  });

  // Inlined (not linked) to preserve the single-file output property.
  ec.addShortcode('fieldCSS', () => `<style>${fs.readFileSync('src/css/field.css', 'utf8')}</style>`);

  // Concatenates src/js/NN-name.js in numeric-prefix order into one inline
  // <script> — the client-side render/interaction modules, run after the
  // 00-data.js-equivalent data block that index.njk emits directly.
  ec.addShortcode('fieldJS', () => {
    const dir = 'src/js';
    const files = fs.readdirSync(dir)
      .filter(f => /^\d{2}-.*\.js$/.test(f))
      .sort();
    const body = files.map(f => `/* ── ${f} ── */\n${fs.readFileSync(`${dir}/${f}`, 'utf8')}`).join('\n');
    return `<script>${body}</script>`;
  });

  ec.setServerOptions({ port: 3000, watch: ['src/assets/**', 'src/css/**', 'src/js/**', 'field.config.js'] });

  return {
    dir: { input: 'src', output: 'dist', includes: '_includes', data: '_data' },
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk'
  };
};

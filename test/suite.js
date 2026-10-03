#!/usr/bin/env node
/* jsdom behavioral suite — §10.
 * Strips CDN scripts (three.js/globe.gl) so Globe/THREE stay deterministically
 * undefined, forcing the globe's own try/catch → #globe-offline path; stubs
 * everything the built page reaches for that jsdom doesn't implement; then
 * asserts zero window errors plus the behavioral checklist.
 *
 * Note: data arrays (POSTS/EXPS/MORGUE/CMDS/...) are declared `const` inside
 * the page's own inline script — only `function` declarations (and explicit
 * `window.x = ...` assignments) become window properties in a classic
 * script, so most of these don't exist from outside. Where a count is
 * needed, we either extract the same JSON literal straight out of the built
 * HTML, or reach for a value 10-render.js deliberately hangs off `window`
 * as a test hook (window.FLOW_ITEMS).
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const DIST = path.join(__dirname, '..', 'dist', 'index.html');
if (!fs.existsSync(DIST)) {
  console.error('dist/index.html not found — run `npm run build` first.');
  process.exit(1);
}
let html = fs.readFileSync(DIST, 'utf8');
html = html.replace(/<script src="https:\/\/unpkg\.com\/[^"]+"><\/script>\s*/g, '');

function extractConst(name) {
  const m = html.match(new RegExp(`^const ${name} = (.+);$`, 'm'));
  if (!m) throw new Error(`could not find "const ${name} = ...;" in built HTML`);
  return JSON.parse(m[1]);
}
const DATA_EXPS = extractConst('EXPS');
const DATA_MORGUE = extractConst('MORGUE');

const failures = [];
let passCount = 0;
function assert(cond, msg) {
  if (cond) { passCount++; }
  else { failures.push(msg); }
}
function section(name, fn) {
  try { fn(); } catch (e) { failures.push(`[${name}] threw: ${e.stack}`); }
}

const windowErrors = [];

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  resources: 'usable',
  url: 'http://localhost/',
  pretendToBeVisual: true,
  beforeParse(window) {
    window.matchMedia = (q) => ({
      matches: q.includes('reduced-motion') ? false : (q.includes('hover') ? true : false),
      addListener(){}, removeListener(){}
    });
    window.requestAnimationFrame = (fn) => setTimeout(fn, 16);
    window.fetch = () => Promise.reject(new Error('network disabled in tests'));
    window.IntersectionObserver = class { observe(){} unobserve(){} disconnect(){} };
    window.Element.prototype.scrollIntoView = function(){};
    window.scrollTo = function(){};
    window.print = function(){};
    if (!window.Blob) window.Blob = class Blob {};
    if (!window.PointerEvent) window.PointerEvent = window.MouseEvent;
    if (window.HTMLCanvasElement) window.HTMLCanvasElement.prototype.getContext = () => null;
    window.onerror = (msg, src, line, col, err) => { windowErrors.push(`${msg} @${line}:${col}${err && err.stack ? '\n' + err.stack : ''}`); };
    window.addEventListener('unhandledrejection', e => windowErrors.push('unhandled rejection: ' + (e.reason && (e.reason.stack || e.reason.message) || e.reason)));
  }
});
const { window } = dom;
const d = window.document;

function typeCommand(raw) {
  const cmdIn = d.getElementById('cmd-input');
  cmdIn.focus();
  cmdIn.value = raw;
  cmdIn.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
}
function lastHistLine() {
  return d.getElementById('cmd-hist').lastElementChild;
}

setTimeout(main, 2600);

function main() {
  // ── zero window errors ──
  section('zero window errors', () => {
    assert(windowErrors.length === 0, `expected zero window errors, got ${windowErrors.length}:\n${windowErrors.join('\n---\n')}`);
  });

  // ── renders ──
  // FLOW_ITEMS (10-render.js) is computed at runtime — no authored position
  // list exists anymore — so it's exposed on window purely as a test hook.
  const FLOW_PAGE_SIZE = 9; // must match FLOW_PAGE_SIZE in src/js/10-render.js
  section('renders: flow — computed order', () => {
    const flowEl = d.getElementById('flow');
    assert(!!flowEl, 'flow container exists');
    const items = window.FLOW_ITEMS;
    assert(Array.isArray(items) && items.length > 0, 'FLOW_ITEMS is computed (posts sorted + briefs/quotes/panels interleaved)');
    const posts0 = items.filter(it => it.type === 'post');
    assert(posts0.length === Math.min(FLOW_PAGE_SIZE, window.__flowPostTotal), `first page shows ${FLOW_PAGE_SIZE} posts, got ${posts0.length}`);
    // +1: 80-fx.js's mountWire() inserts one extra live quote card into #flow
    assert(flowEl.children.length === items.length + 1, `flow renders every current item + 1 WIRE card, got ${flowEl.children.length}`);
    ['projects', 'hobbies', 'nowplaying', 'currentread', 'streak', 'bucket', 'toys', 'contact'].forEach(k =>
      assert(!!flowEl.querySelector(`[data-panel="${k}"]`), `special panel "${k}" is on the page before any Load More click`));
    assert(flowEl.querySelectorAll('.brief').length === window.__flowBriefTotal, 'every brief is on the page before any Load More click');
    assert(flowEl.querySelectorAll('.quote:not(.wire)').length === window.__flowQuoteTotal, 'every authored quote is on the page before any Load More click');
    const posts = items.filter(it => it.type === 'post').map(it => it.data);
    const sorted = [...posts].sort((a, b) => b.date.localeCompare(a.date));
    assert(posts.every((p, i) => p.id === sorted[i].id), 'flow posts are ordered reverse-chronologically, newest first');
    assert(!posts.some(p => p.id === 'p01'), 'the lead post is excluded from the flow pool (it renders in #lead-slot)');
    assert(!posts.some(p => p.tag === 'travel'), 'travel-tagged posts are excluded from the flow pool (they route to the Travel feed)');
    assert(d.querySelectorAll('#flow .quote').length >= 1, 'at least the WIRE quote card is present in the flow');
  });
  section('renders: flow — Load More pagination', () => {
    const flowEl = d.getElementById('flow');
    const row = d.getElementById('flow-more-row');
    const btn = d.getElementById('flow-more');
    assert(!!row && !!btn, 'Load More control exists');
    if (window.__flowPostTotal <= FLOW_PAGE_SIZE) {
      assert(row.hidden, 'Load More stays hidden when every post already fits on the first page');
      return;
    }
    assert(!row.hidden, 'Load More is visible when more posts remain beyond the first page');
    const specialsBefore = flowEl.children.length - d.querySelectorAll('#flow .story').length;
    const np = d.getElementById('np-title');
    const before = d.querySelectorAll('#flow .story').length;
    btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    const after = d.querySelectorAll('#flow .story').length;
    assert(after > before, `clicking Load More adds posts to #flow (${before} → ${after})`);
    assert(flowEl.children.length - after === specialsBefore, 'Load More adds no special cards and drops none — all specials stay on the page');
    assert(d.getElementById('np-title') === np, 'special cards are moved, not rebuilt, on Load More');
    let guard = 0;
    while (!row.hidden && guard < 20) {
      btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      guard++;
    }
    assert(row.hidden, 'Load More hides itself once every post has been revealed');
    assert(flowEl.children.length === window.FLOW_ITEMS.length + 1, `after exhausting Load More, #flow holds every item + the WIRE card (expected ${window.FLOW_ITEMS.length + 1}, got ${flowEl.children.length})`);
    const kinds = window.FLOW_ITEMS.map(it => it.type);
    const lastPost = kinds.lastIndexOf('post');
    assert(kinds.slice(0, lastPost).filter(k => k !== 'post').length >= window.__flowSpecialTotal - 1, 'specials are spread among the posts, not piled at the end');
  });
  section('renders: pinned panels', () => {
    assert(d.getElementById('pinned-panels').children.length === 2, 'pinned band has exactly 2 panels (about, now)');
  });
  section('renders: travel feed page size + pager', () => {
    const feed = d.getElementById('travel-feed');
    const items = feed.querySelectorAll('.story, .brief');
    assert(items.length <= 4 && items.length > 0, `travel feed page shows 1-4 items, got ${items.length}`);
    assert(!!feed.querySelector('.tf-pager'), 'travel feed has a pager');
    assert(!!feed.querySelector('.tf-page-ind'), 'travel feed pager shows a page indicator');
  });
  section('renders: photo strip', () => {
    assert(d.querySelectorAll('#photo-grid .ph').length === 10, `photo strip shows 10 frames, got ${d.querySelectorAll('#photo-grid .ph').length}`);
  });
  section('renders: cv two-column', () => {
    const cols = d.getElementById('cv-root').children;
    assert(cols.length === 2, `cv-root has 2 top-level columns, got ${cols.length}`);
  });
  section('renders: github activity block present', () => {
    assert(!!d.getElementById('cv-activity'), 'cv-activity block exists');
    assert(!!d.getElementById('gh-bars'), 'gh-bars element exists for the 7-day chart');
    assert(!!d.getElementById('gh-heatmap'), 'gh-heatmap element exists for the 12-week heatmap');
    const bars = d.getElementById('gh-bars').textContent;
    assert(bars.includes('GITHUB UNREACHABLE'), `offline github activity shows honest error, got: "${bars}"`);
  });
  section('renders: experiments + morgue', () => {
    assert(d.querySelectorAll('#exp-list .exp-row').length === DATA_EXPS.length, 'experiments row count matches EXPS');
    assert(d.querySelectorAll('#mg-list .mg-entry').length === DATA_MORGUE.length, 'morgue entry count matches MORGUE');
  });

  // ── dossier refCounts ──
  section('dossier refCounts', () => {
    const expected = { CMB: 3, DXB: 4, MCT: 2, NRT: 1, DOH: 0 };
    for (const [code, n] of Object.entries(expected)) {
      assert(window.refCount(code) === n, `refCount(${code}) === ${n}, got ${window.refCount(code)}`);
    }
  });
  section('dossier open/empty/home states', () => {
    window.showDossier('CMB');
    assert(d.getElementById('dossier').classList.contains('open'), 'dossier opens for a city with refs');
    assert(d.getElementById('dossier').innerHTML.includes('CMB'), 'dossier shows the city code');

    window.showDossier('DOH');
    assert(d.getElementById('dossier').innerHTML.includes('NO DISPATCHES FILED YET'), 'empty dossier shows the empty-state copy');

    window.showDossier('DXB');
    assert(d.getElementById('dossier').innerHTML.includes('HOME BASE'), 'home dossier shows the HOME BASE line');
  });

  // ── command line: registry shape ──
  section('commands: registry has exactly the spec 19, no more', () => {
    const keyRe = /(\w+):\s*\{\s*d:\s*'/g;
    const scriptMatch = html.match(/const CMDS = \{[\s\S]*?\n\};/);
    assert(!!scriptMatch, 'CMDS object literal found in built page');
    const keys = [...(scriptMatch ? scriptMatch[0].matchAll(keyRe) : [])].map(m => m[1]);
    const expected = ['help', 'open', 'search', 'find', 'city', 'fly', 'logbook', 'metar', 'cv', 'quote', 'plot', 'email', 'morgue', 'boot', 'clear', 'rhino', 'sudo', 'hello', 'coffee'];
    assert(keys.length === 19, `CMDS has exactly 19 commands, got ${keys.length}: ${keys.join(',')}`);
    expected.forEach(name => assert(keys.includes(name), `"${name}" is in the command registry`));
    const removed = ['about', 'now', 'bucket', 'goto', 'filter', 'skills', 'stats', 'whoop', 'life', 'music', 'isolate', 'visitor', 'debug', 'ls', 'theme'];
    removed.forEach(name => assert(!keys.includes(name), `"${name}" was removed and must not be in the registry`));
  });
  section('commands: behavioral spot-check (safe subset)', () => {
    const safeCommands = ['help', 'logbook', 'cv', 'quote', 'rhino', 'sudo', 'hello', 'coffee', 'find test', 'open 004', 'city dxb', 'fly cmb'];
    safeCommands.forEach(raw => {
      typeCommand(raw);
      const line = lastHistLine();
      assert(!!line, `"${raw}" produced an output line`);
      if (line) assert(!line.textContent.startsWith('Unknown command'), `"${raw}" is recognized (not "Unknown command"), got: "${line.textContent}"`);
    });
  });
  section('commands: unknown command emits a styled error line', () => {
    const before = d.getElementById('cmd-hist').children.length;
    typeCommand('zzznotacommand');
    const hist = d.getElementById('cmd-hist');
    assert(hist.children.length === before + 2, 'unknown command appends an input echo + one error line');
    assert(hist.lastElementChild.className === 'c-err', 'unknown command line is styled as an error');
    assert(hist.lastElementChild.textContent.startsWith('Unknown command'), 'unknown command line says so');
  });

  // ── search → reader flow ──
  section('search finds and opens a result', () => {
    typeCommand('search dubai');
    const result = d.querySelector('#cmd-hist .c-res');
    assert(!!result, 'search produces at least one clickable result');
    if (result) {
      result.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      assert(d.getElementById('reader-back').classList.contains('open'), 'clicking a search result opens the reader');
      window.closeReader({ target: d.getElementById('reader-back') });
    }
  });

  // ── Esc chain ──
  section('Esc chain', () => {
    const cmdIn = d.getElementById('cmd-input');
    cmdIn.focus();
    window.openPost('p01');
    window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
    assert(d.activeElement !== cmdIn, 'Escape blurs a focused command line');
    assert(!d.getElementById('reader-back').classList.contains('open'), 'Escape (cmdline path) also closes the reader');

    window.openPost('p01');
    window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
    assert(!d.getElementById('reader-back').classList.contains('open'), 'Escape closes an open reader directly when cmdline is not focused');
  });

  // ── duplicate-ID scan ──
  section('duplicate-ID scan', () => {
    const seen = new Map();
    d.querySelectorAll('[id]').forEach(el => {
      seen.set(el.id, (seen.get(el.id) || 0) + 1);
    });
    const dupes = [...seen.entries()].filter(([, n]) => n > 1);
    assert(dupes.length === 0, `no duplicate ids, found: ${dupes.map(([id, n]) => `${id}×${n}`).join(', ')}`);
  });

  // ── heading structure (§14.3) — exactly one h1, the masthead, on home ──
  section('heading structure', () => {
    const h1s = d.querySelectorAll('h1');
    assert(h1s.length === 1, `home page has exactly one h1, got ${h1s.length}`);
    assert(h1s[0] && h1s[0].id === 'masthead-name', 'the single h1 is the masthead');
    // 5: dispatches/travel/photography/experiments/personnel — morgue's head is .mg-head, not .sec-head
    assert(d.querySelectorAll('h2.sec-head').length === 5, 'every numbered section head is a real h2');
  });

  // ── stale-reference scan for removed features ──
  section('stale-reference scan', () => {
    assert(!/body\.dark/.test(html), 'no body.dark selector (light/theme toggle was removed)');
    assert(!/#telemetry-panel|class="telemetry/.test(html), 'no telemetry panel markup');
    assert(!/#terminator|day-night-terminator/.test(html), 'no day/night terminator markup');
    assert(!/#particle-field|particle-canvas/.test(html), 'no particle field markup');
    // the ticker itself must be JS transform-driven, not a CSS @keyframes marquee
    // (a `.ticker-track{animation:none !important}` override under
    // prefers-reduced-motion is fine — that's a safeguard, not the mechanism)
    assert(!/@keyframes\s+marquee/i.test(html), 'no @keyframes marquee rule (ticker was a buggy CSS animation before the JS rewrite)');
    assert(/tr\.style\.transform\s*=/.test(html), 'ticker motion is driven by JS style.transform');
    assert(!/boot-fortune|fortune-line/.test(html), 'no boot fortune line');
    assert(!/auto-typed-help|typeHelp\(/.test(html), 'no auto-typed help');
  });

  // ── two-bucket type sanity (§2) — content never flattened to chrome size ──
  section('two-bucket type sanity', () => {
    assert(/\.st-ex\{[^}]*font-size:\.82rem/.test(html), 'story excerpt keeps its content-bucket size (.82rem)');
    assert(!/\.rd-body p\{[^}]*font-size:\.62rem/.test(html), 'reader body text is not flattened to a chrome-sized floor');
  });

  // ── report ──
  console.log(`\n${passCount} passed, ${failures.length} failed.\n`);
  if (failures.length) {
    failures.forEach(f => console.error('FAIL:', f));
    process.exit(1);
  }
  process.exit(0);
}

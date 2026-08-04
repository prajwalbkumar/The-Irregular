/* ═══ READING DEPTH TRACKER ════════════════════════════ */
const _readDepth = {};
function trackReadDepth(id) {
  const body = document.getElementById('rd-body'); if (!body) return;
  const obs = new MutationObserver(() => {
    const el = document.getElementById('rd-body');
    if (!el) return;
    const scroll = document.getElementById('reader-back');
    if (!scroll) return;
    function onScroll() {
      const bh = el.scrollHeight, st = scroll.scrollTop, vh = scroll.clientHeight;
      const pct = Math.min(100, Math.round((st + vh - el.offsetTop) / bh * 100));
      if (id) _readDepth[id] = Math.max(_readDepth[id] || 0, pct);
    }
    scroll.addEventListener('scroll', onScroll, { passive: true });
  });
  obs.observe(body, { childList: true });
}
trackReadDepth(null);

/* ═══ DEEP LINKS ═══════════════════════════════════════ */
addEventListener('load', () => {
  const h = location.hash.slice(1);
  if (!h) return;
  const [k, v] = h.split('=');
  if (k === 'open' && v) {
    const pp = POSTS.find(x => x.num === String(v).padStart(3, '0'));
    if (pp) setTimeout(() => openPost(pp.id), 400);
  } else if (k === 'goto' && v) {
    const map = { dispatches: '#sec-flow', travel: '#sec-travel', photos: '#sec-photo', photography: '#sec-photo', experiments: '#sec-exp', cv: '#sec-cv', personnel: '#sec-cv', morgue: '#morgue', top: '#topbar' };
    const sel = map[String(v).toLowerCase()];
    if (sel) setTimeout(() => document.querySelector(sel)?.scrollIntoView({ behavior: 'smooth' }), 400);
  }
});

/* ═══ PHOTOGRAPHY — lightbox ════════════════════════════ */
function openPlight(i) {
  const p = PHOTOS[i];
  document.getElementById('plight-img').src = p.src;
  document.getElementById('plight-cap').textContent = p.cap;
  document.getElementById('plight').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closePlight() {
  document.getElementById('plight').classList.remove('open');
  if (!document.getElementById('reader-back').classList.contains('open'))
    document.body.style.overflow = '';
}
document.getElementById('plight').addEventListener('click', () => closePlight());

/* ═══ READER ═══════════════════════════════════════════ */
let cur = null, curType = 'post';
// body arrays are pre-rendered HTML blocks (markdown.config.js) — strip tags
// to get a plain word count for the reading-time estimate.
function wordCount(blocks) {
  return blocks.join(' ').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
}
function renderPost(p) {
  cur = p.id; curType = 'post';
  const readMin = Math.max(1, Math.round(wordCount(p.body) / 220));
  const depth = _readDepth[p.id] || 0;
  const depthTxt = depth > 0 ? ` · READ ${depth}% · ${Math.max(1, Math.round(readMin * (1 - depth / 100)))} MIN LEFT` : '';
  document.getElementById('rd-meta').textContent = `${p.num} · ${p.tag.toUpperCase()} · ${p.date} · ${readMin} MIN READ${depthTxt}`;
  document.getElementById('rd-title').textContent = p.title;
  document.getElementById('rd-body').innerHTML = p.body.join('');
  const i = POSTS.findIndex(x => x.id === p.id), prev = POSTS[i - 1], next = POSTS[i + 1];
  const pb = document.getElementById('rd-prev'), nb = document.getElementById('rd-next');
  pb.disabled = !prev; nb.disabled = !next;
  pb.textContent = prev ? `← ${prev.num} ${prev.title.slice(0, 30)}…` : '←';
  nb.textContent = next ? `${next.num} ${next.title.slice(0, 30)}… →` : '→';
  if (p.id) _readDepth[p.id] = _readDepth[p.id] || 0;
  show();
}
function openPost(id) {
  const p = POSTS.find(x => x.id === id); if (!p) return;
  renderPost(p);
  // Canonical, shareable URL — falls back to #open= (still handled by the
  // deep-link resolver below) if a post has no slug for some reason.
  const url = p.slug ? '/posts/' + p.slug + '/' : '#open=' + p.num;
  if (location.pathname + location.hash !== url) history.pushState({ open: p.id }, '', url);
}
function openMorgue(i) {
  const m = MORGUE[i]; cur = i; curType = 'morgue';
  document.getElementById('rd-meta').textContent = `${m.num} · ${m.stamp} · MORGUE`;
  document.getElementById('rd-title').textContent = m.title;
  document.getElementById('rd-body').innerHTML = m.body.join('');
  const pb = document.getElementById('rd-prev'), nb = document.getElementById('rd-next');
  pb.disabled = i <= 0; nb.disabled = i >= MORGUE.length - 1;
  pb.textContent = '←'; nb.textContent = '→';
  show();
}
function show() {
  document.getElementById('reader-back').scrollTop = 0;
  document.getElementById('reader-back').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function navPost(d) {
  if (curType === 'post') {
    const i = POSTS.findIndex(x => x.id === cur), p = POSTS[i + d];
    if (p) openPost(p.id);
  } else {
    const n = cur + d;
    if (n >= 0 && n < MORGUE.length) openMorgue(n);
  }
}
function closeReader(e, opts) {
  if (e && e.target !== document.getElementById('reader-back')) return;
  document.getElementById('reader-back').classList.remove('open');
  document.body.style.overflow = '';
  if (!(opts && opts.fromPopstate)) {
    if (location.pathname.startsWith('/posts/')) history.pushState(null, '', '/');
    else if (location.hash.startsWith('#open=')) history.replaceState(null, '', location.pathname + location.search);
  }
}
// Back/forward through pushed post URLs re-syncs the overlay instead of
// reloading — a real navigation to /posts/slug/ still works (that's the
// standalone page, §15), this only matters for in-page pushState/back.
addEventListener('popstate', () => {
  const m = location.pathname.match(/^\/posts\/([^/]+)\/?$/);
  if (m) {
    const p = POSTS.find(x => x.slug === m[1]);
    if (p) renderPost(p);
  } else if (document.getElementById('reader-back').classList.contains('open')) {
    closeReader({ target: document.getElementById('reader-back') }, { fromPopstate: true });
  }
});
document.getElementById('reader-back').addEventListener('click', e => closeReader(e));
document.querySelector('.rd-x')?.addEventListener('click', () => closeReader({ target: document.getElementById('reader-back') }));
document.getElementById('rd-prev')?.addEventListener('click', () => navPost(-1));
document.getElementById('rd-next')?.addEventListener('click', () => navPost(1));

addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (cmdOpen) return;
    if (typeof SELECTED !== 'undefined' && SELECTED.length) {
      clearSelection();
      document.querySelectorAll('.dim').forEach(el => el.classList.remove('dim')); return;
    }
    if (document.getElementById('plight').classList.contains('open')) { closePlight(); return; }
    closeReader({ target: document.getElementById('reader-back') });
  }
  if (document.getElementById('reader-back').classList.contains('open') && !cmdOpen) {
    if (e.key === 'ArrowLeft') navPost(-1);
    if (e.key === 'ArrowRight') navPost(1);
  }
});

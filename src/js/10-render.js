/* ═══ SCRAMBLE — shared glyph-noise decode helper ══════ */
const CHARS = '!<>-_\\/[]{}—=+*^?#________';
function scramble(el, txt, dur = 520) {
  if (REDUCED) { el.textContent = txt; return; }
  const len = txt.length, start = performance.now();
  (function fr(now) {
    const t = Math.min((now - start) / dur, 1), res = Math.floor(t * len);
    let out = txt.slice(0, res);
    for (let i = res; i < len; i++) out += txt[i] === ' ' ? ' ' : CHARS[Math.random() * CHARS.length | 0];
    el.textContent = out;
    if (t < 1) requestAnimationFrame(fr);
  })(performance.now());
}

/* ═══ PANELS — flow/pinned panel templates, sourced from DATA ══ */
const PANELS = {
  now: `<div class="panel-label">Now · ${DATA.lastUpdated.slice(0, 7)}</div>
    <p>${DATA.now}</p>`,
  about: `<div class="panel-label">About</div>
    <p>${DATA.about}</p>`,
  projects: `<div class="panel-label">Projects · Tracked</div>
    ${DATA.projects.map(p => `<div class="pj-item"><span class="pj-dot pj-${p.st}"></span><span class="nm">${p.name}</span></div>`).join('')}`,
  hobbies: `<div class="panel-label">Hobbies · Off-Model</div>
    <p>${DATA.hobbies}</p>`,
  bucket: `<div class="panel-label">Bucket List</div>
    <p style="line-height:2">${DATA.bucket.map(b => b.done
    ? `<span style="text-decoration:line-through;color:var(--faint)">${b.text}</span> <span style="color:var(--acc);font-family:var(--mono);font-size:.52rem">DONE</span>`
    : `<span class="fg">${b.text}</span>`).join('<br>')}</p>`,
  toys: `<div class="panel-label">Currently Using</div>
    ${DATA.toys.map(t => `<div class="pj-item"><span class="pj-dot pj-${t.st}"></span><span class="nm">${t.name}</span>&nbsp;— ${t.note}</div>`).join('')}`,
  nowplaying: `<div class="panel-label">Now Playing</div>
    <div class="np-row"><div class="np-bars"><div class="np-bar"></div><div class="np-bar"></div><div class="np-bar"></div><div class="np-bar"></div></div>
    <div><div class="np-title" id="np-title">—</div><div class="np-artist" id="np-artist">TUNING…</div></div></div>`,
  currentread: `<div class="panel-label">Currently Reading</div>
    <p><span class="fg" id="cr-title">—</span><br><span id="cr-author">—</span></p>
    <div class="rd-progress"><div class="rd-fill" id="cr-fill" style="width:0"></div></div>
    <p style="font-family:var(--mono);font-size:.52rem;letter-spacing:.12em;color:var(--dim);text-transform:uppercase;margin-top:.4rem" id="cr-stat">—</p>`,
  streak: `<div class="panel-label">Challenge</div>
    <div style="display:flex;align-items:baseline;gap:.8rem;margin-bottom:.3rem">
      <span class="streak-num" id="ch-num">—</span>
      <span style="font-family:var(--mono);font-size:.52rem;letter-spacing:.14em;color:var(--dim);text-transform:uppercase" id="ch-label">—</span>
    </div>
    <div class="streak-bar"><div class="streak-fill" id="ch-fill" style="width:0"></div></div>
    <p style="font-family:var(--mono);font-size:.52rem;letter-spacing:.12em;color:var(--faint);text-transform:uppercase;margin-top:.5rem" id="ch-note">—</p>`,
  contact: `<div class="panel-label">Contact</div>
    <p>If something here made you think something, tell me. Available for BIM automation consulting and interesting collaborations.</p>
    <p><a class="lnk" href="mailto:${DATA.identity.email}" data-cursor="MAIL">${DATA.identity.email}</a></p>`
};

/* ═══ RENDER — lead, flow, pinned band, ticker, morgue ═════════ */
const leadPost = POSTS[0];
// leadPost.body is an array of pre-rendered HTML blocks (already full tags —
// <p>, <ul>, callouts, etc.) — split roughly in half across the two columns
// rather than assuming exactly 4 plain paragraphs.
const leadMid = Math.ceil(leadPost.body.length / 2);
document.getElementById('lead-slot').innerHTML = `
 <div class="lead rv" data-tags="${leadPost.tag}" onclick="openPost('${leadPost.id}')" data-cursor="READ">
   <div class="lead-meta">
     <span class="acc">▸ LEAD DISPATCH</span>
     <span>${leadPost.num}</span><span>${leadPost.tag.toUpperCase()}</span><span>${leadPost.date}</span>
   </div>
   <div class="lead-title" data-scr="${leadPost.title}">${leadPost.title}</div>
   <div class="lead-cols">
     <div>${leadPost.body.slice(0, leadMid).join('')}</div>
     <div>${leadPost.body.slice(leadMid).join('')}</div>
   </div>
   <span class="lead-read">READ FULL ENTRY <span>→</span></span>
 </div>`;

let flowHTML = '';
FLOW.forEach((f, fi) => {
  const delay = `style="transition-delay:${(fi % 6) * 50}ms"`;
  if (f.type === 'post') {
    const p = POSTS.find(x => x.id === f.ref);
    flowHTML += `
    <div class="story rv" ${delay} data-tags="${p.tag}" onclick="openPost('${p.id}')" data-cursor="READ">
      <div class="st-meta"><span class="st-num">${p.num}</span><span>${p.date}</span></div>
      <div class="st-title t-${p.size}" data-scr="${p.title.replace(/"/g, '&quot;')}">${p.title}</div>
      <div class="st-ex">${p.excerpt}</div>
      <span class="st-tag">${p.tag}</span>
    </div>`;
  } else if (f.type === 'brief') {
    const b = BRIEFS.find(x => x.order === f.ref);
    flowHTML += `
    <div class="brief rv" ${delay} data-tags="${b.tag}">
      <div class="br-label">${b.label}</div>
      <div class="br-text">${b.text}</div>
    </div>`;
  } else if (f.type === 'quote') {
    const q = QUOTES.find(x => x.n === f.ref);
    flowHTML += `
    <div class="quote rv" ${delay} data-tags="${q.tag}">
      <div class="q-mark">// QUOTED</div>
      <div class="q-text">${q.text}</div>
      <div class="q-attr">${q.attr}</div>
    </div>`;
  } else if (f.type === 'panel') {
    flowHTML += `<div class="panel rv tilt" ${delay} data-panel="${f.ref}"><span class="p-h2"></span><span class="p-h4"></span>${PANELS[f.ref]}</div>`;
  }
});
document.getElementById('flow').innerHTML = flowHTML;

/* Pinned identity band — About + Now, full width */
document.getElementById('pinned-panels').innerHTML = ['about', 'now'].map(k =>
  `<div class="panel rv in tilt pinned" data-panel="${k}"><span class="p-h2"></span><span class="p-h4"></span>${PANELS[k]}</div>`).join('');

document.getElementById('mg-list').innerHTML = MORGUE.map((m, i) => `
  <div class="mg-entry rv" onclick="openMorgue(${i})" data-cursor="EXHUME">
    <span class="mg-num">${m.num}</span>
    <span class="mg-title">${m.title}</span>
    <span class="mg-stamp">${m.stamp}</span>
  </div>`).join('');

/* Ticker — JS marquee: pauses exactly in place on hover */
document.getElementById('ticker-track').innerHTML = (() => {
  const items = POSTS.slice(0, 10).map(p =>
    `<span class="tk-item" onclick="openPost('${p.id}')"><strong>${p.tag}:</strong>${p.title}</span><span class="tk-sep">···</span>`
  ).join('');
  return items + items;
})();
(function () {
  const tk = document.getElementById('ticker'), tr = document.getElementById('ticker-track');
  let x = 0, paused = false, half = 0;
  const meas = () => { half = tr.scrollWidth / 2 || 0; };
  requestAnimationFrame(meas); addEventListener('resize', meas);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(meas);
  setTimeout(meas, 2500);
  tk.addEventListener('mouseenter', () => paused = true);
  tk.addEventListener('mouseleave', () => paused = false);
  (function step() {
    if (!REDUCED && !paused && half) {
      x -= .55;
      if (-x >= half) x += half;
      tr.style.transform = `translateX(${x}px)`;
    }
    requestAnimationFrame(step);
  })();
})();

/* ═══ TRAVEL FEED — paged, newest first ═════════════════ */
const TF_PAGE_SIZE = 4;
let tfPage = 0;
const TF_ITEMS = (() => {
  const posts = POSTS.filter(pp => pp.tag === 'travel')
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(pp => ({ kind: 'post', pp }));
  const briefs = BRIEFS.filter(b => b.tag === 'travel').map(b => ({ kind: 'brief', b }));
  return [...posts, ...briefs];
})();
function renderTravelFeed() {
  const feed = document.getElementById('travel-feed');
  if (!feed) return;
  const pages = Math.max(1, Math.ceil(TF_ITEMS.length / TF_PAGE_SIZE));
  tfPage = Math.max(0, Math.min(tfPage, pages - 1));
  const slice = TF_ITEMS.slice(tfPage * TF_PAGE_SIZE, (tfPage + 1) * TF_PAGE_SIZE);
  let html = slice.map(it => it.kind === 'post' ? `
    <div class="story rv in" data-tags="travel" onclick="openPost('${it.pp.id}')" data-cursor="READ">
      <div class="st-meta"><span class="st-num">${it.pp.num}</span><span>${it.pp.date}</span></div>
      <div class="st-title t-md" data-scr="${it.pp.title.replace(/"/g, '&quot;')}">${it.pp.title}</div>
      <div class="st-ex">${it.pp.excerpt}</div>
      <span class="st-tag">travel</span>
    </div>` : `
    <div class="brief rv in" data-tags="travel">
      <div class="br-label">${it.b.label}</div>
      <div class="br-text">${it.b.text}</div>
    </div>`).join('');
  html += `
    <div class="tf-pager">
      <button class="mt-btn" id="tf-prev" data-cursor="PAGE" ${tfPage === 0 ? 'disabled style="opacity:.25"' : ''}>← Prev</button>
      <button class="mt-btn" id="tf-next" data-cursor="PAGE" ${tfPage >= pages - 1 ? 'disabled style="opacity:.25"' : ''}>Next →</button>
      <span class="tf-page-ind">PAGE ${tfPage + 1} / ${pages} · ${TF_ITEMS.length} DISPATCHES</span>
    </div>`;
  feed.innerHTML = html;
  document.getElementById('tf-prev')?.addEventListener('click', () => { tfPage--; renderTravelFeed(); });
  document.getElementById('tf-next')?.addEventListener('click', () => { tfPage++; renderTravelFeed(); });
  feed.querySelectorAll('[data-scr]').forEach(el => {
    let busy = false;
    const host = el.closest('.story');
    (host || el).addEventListener('mouseenter', () => {
      if (busy || REDUCED) return;
      busy = true; scramble(el, el.dataset.scr, 400);
      setTimeout(() => busy = false, 550);
    });
  });
  const intro = document.querySelector('.travel-feed-intro');
  if (intro) intro.textContent = `ALL TRAVEL DISPATCHES · ${TF_ITEMS.length} FILED · PAGE ${tfPage + 1}/${pages}`;
}
renderTravelFeed();

/* ═══ PHOTOGRAPHY — grid (drag-scroll + lightbox open land in 70-reader.js, M4) ═══ */
document.getElementById('photo-grid').innerHTML = PHOTOS.map((p, i) => `
  <div class="ph" onclick="openPlight(${i})" data-cursor="DEVELOP">
    <img src="${p.src}" alt="${p.cap}" loading="lazy">
    <div class="ph-cap">${p.cap}</div>
  </div>`).join('');

/* ═══ EXPERIMENTS ════════════════════════════════════════ */
document.getElementById('exp-list').innerHTML = EXPS.map(x => `
  <div class="exp-row" data-cursor="LOG">
    <span class="exp-id">${x.id}</span>
    <span class="exp-name">${x.name}</span>
    <span class="exp-desc">${x.desc}</span>
    <span class="exp-st es-${x.st}">${x.st}</span>
  </div>`).join('');

/* ═══ PERSONNEL FILE render ══════════════════════════════ */
(function renderCV() {
  const root = document.getElementById('cv-root');
  if (!root) return;
  const id = DATA.identity, cv = DATA.cv;
  const xp = rows => rows.map(x => `
    <div class="xp-row">
      <span class="xp-period">${x.period}</span>
      <span><span class="xp-role">${x.role}</span>
      <div class="xp-org">${x.org} <span class="xp-mode">· ${x.mode}</span></div></span>
    </div>`).join('');
  root.innerHTML = `
  <div>
    <div class="cv-block rv">
      <div class="cv-id">${id.name}<span class="acc">_</span></div>
      <div class="cv-tagline">${id.title}<br>${id.tagline}</div>
      <div class="cv-blurb">${cv.blurb}</div>
      <div class="cv-contact-line"><a href="mailto:${id.email}" data-cursor="MAIL">${id.email}</a>
        &nbsp;·&nbsp; ${id.base}</div>
    </div>
    <div class="cv-block rv">
      <div class="cv-sub">Experience</div>
      ${xp(cv.experience)}
    </div>
    <div class="cv-block rv">
      <div class="cv-sub">Education &amp; Certification</div>
      ${xp(cv.education)}
    </div>
    <div class="cv-block rv" id="cv-activity">
      <div class="cv-sub">Open-Source Activity</div>
      <div id="gh-bars" style="display:flex;align-items:flex-end;gap:4px;height:38px;margin:.3rem 0 .5rem"></div>
      <div id="gh-days" style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:.52rem;letter-spacing:.1em;color:var(--dim);text-transform:uppercase;margin-bottom:.7rem"></div>
      <div class="gh-row"><span class="gh-k">Commits · 7d</span><span class="gh-v" id="gh-total">—</span></div>
      <div class="gh-row"><span class="gh-k">Active Streak</span><span class="gh-v" id="gh-streak">—</span></div>
      <div class="gh-row"><span class="gh-k">Followers</span><span class="gh-v" id="gh-followers">—</span></div>
      <div class="gh-row"><span class="gh-k">Public Repos</span><span class="gh-v" id="gh-repos">—</span></div>
      <div id="gh-heatmap" style="display:flex;flex-wrap:wrap;gap:2px;margin-top:.7rem"></div>
      <a class="gh-link" href="https://github.com/${id.github}" target="_blank" rel="noopener" data-cursor="FEED">@${id.github} ↗</a>
    </div>
  </div>
  <div>
    <div class="cv-block rv">
      <div class="cv-sub">Specializations</div>
      ${cv.specializations.map(s => `
        <div class="spec-card" data-cursor="SPEC">
          <span class="spec-count">${s.count}<small> PRJ</small></span>
          <div class="spec-name">${s.name}</div>
          <div class="spec-desc">${s.desc}</div>
        </div>`).join('')}
    </div>
    <div class="cv-block rv">
      <div class="cv-sub">Tech Stack</div>
      ${cv.skills.map(s => `
        <div class="skill-row">
          <span class="skill-name">${s.name}</span>
          <span class="skill-bar">${Array.from({ length: 5 }, (_, i) =>
    `<span class="skill-seg${i < s.level ? ' f' : ''}"></span>`).join('')}</span>
        </div>`).join('')}
    </div>
    <div class="cv-block rv">
      <div class="cv-sub">Field Reference</div>
      <div class="cv-quote">“${cv.testimonial.quote}”
        <div class="cv-quote-attr">${cv.testimonial.attr}</div>
      </div>
    </div>
  </div>`;
  root.querySelectorAll('.rv').forEach(el => el.classList.add('in'));
})();

/* ═══ STATUS — clock, date, temperature, scroll % ═══════ */
function tick() {
  const t = new Date().toLocaleTimeString('en-GB', { timeZone: window.__FIELD.weather.tz, hour12: false });
  document.getElementById('sb-time').textContent = t;
  document.getElementById('tb-time').textContent = t.slice(0, 5);
}
tick(); setInterval(tick, 1000);
const ptDate = document.getElementById('pt-date');
if (ptDate) ptDate.textContent = 'DATE ' + new Date().toISOString().slice(0, 10);
document.getElementById('tb-date').textContent =
  new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
addEventListener('scroll', () => {
  const pct = Math.round(scrollY / (document.body.scrollHeight - innerHeight) * 100) || 0;
  document.getElementById('sb-fill').style.width = pct + '%';
  document.getElementById('sb-pct').textContent = pct + '%';
}, { passive: true });

async function cached(key, ttl, fetcher) {
  try {
    const hit = JSON.parse(localStorage.getItem(key) || 'null');
    if (hit && Date.now() - hit.ts < ttl) return hit.data;
  } catch {}
  const data = await fetcher();
  try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch {}
  return data;
}
cached('field_wx', window.__FIELD.weather.cacheTTL, async () => {
  const w = window.__FIELD.weather;
  const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${w.lat}&longitude=${w.lon}&current=temperature_2m&timezone=${encodeURIComponent(w.tz)}`);
  const d = await r.json();
  return Math.round(d.current.temperature_2m);
}).then(temp => {
  document.getElementById('tb-temp').textContent = temp + '°C';
}).catch(() => {});

/* ═══ COMMAND LINE ═════════════════════════════════════ */
const cmdEl = document.getElementById('cmdline'),
  cmdIn = document.getElementById('cmd-input'),
  cmdHist = document.getElementById('cmd-hist'),
  cmdHint = document.getElementById('cmd-hint');
let cmdOpen = false, histArr = [], histIdx = -1;

const CMDS = {
  help: { d: 'list commands', f: () => cmdOut('ok', 'open <n> · search <term> · city <code> · fly <code> · metar <code> · cv · logbook · plot · quote · morgue · clear · email') },
  open: {
    d: 'open entry N', f: a => {
      const p = POSTS.find(x => x.num === String(a).padStart(3, '0'));
      if (p) { openPost(p.id); cmdOut('ok', 'Opened ' + p.num); } else cmdOut('err', 'No entry ' + a);
    }
  },
  search: {
    d: 'full-text search', f: q => {
      q = String(q || '').trim().toLowerCase();
      if (q.length < 2) { cmdOut('err', 'search <term> — min 2 chars'); return; }
      let hits = 0;
      POSTS.forEach(pp => {
        const hay = (pp.title + ' ' + pp.excerpt + ' ' + pp.body.join(' ').replace(/<[^>]+>/g, ' ')).toLowerCase();
        if (hay.includes(q)) {
          hits++;
          const d = document.createElement('div');
          d.className = 'c-res';
          d.textContent = `▸ ${pp.num} · ${pp.tag.toUpperCase()} · ${pp.title}`;
          d.onclick = () => openPost(pp.id);
          cmdHist.appendChild(d);
        }
      });
      MORGUE.forEach((m, i) => {
        const hay = (m.title + ' ' + m.body.join(' ').replace(/<[^>]+>/g, ' ')).toLowerCase();
        if (hay.includes(q)) {
          hits++;
          const d = document.createElement('div');
          d.className = 'c-res';
          d.textContent = `▸ ${m.num} · MORGUE · ${m.title}`;
          d.onclick = () => openMorgue(i);
          cmdHist.appendChild(d);
        }
      });
      cmdHist.scrollTop = cmdHist.scrollHeight;
      cmdOut(hits ? 'ok' : 'err', hits ? hits + ' MATCH' + (hits > 1 ? 'ES' : '') + ' — click a result to open' : 'NO MATCHES FOR "' + q.toUpperCase() + '"');
    }
  },
  find: { d: 'alias of search', f: q => CMDS.search.f(q) },
  city: {
    d: 'city dossier', f: a => {
      const code = String(a || '').toUpperCase();
      if (!AIRPORTS[code]) { cmdOut('err', 'Cities: ' + Object.keys(AIRPORTS).join(' ')); return; }
      const r = cityRefs(code);
      cmdOut('ok', code + ' · ' + AIRPORTS[code].name.toUpperCase());
      if (r.flight) cmdOut('ok', '✈ ' + r.flight.fl + ' · ' + r.flight.date);
      r.posts.forEach(pp => {
        const d = document.createElement('div'); d.className = 'c-res';
        d.textContent = '▸ ' + pp.num + ' · ' + pp.title;
        d.onclick = () => openPost(pp.id); cmdHist.appendChild(d);
      });
      if (r.photos.length) cmdOut('ok', r.photos.length + ' FRAMES · see section 02');
      if (!refCount(code)) cmdOut('ok', 'No dispatches filed yet.');
      cmdHist.scrollTop = cmdHist.scrollHeight;
    }
  },
  fly: {
    d: 'highlight route', f: a => {
      const code = String(a || '').toUpperCase();
      const i = FLIGHTS.findIndex(f => f.to === code);
      if (i >= 0) {
        routeHi = i; refreshArcs();
        document.querySelector('#map-wrap').scrollIntoView({ behavior: 'smooth' });
        const f = FLIGHTS[i], km = Math.round(haversineLL(AIRPORTS[f.from], AIRPORTS[f.to]));
        cmdOut('ok', `${f.fl} — ${f.from} → ${f.to} · ${km.toLocaleString()} KM · ${Math.round(km * .53996).toLocaleString()} NM`);
        setTimeout(() => { routeHi = -1; refreshArcs(); }, 7000);
      } else cmdOut('err', 'Destinations: ' + FLIGHTS.map(f => f.to).join(' '));
    }
  },
  logbook: {
    d: 'flight history', f: () => {
      FLIGHTS.forEach(f => {
        const km = Math.round(haversineLL(AIRPORTS[f.from], AIRPORTS[f.to]));
        cmdOut('ok', `${f.date}  ${f.fl}  ${f.from}→${f.to}  ${km.toLocaleString()} KM`);
      });
      cmdOut('ok', '— ' + FLIGHTS.length + ' FLIGHTS LOGGED —');
    }
  },
  metar: {
    d: 'live aviation weather', f: async a => {
      const code = String(a || 'dxb').toUpperCase();
      const icao = AIRPORTS[code] ? AIRPORTS[code].icao : (code.length === 4 ? code : null);
      if (!icao) { cmdOut('err', 'Stations: ' + Object.keys(AIRPORTS).join(' ') + ' or any ICAO'); return; }
      cmdOut('ok', 'FETCHING ' + icao + ' …');
      try {
        const r = await fetch('https://aviationweather.gov/api/data/metar?ids=' + icao + '&format=json');
        const j = await r.json();
        if (!Array.isArray(j) || !j.length) throw 0;
        const m = j[0];
        cmdOut('ok', m.rawOb || '(no raw ob)');
        const bits = [];
        if (m.temp != null) bits.push('TEMP ' + Math.round(m.temp) + '°C');
        if (m.dewp != null) bits.push('DEW ' + Math.round(m.dewp) + '°C');
        if (m.wdir != null && m.wspd != null) bits.push('WIND ' + m.wdir + '° / ' + m.wspd + 'KT');
        if (m.visib != null) bits.push('VIS ' + m.visib);
        if (m.altim != null) bits.push('QNH ' + Math.round(m.altim));
        if (bits.length) cmdOut('ok', bits.join(' · '));
      } catch { cmdOut('err', 'METAR UNAVAILABLE — network or station.'); }
    }
  },
  cv: {
    d: 'personnel file', f: () => {
      document.getElementById('cv-root').scrollIntoView({ behavior: 'smooth' });
      cmdOut('ok', 'Personnel file open · 7+ yrs · 50+ projects · 8 countries.');
    }
  },
  quote: { d: 'pull a wire quote', f: () => { pullWire(); cmdOut('ok', 'Wire pulled — see the QUOTED · WIRE card.'); } },
  plot: { d: 'print as drawing', f: () => { cmdOut('ok', '_Plot — sending to sheet…'); setTimeout(() => print(), 400); } },
  email: { d: 'open mail', f: () => { location.href = 'mailto:' + DATA.identity.email; cmdOut('ok', 'Opening mail client…'); } },
  morgue: { d: 'deprecated entries', f: () => { document.getElementById('morgue').scrollIntoView({ behavior: 'smooth' }); cmdOut('ok', '3 bodies preserved.'); } },
  boot: { d: 'replay boot', f: () => { localStorage.removeItem('fieldbooted'); location.reload(); } },
  clear: {
    d: 'reset field', f: () => {
      applyFilter('all');
      clearSelection();
      document.querySelectorAll('.dim').forEach(el => el.classList.remove('dim'));
      cmdHist.innerHTML = ''; cmdOut('ok', 'Field cleared · filter off · selection released.');
    }
  },
  rhino: { d: '?', f: () => cmdOut('ok', 'This is not actually Rhino. Close enough.') },
  sudo: { d: '?', f: () => cmdOut('err', 'Permission denied. This is Prajwal’s field.') },
  hello: { d: '?', f: () => cmdOut('ok', 'Hello. The press is running.') },
  coffee: { d: '?', f: () => cmdOut('err', 'Insufficient. Brewing more.') }
};

function cmdOut(cls, txt) {
  const d = document.createElement('div');
  d.className = 'c-' + cls; d.textContent = txt;
  cmdHist.appendChild(d); cmdHist.scrollTop = cmdHist.scrollHeight;
}
function flashPanel(k) {
  const el = document.querySelector(`.panel[data-panel="${k}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.style.borderColor = 'var(--acc)';
  el.style.boxShadow = '0 0 30px rgba(204,255,0,.15)';
  setTimeout(() => { el.style.borderColor = ''; el.style.boxShadow = ''; }, 2200);
}
/* Always pinned — focus is the only state */
cmdIn.addEventListener('focus', () => { cmdOpen = true; cmdEl.classList.add('focused'); });
cmdIn.addEventListener('blur', () => { cmdOpen = false; cmdEl.classList.remove('focused'); });
document.getElementById('cmd-open-btn').addEventListener('click', () => cmdIn.focus());
addEventListener('keydown', e => {
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
    e.preventDefault(); cmdIn.focus();
  } else if (e.key === 'Escape' && cmdOpen) { cmdIn.blur(); }
});
cmdIn.addEventListener('input', () => {
  const v = cmdIn.value.trim().toLowerCase().split(' ')[0];
  if (!v) { cmdHint.textContent = ''; return; }
  const m = Object.keys(CMDS).filter(k => k.startsWith(v));
  cmdHint.textContent = m.length ? m.slice(0, 5).join(' · ') : '';
});
cmdIn.addEventListener('keydown', e => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const v = cmdIn.value.trim().toLowerCase().split(' ')[0];
    const m = Object.keys(CMDS).filter(k => k.startsWith(v));
    if (m.length === 1) cmdIn.value = m[0] + ' ';
  }
  else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (histIdx < histArr.length - 1) { histIdx++; cmdIn.value = histArr[histArr.length - 1 - histIdx]; }
  }
  else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (histIdx > 0) { histIdx--; cmdIn.value = histArr[histArr.length - 1 - histIdx]; }
    else { histIdx = -1; cmdIn.value = ''; }
  }
  else if (e.key === 'Enter') {
    const raw = cmdIn.value.trim(); if (!raw) return;
    histArr.push(raw); histIdx = -1;
    cmdOut('in', raw);
    const [name, ...args] = raw.toLowerCase().split(' ');
    const cmd = CMDS[name];
    if (cmd) cmd.f(args.join(' '));
    else cmdOut('err', `Unknown command "${name}". Try help.`);
    cmdIn.value = ''; cmdHint.textContent = '';
  }
});

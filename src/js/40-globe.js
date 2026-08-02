/* ═══ TRAVEL TERRITORY — globe.gl WebGL globe ══════════ */
const AIRPORTS = DATA.airports;
const FLIGHTS = DATA.flights;
const HOME_CODE = Object.keys(AIRPORTS).find(k => AIRPORTS[k].home) || 'DXB';

const D2R = Math.PI / 180;
function haversineLL(a, b) {
  const R = 6371, dLa = (b.lat - a.lat) * D2R, dLo = (b.lon - a.lon) * D2R;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * D2R) * Math.cos(b.lat * D2R) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function llToVec(lat, lon) {
  const la = lat * D2R, lo = lon * D2R;
  return [Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)];
}
function vecToLL(v) {
  return { lat: Math.asin(Math.max(-1, Math.min(1, v[1]))) / D2R, lng: Math.atan2(v[2], v[0]) / D2R };
}
function slerp(a, b, t) {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  d = Math.min(1, Math.max(-1, d));
  const th = Math.acos(d);
  if (th < 1e-6) return a.slice();
  const s = Math.sin(th);
  const w1 = Math.sin((1 - t) * th) / s, w2 = Math.sin(t * th) / s;
  return [a[0] * w1 + b[0] * w2, a[1] * w1 + b[1] * w2, a[2] * w1 + b[2] * w2];
}

/* Flight stats from the logbook */
(function renderStats() {
  const codes = new Set();
  let km = 0;
  FLIGHTS.forEach(f => {
    codes.add(f.from); codes.add(f.to);
    km += haversineLL(AIRPORTS[f.from], AIRPORTS[f.to]);
  });
  const nm = km * .53996;
  document.getElementById('flight-stats').innerHTML = `
    <div class="fs-item"><div class="fs-num">${FLIGHTS.length}</div><div class="fs-lbl">Flights Logged</div></div>
    <div class="fs-item"><div class="fs-num">${Math.round(km).toLocaleString()}</div><div class="fs-lbl">KM Flown</div></div>
    <div class="fs-item"><div class="fs-num">${Math.round(nm).toLocaleString()}</div><div class="fs-lbl">Nautical Miles</div></div>
    <div class="fs-item"><div class="fs-num">${codes.size}</div><div class="fs-lbl">Airports</div></div>`;
  const tm = document.getElementById('travel-meta');
  if (tm) tm.textContent = `${FLIGHTS.length} FLIGHTS · ${codes.size} AIRPORTS · BASE ${HOME_CODE}`;
})();

/* Globe */
let world = null, routeHi = -1;

function arcsPayload() {
  return FLIGHTS.map((f, i) => ({
    startLat: AIRPORTS[f.from].lat, startLng: AIRPORTS[f.from].lon,
    endLat: AIRPORTS[f.to].lat, endLng: AIRPORTS[f.to].lon,
    fl: f.fl, hi: routeHi === i, kind: 'route'
  }));
}
function refreshArcs() { if (world) world.arcsData(arcsPayload()); }

function labelsPayload() {
  return Object.entries(AIRPORTS).map(([code, a]) => ({
    code, lat: a.lat, lng: a.lon, home: !!a.home
  }));
}

function initGlobe() {
  if (typeof Globe === 'undefined' || typeof THREE === 'undefined') throw 0;
  const el = document.getElementById('globeViz');
  const W = el.clientWidth || 500;
  const H = Math.min(Math.max(W * .92, 380), 560);

  world = Globe()(el)
    .width(W).height(H)
    .backgroundColor('rgba(0,0,0,0)')
    .showAtmosphere(true)
    .atmosphereColor('#ccff00')
    .atmosphereAltitude(.12)
    .arcsData(arcsPayload())
    .arcColor(d => d.kind === 'measure' ? ['#ffffff', '#ffffff']
      : d.hi ? ['rgba(204,255,0,.95)', 'rgba(204,255,0,.95)']
        : ['rgba(204,255,0,.06)', 'rgba(204,255,0,.55)'])
    .arcStroke(d => d.kind === 'measure' ? .55 : d.hi ? .7 : .35)
    .arcAltitudeAutoScale(.32)
    .arcDashLength(.35).arcDashGap(.65)
    .arcDashAnimateTime(d => d.kind === 'measure' ? 0 : 3400)
    .labelsData(labelsPayload())
    .labelLat(d => d.lat).labelLng(d => d.lng)
    .labelText(d => d.code)
    .labelSize(d => d.home ? 1.5 : 1.15)
    .labelDotRadius(d => d.home ? .55 : .38)
    .labelColor(d => d.home ? '#ccff00' : 'rgba(233,235,230,.75)')
    .labelResolution(2);

  /* dark globe material */
  const mat = world.globeMaterial();
  mat.color = new THREE.Color('#101216');
  mat.emissive = new THREE.Color('#0a0b0d');
  mat.shininess = 0;

  /* dot-matrix continents */
  fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
    .then(r => r.json())
    .then(geo => {
      world.hexPolygonsData(geo.features)
        .hexPolygonResolution(3)
        .hexPolygonMargin(.72)
        .hexPolygonUseDots(true)
        .hexPolygonColor(() => 'rgba(233,235,230,.5)');
    }).catch(() => {});

  /* controls */
  const ctl = world.controls();
  ctl.autoRotate = true;
  ctl.autoRotateSpeed = .55;
  ctl.enableZoom = false;
  el.addEventListener('pointerdown', () => { ctl.autoRotate = false; });
  el.addEventListener('pointerup', () => { setTimeout(() => ctl.autoRotate = true, 5000); });

  const home = AIRPORTS[HOME_CODE];
  world.pointOfView({ lat: home.lat - 4, lng: home.lon + 8, altitude: 1.9 }, 0);

  /* aircraft flying the arcs */
  try {
    const planes = FLIGHTS.map((f, i) => ({
      f, t: (i * .12) % 1, speed: .00055 + (i % 4) * .00012,
      va: llToVec(AIRPORTS[f.from].lat, AIRPORTS[f.from].lon),
      vb: llToVec(AIRPORTS[f.to].lat, AIRPORTS[f.to].lon)
    }));
    world.customLayerData(planes)
      .customThreeObject(() => {
        const g = new THREE.ConeGeometry(1.15, 3.4, 4);
        g.rotateX(Math.PI / 2);
        return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xccff00 }));
      })
      .customThreeObjectUpdate((obj, d) => {
        const pos = slerp(d.va, d.vb, d.t);
        const { lat, lng } = vecToLL(pos);
        const alt = .01 + Math.sin(Math.PI * d.t) * .30 * .32;
        Object.assign(obj.position, world.getCoords(lat, lng, alt));
        const nx = slerp(d.va, d.vb, Math.min(d.t + .015, 1));
        const nll = vecToLL(nx);
        const ncd = world.getCoords(nll.lat, nll.lng, alt);
        obj.lookAt(ncd.x, ncd.y, ncd.z);
      });
    (function planeTick() {
      planes.forEach(pl => { pl.t += pl.speed; if (pl.t > 1) pl.t = 0; });
      if (world) world.customLayerData(planes);
      setTimeout(() => requestAnimationFrame(planeTick), 40);
    })();
  } catch (e) { /* planes optional */ }

  /* keep sized */
  addEventListener('resize', () => {
    const w2 = el.clientWidth || W;
    world.width(w2).height(Math.min(Math.max(w2 * .92, 380), 560));
  });
}

try { initGlobe(); }
catch (e) {
  document.getElementById('globe-offline').style.display = 'block';
  const gv = document.getElementById('globeViz');
  if (gv) gv.style.display = 'none';
}

/* ═══ CITY DOSSIERS ════════════════════════════════════ */
function cityRefs(code) {
  return {
    posts: POSTS.filter(pp => pp.city === code),
    photos: PHOTOS.map((ph, i) => ({ ph, i })).filter(x => x.ph.city === code),
    briefs: BRIEFS.filter(b => b.city === code),
    flight: FLIGHTS.find(f => f.to === code)
  };
}
function refCount(code) {
  const r = cityRefs(code);
  return r.posts.length + r.photos.length + r.briefs.length;
}
const dossier = document.getElementById('dossier');
let dsTimer = null, dsOpen = '';
function showDossier(code) {
  clearTimeout(dsTimer);
  if (dsOpen === code && dossier.classList.contains('open')) return;
  dsOpen = code;
  const a = AIRPORTS[code], r = cityRefs(code);
  let html = `<div class="ds-head">
    <span>${code} · ${a.name.toUpperCase()}</span>
    <span class="ds-coords">${a.lat.toFixed(2)}N ${Math.abs(a.lon).toFixed(2)}${a.lon < 0 ? 'W' : 'E'}</span>
  </div>`;
  if (r.flight) html += `<div class="ds-flight">✈ ${r.flight.fl} · ${r.flight.from} → ${r.flight.to} · ${r.flight.date}</div>`;
  else if (a.home) html += `<div class="ds-flight">⌂ HOME BASE · ALL ROUTES ORIGINATE HERE</div>`;
  r.posts.forEach(pp => {
    html += `<span class="ds-post" onclick="openPost('${pp.id}')" data-cursor="READ"><span class="ds-num">${pp.num}</span>${pp.title}</span>`;
  });
  r.briefs.forEach(b => {
    html += `<span class="ds-post" style="cursor:default"><span class="ds-num">BRIEF</span>${b.text.replace(/<[^>]+>/g, '').slice(0, 60)}…</span>`;
  });
  if (r.photos.length) {
    html += `<div class="ds-thumbs">` + r.photos.map(x =>
      `<img class="ds-thumb" src="${x.ph.src}" onclick="openPlight(${x.i})" data-cursor="DEVELOP" alt="">`
    ).join('') + `</div>`;
  }
  if (!r.posts.length && !r.photos.length && !r.briefs.length)
    html += `<div class="ds-empty">NO DISPATCHES FILED YET — THE DOSSIER AWAITS</div>`;
  dossier.innerHTML = html;
  dossier.classList.add('open');
}
function hideDossier() {
  dsTimer = setTimeout(() => { dossier.classList.remove('open'); dsOpen = ''; }, 250);
}
dossier.addEventListener('mouseenter', () => clearTimeout(dsTimer));
dossier.addEventListener('mouseleave', hideDossier);

/* Legend with ref counts */
document.getElementById('map-legend').innerHTML =
  `<span class="ml-chip home" data-city="${HOME_CODE}" data-cursor="BASE"><span class="ml-dot"></span>${HOME_CODE} · ${AIRPORTS[HOME_CODE].name} · HOME<span class="ml-refs">· ${refCount(HOME_CODE)} REFS</span></span>` +
  FLIGHTS.map((f, i) => {
    const n = refCount(f.to);
    return `
  <span class="ml-chip" data-ri="${i}" data-city="${f.to}" data-cursor="ROUTE">
    <span class="ml-dot"></span>${f.to} · ${f.fl}${n ? `<span class="ml-refs">· ${n} REFS</span>` : ''}
  </span>`;
  }).join('');
document.querySelectorAll('.ml-chip').forEach(ch => {
  const city = ch.dataset.city;
  ch.addEventListener('mouseenter', () => {
    if (ch.dataset.ri !== undefined) { routeHi = +ch.dataset.ri; refreshArcs(); }
    showDossier(city);
  });
  ch.addEventListener('mouseleave', () => {
    if (ch.dataset.ri !== undefined) { routeHi = -1; refreshArcs(); }
    hideDossier();
  });
  /* mobile tap toggles */
  ch.addEventListener('click', () => {
    if (dsOpen === city && dossier.classList.contains('open')) {
      clearTimeout(dsTimer); dossier.classList.remove('open'); dsOpen = '';
    } else showDossier(city);
  });
});

/* ═══ REVEAL ═══════════════════════════════════════════ */
const rvIO = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); rvIO.unobserve(e.target); }
}), { rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('.rv').forEach(el => rvIO.observe(el));

/* ═══ TILT PANELS ══════════════════════════════════════ */
if (FINE_PTR && !REDUCED) {
  document.querySelectorAll('.tilt').forEach(c => {
    c.addEventListener('mousemove', e => {
      const r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      c.style.transform = `perspective(700px) rotateX(${(py - .5) * -5}deg) rotateY(${(px - .5) * 5}deg)`;
    });
    c.addEventListener('mouseleave', () => c.style.transform = '');
  });
}

/* ═══ NAV + FILTER (command-line driven) ═══════════════ */
let activeF = 'all';
function applyFilter(tag) {
  activeF = tag || 'all';
  if (activeF === 'travel') {
    document.querySelectorAll('[data-tags]').forEach(el => el.classList.remove('dim'));
    document.getElementById('sec-travel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }
  const valid = ['all', 'architecture', 'code', 'dispatch', 'opinion'];
  if (!valid.includes(activeF)) return false;
  document.querySelectorAll('[data-tags]').forEach(el => {
    el.classList.toggle('dim', activeF !== 'all' && !(el.dataset.tags || '').split(' ').includes(activeF));
  });
  return true;
}
/* nav row — event delegation, unkillable */
document.addEventListener('click', e => {
  const b = e.target.closest('.fb.nv');
  if (!b) return;
  document.querySelectorAll('.fb.nv').forEach(x => x.classList.remove('on'));
  b.classList.add('on');
  document.querySelector(b.dataset.goto)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
/* masthead → top */
document.getElementById('masthead-name')?.addEventListener('click', () => {
  scrollTo({ top: 0, behavior: 'smooth' });
});

/* ═══ BOOT — once ever (localStorage fieldbooted) ══════ */
const boot = document.getElementById('boot');
addEventListener('error', () => boot.classList.add('done'));
setTimeout(() => boot.classList.add('done'), 12000); /* absolute safety cap */

function heroScramble() {
  const m = document.querySelector('.masthead-name');
  // keep the accent underscore
  scramble(m, 'THE IRREGULAR_', 800);
  setTimeout(() => { m.innerHTML = 'THE IRREGULAR<span class="acc">_</span>'; }, 850);
}
if (localStorage.getItem('fieldbooted') || REDUCED) {
  boot.classList.add('done');
} else {
  const lines = document.querySelectorAll('#boot-lines .bl');
  lines.forEach((l, i) => setTimeout(() => l.classList.add('show'), 120 + i * 260));
  const gateDelay = 120 + lines.length * 260 + 400;
  setTimeout(() => {
    const gate = document.getElementById('boot-gate');
    if (gate) gate.classList.add('show');
    function enterGate(e) {
      if (e.key !== 'Enter') return;
      removeEventListener('keydown', enterGate);
      if (gate) { gate.removeEventListener('click', clickGate); gate.removeEventListener('touchend', clickGate); }
      localStorage.setItem('fieldbooted', '1');
      boot.classList.add('done'); heroScramble();
    }
    function clickGate(e) {
      // Without this, a touchend here can still fire a browser-synthesized
      // "ghost" click on whatever is underneath once #boot's pointer-events
      // flips to none — landing a tap on the lead card and opening a random
      // post right as the field appears.
      if (e) { e.preventDefault(); e.stopPropagation(); }
      enterGate({ key: 'Enter' });
    }
    addEventListener('keydown', enterGate);
    if (gate) { gate.addEventListener('click', clickGate); gate.addEventListener('touchend', clickGate); }
  }, gateDelay);
}

/* ═══ SCROLLSPY ════════════════════════════════════════ */
(function () {
  const secs = ['#sec-flow', '#sec-travel', '#sec-photo', '#sec-exp', '#sec-cv', '#morgue'];
  const spy = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      const id = '#' + e.target.id;
      document.querySelectorAll('.fb.nv').forEach(b =>
        b.classList.toggle('here', b.dataset.goto === id));
    });
  }, { rootMargin: '-35% 0px -55% 0px' });
  secs.forEach(s => { const el = document.querySelector(s); if (el) spy.observe(el); });
})();

/* ═══ THE WIRE — live quote engine ═════════════════════ */
const WIRE_FALLBACK = [
  { q: 'Good design is as little design as possible.', a: 'DIETER RAMS' },
  { q: 'A complex system that works is invariably found to have evolved from a simple system that worked.', a: 'JOHN GALL' },
  { q: 'Always design a thing by considering it in its next larger context.', a: 'EERO SAARINEN' },
  { q: 'The details are not the details. They make the design.', a: 'CHARLES EAMES' },
  { q: 'First, solve the problem. Then, write the code.', a: 'JOHN JOHNSON' }
];
async function pullWire() {
  const qt = document.getElementById('wire-q'), at = document.getElementById('wire-a');
  if (!qt) return;
  qt.style.opacity = '.3';
  try {
    const r = await fetch('https://dummyjson.com/quotes/random');
    const j = await r.json();
    if (!j.quote) throw 0;
    qt.textContent = '“' + j.quote + '”'; at.textContent = (j.author || 'UNKNOWN').toUpperCase() + ' · WIRE';
  } catch {
    const f = WIRE_FALLBACK[Math.random() * WIRE_FALLBACK.length | 0];
    qt.textContent = '“' + f.q + '”'; at.textContent = f.a + ' · ARCHIVE';
  }
  qt.style.opacity = '1';
}
(function mountWire() {
  const flow = document.getElementById('flow');
  const d = document.createElement('div');
  d.className = 'quote rv in'; d.setAttribute('data-tags', 'opinion');
  d.innerHTML = `<div class="q-mark">// QUOTED · WIRE</div>
    <div class="q-text" id="wire-q" style="transition:opacity .3s">—</div>
    <div class="q-attr" id="wire-a">TUNING…</div>
    <button class="q-pull" data-cursor="PULL" onclick="pullWire()">PULL ↻</button>`;
  flow.insertBefore(d, flow.children[Math.min(6, flow.children.length)]);
  pullWire();
})();

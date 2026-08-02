/* ═══ CURSOR ═══════════════════════════════════════════ */
let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
if (FINE_PTR && !REDUCED) {
  document.body.classList.add('cursor-on');
  const dot = document.getElementById('cur-dot'), ring = document.getElementById('cur-ring'),
    label = document.getElementById('cur-label'), coords = document.getElementById('cur-coords'),
    sbC = document.getElementById('sb-cursor'), sbO = document.getElementById('sb-osnap'),
    chL = document.getElementById('ch-l'), chR = document.getElementById('ch-r'),
    chT = document.getElementById('ch-t'), chB = document.getElementById('ch-b'),
    pick = document.getElementById('pickbox'),
    osn = document.getElementById('osnap'), osnL = document.getElementById('osnap-lbl');

  const SNAP_R = 13, NEAR_R = 9, GAP = 9;
  let snapPts = [], snapEdges = [], snapDirty = true;
  function rebuildSnaps() {
    snapPts = []; snapEdges = [];
    document.querySelectorAll('.story,.brief,.quote,.panel,.lead,.exp-row,.ph,.mg-entry,#map-wrap,.masthead-name,.cv-block,.spec-card').forEach(el => {
      if (el.classList.contains('dim')) return;
      // skip elements still mid-reveal — their rects are 20px off (THE alignment bug)
      if (el.classList.contains('rv') && !el.classList.contains('in')) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < -60 || r.top > innerHeight + 60 || !r.width) return;
      // End: corners
      snapPts.push([r.left, r.top, 0], [r.right, r.top, 0], [r.left, r.bottom, 0], [r.right, r.bottom, 0]);
      // Mid: edge midpoints
      const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
      snapPts.push([cx, r.top, 1], [cx, r.bottom, 1], [r.left, cy, 1], [r.right, cy, 1]);
      // Near: the four edges as segments [x1,y1,x2,y2]
      snapEdges.push(
        [r.left, r.top, r.right, r.top], [r.left, r.bottom, r.right, r.bottom],
        [r.left, r.top, r.left, r.bottom], [r.right, r.top, r.right, r.bottom]
      );
    });
    snapDirty = false;
  }
  addEventListener('scroll', () => snapDirty = true, { passive: true });
  addEventListener('resize', () => snapDirty = true);
  setInterval(() => snapDirty = true, 1000);
  /* re-register when reveals finish settling */
  document.addEventListener('transitionend', e => {
    if (e.target.classList && e.target.classList.contains('rv')) snapDirty = true;
  });

  const SNAP_NAMES = ['End', 'Mid', 'Near'];
  let snapped = false, sx = 0, sy = 0, snapType = 0;

  function place(x, y) {
    chL.style.top = y + 'px'; chL.style.left = '0'; chL.style.width = Math.max(x - GAP, 0) + 'px';
    chR.style.top = y + 'px'; chR.style.left = (x + GAP) + 'px'; chR.style.width = Math.max(innerWidth - x - GAP, 0) + 'px';
    chT.style.left = x + 'px'; chT.style.top = '0'; chT.style.height = Math.max(y - GAP, 0) + 'px';
    chB.style.left = x + 'px'; chB.style.top = (y + GAP) + 'px'; chB.style.height = Math.max(innerHeight - y - GAP, 0) + 'px';
    pick.style.transform = `translate(${x - 6}px,${y - 6}px)`;
    dot.style.transform = `translate(${x - 2.5}px,${y - 2.5}px)`;
    coords.style.transform = `translate(${x + 16}px,${y + 20}px)`;
    const cs = `X ${String(Math.round(x)).padStart(4, '0')} Y ${String(Math.round(y)).padStart(4, '0')}`;
    coords.textContent = cs; if (sbC) sbC.textContent = cs;
  }

  addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    if (snapDirty) rebuildSnaps();
    snapped = false; snapType = 0;
    /* End first, then Mid — priority by pass */
    for (const wantType of [0, 1]) {
      let best = SNAP_R * SNAP_R;
      for (const [px, py, pt] of snapPts) {
        if (pt !== wantType) continue;
        const dx = mx - px, dy = my - py, d2 = dx * dx + dy * dy;
        if (d2 < best) { best = d2; sx = px; sy = py; snapped = true; snapType = wantType; }
      }
      if (snapped) break;
    }
    /* Near: project onto closest edge */
    if (!snapped) {
      let best = NEAR_R * NEAR_R;
      for (const [x1, y1, x2, y2] of snapEdges) {
        const ex = x2 - x1, ey = y2 - y1;
        const len2 = ex * ex + ey * ey; if (!len2) continue;
        let t = ((mx - x1) * ex + (my - y1) * ey) / len2;
        t = Math.max(0, Math.min(1, t));
        const px = x1 + ex * t, py = y1 + ey * t;
        const dx = mx - px, dy = my - py, d2 = dx * dx + dy * dy;
        if (d2 < best) { best = d2; sx = px; sy = py; snapped = true; snapType = 2; }
      }
    }
    const x = snapped ? sx : mx, y = snapped ? sy : my;
    place(x, y);
    osn.classList.toggle('on', snapped);
    osnL.classList.toggle('on', snapped);
    if (snapped) {
      const name = SNAP_NAMES[snapType];
      osn.className = 'on ' + name.toLowerCase();
      osnL.textContent = name;
      if (snapType === 1) { /* triangle: tip alignment */
        osn.style.transform = `translate(${x - 8}px,${y - 8}px)`;
      } else if (snapType === 2) { /* diamond */
        osn.style.transform = `translate(${x - 7}px,${y - 7}px) rotate(45deg)`;
      } else {
        osn.style.transform = `translate(${x - 7}px,${y - 7}px)`;
      }
      osnL.style.transform = `translate(${x + 12}px,${y - 18}px)`;
      if (sbO) { sbO.style.color = 'var(--acc)'; sbO.textContent = 'OSNAP: ' + name.toUpperCase() + ' ◉'; }
    } else {
      osn.className = '';
      if (sbO) { sbO.style.color = 'var(--faint)'; sbO.textContent = 'OSNAP: END MID NEAR'; }
    }
    document.body.style.setProperty('--gpx', ((mx - innerWidth / 2) * .018) + 'px');
    document.body.style.setProperty('--gpy', ((my - innerHeight / 2) * .018 - scrollY * .05) + 'px');
  });

  (function loop() {
    rx += (mx - rx) * .16; ry += (my - ry) * .16;
    ring.style.transform = `translate(${rx - ring.offsetWidth / 2}px,${ry - ring.offsetHeight / 2}px)`;
    label.style.transform = `translate(${rx - label.offsetWidth / 2}px,${ry + 34}px)`;
    requestAnimationFrame(loop);
  })();
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('[data-cursor]');
    if (t) { ring.classList.add('hov'); label.textContent = t.dataset.cursor; label.style.display = 'block'; }
  });
  document.addEventListener('mouseout', e => {
    const t = e.target.closest('[data-cursor]');
    if (t) { ring.classList.remove('hov'); label.style.display = 'none'; }
  });

  const clT = document.getElementById('cl-t'), clB = document.getElementById('cl-b'),
    clLn = document.getElementById('cl-l'), clRn = document.getElementById('cl-r');
  function clOn(el) {
    const r = el.getBoundingClientRect();
    clT.style.top = r.top + 'px'; clB.style.top = r.bottom + 'px';
    clLn.style.left = r.left + 'px'; clRn.style.left = r.right + 'px';
    [clT, clB, clLn, clRn].forEach(l => l.classList.add('on'));
  }
  function clOff() { [clT, clB, clLn, clRn].forEach(l => l.classList.remove('on')); }
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('.story,.brief,.quote,.panel,.lead,.exp-row,.ph,.masthead-name,.cv-block,.spec-card');
    if (t) clOn(t);
  });
  document.addEventListener('mouseout', e => {
    const t = e.target.closest('.story,.brief,.quote,.panel,.lead,.exp-row,.ph,.masthead-name,.cv-block,.spec-card');
    if (t) clOff();
  });
  addEventListener('scroll', clOff, { passive: true });
}

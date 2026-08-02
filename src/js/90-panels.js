/* ═══ PANELS: Now Playing / Reading / Streak ═══════════ */
(function () {
  /* Now Playing — Spotify (via the /api/nowplaying proxy, see README) or DATA fallback.
     Not cached: "now playing" is only meaningful fresh, and this fetches once per
     page load anyway. */
  async function loadMusic() {
    const te = document.getElementById('np-title'), ae = document.getElementById('np-artist');
    if (!te) return;
    try {
      const r = await fetch('/api/nowplaying');
      if (r.ok) {
        const j = await r.json();
        if (j && j.title) {
          te.textContent = j.title;
          ae.textContent = (j.artist + (j.isPlaying ? '' : ' · LAST PLAYED')).toUpperCase();
          return;
        }
      }
    } catch {}
    if (DATA.nowPlaying.title) {
      te.textContent = DATA.nowPlaying.title;
      ae.textContent = (DATA.nowPlaying.artist + ' · ' + DATA.nowPlaying.genre).toUpperCase();
    } else {
      te.textContent = 'SILENCE'; ae.textContent = 'NO TRACK LOADED';
    }
  }
  loadMusic();

  /* Currently Reading */
  const rd = DATA.reading;
  if (rd && rd.title) {
    const t = document.getElementById('cr-title'), a = document.getElementById('cr-author'),
      f = document.getElementById('cr-fill'), s = document.getElementById('cr-stat');
    if (t) { t.textContent = rd.title; a.textContent = rd.author.toUpperCase(); }
    if (f) f.style.width = Math.round(rd.page / rd.total * 100) + '%';
    if (s) s.textContent = `PAGE ${rd.page} / ${rd.total} · ${Math.round(rd.page / rd.total * 100)}%`;
  }

  /* Challenge / Streak */
  const ch = DATA.challenge;
  if (ch && ch.active) {
    const n = document.getElementById('ch-num'), l = document.getElementById('ch-label'),
      f = document.getElementById('ch-fill'), nt = document.getElementById('ch-note');
    if (n) { n.textContent = `DAY ${ch.day}`; }
    if (l) l.textContent = `${ch.name} · ${Math.round(ch.day / ch.total * 100)}%`;
    if (f) f.style.width = Math.round(ch.day / ch.total * 100) + '%';
    if (nt) nt.textContent = ch.day >= ch.total ? 'COMPLETED ✔' : 'STARTED ' + ch.startDate + ' · ' + (ch.total - ch.day) + ' DAYS REMAINING';
  }
})();

/* ═══ GITHUB ACTIVITY (in Personnel File) ══════════════
   Cached (TTL 1h, key field_gh_{user}) per §9.1 — `cached()` comes from
   10-render.js, loaded first. */
(async () => {
  try {
    const gh = window.__FIELD.github.username;
    const { ev, u } = await cached(`field_gh_${gh}`, 3600000, async () => {
      const [evR, uR] = await Promise.all([
        fetch(`https://api.github.com/users/${gh}/events/public?per_page=100`),
        fetch(`https://api.github.com/users/${gh}`)
      ]);
      return { ev: await evR.json(), u: await uR.json() };
    });
    if (!Array.isArray(ev)) throw 0;
    const days = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d.toISOString().slice(0, 10)); }
    const counts = Object.fromEntries(days.map(d => [d, 0]));
    const T = ['PushEvent', 'PullRequestEvent', 'CreateEvent', 'IssuesEvent', 'IssueCommentEvent'];
    ev.filter(e => T.includes(e.type)).forEach(e => { const d = e.created_at.slice(0, 10); if (d in counts) counts[d]++; });
    const vals = days.map(d => counts[d]);
    const max = Math.max(...vals, 1), total = vals.reduce((a, b) => a + b, 0);
    const bars = document.getElementById('gh-bars');
    if (bars) bars.innerHTML = vals.map(v => {
      const h = Math.max(3, v / max * 38);
      const col = v === 0 ? 'rgba(var(--ink),.15)' : 'var(--acc)';
      return `<div style="flex:1;height:${h}px;background:${col};opacity:${v === 0 ? 1 : 0.4 + v / max * 0.6}" title="${v} events"></div>`;
    }).join('');
    const dayEl = document.getElementById('gh-days');
    if (dayEl) dayEl.innerHTML = days.map(d => `<span>${['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(d).getDay()]}</span>`).join('');
    document.getElementById('gh-total').textContent = total > 0 ? total : 'QUIET WEEK';
    let streak = 0; for (let i = vals.length - 1; i >= 0; i--) { if (vals[i] > 0) streak++; else break; }
    document.getElementById('gh-streak').textContent = streak > 0 ? streak + ' DAYS' : 'NO PUSHES';
    if (u && typeof u.followers === 'number') {
      document.getElementById('gh-followers').textContent = u.followers;
      document.getElementById('gh-repos').textContent = u.public_repos;
    }
    const hm = document.getElementById('gh-heatmap');
    if (hm) {
      const allC = {}; ev.filter(e => ['PushEvent', 'PullRequestEvent', 'CreateEvent'].includes(e.type))
        .forEach(e => { const d = e.created_at.slice(0, 10); allC[d] = (allC[d] || 0) + 1; });
      const sq = []; for (let i = 83; i >= 0; i--) {
        const dd = new Date(); dd.setDate(dd.getDate() - i); const ds = dd.toISOString().slice(0, 10); const n = allC[ds] || 0;
        const col = n === 0 ? 'rgba(var(--ink),.1)' : n < 3 ? 'rgba(var(--acc-rgb),.35)' : n < 6 ? 'rgba(var(--acc-rgb),.6)' : 'rgba(var(--acc-rgb),.9)';
        sq.push(`<div style="width:7px;height:7px;background:${col}" title="${ds}: ${n}"></div>`);
      }
      hm.innerHTML = sq.join('');
    }
  } catch {
    const b = document.getElementById('gh-bars');
    if (b) b.innerHTML = '<span style="font-family:var(--mono);font-size:.52rem;letter-spacing:.1em;color:var(--dim);text-transform:uppercase">GITHUB UNREACHABLE</span>';
  }
})();

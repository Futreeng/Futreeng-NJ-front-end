/* =====================================================================
   Council feed (demo)
   Council posts travel hub -> president approval -> local website.
   Demo storage: this browser's localStorage, shared by the hub, the
   Local 823 / 825 previews and the approval inbox (same site).
   Production: a database with the approval gate from docs/ARCHITECTURE.md.

   Rules (agreed with Haron, 2026-10-17):
   - Urgent posts go live on every targeted local's site at once; the
     president and backup are notified and can remove it from their site.
   - Regular posts wait until the president OR the backup approves.
   - Locals approve or decline, with an optional short note. They cannot
     edit the council's text.
   ===================================================================== */
(function () {
  'use strict';
  const KEY = 'njch.council.v1';
  const NOTE_MAX = 140;

  /* Locals with a demo website and inbox. Everyone else approves on a timer (simulated). */
  const SITES = {
    '823': { name: 'ATU Local 823', city: 'Newark (Ironbound)', site: '/preview-823/', accent: '#D7263D',
             president: 'Elijah Spates Jr.', backup: 'Vice President' },
    '825': { name: 'ATU Local 825', city: 'Oradell · Westwood', site: '/preview-825/', accent: '#C9A14A',
             president: 'Retheena Goodwin', backup: 'Chris Haskins' }
  };
  const ALL = ['540', '819', '820', '821', '822', '823', '824', '825', '880'];
  const NEVER_SIM = '880';   // one local stays "waiting" so the demo looks real

  let mem = [];
  const listeners = new Set();
  const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); mem = Array.isArray(v) ? v : []; } catch (e) { /* storage blocked: keep memory copy */ } return mem; };
  const write = (posts) => { mem = posts; try { localStorage.setItem(KEY, JSON.stringify(posts)); } catch (e) { /* memory only */ } listeners.forEach((f) => f()); };
  window.addEventListener('storage', (e) => { if (e.key === KEY) { read(); listeners.forEach((f) => f()); } });

  const now = () => Date.now();
  const uid = () => 'p' + now().toString(36) + Math.random().toString(36).slice(2, 6);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* Resolve simulated approvals lazily, so nothing depends on a timer surviving a reload. */
  function settle(post) {
    let changed = false;
    Object.entries(post.status).forEach(([n, st]) => {
      if (st.state === 'pending' && st.simAt && st.simAt <= now()) {
        Object.assign(st, { state: 'approved', placement: 'feed', by: 'simulated', at: st.simAt });
        delete st.simAt; changed = true;
      }
    });
    return changed;
  }
  function all() {
    const posts = read();
    if (posts.map(settle).some(Boolean)) write(posts);
    return posts.slice().sort((a, b) => b.created - a.created);
  }

  function send({ title, body, titleEs, bodyEs, urgent, targets }) {
    const t = now();
    const status = {};
    (targets && targets.length ? targets : ALL).forEach((n, i) => {
      if (urgent) status[n] = { state: 'live', notified: true, at: t };
      else if (SITES[n] || n === NEVER_SIM) status[n] = { state: 'pending' };
      else status[n] = { state: 'pending', simAt: t + 4000 + i * 2600 };
    });
    const post = { id: uid(), created: t, urgent: !!urgent, title: String(title).trim(), body: String(body).trim(),
                   titleEs: String(titleEs || '').trim(), bodyEs: String(bodyEs || '').trim(), status };
    write([post].concat(read()));
    return post;
  }
  function update(id, n, patch) {
    const posts = read(); const p = posts.find((x) => x.id === id);
    if (!p || !p.status[n]) return null;
    Object.assign(p.status[n], patch, { at: now() });
    write(posts); return p;
  }
  const approve = (id, n, { placement, note, by }) => {
    const p = read().find((x) => x.id === id);
    if (!p || !p.status[n] || p.status[n].state !== 'pending') return p;   // first approver decides
    return update(id, n, { state: 'approved', placement: placement === 'pinned' ? 'pinned' : 'feed', note: String(note || '').slice(0, NOTE_MAX), by });
  };
  const decline = (id, n, { reason, by }) => update(id, n, { state: 'declined', reason: String(reason || '').slice(0, 280), by });
  const remove = (id, n, { by }) => update(id, n, { state: 'removed', by });
  const reset = () => write([]);
  const onChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

  /* What a local's website shows: urgent live posts and approved posts. */
  function forLocal(n) {
    return all().filter((p) => p.status[n] && (p.status[n].state === 'live' || p.status[n].state === 'approved'));
  }

  /* ---------- Rendering on a local website ---------- */
  const fmtDate = (ms) => new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const CSS = `
.council-alert{background:#D7263D;color:#fff;border-bottom:3px solid #06101F}
.council-alert .ca-in{display:flex;gap:18px;align-items:center;padding:14px var(--gutter,24px)}
.council-alert .ca-tag{flex:none;font-family:var(--mono,monospace);font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;background:#06101F;color:#fff;padding:5px 8px}
.council-alert .ca-txt{flex:1;min-width:0;font-family:var(--body,sans-serif);font-size:15px;line-height:1.45}
.council-alert .ca-txt b{font-family:var(--display,sans-serif);font-weight:800;font-size:20px;text-transform:uppercase;letter-spacing:.02em;display:block;line-height:1.1}
.council-pin{margin-top:24px;border:2px solid #F2F4F8;background:#06101F;padding:20px 22px;display:grid;grid-template-columns:auto minmax(0,1fr);gap:18px;align-items:start}
.council-badge{display:inline-flex;align-items:center;gap:8px;font-family:var(--mono,monospace);font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#06101F;background:#E4BE80;padding:4px 8px;white-space:nowrap}
.council-pin h3{margin:0;font-family:var(--display,sans-serif);font-weight:800;font-size:26px;line-height:1.05}
.council-pin p{margin:8px 0 0;font-family:var(--body,sans-serif);font-size:15px;line-height:1.5;color:var(--muted,#C5CDDB)}
.council-meta{margin-top:10px;font-family:var(--mono,monospace);font-size:11px;letter-spacing:.06em;color:var(--dim,#8FA2C4);text-transform:uppercase}
.council-note{margin-top:12px;border-left:3px solid var(--local-accent,#D7263D);padding:6px 0 6px 12px;font-family:var(--body,sans-serif);font-size:14px;color:var(--ink,#F2F4F8)}
.council-note span{display:block;font-family:var(--mono,monospace);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--dim,#8FA2C4);margin-bottom:2px}
.news-card.council .news-img{background:#06101F;border-bottom:3px solid #E4BE80}
.news-card.council .news-img .lab{color:#E4BE80;font-family:var(--display,sans-serif);font-weight:800;font-size:20px;letter-spacing:.06em;text-transform:uppercase}
@media (max-width:720px){.council-alert .ca-in{flex-direction:column;align-items:flex-start;gap:8px}.council-pin{grid-template-columns:minmax(0,1fr)}}
`;
  function mountLocal(n, sel) {
    if (!document.getElementById('council-feed-css')) {
      const st = document.createElement('style'); st.id = 'council-feed-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    const draw = () => {
      const posts = forLocal(n);
      const urgent = posts.filter((p) => p.urgent);
      const pinned = posts.filter((p) => !p.urgent && p.status[n].placement === 'pinned');
      const feed = posts.filter((p) => !p.urgent && p.status[n].placement !== 'pinned');
      const note = (p) => p.status[n].note ? `<div class="council-note"><span>Note from Local ${n}</span>${esc(p.status[n].note)}</div>` : '';
      const alertEl = document.querySelector(sel.alert);
      if (alertEl) alertEl.innerHTML = urgent.map((p) => `
        <div class="council-alert" role="alert"><div class="ca-in">
          <span class="ca-tag">◆ Urgent · NJ State Council</span>
          <div class="ca-txt"><b>${esc(p.title)}</b>${esc(p.body)}</div>
        </div></div>`).join('');
      const pinEl = document.querySelector(sel.pinned);
      if (pinEl) pinEl.innerHTML = pinned.map((p) => `
        <article class="council-pin">
          <span class="council-badge">◆ From the State Council</span>
          <div><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p>${note(p)}
            <div class="council-meta">Sent by the ATU NJ State Council · ${fmtDate(p.created)} · Approved by Local ${n}</div></div>
        </article>`).join('');
      const grid = document.querySelector(sel.grid);
      if (grid) {
        grid.querySelectorAll('.news-card.council').forEach((c) => c.remove());
        grid.insertAdjacentHTML('afterbegin', feed.map((p) => `
          <article class="news-card council">
            <div class="news-img"><span class="lab">◆ NJ State Council</span></div>
            <div class="news-body">
              <div class="news-meta"><span class="council-badge">From the Council</span><span>${fmtDate(p.created)}</span></div>
              <h3 class="news-title">${esc(p.title)}</h3>
              <p class="news-excerpt">${esc(p.body)}</p>${note(p)}
              <div class="news-foot"><b>Sent by the State Council</b><span>Approved by Local ${n}</span></div>
            </div>
          </article>`).join(''));
      }
    };
    draw(); onChange(draw);
  }

  window.CouncilFeed = { SITES, ALL, NOTE_MAX, all, send, approve, decline, remove, reset, onChange, forLocal, mountLocal, esc, fmtDate };
})();

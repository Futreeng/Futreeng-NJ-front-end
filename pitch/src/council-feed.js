/* =====================================================================
   Council feed (demo engine, v2)
   How the ATU NJ State Council and its nine locals talk to each other.
   Used by the hub (council workspace), the local previews (websites),
   the president's email (/inbox/) and the officer portal (/portal/).

   Demo storage: this browser's localStorage, shared by every page on the
   site. Production: the database and approval gate in docs/ARCHITECTURE.md,
   real email/SMS providers, signed one-time links.

   Agreed rules (Haron, 2026-10-17)
   - Urgent: live at once on every targeted local's site; president and
     backup notified; members texted automatically; either officer can
     take it down.
   - Regular: waits until the local president OR backup approves; first
     to act decides. Reminder at 24h, passed to the backup at 48h.
   - Locals approve or decline, pick news feed or pinned, may add a note
     (140 chars), and choose to text and/or email their members. They
     cannot edit the council's text.
   - Locals can send posts UP to the council (share a win, ask other
     locals for support, flag an issue). The council reviews and routes.
   - Corrections to an approved post go back for re-approval; the site
     keeps the approved version until then. The council can pull a post
     from every site at once.
   - Every action is recorded (who, what, when) and can be exported.
   - Partners (member benefits): the council keeps its own statewide list
     on the hub; each local keeps its own list on its site, completely
     separate from the council and from other locals. Statewide partners
     also show in a row on every local site. Up to 3 featured partners
     per list. Officers confirm the local or council is responsible for
     each partnership. FutreEng provides the tool only and never finds,
     approves or handles sponsors or money. Partners appear on websites
     only (never in texts, alerts or emails), and clicks are counted as
     totals: partners never receive member information.

   Demo clock: 1 real second = 1 hour, so reminders and hand-offs happen
   during the pitch. Calendar start/end dates use real time.
   ===================================================================== */
(function () {
  'use strict';
  const KEY = 'njch.council.v2';
  const NOTE_MAX = 140;
  const DEMO_HOUR = 1000;            // ms of real time per demo hour
  const REMIND_H = 24, ESCALATE_H = 48, VERIFY_DAYS = 90;

  /* Locals. members = sample active members (same sample numbers as the hub's COPE counters). */
  const LOCALS = {
    '540': { city: 'Trenton', accent: '#2F6FB5', members: 420 },
    '819': { city: 'Newark', accent: '#D7263D', members: 2100 },
    '820': { city: 'Union City', accent: '#0F766E', members: 1180 },
    '821': { city: 'Jersey City', accent: '#E36A2E', members: 980 },
    '822': { city: 'Plainfield', accent: '#23774A', members: 1240 },
    '823': { city: 'Newark (Ironbound)', accent: '#D7263D', members: 870 },
    '824': { city: 'New Brunswick', accent: '#C2185B', members: 740 },
    '825': { city: 'Oradell · Westwood', accent: '#C9A14A', members: 610 },
    '880': { city: 'Camden', accent: '#4FA3D9', members: 1860 }
  };
  const ALL = Object.keys(LOCALS);
  const HANDS_ON = ['823', '825'];   // approved by hand in the demo
  const NEVER_SIM = '880';           // stays waiting, so the reminder and hand-off show in the demo
  const DELEGATES = { '540': 2, '819': 3, '820': 2, '821': 2, '822': 2, '823': 3, '824': 2, '825': 2, '880': 2 };
  const DAY = 86400000;

  function seedDirectory() {
    const t = Date.now(), d = {};
    ALL.forEach((n) => { d[n] = { president: '', backup: '', stewards: null, delegates: DELEGATES[n], verifiedAt: null, requestedAt: null }; });
    Object.assign(d['823'], { president: 'Elijah Spates Jr.', backup: 'Vice President', stewards: 2, verifiedAt: t - 20 * DAY });
    Object.assign(d['825'], { president: 'Retheena Goodwin', backup: 'Chris Haskins', verifiedAt: t - 20 * DAY });
    Object.assign(d['819'], { verifiedAt: t - 40 * DAY });
    return d;
  }
  /* ---------- partners (member benefits) ---------- */
  const FEATURED_MAX = 3;
  const CATS = {
    food: { en: 'Food & coffee', es: 'Comida y café' }, auto: { en: 'Auto & tires', es: 'Auto y llantas' },
    health: { en: 'Health & dental', es: 'Salud y dental' }, finance: { en: 'Banking & credit unions', es: 'Bancos y cooperativas de crédito' },
    gear: { en: 'Uniforms & gear', es: 'Uniformes y equipo' }, print: { en: 'Printing', es: 'Imprenta' },
    family: { en: 'Family & kids', es: 'Familia y niños' }, fitness: { en: 'Fitness', es: 'Ejercicio' }, other: { en: 'Other', es: 'Otro' }
  };
  /* Fictional sample partners for the pitch. Every one is marked SAMPLE. */
  function seedPartners() {
    const t = Date.now(), mk = (owner, i, o) => Object.assign({ id: 'pt' + owner + i, owner, url: '#', created: t - (30 - i) * DAY, by: owner === 'council' ? 'Council' : 'President, Local ' + owner,
      sample: true, featured: false, startAt: null, endAt: null, offerEs: '', ack: true }, o);
    return [
      mk('council', 1, { name: 'Hudson & Delaware Credit Union', cat: 'finance', featured: true, clicks: 412, offer: 'Half a point off auto loans for every ATU member in New Jersey.', offerEs: 'Medio punto menos en préstamos de auto para todo miembro de ATU en Nueva Jersey.' }),
      mk('council', 2, { name: 'Garden Line Union Print', cat: 'print', featured: true, clicks: 133, offer: 'Union-printed flyers and shirts for locals at cost.', offerEs: 'Volantes y camisetas impresos por sindicato, a precio de costo para los locales.' }),
      mk('council', 3, { name: 'Statewide Tire & Brake', cat: 'auto', clicks: 96, offer: '15% off service at any location. Show your union card.', offerEs: '15% de descuento en servicio en cualquier sucursal. Muestra tu tarjeta sindical.' }),
      mk('council', 4, { name: 'Shoreline Family Dental', cat: 'health', clicks: 71, offer: 'Free first cleaning for members and their kids.', offerEs: 'Primera limpieza gratis para miembros y sus hijos.' }),
      mk('823', 1, { name: 'Garage Door Diner', cat: 'food', featured: true, clicks: 188, offer: 'Free coffee with any breakfast before 7am. Show your union card.' }),
      mk('823', 2, { name: 'Night Shift Uniform Co.', cat: 'gear', clicks: 64, offer: '10% off work boots and rain gear.' }),
      mk('823', 3, { name: 'Clockwork Barbers', cat: 'other', clicks: 41, offer: '$5 off cuts, Monday to Wednesday.' }),
      mk('825', 1, { name: 'Layover Coffee Co.', cat: 'food', featured: true, clicks: 97, offer: 'Any size coffee for $1 with your union card.' }),
      mk('825', 2, { name: 'Two Shifts Pizza', cat: 'food', featured: true, clicks: 120, offer: 'Large pie for $10 after 9pm, for the late runs.' }),
      mk('825', 3, { name: 'Valley Fit Club', cat: 'fitness', clicks: 38, offer: 'No sign-up fee and $15 a month for members.' })
    ];
  }
  const fresh = () => ({ v: 2, posts: [], subs: [], dir: seedDirectory(), log: [], partners: seedPartners() });

  /* ---------- storage ---------- */
  let mem = fresh();
  const listeners = new Set();
  function load() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (v && v.v === 2) { mem = v; if (!mem.partners) { mem.partners = seedPartners(); save(mem, true); } } else save(mem, true);
    } catch (e) { /* storage blocked: keep memory copy */ }
    return mem;
  }
  function save(st, quiet) {
    mem = st;
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* memory only */ }
    if (!quiet) listeners.forEach((f) => f());
  }
  window.addEventListener('storage', (e) => { if (e.key === KEY) { load(); listeners.forEach((f) => f()); } });

  const now = () => Date.now();
  const uid = (p) => p + now().toString(36) + Math.random().toString(36).slice(2, 6);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hoursSince = (t) => Math.max(0, (now() - t) / DEMO_HOUR);
  const ageLabel = (t) => { const h = Math.floor(hoursSince(t)); return h >= 48 ? Math.floor(h / 24) + 'd ' + (h % 24) + 'h' : h + 'h'; };

  /* ---------- directory ---------- */
  function contacts(n) {
    const d = load().dir[n] || {};
    return {
      name: 'ATU Local ' + n, num: n, city: LOCALS[n].city, accent: LOCALS[n].accent, members: LOCALS[n].members,
      site: '/preview-' + n + '/', president: d.president || 'President (to confirm)', backup: d.backup || 'Vice President (to confirm)',
      presidentSet: !!d.president, backupSet: !!d.backup,
      stewards: d.stewards, delegates: d.delegates, verifiedAt: d.verifiedAt, requestedAt: d.requestedAt,
      verifyDue: !d.verifiedAt || now() - d.verifiedAt > VERIFY_DAYS * DAY
    };
  }
  const alertSubs = (n) => Math.round(LOCALS[n].members * 0.55);
  const emailSubs = (n) => Math.round(LOCALS[n].members * 0.4);

  /* ---------- record ---------- */
  function record(st, actor, action, o) {
    st.log.unshift(Object.assign({ id: uid('l'), at: (o && o.at) || now(), actor, action }, o || {}));
    st.log.sort((a, b) => b.at - a.at);
    if (st.log.length > 500) st.log.length = 500;
  }

  const snapshot = (p) => ({ title: p.title, body: p.body, titleEs: p.titleEs, bodyEs: p.bodyEs });

  /* ---------- time-driven events: simulated approvals, reminders, hand-offs ---------- */
  function settle(st) {
    let changed = false;
    st.posts.forEach((p) => {
      if (p.pulledAt) return;
      Object.entries(p.status).forEach(([n, s]) => {
        if (s.state !== 'pending') return;
        const since = s.pendingSince || p.created;
        if (s.simAt && s.simAt <= now()) {
          Object.assign(s, { state: 'approved', placement: 'feed', by: 'simulated', at: s.simAt, channels: { text: false, email: true }, version: snapshot(p) });
          delete s.simAt;
          record(st, 'Local ' + n + ' (simulated)', 'approved', { at: s.at, local: n, post: p.id, title: p.title, detail: 'News feed · emailed ' + emailSubs(n) + ' members' });
          changed = true; return;
        }
        const remindAt = since + REMIND_H * DEMO_HOUR, escAt = since + ESCALATE_H * DEMO_HOUR;
        if (!s.remindedAt && now() >= remindAt) {
          s.remindedAt = remindAt; changed = true;
          record(st, 'System', 'reminded', { at: remindAt, local: n, post: p.id, title: p.title, detail: 'Reminder sent to the president after 24 hours' });
        }
        if (!s.escalatedAt && now() >= escAt) {
          s.escalatedAt = escAt; changed = true;
          record(st, 'System', 'passed to backup', { at: escAt, local: n, post: p.id, title: p.title, detail: 'No answer in 48 hours. Passed to the backup approver' });
        }
      });
    });
    return changed;
  }
  function state() { const st = load(); if (settle(st)) save(st); return st; }

  const windowState = (p) => p.pulledAt ? 'pulled' : (p.startAt && p.startAt > now() ? 'scheduled' : (p.endAt && now() >= p.endAt ? 'ended' : 'active'));

  /* ---------- council: send, correct, pull ---------- */
  function send(o) {
    const st = state(), t = now();
    const targets = o.targets && o.targets.length ? o.targets : ALL;
    const post = { id: uid('p'), created: t, urgent: !!o.urgent, title: String(o.title).trim(), body: String(o.body).trim(),
      titleEs: String(o.titleEs || '').trim(), bodyEs: String(o.bodyEs || '').trim(),
      startAt: o.startAt || null, endAt: o.endAt || null, origin: o.origin || null, kind: o.kind || 'council', status: {} };
    targets.forEach((n, i) => {
      if (post.urgent) post.status[n] = { state: 'live', at: t, version: snapshot(post), channels: { text: true, email: false } };
      else if (o.origin === n) post.status[n] = { state: 'approved', at: t, by: 'origin', placement: 'feed', version: snapshot(post), channels: { text: false, email: false } };
      else if (HANDS_ON.includes(n) || n === NEVER_SIM) post.status[n] = { state: 'pending', pendingSince: t };
      else post.status[n] = { state: 'pending', pendingSince: t, simAt: t + 4000 + i * 2600 };
    });
    st.posts.unshift(post);
    const when = post.startAt && post.startAt > t ? ' · starts ' + new Date(post.startAt).toLocaleString('en-US') : '';
    record(st, 'Council', post.urgent ? 'sent urgent' : 'sent', { post: post.id, title: post.title,
      detail: (post.urgent ? 'Live now, members texted' : 'Waiting for local approval') + ' · to ' + targets.join(', ') + (post.origin ? ' · shared from Local ' + post.origin : '') + when });
    save(st); return post;
  }
  function correct(id, o) {
    const st = state(), p = st.posts.find((x) => x.id === id); if (!p) return null;
    Object.assign(p, { title: String(o.title).trim(), body: String(o.body).trim(), titleEs: String(o.titleEs || '').trim(), bodyEs: String(o.bodyEs || '').trim() });
    (p.edits = p.edits || []).push({ at: now() });
    Object.entries(p.status).forEach(([n, s]) => {
      if (p.urgent && s.state === 'live') { s.version = snapshot(p); s.corrected = true; }
      else if (s.state === 'approved') { Object.assign(s, { state: 'pending', correction: true, pendingSince: now() }); delete s.remindedAt; delete s.escalatedAt; }
    });
    record(st, 'Council', 'corrected', { post: p.id, title: p.title, detail: p.urgent ? 'Urgent text updated on every site' : 'Sent back to locals for re-approval; sites keep the approved version until then' });
    save(st); return p;
  }
  function pull(id) {
    const st = state(), p = st.posts.find((x) => x.id === id); if (!p) return null;
    p.pulledAt = now();
    record(st, 'Council', 'pulled', { post: p.id, title: p.title, detail: 'Taken down from every local site' });
    save(st); return p;
  }

  /* ---------- locals: approve, decline, remove ---------- */
  const officer = (n, by) => { const c = contacts(n); return (by === 'backup' ? c.backup + ' (backup)' : c.president) + ', Local ' + n; };
  function approve(id, n, o) {
    const st = state(), p = st.posts.find((x) => x.id === id);
    if (!p || !p.status[n] || p.status[n].state !== 'pending') return p;     // first approver decides
    const s = p.status[n];
    const channels = { text: !!o.text, email: !!o.email };
    const wasCorrection = !!s.correction;
    Object.assign(s, { state: 'approved', placement: o.placement === 'pinned' ? 'pinned' : 'feed', note: String(o.note || '').slice(0, NOTE_MAX),
                       by: o.by, at: now(), channels, version: snapshot(p) });
    delete s.simAt; delete s.correction;
    const r = [channels.text ? 'texted ' + alertSubs(n) : '', channels.email ? 'emailed ' + emailSubs(n) : ''].filter(Boolean).join(', ');
    record(st, officer(n, o.by), wasCorrection ? 're-approved' : 'approved', { local: n, post: p.id, title: p.title,
      detail: (s.placement === 'pinned' ? 'Pinned' : 'News feed') + (s.note ? ' · note added' : '') + (r ? ' · ' + r + ' members' : '') });
    save(st); return p;
  }
  function decline(id, n, o) {
    const st = state(), p = st.posts.find((x) => x.id === id); if (!p || !p.status[n]) return null;
    Object.assign(p.status[n], { state: 'declined', reason: String(o.reason || '').slice(0, 280), by: o.by, at: now() });
    delete p.status[n].simAt;
    record(st, officer(n, o.by), 'declined', { local: n, post: p.id, title: p.title, detail: o.reason ? 'Reason: ' + o.reason : '' });
    save(st); return p;
  }
  function remove(id, n, o) {
    const st = state(), p = st.posts.find((x) => x.id === id); if (!p || !p.status[n]) return null;
    Object.assign(p.status[n], { state: 'removed', by: o.by, at: now() });
    record(st, officer(n, o.by), 'removed', { local: n, post: p.id, title: p.title, detail: 'Taken down from the local site' });
    save(st); return p;
  }

  /* ---------- locals send up: share, solidarity, issue ---------- */
  function submit(n, o) {
    const st = state();
    const sub = { id: uid('s'), created: now(), from: n, by: o.by || 'president', kind: o.kind, title: String(o.title).trim(), body: String(o.body).trim(),
                  targets: o.kind === 'solidarity' ? (o.targets || []).filter((x) => x !== n) : [], state: 'pending' };
    st.subs.unshift(sub);
    record(st, officer(n, sub.by), 'submitted', { local: n, sub: sub.id, title: sub.title,
      detail: { share: 'Asked the council to share with all locals', solidarity: 'Asked locals ' + sub.targets.join(', ') + ' for support', issue: 'Flagged an issue to the council (private)' }[sub.kind] });
    save(st); return sub;
  }
  function routeSub(id, o) {
    const st = state(), s = st.subs.find((x) => x.id === id); if (!s || s.state !== 'pending') return s;
    s.councilNote = String(o.note || '').trim(); s.decidedAt = now();
    if (!o.approve) {
      s.state = 'declined';
      record(st, 'Council', 'declined submission', { local: s.from, sub: s.id, title: s.title, detail: s.councilNote ? 'Note: ' + s.councilNote : '' });
      save(st); return s;
    }
    if (s.kind === 'issue') {
      s.state = 'handled';
      record(st, 'Council', 'replied', { local: s.from, sub: s.id, title: s.title, detail: s.councilNote ? 'Reply: ' + s.councilNote : 'Marked handled' });
      save(st); return s;
    }
    s.state = 'routed';
    save(st, true);
    const targets = s.kind === 'share' ? ALL : [s.from].concat(s.targets);
    const post = send({ title: s.title, body: s.body, targets, origin: s.from, kind: s.kind });
    const st2 = state(), s2 = st2.subs.find((x) => x.id === id); s2.postId = post.id;
    record(st2, 'Council', 'routed submission', { local: s.from, sub: s.id, post: post.id, title: s.title,
      detail: (s.kind === 'share' ? 'Shared with all locals' : 'Sent to locals ' + s.targets.join(', ')) + (s.councilNote ? ' · note: ' + s.councilNote : '') });
    save(st2); return s2;
  }

  /* ---------- contacts ---------- */
  function requestVerify(n) {
    const st = state(); st.dir[n].requestedAt = now();
    record(st, 'Council', 'asked to verify contacts', { local: n, detail: 'Email sent to the president' });
    save(st);
  }
  function verifyContacts(n, o) {
    const st = state(), d = st.dir[n];
    const norm = (v) => v == null ? '' : String(v).trim();
    const changes = ['president', 'backup', 'stewards', 'delegates'].filter((k) => norm(o[k]) !== norm(d[k]));
    Object.assign(d, { president: norm(o.president), backup: norm(o.backup),
                       stewards: norm(o.stewards) === '' ? null : +o.stewards, delegates: norm(o.delegates) === '' ? null : +o.delegates,
                       verifiedAt: now(), requestedAt: null });
    record(st, (d.president || 'President') + ', Local ' + n, 'verified contacts', { local: n, detail: changes.length ? 'Updated: ' + changes.join(', ') : 'Confirmed, no changes' });
    save(st);
  }

  /* ---------- reach (simulated): site views, texts, emails ---------- */
  function reach(p, n) {
    const s = p.status[n];
    const live = s && (['approved', 'live'].includes(s.state) || (s.state === 'pending' && s.version)) && !p.pulledAt && windowState(p) !== 'scheduled';
    if (!live) return { views: 0, texts: 0, taps: 0, emails: 0, opens: 0 };
    const h = hoursSince(s.at), m = LOCALS[n].members, ch = s.channels || {};
    const grow = (k) => 1 - Math.exp(-h / k);
    const texts = ch.text ? alertSubs(n) : 0, emails = ch.email ? emailSubs(n) : 0;
    return { views: Math.floor(m * 0.35 * grow(12)), texts, taps: Math.floor(texts * 0.42 * grow(3)), emails, opens: Math.floor(emails * 0.38 * grow(8)) };
  }
  function reachTotal(p) {
    return Object.keys(p.status).map((n) => reach(p, n)).reduce((a, r) => { Object.keys(r).forEach((k) => { a[k] = (a[k] || 0) + r[k]; }); return a; }, { views: 0, texts: 0, taps: 0, emails: 0, opens: 0 });
  }

  /* ---------- partners ---------- */
  const ownerName = (o) => o === 'council' ? 'Council' : null;
  const partnerWindow = (p) => p.startAt && p.startAt > now() ? 'scheduled' : (p.endAt && now() >= p.endAt ? 'ended' : 'active');
  const byRank = (a, b) => (b.featured - a.featured) || (b.created - a.created);
  /* What the public sees: active partners only, featured first. */
  function partners(owner) { return (state().partners || []).filter((p) => p.owner === owner && partnerWindow(p) === 'active').sort(byRank); }
  /* What the officers manage: everything, including scheduled and ended. */
  function partnersAdmin(owner) { return (state().partners || []).filter((p) => p.owner === owner).sort(byRank); }
  const featuredCount = (st, owner) => st.partners.filter((p) => p.owner === owner && p.featured && partnerWindow(p) !== 'ended').length;
  const partnerActor = (owner, by) => owner === 'council' ? 'Council' : officer(owner, by);
  function addPartner(owner, o) {
    const st = state();
    if (!o.ack) return { error: 'ack' };
    if (!String(o.name || '').trim() || !String(o.offer || '').trim()) return { error: 'missing' };
    const featured = !!o.featured && featuredCount(st, owner) < FEATURED_MAX;
    const url = String(o.url || '').trim();
    const p = { id: uid('pt'), owner, name: String(o.name).trim().slice(0, 60), offer: String(o.offer).trim().slice(0, 140), offerEs: String(o.offerEs || '').trim().slice(0, 160),
      url: !url ? '#' : /^https?:\/\//i.test(url) ? url : 'https://' + url, cat: CATS[o.cat] ? o.cat : 'other', featured, startAt: o.startAt || null, endAt: o.endAt || null,
      created: now(), by: partnerActor(owner, o.by), ack: true, ackAt: now(), clicks: 0, sample: false };
    st.partners.unshift(p);
    record(st, p.by, 'added partner', { local: owner === 'council' ? undefined : owner, title: p.name,
      detail: (owner === 'council' ? 'Statewide partner on the hub and every local site' : 'Member benefit on the Local ' + owner + ' site') + (featured ? ' · featured' : '') + ' · responsibility confirmed' });
    save(st); return { partner: p, featuredFull: !!o.featured && !featured };
  }
  function setFeatured(id, on, by) {
    const st = state(), p = st.partners.find((x) => x.id === id); if (!p) return { error: 'missing' };
    if (on && !p.featured && featuredCount(st, p.owner) >= FEATURED_MAX) return { error: 'full' };
    p.featured = !!on;
    record(st, partnerActor(p.owner, by), on ? 'featured partner' : 'unfeatured partner', { local: p.owner === 'council' ? undefined : p.owner, title: p.name, detail: on ? 'Moved to a featured card' : 'Moved to the regular list' });
    save(st); return { partner: p };
  }
  function removePartner(id, by) {
    const st = state(), i = st.partners.findIndex((x) => x.id === id); if (i < 0) return null;
    const p = st.partners.splice(i, 1)[0];
    record(st, partnerActor(p.owner, by), 'removed partner', { local: p.owner === 'council' ? undefined : p.owner, title: p.name, detail: 'Taken off the site' });
    save(st); return p;
  }
  /* A click is counted as a total for the partner. No member identity is stored. */
  function clickPartner(id) { const st = load(), p = (st.partners || []).find((x) => x.id === id); if (p) { p.clicks = (p.clicks || 0) + 1; save(st, true); } }

  /* ---------- queries ---------- */
  const posts = () => state().posts;
  const subs = () => state().subs;
  const log = () => state().log;
  /* What a local website shows: live/approved posts (or the approved version of one being corrected), inside its date window. */
  function forLocal(n) {
    return posts().filter((p) => { const s = p.status[n];
      return s && windowState(p) === 'active' && (['live', 'approved'].includes(s.state) || (s.state === 'pending' && s.version)); });
  }
  function exportCSV(rows) {
    const cols = ['when', 'who', 'action', 'local', 'post or submission', 'detail'];
    const q = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const lines = (rows || log()).map((r) => [new Date(r.at).toISOString(), r.actor, r.action, r.local ? 'Local ' + r.local : '', r.title || '', r.detail || ''].map(q).join(','));
    return [cols.join(',')].concat(lines).join('\n');
  }
  function reset() { save(fresh()); }
  const onChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

  /* ---------- rendering on a local website ---------- */
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
      const list = forLocal(n);
      const v = (p) => p.status[n].version || snapshot(p);
      const credit = (p) => p.origin && p.origin !== n ? `From Local ${p.origin} · shared by the State Council` : (p.origin === n ? 'From your local · shared statewide by the council' : 'Sent by the ATU NJ State Council');
      const urgent = list.filter((p) => p.urgent);
      const pinned = list.filter((p) => !p.urgent && p.status[n].placement === 'pinned');
      const feed = list.filter((p) => !p.urgent && p.status[n].placement !== 'pinned');
      const note = (p) => p.status[n].note ? `<div class="council-note"><span>Note from Local ${n}</span>${esc(p.status[n].note)}</div>` : '';
      const badge = (p) => p.origin ? (p.kind === 'solidarity' ? '◆ Solidarity request' : '◆ From Local ' + p.origin) : '◆ From the State Council';
      const alertEl = document.querySelector(sel.alert);
      if (alertEl) alertEl.innerHTML = urgent.map((p) => `
        <div class="council-alert" role="alert"><div class="ca-in">
          <span class="ca-tag">◆ Urgent · NJ State Council</span>
          <div class="ca-txt"><b>${esc(v(p).title)}</b>${esc(v(p).body)}</div>
        </div></div>`).join('');
      const pinEl = document.querySelector(sel.pinned);
      if (pinEl) pinEl.innerHTML = pinned.map((p) => `
        <article class="council-pin">
          <span class="council-badge">${esc(badge(p))}</span>
          <div><h3>${esc(v(p).title)}</h3><p>${esc(v(p).body)}</p>${note(p)}
            <div class="council-meta">${esc(credit(p))} · ${fmtDate(p.created)}${p.endAt ? ' · Until ' + fmtDate(p.endAt) : ''}</div></div>
        </article>`).join('');
      const grid = document.querySelector(sel.grid);
      if (grid) {
        grid.querySelectorAll('.news-card.council').forEach((c) => c.remove());
        grid.insertAdjacentHTML('afterbegin', feed.map((p) => `
          <article class="news-card council">
            <div class="news-img"><span class="lab">${esc(p.origin ? (p.kind === 'solidarity' ? 'Solidarity' : 'Local ' + p.origin) : 'NJ State Council')}</span></div>
            <div class="news-body">
              <div class="news-meta"><span class="council-badge">${esc(p.origin ? 'Via the Council' : 'From the Council')}</span><span>${fmtDate(p.created)}</span></div>
              <h3 class="news-title">${esc(v(p).title)}</h3>
              <p class="news-excerpt">${esc(v(p).body)}</p>${note(p)}
              <div class="news-foot"><b>${esc(credit(p))}</b><span>${p.endAt ? 'Until ' + fmtDate(p.endAt) : ''}</span></div>
            </div>
          </article>`).join(''));
      }
    };
    draw(); onChange(draw);
    setInterval(draw, 30000);   // start and end dates
  }

  /* ---------- rendering: member benefits & partners ---------- */
  const SWATCH = [['#2F6FB5', '#fff'], ['#0F766E', '#fff'], ['#B81E33', '#fff'], ['#23774A', '#fff'], ['#C2185B', '#fff'], ['#E4BE80', '#06101F'], ['#4FA3D9', '#06101F'], ['#F2C14E', '#06101F']];
  const swatch = (name) => { let h = 0; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return SWATCH[h % SWATCH.length]; };
  const mono = (name) => String(name).replace(/[^A-Za-z0-9& ]/g, ' ').split(/\s+/).filter((w) => w && w !== '&').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const PT_EN = { eyebrow: '◆ Member benefits & partners', titleLocal: 'Show your card. Save.', titleHub: 'Statewide partners',
    ledeLocal: 'Businesses that back Local {n} members. Show your union card to get the deal.',
    ledeHub: 'Businesses that back every member of all nine locals. Show your union card to get the deal.',
    featured: 'Featured partner', partner: 'Partner', cta: 'Get the deal', sample: 'Sample',
    statewide: '◆ Statewide partners · from the ATU NJ State Council', none: 'No partners yet.',
    fine: 'Partners support the union. Each business sets its own offer. Partners never receive member information.' };
  function partnerCard(p, t, lang, size) {
    const [bg, fg] = swatch(p.name);
    const offer = lang === 'es' && p.offerEs ? p.offerEs : p.offer;
    const cat = CATS[p.cat] ? CATS[p.cat][lang] || CATS[p.cat].en : '';
    const ext = p.url && p.url !== '#';
    const tags = (size === 'big' ? `<span class="pt-tag feat">${esc(t.featured)}</span>` : `<span class="pt-tag">${esc(t.partner)}</span>`) + (p.sample ? `<span class="pt-tag sample">${esc(t.sample)}</span>` : '');
    return `<a class="pt-card ${size}" href="${esc(ext ? p.url : '#')}"${ext ? ' target="_blank" rel="sponsored noopener"' : ''} data-partner="${esc(p.id)}">
        <span class="pt-logo" style="background:${bg};color:${fg}" aria-hidden="true">${esc(mono(p.name))}</span>
        <span class="pt-txt"><span class="pt-tags">${tags}</span><b class="pt-name">${esc(p.name)}</b><span class="pt-offer">${esc(offer)}</span>
        <span class="pt-foot"><span class="pt-cat">${esc(cat)}</span>${size !== 'mini' ? `<span class="pt-cta">${esc(t.cta)} →</span>` : ''}</span></span></a>`;
  }
  /* owner: 'council' (the hub) or a local number. Local sites also get the statewide row. */
  function partnersHTML(owner, opt) {
    const o = opt || {}, lang = o.lang || 'en', t = Object.assign({}, PT_EN, o.t || {});
    const own = partners(owner), feat = own.filter((p) => p.featured), rest = own.filter((p) => !p.featured);
    const isHub = owner === 'council', statewide = isHub ? [] : partners('council');
    if (!own.length && !statewide.length) return '';
    return `<div class="pt-wrap">
      <div class="pt-head"><div class="pt-eyebrow">${esc(t.eyebrow)}</div>
        <h2 class="pt-title">${esc(isHub ? t.titleHub : t.titleLocal)}</h2>
        <p class="pt-lede">${esc((isHub ? t.ledeHub : t.ledeLocal).replace('{n}', owner))}</p></div>
      ${feat.length ? `<div class="pt-feat">${feat.map((p) => partnerCard(p, t, lang, 'big')).join('')}</div>` : ''}
      ${rest.length ? `<div class="pt-list">${rest.map((p) => partnerCard(p, t, lang, 'row')).join('')}</div>` : ''}
      ${statewide.length ? `<div class="pt-state"><div class="pt-state-l">${esc(t.statewide)}</div><div class="pt-mini">${statewide.map((p) => partnerCard(p, t, lang, 'mini')).join('')}</div></div>` : ''}
      <p class="pt-fine">${esc(t.fine)}</p></div>`;
  }
  const PCSS = `
.partners-mount{background:var(--navy-deep,#06101F);border-top:1px solid rgba(255,255,255,.12)}
.pt-wrap{padding:64px var(--gutter,24px)}
.pt-eyebrow{font-family:var(--mono,monospace);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim,#8FA2C4)}
.pt-title{margin:10px 0 0;font-family:var(--display,sans-serif);font-weight:800;font-size:clamp(36px,5vw,56px);line-height:.95;text-transform:uppercase;color:var(--ink,#F2F4F8)}
.pt-lede{margin:12px 0 0;font-family:var(--body,sans-serif);font-size:16px;line-height:1.55;color:var(--muted,#C5CDDB);max-width:60ch}
.pt-card{display:flex;gap:16px;align-items:flex-start;text-decoration:none;color:var(--ink,#F2F4F8);background:var(--panel,#13284D);border:1px solid rgba(255,255,255,.14);padding:16px;min-width:0;transition:border-color .15s,transform .15s}
.pt-card:hover{border-color:var(--ink,#F2F4F8)}
.pt-card:focus-visible{outline:3px solid #F2C14E;outline-offset:2px}
.pt-logo{flex:none;width:48px;height:48px;display:flex;align-items:center;justify-content:center;font-family:var(--display,sans-serif);font-weight:800;font-size:20px;letter-spacing:.02em}
.pt-txt{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}
.pt-tags{display:flex;gap:6px;flex-wrap:wrap}
.pt-tag{font-family:var(--mono,monospace);font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--dim,#8FA2C4);border:1px solid rgba(255,255,255,.22);padding:2px 6px}
.pt-tag.feat{color:#06101F;background:#E4BE80;border-color:#E4BE80}
.pt-tag.sample{color:#06101F;background:#F2C14E;border-color:#F2C14E}
.pt-name{font-family:var(--display,sans-serif);font-weight:800;font-size:22px;line-height:1.05;text-transform:uppercase;letter-spacing:.01em}
.pt-offer{font-family:var(--body,sans-serif);font-size:15px;line-height:1.45;color:var(--muted,#C5CDDB)}
.pt-foot{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:6px;font-family:var(--mono,monospace);font-size:11px;letter-spacing:.08em;text-transform:uppercase}
.pt-cat{color:var(--dim,#8FA2C4)}
.pt-cta{color:#F2F4F8;font-weight:600}
.pt-feat{margin-top:32px;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:16px}
.pt-card.big{flex-direction:column;padding:24px;border-top:4px solid #E4BE80;background:var(--panel,#13284D)}
.pt-card.big .pt-logo{width:72px;height:72px;font-size:30px}
.pt-card.big .pt-name{font-size:30px}
.pt-card.big .pt-offer{font-size:17px;color:var(--ink,#F2F4F8)}
.pt-list{margin-top:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:12px}
.pt-state{margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,.14)}
.pt-state-l{font-family:var(--mono,monospace);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#E4BE80}
.pt-mini{margin-top:14px;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr));gap:10px}
.pt-card.mini{padding:12px;background:transparent}
.pt-card.mini .pt-logo{width:36px;height:36px;font-size:15px}
.pt-card.mini .pt-name{font-size:17px}
.pt-card.mini .pt-offer{font-size:13px}
.pt-fine{margin:28px 0 0;font-family:var(--mono,monospace);font-size:11px;letter-spacing:.06em;color:var(--dim,#8FA2C4);max-width:80ch}
@media (prefers-reduced-motion:reduce){.pt-card{transition:none}}
`;
  function ensurePartnerCSS() {
    if (document.getElementById('partners-css')) return;
    const st = document.createElement('style'); st.id = 'partners-css'; st.textContent = PCSS; document.head.appendChild(st);
  }
  let clickWired = false;
  function wirePartnerClicks() {
    if (clickWired) return; clickWired = true;
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('[data-partner]'); if (!a) return;
      clickPartner(a.dataset.partner);
      if (a.getAttribute('href') === '#') e.preventDefault();    // sample partners have no real site
    });
  }
  /* Local website: render into sel. opt.t / opt.lang optional. */
  function mountPartners(sel, owner, opt) {
    ensurePartnerCSS(); wirePartnerClicks();
    const draw = () => { const el = document.querySelector(sel); if (el) el.innerHTML = partnersHTML(owner, typeof opt === 'function' ? opt() : opt); };
    draw(); onChange(draw); setInterval(draw, 60000);
    return draw;
  }

  window.CouncilFeed = {
    LOCALS, ALL, HANDS_ON, NOTE_MAX, DEMO_HOUR, REMIND_H, ESCALATE_H, VERIFY_DAYS,
    posts, subs, log, contacts, alertSubs, emailSubs, reach, reachTotal, forLocal, windowState, ageLabel, hoursSince,
    send, correct, pull, approve, decline, remove, submit, routeSub, requestVerify, verifyContacts, exportCSV, reset, onChange, mountLocal,
    CATS, FEATURED_MAX, partners, partnersAdmin, partnerWindow, addPartner, setFeatured, removePartner, clickPartner, partnersHTML, mountPartners, ensurePartnerCSS, wirePartnerClicks, mono, swatch,
    esc, fmtDate, tick: () => { const st = load(); if (settle(st)) save(st); }
  };
})();

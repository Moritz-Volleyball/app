// Volleyball app – user interface (English main language, plus Russian and German)
(function () {
  'use strict';
  const C = self.APP_CONFIG || {};
  const I = self.I18N;
  const { DEL } = self.Data;
  let DB = null;

  const S = {
    ready: false, error: '', user: null, me: undefined,
    members: [], events: [], posts: [], polls: [], videos: [], fees: [], payments: [], myPay: null, inbox: [],
    authSubs: [], dataSubs: [], dataKey: '',
    videoCat: '*', statRange: '90', showPast: false, loginTab: 'login',
    installEvt: null, pushDismissed: false, openFee: null, navCount: 0,
    lang: null, langPicker: false,
    comments: [], homework: [], feedback: [], cal: null, skills: {}, prefs: null, goals: null, theme: null,
    calView: 'list', calMonth: null, calDay: null, openComments: new Set(), teamDraft: null, q: '', pendingRender: false,
    tournaments: [], tourTab: 'plan', rulesTab: 'rules'
  };
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* no storage */ } }
  };
  S.pushDismissed = store.get('vb-push-dismissed') === '1';

  // ---------------------------------------------------------- Language
  const LANG_CODES = I.langs.map((l) => l.code);
  const saved = store.get('vb-lang');
  S.lang = LANG_CODES.includes(saved) ? saved : (C.defaultLang || 'en');
  S.langPicker = !LANG_CODES.includes(saved); // first start → show language picker
  const t = (key, p) => I.t(S.lang, key, p);
  let F_ = {};
  function buildFormats() {
    const loc = I.locales[S.lang] || 'en-GB';
    F_ = {
      shortDay: new Intl.DateTimeFormat(loc, { weekday: 'short' }),
      dm: new Intl.DateTimeFormat(loc, { day: '2-digit', month: '2-digit' }),
      long: new Intl.DateTimeFormat(loc, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      time: new Intl.DateTimeFormat(loc, { hour: '2-digit', minute: '2-digit', hour12: false }),
      month: new Intl.DateTimeFormat(loc, { month: 'long', year: 'numeric' }),
      eur: new Intl.NumberFormat(loc, { style: 'currency', currency: 'EUR' })
    };
    document.documentElement.lang = S.lang;
  }
  buildFormats();
  async function setLang(code) {
    S.lang = code; S.langPicker = false; store.set('vb-lang', code); buildFormats();
    if (DB && S.me && uid() && S.me.lang !== code) { try { await DB.update('members/' + uid(), { lang: code }); } catch (e) { /* not critical */ } }
    render(true);
  }

  // ---------------------------------------------------------- Helpers
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nl2br = (s) => esc(s).replace(/\n/g, '<br>');
  const linkify = (s) => nl2br(s).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  const uid = () => S.user && S.user.uid;
  const isTrainer = () => !!(S.me && S.me.role === 'trainer' && S.me.status === 'active');
  const activeMembers = () => S.members.filter((m) => m.status === 'active').sort((a, b) => (a.name || '').localeCompare(b.name || '', I.locales[S.lang]));
  const nameOf = (id) => { const m = S.members.find((x) => x.id === id); return m ? m.name : (id === uid() && S.me ? S.me.name : t('unknown')); };
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  const pushPerm = () => ('Notification' in window ? Notification.permission : 'unsupported');
  const appUrl = () => location.href.split('#')[0].replace(/index\.html$/, '');
  const timeRange = (e) => t('time.range', { a: F_.time.format(e.start), b: F_.time.format(e.end || e.start) });
  const whenTxt = (ts) => `${F_.shortDay.format(ts)} ${F_.dm.format(ts)}, ${F_.time.format(ts)}`;
  const rel = (ts) => {
    const d = (Date.now() - ts) / 60000;
    if (d < 1) return t('rel.now'); if (d < 60) return t('rel.min', { n: Math.round(d) });
    if (d < 1440) return t('rel.h', { n: Math.round(d / 60) }); if (d < 2880) return t('rel.yesterday');
    return F_.dm.format(ts);
  };
  const pad = (n) => String(n).padStart(2, '0');
  const toDateInput = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const toTimeInput = (ts) => { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const euro = (n) => F_.eur.format(n || 0);
  const fnv = (str) => { let h = 0x811c9dc5; for (const ch of str) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
  const fbId = (evId) => evId + '_' + fnv(uid() + '|' + evId) + fnv(evId + '|' + uid());
  const REACTIONS = ['👍', '❤️', '😂', '🔥', '🏐'];
  const memberOf = (id) => (id === uid() && S.me ? S.me : S.members.find((x) => x.id === id));
  // Away / holidays: periods {f, t} in milliseconds (start of first day – end of last day)
  const awayOf = (m) => (m && Array.isArray(m.away) ? m.away.filter((a) => a && a.f && a.t) : []);
  const isAwayAt = (id, ts) => awayOf(memberOf(id)).some((a) => a.f <= ts && ts <= a.t);
  // Preferred positions (max. 2): Setter, Outside hitter, Middle blocker, Opposite, Libero
  const POS = ['S', 'OH', 'MB', 'OPP', 'L'];
  const posOf = (id) => { const m = memberOf(id); return m && Array.isArray(m.pos) ? m.pos.filter((p) => POS.includes(p)).slice(0, 2) : []; };
  const posTag = (list) => (list.length ? ` <small class="pos">${list.map((x) => t('pos.s.' + x)).join('/')}</small>` : '');

  // Seen timestamps (unread counters) – per device
  let SEEN = null;
  try { SEEN = JSON.parse(store.get('vb-seen') || 'null'); } catch (e) { SEEN = null; }
  if (!SEEN || typeof SEEN !== 'object') SEEN = { news: Date.now(), videos: Date.now(), c: {}, start: Date.now() };
  if (!SEEN.c) SEEN.c = {};
  const saveSeen = () => store.set('vb-seen', JSON.stringify(SEEN));
  saveSeen();
  const PREV = { news: SEEN.news, videos: SEEN.videos };
  function markSeen(key) { PREV[key] = SEEN[key]; SEEN[key] = Date.now(); saveSeen(); }
  function markComments(target) { SEEN.c[target] = Date.now(); saveSeen(); }

  // One-off document subscriptions (feedback, goals of others …)
  const docCache = {}, docSubs = {};
  function useDoc(path) {
    if (!(path in docSubs)) { docCache[path] = undefined; docSubs[path] = DB.watchDoc(path, (d) => { docCache[path] = d; schedule(); }); }
    return docCache[path];
  }
  const clearDocs = () => { Object.keys(docSubs).forEach((k) => { try { docSubs[k](); } catch (e) { /* */ } delete docSubs[k]; delete docCache[k]; }); };

  // Team design (colours, logo, name)
  const hexOk = (h) => /^#[0-9a-f]{6}$/i.test(h || '');
  function mix(hex, other, w) {
    const a = parseInt(hex.slice(1), 16), b = parseInt(other.slice(1), 16);
    const ch = (x, sh) => (x >> sh) & 255;
    const m = (sh) => Math.round(ch(a, sh) * (1 - w) + ch(b, sh) * w);
    return '#' + [16, 8, 0].map((sh) => m(sh).toString(16).padStart(2, '0')).join('');
  }
  function applyTheme(th, preview) {
    if (!preview) S.theme = th || null;
    const r = document.documentElement.style;
    if (th && hexOk(th.c1)) {
      r.setProperty('--blue', th.c1); r.setProperty('--navy', mix(th.c1, '#000000', 0.35)); r.setProperty('--sky', mix(th.c1, '#ffffff', 0.88));
      const meta = document.querySelector('meta[name=theme-color]'); if (meta) meta.setAttribute('content', mix(th.c1, '#000000', 0.35));
    } else { ['--blue', '--navy', '--sky'].forEach((v) => r.removeProperty(v)); }
    if (th && hexOk(th.c2)) r.setProperty('--accent', th.c2); else r.removeProperty('--accent');
    if (!preview) { try { store.set('vb-theme', JSON.stringify(th || null)); } catch (e) { /* */ } }
  }
  try { applyTheme(JSON.parse(store.get('vb-theme') || 'null')); } catch (e) { /* */ }
  const groupName = () => (S.theme && S.theme.name) || C.groupName || 'Volleyball';
  const logoHtml = (cls) => (S.theme && S.theme.logo ? `<img class="${cls} img" src="${esc(S.theme.logo)}" alt="">` : `<div class="${cls}">🏐</div>`);

  function toast(msg, kind = '') {
    let box = $('#toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
    const el = document.createElement('div'); el.className = 'toast ' + kind; el.innerHTML = msg; box.appendChild(el);
    setTimeout(() => el.classList.add('out'), 3200); setTimeout(() => el.remove(), 3700);
  }
  const errMsg = (e) => { const k = e && e.code ? 'err.' + e.code : ''; const v = k ? t(k) : ''; return v && v !== k ? v : ((e && e.message) || String(e)); };

  // ---------------------------------------------------------- Event logic
  // Members with "yes" and guests share the spots in the order they signed up
  function guestEntries(ev) {
    return Object.entries(ev.guests || {}).flatMap(([host, arr]) => (Array.isArray(arr) ? arr : []).map((g, i) => ({ k: 'g:' + host + ':' + i, t: g.t || 0, m: false, name: g.n, trial: !!g.trial, s: Number(g.s) || 0, host, i })));
  }
  function rsvpLists(ev) {
    const r = ev.rsvp || {};
    const entries = Object.entries(r).filter(([, v]) => v && v.s === 'yes').map(([k, v]) => ({ k, t: v.t || 0, m: true })).concat(guestEntries(ev)).sort((a, b) => a.t - b.t);
    const lim = Number(ev.limit) || 0;
    const inE = lim > 0 ? entries.slice(0, lim) : entries;
    const waitE = lim > 0 ? entries.slice(lim) : [];
    const confirmed = inE.filter((e) => e.m).map((e) => e.k);
    const waitlist = waitE.filter((e) => e.m).map((e) => e.k);
    const no = Object.entries(r).filter(([, v]) => v && v.s === 'no').map(([k]) => k);
    const answered = new Set(Object.keys(r));
    const notAnswered = activeMembers().map((m) => m.id).filter((id) => !answered.has(id));
    const away = notAnswered.filter((id) => isAwayAt(id, ev.start));
    const open = notAnswered.filter((id) => !away.includes(id));
    return { confirmed, waitlist, no, open, away, lim, guestsIn: inE.filter((e) => !e.m), guestsWait: waitE.filter((e) => !e.m), total: inE.length, waitTotal: waitE.length };
  }
  function myStatus(ev) {
    const l = rsvpLists(ev); const me = uid();
    if (l.confirmed.includes(me)) return { k: 'yes', label: t('st.yes') };
    const w = l.waitlist.indexOf(me); if (w >= 0) return { k: 'wait', label: t('st.wait', { n: w + 1 }) };
    if (l.no.includes(me)) return { k: 'no', label: t('st.no') };
    if (l.away.includes(me)) return { k: 'away', label: t('st.away') };
    return { k: 'open', label: t('st.open') };
  }
  // Push: stored as key + parameters, the sender translates per recipient language
  async function push(to, k, p = {}, link = '') {
    try { await DB.add('outbox', { to, k, p, link, from: uid(), ts: Date.now() }); kickPush(); } catch (e) { console.warn('push not queued', e); }
  }
  // Tell the push service (Cloudflare Worker) to send right away
  let kickT = null;
  function kickPush() {
    if (!C.pushUrl || !DB || DB.demo) return;
    clearTimeout(kickT);
    kickT = setTimeout(() => { try { fetch(C.pushUrl, { method: 'POST', mode: 'no-cors', keepalive: true }).catch(() => { /* cron catches up */ }); } catch (e) { /* */ } }, 400);
  }
  const evP = (ev) => ({ title: ev.title, start: ev.start, place: ev.place || '' });
  async function notifyPromoted(before, after, ev) {
    const promoted = after.filter((x) => !before.includes(x) && x !== uid());
    if (promoted.length) await push(promoted, 'promoted', evP(ev), '#/termin/' + ev.id);
  }
  // "Spot free" alert: the session was full, now a spot is free and nobody is waiting → tell everyone who hasn't replied
  async function notifySpotFree(beforeL, nextEv) {
    const a = rsvpLists(nextEv);
    if (!a.lim || nextEv.cancelled || nextEv.start < Date.now() || beforeL.total < a.lim || a.total >= a.lim || a.waitTotal) return;
    const to = a.open.filter((x) => x !== uid());
    if (to.length) await push(to, 'spotFree', { ...evP(nextEv), n: a.lim - a.total }, '#/termin/' + nextEv.id);
  }
  async function setRsvp(id, s) {
    const ev = S.events.find((e) => e.id === id); if (!ev) return;
    const cur = (ev.rsvp || {})[uid()];
    const entry = s === 'yes' ? { s: 'yes', t: cur && cur.s === 'yes' ? cur.t : Date.now() } : { s: 'no', t: Date.now() };
    const beforeL = rsvpLists(ev); const before = beforeL.confirmed;
    const nextEv = { ...ev, rsvp: { ...(ev.rsvp || {}), [uid()]: entry } };
    await DB.update('events/' + id, { ['rsvp.' + uid()]: entry });
    await notifyPromoted(before, rsvpLists(nextEv).confirmed, ev);
    await notifySpotFree(beforeL, nextEv);
    const st = myStatus(nextEv);
    toast(s === 'yes' ? (st.k === 'wait' ? t('rsvp.wait', { status: st.label }) : t('rsvp.yes')) : t('rsvp.no'));
  }
  function icsFor(ev) {
    const f = (ts) => new Date(ts).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const e = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//' + e(C.publisher) + '//Volleyball//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      'UID:' + ev.id + '@volleyball-app', 'DTSTAMP:' + f(Date.now()), 'DTSTART:' + f(ev.start), 'DTEND:' + f(ev.end || ev.start + 7200e3),
      'SUMMARY:' + e(ev.title + ' – ' + groupName()), 'LOCATION:' + e(ev.place), 'DESCRIPTION:' + e(ev.notes),
      'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:' + e(ev.title), 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  }
  function gcalUrl(ev) {
    const f = (ts) => new Date(ts).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const p = new URLSearchParams({ action: 'TEMPLATE', text: ev.title + ' – ' + groupName(), dates: f(ev.start) + '/' + f(ev.end || ev.start + 7200e3), location: ev.place || '', details: ev.notes || '' });
    return 'https://calendar.google.com/calendar/render?' + p.toString();
  }
  const ytId = (url) => { const m = String(url || '').match(/(?:youtu\.be\/|v=|\/shorts\/|\/embed\/|\/live\/)([A-Za-z0-9_-]{11})/); return m ? m[1] : ''; };

  // ---------------------------------------------------------- Subscriptions
  const unsub = (list) => list.splice(0).forEach((u) => { try { u && u(); } catch (e) { /* */ } });
  function subscribeData() {
    const key = uid() + ':' + (S.me && S.me.role);
    if (S.dataKey === key) return;
    unsub(S.dataSubs); S.dataKey = key;
    const w = (n, k) => S.dataSubs.push(DB.watchCol(n, (d) => { S[k] = d; schedule(); }));
    w('members', 'members'); w('events', 'events'); w('posts', 'posts'); w('polls', 'polls'); w('videos', 'videos'); w('fees', 'fees');
    w('comments', 'comments'); w('homework', 'homework'); w('tournaments', 'tournaments');
    const d = (path, fn) => S.dataSubs.push(DB.watchDoc(path, (x) => { fn(x); schedule(); }));
    d('settings/cal', (x) => { S.cal = x; });
    d('prefs/' + uid(), (x) => { S.prefs = x; });
    d('goals/' + uid(), (x) => { S.goals = x; });
    if (isTrainer()) { w('payments', 'payments'); w('inbox', 'inbox'); w('feedback', 'feedback'); d('private/skills', (x) => { S.skills = (x && x.s) || {}; }); }
    else S.dataSubs.push(DB.watchDoc('payments/' + uid(), (x) => { S.myPay = x; schedule(); }));
  }
  function onAuth(u) {
    unsub(S.authSubs); unsub(S.dataSubs); S.dataKey = ''; clearDocs();
    Object.assign(S, { user: u, me: undefined, members: [], events: [], posts: [], polls: [], videos: [], fees: [], payments: [], inbox: [], myPay: null, comments: [], homework: [], feedback: [], cal: null, skills: {}, prefs: null, goals: null, tournaments: [] });
    if (u) {
      S.authSubs.push(DB.watchDoc('members/' + u.uid, (m) => {
        const prev = S.me;
        const changed = prev === undefined || !prev !== !m || (prev && m && (prev.status !== m.status || prev.role !== m.role));
        S.me = m;
        if (m && m.lang !== S.lang && !S.langPicker) DB.update('members/' + u.uid, { lang: S.lang }).catch(() => { /* */ });
        if (m && m.status === 'active') {
          subscribeData();
          if (!DB.demo && pushPerm() === 'granted') DB.enablePush(true).catch(() => { /* */ });
        } else { unsub(S.dataSubs); S.dataKey = ''; }
        if (changed) render(true); else schedule();
      }));
    }
    render(true);
  }

  // ---------------------------------------------------------- Rendering
  const FORM_ROUTES = new Set(['termin-neu', 'termin-edit', 'nachricht', 'umfrage-neu', 'video-neu', 'video-edit', 'anwesenheit', 'profil', 'beitrag-neu', 'fahrt', 'gast', 'aufgabe-neu', 'design', 'push-prefs', 'turnier-neu', 'spiel', 'timer', 'abwesend', 'quiz']);
  let lastKey = '', rq = false;
  const schedule = () => { if (rq) return; rq = true; requestAnimationFrame(() => { rq = false; render(false); }); };
  // Don't redraw while someone is typing into an inline field (comment, goal, search)
  const typing = () => { const a = document.activeElement; return !!(a && a.matches && a.matches('[data-keep]') && a.value); };
  document.addEventListener('focusout', () => { if (S.pendingRender) { S.pendingRender = false; setTimeout(() => render(false), 50); } });
  function route() {
    const h = (location.hash || '#/termine').replace(/^#\/?/, '');
    const [r, ...rest] = h.split('/');
    return { r: r || 'termine', id: decodeURIComponent(rest.join('/')) };
  }
  const go = (h) => { if (location.hash === h) render(true); else location.hash = h; };
  const back = (fallback) => { if (history.length > 1 && S.navCount > 0) history.back(); else go(fallback); };

  function render(force) {
    const app = $('#app');
    let stage = 'app';
    if (S.langPicker) stage = 'lang';
    else if (!S.ready) stage = 'boot'; else if (!S.user) stage = 'login'; else if (S.me === undefined) stage = 'loading'; else if (S.me === null) stage = 'profile'; else if (S.me.status !== 'active') stage = 'pending';
    const { r, id } = route();
    const key = S.lang + '|' + stage + '|' + r + '/' + id;
    if (!force && key === lastKey && (stage !== 'app' || FORM_ROUTES.has(r)) && document.querySelector('#app form[data-f]')) return;
    if (!force && key === lastKey && typing()) { S.pendingRender = true; return; }
    const main = $('#main');
    const scroll = key === lastKey && main ? main.scrollTop : 0;
    if (stage === 'lang') app.innerHTML = viewLangPicker();
    else if (['login', 'pending', 'profile'].includes(stage) && r === 'install') { const v = viewInstall(); app.innerHTML = `<header class="top"><button class="back" data-a="back" data-to="#/" aria-label="${t('back')}">‹</button><h1>${esc(v.title)}</h1></header><main id="main"><div class="wrap">${v.html}</div></main>`; }
    else if (stage === 'boot' || stage === 'loading') app.innerHTML = viewBoot();
    else if (stage === 'login') app.innerHTML = viewLogin();
    else if (stage === 'profile') app.innerHTML = viewProfileCreate();
    else if (stage === 'pending') app.innerHTML = viewPending();
    else app.innerHTML = shell(r, id);
    const m2 = $('#main'); if (m2) m2.scrollTop = scroll;
    lastKey = key;
    if (stage === 'app') afterRender(r, id);
  }

  const TABS = [
    ['termine', '📅', 'tab.events', ['termine', 'termin', 'termin-neu', 'termin-edit', 'anwesenheit', 'fahrt', 'gast', 'teams']],
    ['news', '📣', 'tab.news', ['news', 'nachricht']],
    ['umfragen', '📊', 'tab.polls', ['umfragen', 'umfrage-neu']],
    ['videos', '🎬', 'tab.videos', ['videos', 'video-neu', 'video-edit', 'aufgabe-neu']],
    ['mehr', '☰', 'tab.more', ['mehr', 'kasse', 'beitrag-neu', 'statistik', 'mitglieder', 'postfach', 'profil', 'install', 'kalender-abo', 'push-prefs', 'ziele', 'design', 'suche', 'turniere', 'turnier', 'turnier-neu', 'spiel', 'timer', 'regeln', 'abwesend', 'quiz']]
  ];
  const VIEWS = {
    termine: viewTermine, termin: viewTermin, 'termin-neu': viewTerminForm, 'termin-edit': viewTerminForm, anwesenheit: viewAnwesenheit, fahrt: viewFahrt,
    news: viewNews, nachricht: viewNachricht, umfragen: viewUmfragen, 'umfrage-neu': viewUmfrageForm,
    videos: viewVideos, 'video-neu': viewVideoForm, 'video-edit': viewVideoForm,
    mehr: viewMehr, kasse: viewKasse, 'beitrag-neu': viewBeitragForm, statistik: viewStatistik, mitglieder: viewMitglieder, postfach: viewPostfach, profil: viewProfil, install: viewInstall,
    gast: viewGast, teams: viewTeams, 'aufgabe-neu': viewAufgabeForm, 'kalender-abo': viewKalenderAbo, 'push-prefs': viewPushPrefs, ziele: viewZiele, design: viewDesign, suche: viewSuche,
    turniere: viewTurniere, turnier: viewTurnier, 'turnier-neu': viewTurnierForm, spiel: viewSpiel, timer: viewTimer, regeln: viewRegeln, abwesend: viewAbwesend, quiz: viewQuiz
  };
  const curFlag = () => (I.langs.find((l) => l.code === S.lang) || I.langs[0]).flag;
  function shell(r, id) {
    const v = (VIEWS[r] || viewTermine)(id);
    const b = badges();
    const nav = TABS.map(([k, ic, lb, group]) => `<a href="#/${k}" class="${group.includes(r) ? 'on' : ''}"><span class="ic">${ic}${b[k] ? `<i class="dot">${b[k] > 99 ? '99+' : b[k]}</i>` : ''}</span><span>${t(lb)}</span></a>`).join('');
    return `${DB.demo ? `<div class="demo-bar">${t('demo.bar', { name: S.me.name })}${isTrainer() ? ' (' + t('demo.trainer') + ')' : ''} · <button data-a="demo-switch">${t('demo.switch')}</button></div>` : ''}
      <header class="top">${v.back ? `<button class="back" data-a="back" data-to="${esc(v.back)}" aria-label="${t('back')}">‹</button>` : logoHtml('logo')}
        <h1>${esc(v.title)}</h1>${v.action || ''}${r !== 'suche' ? `<a class="langbtn" href="#/suche" aria-label="${t('search.title')}">🔍</a>` : ''}<button class="langbtn" data-a="lang-open" aria-label="${t('lang.change')}">${curFlag()}</button></header>
      <main id="main"><div class="wrap">${v.html}</div></main>
      <nav class="tabs">${nav}</nav>`;
  }

  // ---------------------------------------------------------- Language picker
  function viewLangPicker() {
    // Title in all three languages, because the language is not chosen yet
    return `<div class="login lang-pick">
      <div class="brand">${logoHtml('ball')}<h2>${esc(groupName())}</h2></div>
      <div class="card"><h3 class="center-text">Choose your language<br><span class="muted small">Выберите язык · Sprache wählen</span></h3>
        ${I.langs.map((l) => `<button class="langopt ${l.code === S.lang ? 'on' : ''}" data-a="lang-set" data-l="${l.code}"><span class="flag">${l.flag}</span><span>${l.name}</span>${l.code === (C.defaultLang || 'en') ? '<span class="tag">Main</span>' : ''}</button>`).join('')}
      </div>
      <p class="muted small center-text">${t('publisher', { name: C.publisher || '' })}</p></div>`;
  }

  // ---------------------------------------------------------- Start / login
  function viewBoot() {
    return `<div class="center"><div class="ball spin">🏐</div><p class="muted">${S.error ? t(S.error) : t('loading')}</p>${S.error ? `<button class="btn" data-a="reload">${t('reload')}</button>` : ''}</div>`;
  }
  function brand() {
    return `<div class="brand">${logoHtml('ball')}<h2>${esc(groupName())}</h2><p class="muted">${t('publisher', { name: C.publisher || '' })}</p>
      <button class="link sm" data-a="lang-open">${curFlag()} ${t('lang.change')}</button></div>`;
  }
  function viewLogin() {
    if (DB.demo) {
      const users = DB.demoUsers().sort((a, b) => (a.role === 'trainer' ? -1 : 1) - (b.role === 'trainer' ? -1 : 1));
      const pick = users.filter((u) => u.role === 'trainer' || ['u_lena', 'u_tom'].includes(u.id));
      return `<div class="login">${brand()}
        <div class="card"><h3>${t('demo.title')}</h3><p class="muted">${t('demo.text')}</p>
        ${pick.map((u) => `<button class="btn block ${u.role === 'trainer' ? '' : 'ghost'}" data-a="demo-login" data-id="${u.id}">${u.role === 'trainer' ? '🧢' : u.status === 'pending' ? '🆕' : '🙋'} ${esc(u.name)} – ${u.role === 'trainer' ? t('demo.trainer') : u.status === 'pending' ? t('demo.pending') : t('demo.member')}</button>`).join('')}
        <details class="more"><summary>${t('demo.other')}</summary>${users.filter((u) => !pick.includes(u)).map((u) => `<button class="chip" data-a="demo-login" data-id="${u.id}">${esc(u.name)}</button>`).join('')}</details>
        </div><button class="link" data-a="demo-reset">${t('demo.reset')}</button></div>`;
    }
    const reg = S.loginTab === 'register';
    return `<div class="login">${brand()}
      <div class="card">
        <div class="seg"><button class="${!reg ? 'on' : ''}" data-a="login-tab" data-t="login">${t('login.tab')}</button><button class="${reg ? 'on' : ''}" data-a="login-tab" data-t="register">${t('register.tab')}</button></div>
        <form data-f="${reg ? 'register' : 'login'}">
          ${reg ? `<label>${t('f.name')}<input name="name" required maxlength="40" autocomplete="name" placeholder="${t('f.namePh')}"></label>` : ''}
          <label>${t('f.email')}<input name="email" type="email" required autocomplete="email"></label>
          <label>${t('f.pw')}<input name="pw" type="password" required minlength="6" autocomplete="${reg ? 'new-password' : 'current-password'}"></label>
          <button class="btn block">${reg ? t('register.btn') : t('login.btn')}</button>
        </form>
        ${!reg ? `<button class="link" data-a="reset-pw">${t('login.forgot')}</button>` : `<p class="muted small">${t('register.hint')}</p>`}
      </div>
      ${!isStandalone() ? `<a class="link" href="#/install">${t('login.install')}</a>` : ''}
    </div>`;
  }
  function viewProfileCreate() {
    return `<div class="login">${brand()}<div class="card"><h3>${t('profile.almost')}</h3><form data-f="profile-create"><label>${t('f.name')}<input name="name" required maxlength="40"></label><button class="btn block">${t('next')}</button></form></div><button class="link" data-a="logout">${t('logout')}</button></div>`;
  }
  function viewPending() {
    return `<div class="login">${brand()}<div class="card center-text"><div class="big">⏳</div><h3>${t('pending.hello', { name: S.me.name })}</h3>
      <p>${t('pending.text')}</p><p class="muted small">${t('pending.small')}</p></div>
      ${DB.demo ? `<button class="btn ghost" data-a="demo-switch">${t('demo.switch')}</button>` : `<button class="link" data-a="logout">${t('logout')}</button>`}</div>`;
  }

  // ---------------------------------------------------------- Sessions
  function pushBanner() {
    if (DB.demo || S.pushDismissed || pushPerm() === 'granted' || pushPerm() === 'denied') return '';
    const ios = isIOS && !isStandalone();
    return `<div class="banner"><div><b>${t('push.bannerT')}</b><br><span class="small">${ios ? t('push.bannerIos') : t('push.bannerTxt')}</span></div>
      <div class="row">${ios ? `<a class="btn sm" href="#/install">${t('push.guide')}</a>` : `<button class="btn sm" data-a="push-on">${t('push.enable')}</button>`}<button class="x" data-a="push-dismiss" aria-label="${t('hide')}">✕</button></div></div>`;
  }
  function rsvpButtons(ev, st, big) {
    return `<button class="btn ${big ? '' : 'sm'} ${st.k === 'yes' || st.k === 'wait' ? 'on-yes' : 'ghost'}" data-a="rsvp" data-id="${ev.id}" data-s="yes">${t('btn.yes')}</button><button class="btn ${big ? '' : 'sm'} ${st.k === 'no' ? 'on-no' : 'ghost'}" data-a="rsvp" data-id="${ev.id}" data-s="no">${t('btn.no')}</button>`;
  }
  const commentsFor = (target) => S.comments.filter((c) => c.target === target);
  const newComments = (target) => commentsFor(target).filter((c) => c.author !== uid() && c.ts > (SEEN.c[target] || SEEN.start)).length;
  function evCard(ev) {
    const l = rsvpLists(ev); const st = myStatus(ev); const past = (ev.end || ev.start) < Date.now();
    const pills = [`<span class="pill ok">✅ ${l.total}${l.lim ? '/' + l.lim : ''}</span>`];
    if (l.waitTotal) pills.push(`<span class="pill wait">${t('ev.waitN', { n: l.waitTotal })}</span>`);
    if (l.guestsIn.length) pills.push(`<span class="pill">${t('guest.pill', { n: l.guestsIn.length })}</span>`);
    if (ev.carpool) pills.push(`<span class="pill">${t('ev.carpool')}</span>`);
    if (ev.plan && ev.plan.length) pills.push(`<span class="pill">${t('ev.plan')}</span>`);
    const nc = newComments('events/' + ev.id); const cc = commentsFor('events/' + ev.id).length;
    if (cc) pills.push(`<span class="pill ${nc ? 'new' : ''}">💬 ${cc}${nc ? ' · ' + t('unread.new', { n: nc }) : ''}</span>`);
    const minLow = isTrainer() && !past && !ev.cancelled && Number(ev.minPlayers) > 0 && l.total < Number(ev.minPlayers);
    return `<div class="card ev ${ev.cancelled ? 'cancelled' : ''} ${past ? 'past' : ''}">
      <a class="ev-top" href="#/termin/${ev.id}">
        <div class="ev-date"><b>${F_.shortDay.format(ev.start)}</b><span>${F_.dm.format(ev.start)}</span></div>
        <div class="ev-body"><div class="ev-title">${esc(ev.title)}${ev.cancelled ? ` <span class="tag red">${t('ev.cancelledTag')}</span>` : ''}${minLow ? ` <span class="tag warnt">${t('min.lowTag')}</span>` : ''}</div>
          <div class="muted small">${timeRange(ev)}${ev.place ? ' · ' + esc(ev.place) : ''}</div>
          <div class="pills">${pills.join('')}</div></div>
        <div class="st st-${st.k}">${st.label}</div></a>
      ${!past && !ev.cancelled ? `<div class="ev-actions">${rsvpButtons(ev, st, false)}</div>` : ''}
    </div>`;
  }
  // Feedback: which past session still waits for my rating?
  function feedbackDue() {
    const now = Date.now();
    return [...S.events].filter((e) => e.fb !== false && !e.cancelled && (e.end || e.start) < now && (e.end || e.start) > now - 4 * 864e5 && rsvpLists(e).confirmed.includes(uid()))
      .sort((a, b) => b.start - a.start).find((e) => { const d = useDoc('feedback/' + fbId(e.id)); return d === null && !store.get('vb-fb-' + e.id); });
  }
  function viewTermine() {
    const now = Date.now();
    const sorted = [...S.events].sort((a, b) => a.start - b.start);
    const up = sorted.filter((e) => (e.end || e.start) >= now);
    const past = sorted.filter((e) => (e.end || e.start) < now).reverse().slice(0, 12);
    const open = up.filter((e) => !e.cancelled && myStatus(e).k === 'open').length;
    const fb = feedbackDue();
    const seg = `<div class="seg"><button class="${S.calView === 'list' ? 'on' : ''}" data-a="cal-view" data-v="list">☰ ${t('cal.list')}</button><button class="${S.calView === 'month' ? 'on' : ''}" data-a="cal-view" data-v="month">🗓 ${t('cal.month')}</button></div>`;
    const myAway = awayOf(S.me).filter((a) => a.t >= now).sort((a, b) => a.f - b.f)[0];
    const awayBanner = myAway && myAway.f - now < 14 * 864e5 ? `<a class="banner awayb" href="#/abwesend"><div><b>🏖️ ${myAway.f <= now ? t('away.bannerNow', { date: F_.dm.format(myAway.t) }) : t('away.bannerSoon', { a: F_.dm.format(myAway.f), b: F_.dm.format(myAway.t) })}</b><br><span class="small">${t('away.bannerSub')}</span></div><span class="chev">›</span></a>` : '';
    const fbBanner = fb ? `<a class="banner fbb" href="#/termin/${fb.id}"><div><b>${t('fb.bannerT')}</b><br><span class="small">${esc(fb.title)} · ${esc(whenTxt(fb.start))}</span></div><span class="stars-mini">☆☆☆☆☆</span></a>` : '';
    return {
      title: t('ev.title'),
      action: isTrainer() ? `<a class="btn sm" href="#/termin-neu">${t('ev.add')}</a>` : '',
      html: `${pushBanner()}${awayBanner}${fbBanner}${seg}
        ${open ? `<div class="hint">${t('ev.openHint', { n: open })}</div>` : ''}
        ${S.calView === 'month' ? monthView(sorted) : `
        ${up.length ? up.map(evCard).join('') : `<div class="empty">${t('ev.none')}${isTrainer() ? `<br><a class="btn" href="#/termin-neu">${t('ev.first')}</a>` : ''}</div>`}
        ${past.length ? `<button class="link" data-a="toggle-past">${S.showPast ? t('ev.hidePast') : t('ev.showPast')}</button>${S.showPast ? past.map(evCard).join('') : ''}` : ''}`}`
    };
  }
  function monthView(sorted) {
    const base = S.calMonth ? new Date(S.calMonth) : new Date(); base.setDate(1); base.setHours(0, 0, 0, 0);
    const y = base.getFullYear(), mo = base.getMonth();
    const first = (base.getDay() + 6) % 7; // Monday first
    const days = new Date(y, mo + 1, 0).getDate();
    const key = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const byDay = {}; sorted.forEach((e) => { const k = key(new Date(e.start)); (byDay[k] = byDay[k] || []).push(e); });
    const todayK = key(new Date());
    const wd = Array.from({ length: 7 }, (_, i) => F_.shortDay.format(new Date(2024, 0, 1 + i)));
    let cells = '';
    for (let i = 0; i < first; i++) cells += '<span class="cd empty"></span>';
    for (let d = 1; d <= days; d++) {
      const k = `${y}-${mo}-${d}`; const evs = byDay[k] || [];
      const dots = evs.slice(0, 3).map((e) => { const st = myStatus(e).k; return `<i class="dt ${e.cancelled ? 'c' : st === 'yes' ? 'y' : st === 'no' ? 'n' : st === 'wait' ? 'w' : 'o'}"></i>`; }).join('');
      cells += `<button class="cd ${k === todayK ? 'today' : ''} ${S.calDay === k ? 'sel' : ''} ${evs.length ? 'has' : ''}" data-a="cal-day" data-k="${k}"><span>${d}</span><span class="dots">${dots}</span></button>`;
    }
    const sel = S.calDay && byDay[S.calDay] ? byDay[S.calDay] : null;
    return `<div class="card cal"><div class="cal-h"><button class="x" data-a="cal-move" data-d="-1" aria-label="‹">‹</button><b>${esc(F_.month.format(base))}</b><button class="x" data-a="cal-move" data-d="1" aria-label="›">›</button></div>
      <div class="cal-g">${wd.map((w) => `<span class="cw">${esc(w)}</span>`).join('')}${cells}</div>
      <div class="cal-legend small muted"><span><i class="dt y"></i>${t('st.yes')}</span><span><i class="dt o"></i>${t('st.open')}</span><span><i class="dt n"></i>${t('st.no')}</span><span><i class="dt c"></i>${t('cal.cancelled')}</span></div></div>
      ${sel ? sel.map(evCard).join('') : `<p class="center-text small muted">${t('cal.tapDay')}</p>`}`;
  }
  const chips = (ids, cls = '', withPos) => (ids.length ? ids.map((id) => `<span class="chip ${cls}">${esc(nameOf(id))}${withPos ? posTag(posOf(id)) : ''}</span>`).join('') : '<span class="muted small">–</span>');
  function posSummary(ids) {
    const c = {}; ids.forEach((id) => { const p = posOf(id)[0] || '?'; c[p] = (c[p] || 0) + 1; });
    const parts = POS.filter((p) => c[p]).map((p) => `${t('pos.s.' + p)} ${c[p]}`);
    return parts.length ? `<div class="small muted possum">🏐 ${parts.join(' · ')}${c['?'] ? ' · ? ' + c['?'] : ''}</div>` : '';
  }
  function guestChips(list, cls) {
    return list.map((g) => `<span class="chip ${cls} guest">${esc(g.name)}${g.trial ? ' 🆕' : ''} <small>(${t('guest.of', { name: nameOf(g.host) })})</small>${g.host === uid() || isTrainer() ? `<button class="chip-x" data-a="guest-del" data-id="${g.evId}" data-h="${g.host}" data-i="${g.i}" aria-label="${t('remove')}">✕</button>` : ''}</span>`).join('');
  }
  function reactBar(path, obj) {
    const r = obj.react || {}; const mine = r[uid()];
    const counts = {}; Object.values(r).forEach((e) => { counts[e] = (counts[e] || 0) + 1; });
    return `<div class="react">${REACTIONS.map((e) => `<button class="rx ${mine === e ? 'on' : ''}" data-a="react" data-p="${path}" data-e="${e}" title="${esc(Object.keys(r).filter((k) => r[k] === e).map(nameOf).join(', '))}">${e}${counts[e] ? `<b>${counts[e]}</b>` : ''}</button>`).join('')}</div>`;
  }
  function commentsBlock(target, open) {
    const list = commentsFor(target).sort((a, b) => a.ts - b.ts);
    const nc = newComments(target);
    const head = `<button class="link sm cm-toggle" data-a="cm-toggle" data-t="${target}">💬 ${t('cm.count', { n: list.length })}${nc ? ` <span class="tag blue">${t('unread.new', { n: nc })}</span>` : ''} ${open ? '▲' : '▼'}</button>`;
    if (!open) return `<div class="cm">${head}</div>`;
    return `<div class="cm open">${head}
      ${list.map((c) => `<div class="cmi"><div class="cmh"><b>${esc(c.authorName || nameOf(c.author))}</b><span class="muted small">${rel(c.ts)}</span>${c.author === uid() || isTrainer() ? `<button class="chip-x" data-a="cm-del" data-id="${c.id}" aria-label="${t('delete')}">✕</button>` : ''}</div><div>${linkify(c.text)}</div></div>`).join('')}
      <form class="cmf" data-f="comment" data-t="${target}"><input name="text" data-keep maxlength="500" required placeholder="${t('cm.ph')}" autocomplete="off"><button class="btn sm">${t('cm.send')}</button></form></div>`;
  }
  function feedbackCard(ev) {
    const d = useDoc('feedback/' + fbId(ev.id));
    if (d === undefined) return '';
    if (d || store.get('vb-fb-' + ev.id)) return `<div class="card fbdone">✅ ${t('fb.thanks')}${d ? ' ' + '★'.repeat(d.stars) : ''}</div>`;
    return `<form class="card fbcard" data-f="feedback" data-id="${ev.id}"><h3>${t('fb.title')}</h3>
      <div class="stars">${[1, 2, 3, 4, 5].map((n) => `<label><input type="radio" name="stars" value="${n}" required><span>★</span></label>`).join('')}</div>
      <label>${t('fb.text')}<textarea name="text" rows="2" maxlength="500" placeholder="${t('fb.ph')}"></textarea></label>
      <label class="check"><input type="checkbox" name="anon" checked> ${t('fb.anon')}</label>
      <button class="btn block">${t('fb.send')}</button></form>`;
  }
  function feedbackSummary(ev) {
    const list = S.feedback.filter((f) => f.event === ev.id);
    if (!list.length) return `<p class="muted small">${t('fb.none')}</p>`;
    const avg = list.reduce((s, f) => s + (Number(f.stars) || 0), 0) / list.length;
    return `<div class="fbsum"><b>${'★'.repeat(Math.round(avg))}${'☆'.repeat(5 - Math.round(avg))}</b> ${avg.toFixed(1)} · ${t('fb.count', { n: list.length })}</div>
      ${list.filter((f) => f.text).map((f) => `<div class="cmi"><div class="cmh"><b>${f.anon ? t('fb.anonName') : esc(f.name || nameOf(f.by))}</b><span>${'★'.repeat(f.stars)}</span></div><div>${nl2br(f.text)}</div></div>`).join('')}`;
  }
  function viewTermin(id) {
    const ev = S.events.find((e) => e.id === id);
    if (!ev) return { title: t('ev.session'), back: '#/termine', html: `<div class="empty">${t('ev.notFound')}</div>` };
    const l = rsvpLists(ev); const st = myStatus(ev); const now = Date.now();
    const past = (ev.end || ev.start) < now; const started = ev.start < now;
    const vids = Object.fromEntries(S.videos.map((v) => [v.id, v]));
    const plan = (ev.plan || []).filter((p) => p.text || p.video);
    const ics = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(icsFor(ev));
    const attended = Object.keys(ev.attended || {}).filter((k) => ev.attended[k]);
    const gIn = l.guestsIn.map((g) => ({ ...g, evId: ev.id })); const gWait = l.guestsWait.map((g) => ({ ...g, evId: ev.id }));
    const min = Number(ev.minPlayers) || 0;
    let html = `<div class="card">
      ${ev.cancelled ? `<div class="alert red">${t('ev.cancelled')}</div>` : ''}
      <h2 class="ev-h">${esc(ev.title)}</h2>
      <div class="info"><span>📅</span><div>${esc(F_.long.format(ev.start))}<br><b>${timeRange(ev)}</b></div></div>
      ${ev.place ? `<div class="info"><span>📍</span><div><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.place)}" target="_blank" rel="noopener">${esc(ev.place)}</a></div></div>` : ''}
      ${ev.notes ? `<div class="info"><span>📝</span><div>${linkify(ev.notes)}</div></div>` : ''}
      ${l.lim ? `<div class="info"><span>👥</span><div>${t('ev.places', { n: l.lim, free: Math.max(0, l.lim - l.total) })}</div></div>` : ''}
      ${!past && !ev.cancelled ? `<div class="rsvp-big">${rsvpButtons(ev, st, true)}</div>
        <p class="center-text small">${t('ev.yourStatus')} <b class="st-t st-${st.k}">${st.label}</b>${st.k === 'wait' ? t('ev.waitExplain') : ''}</p>` : ''}
      ${reactBar('events/' + ev.id, ev)}
    </div>`;
    if (past && !ev.cancelled && ev.fb !== false && l.confirmed.includes(uid()) && (ev.end || ev.start) > now - 7 * 864e5) html += feedbackCard(ev);
    html += `<div class="card"><h3>${t('ev.participants')}</h3>
      <div class="grp"><div class="gl">${t('ev.confirmed', { n: l.total + (l.lim ? '/' + l.lim : '') })}</div>${chips(l.confirmed, 'ok', true)}${guestChips(gIn, 'ok')}${posSummary(l.confirmed)}</div>
      ${l.waitTotal ? `<div class="grp"><div class="gl">${t('ev.waitlist', { n: l.waitTotal })}</div>${l.waitlist.map((x, i) => `<span class="chip wait">${i + 1}. ${esc(nameOf(x))}</span>`).join('')}${guestChips(gWait, 'wait')}</div>` : ''}
      <div class="grp"><div class="gl">${t('ev.declined', { n: l.no.length })}</div>${chips(l.no, 'no')}</div>
      ${!past ? `<div class="grp"><div class="gl">${t('ev.noReply', { n: l.open.length })}</div>${chips(l.open)}</div>` : ''}
      ${!past && l.away.length ? `<div class="grp"><div class="gl">${t('away.group', { n: l.away.length })}</div>${chips(l.away, 'away')}</div>` : ''}
      ${ev.attendanceDone ? `<div class="grp"><div class="gl">${t('ev.attended', { n: attended.length })}</div>${chips(attended, 'ok')}</div>` : ''}
      ${!past && !ev.cancelled ? `<a class="btn sm ghost" href="#/gast/${ev.id}">${t('guest.add')}</a>` : ''}
    </div>`;
    const teams = ev.teams && ev.teams.n ? ev.teams : null;
    if (teams || (isTrainer() && !past && !ev.cancelled)) {
      html += `<div class="card"><h3>${t('teams.title')}</h3>${teams ? teamsHtml(Array.from({ length: teams.n }, (_, i) => teams['t' + i] || []), false) : `<p class="muted small">${t('teams.none')}</p>`}
        <div class="row wrap-row">${isTrainer() ? `<a class="btn sm ghost" href="#/teams/${ev.id}">${teams ? t('teams.redo') : t('teams.draw')}</a>` : ''}
        ${S.tournaments.filter((x) => x.ev === ev.id).map((x) => `<a class="btn sm" href="#/turnier/${x.id}">🏆 ${esc(x.name)}</a>`).join('')}
        ${isTrainer() && teams && !S.tournaments.some((x) => x.ev === ev.id) ? `<a class="btn sm ghost" href="#/turnier-neu/${ev.id}">🏆 ${t('tour.fromTeams')}</a>` : ''}</div></div>`;
    }
    if (plan.length) {
      html += `<div class="card"><h3>${t('ev.planT')}</h3><ol class="plan">${plan.map((p) => {
        const v = p.video && vids[p.video];
        return `<li><span>${esc(p.text || (v ? v.title : ''))}</span>${v ? `<button class="btn sm ghost" data-a="play" data-id="${v.id}">${t('ev.video')}</button>` : ''}</li>`;
      }).join('')}</ol></div>`;
    }
    if (ev.carpool) html += carpoolCard(ev, past);
    html += `<div class="card">${commentsBlock('events/' + ev.id, true)}</div>`;
    html += `<div class="card"><h3>${t('ev.cal')}</h3><div class="row wrap-row">
      <a class="btn ghost sm" href="${ics}" download="${esc(ev.title.replace(/[^\p{L}\p{N}-]+/gu, '_'))}.ics">${t('ev.ics')}</a>
      <a class="btn ghost sm" href="${gcalUrl(ev)}" target="_blank" rel="noopener">${t('ev.gcal')}</a>
      <a class="btn ghost sm" href="#/kalender-abo">${t('abo.short')}</a></div></div>`;
    if (isTrainer()) {
      html += `<div class="card"><h3>${t('ev.coach')}</h3>
        ${min && !past && !ev.cancelled ? `<div class="alert ${l.total < min ? 'warnbox' : 'ok'}">${l.total < min ? t('min.low', { n: l.total, min }) : t('min.ok', { n: l.total, min })}</div>` : ''}
        <div class="row wrap-row">
        <a class="btn sm ghost" href="#/termin-edit/${ev.id}">${t('ev.edit')}</a>
        ${!past && !ev.cancelled ? `<button class="btn sm ghost" data-a="remind" data-id="${ev.id}">${t('ev.remind', { n: l.open.length })}</button>` : ''}
        ${started ? `<a class="btn sm ghost" href="#/anwesenheit/${ev.id}">${t('ev.attendance')}</a>` : ''}
        ${!past ? `<button class="btn sm ghost" data-a="cancel-ev" data-id="${ev.id}">${ev.cancelled ? t('ev.reactivate') : t('ev.cancel')}</button>` : ''}
        <button class="btn sm danger" data-a="del-ev" data-id="${ev.id}">${t('ev.delete')}</button></div>
        ${!past ? `<p class="muted small">${t('ev.autoRemind')}${min ? ' ' + t('min.auto', { h: ev.minHours || 4 }) : ''}</p>` : ''}
        ${started && ev.fb !== false ? `<h4>${t('fb.summary')}</h4>${feedbackSummary(ev)}` : ''}</div>`;
    }
    return { title: ev.title, back: '#/termine', html };
  }
  // ---------- Guests
  function viewGast(id) {
    const ev = S.events.find((e) => e.id === id);
    return { title: t('guest.title'), back: '#/termin/' + id, html: ev ? `<form class="card" data-f="guest" data-id="${id}">
      <p class="muted">${esc(ev.title)} · ${esc(whenTxt(ev.start))}</p>
      <label>${t('guest.name')}<input name="name" required maxlength="40" placeholder="${t('guest.namePh')}"></label>
      <label class="check"><input type="checkbox" name="trial"> ${t('guest.trial')}</label>
      <label>${t('gskill.q')}</label><div class="stars">${[1, 2, 3, 4, 5].map((n) => `<label title="${t('gskill.l' + n)}"><input type="radio" name="gs" value="${n}" ${n === 3 ? 'checked' : ''}><span>★</span></label>`).join('')}</div>
      <p class="small muted">${t('gskill.scale')}</p>
      <p class="small muted">${t('guest.hint')}</p>
      <button class="btn block">${t('guest.save')}</button></form>` : `<div class="empty">${t('ev.notFound')}</div>` };
  }
  // ---------- Teams
  const guestKey = (name) => 'g~' + String(name || '').trim().toLowerCase().slice(0, 40);
  const guestSkill = (g) => Number(S.skills[guestKey(g.name)]) || g.s || (g.trial ? 2 : 3);
  function playerPool(ev) {
    const l = rsvpLists(ev);
    return l.confirmed.map((k) => ({ k, name: nameOf(k), s: Number(S.skills[k]) || 3, r: posOf(k)[0] || '' })).concat(l.guestsIn.map((g) => ({ k: g.k, name: g.name + ' (G)', s: guestSkill(g), r: '', gk: guestKey(g.name), gs: g.s || (g.trial ? 2 : 3) })));
  }
  // Setters (and other positions) are spread first; swaps only between players of the same position
  const ROLE_ORDER = ['S', 'L', 'MB', 'OPP', 'OH', ''];
  function drawTeams(pool, n) {
    const arr = pool.map((p) => ({ ...p, r: p.r || '', rnd: Math.random() })).sort((a, b) => ROLE_ORDER.indexOf(a.r) - ROLE_ORDER.indexOf(b.r) || b.s - a.s || a.rnd - b.rnd);
    const teams = Array.from({ length: n }, () => []);
    arr.forEach((p, i) => { const round = Math.floor(i / n); const pos = i % n; teams[round % 2 ? n - 1 - pos : pos].push(p); });
    const sum = (tm) => tm.reduce((s, p) => s + p.s, 0);
    for (let it = 0; it < 200; it++) { // small swaps to even out strength
      const a = Math.floor(Math.random() * n), b = Math.floor(Math.random() * n); if (a === b || !teams[a].length || !teams[b].length) continue;
      const i = Math.floor(Math.random() * teams[a].length), j = Math.floor(Math.random() * teams[b].length);
      if (teams[a][i].r !== teams[b][j].r) continue;
      const before = Math.abs(sum(teams[a]) - sum(teams[b]));
      const after = Math.abs(sum(teams[a]) - teams[a][i].s + teams[b][j].s - (sum(teams[b]) - teams[b][j].s + teams[a][i].s));
      if (after < before) { const x = teams[a][i]; teams[a][i] = teams[b][j]; teams[b][j] = x; }
    }
    return teams;
  }
  const TEAM_COLORS = ['#1756c9', '#d64545', '#14a05a', '#c27c00'];
  function teamsHtml(teams, showSkill) {
    return `<div class="teams">${teams.map((tm, i) => {
      const players = tm.map((p) => (typeof p === 'string' ? { k: p, name: p.startsWith('g:') ? (guestName(p) || '?') + ' (G)' : nameOf(p), s: p.startsWith('g:') ? guestSkillByKey(p) : Number(S.skills[p]) || 3 } : p));
      return `<div class="team" style="--tc:${TEAM_COLORS[i % 4]}"><b>${t('teams.team', { n: i + 1 })}${showSkill ? ` <small>★ ${players.reduce((s, p) => s + p.s, 0)}</small>` : ''}</b>${players.map((p) => `<span>${esc(p.name)}${p.k && !p.k.startsWith('g:') ? posTag(posOf(p.k)) : ''}${showSkill ? ` <small>${'★'.repeat(p.s)}</small>` : ''}</span>`).join('')}</div>`;
    }).join('')}</div>`;
  }
  function guestSkillByKey(k) { const [, host, i] = k.split(':'); for (const e of S.events) { const g = ((e.guests || {})[host] || [])[Number(i)]; if (g) return guestSkill({ name: g.n, s: Number(g.s) || 0, trial: !!g.trial }); } return 3; }
  function guestName(k) { const [, host, i] = k.split(':'); for (const e of S.events) { const g = ((e.guests || {})[host] || [])[Number(i)]; if (g) return g.n; } return ''; }
  function viewTeams(id) {
    const ev = S.events.find((e) => e.id === id);
    if (!ev || !isTrainer()) return { title: t('teams.title'), back: '#/termin/' + id, html: `<div class="empty">${t('att.na')}</div>` };
    const pool = playerPool(ev);
    const d = S.teamDraft && S.teamDraft.ev === id ? S.teamDraft : null;
    const n = d ? d.n : Math.min(4, Math.max(2, Math.round(pool.length / 6) || 2));
    return {
      title: t('teams.title'), back: '#/termin/' + id,
      html: `<div class="card"><p class="muted">${esc(ev.title)} · ${esc(whenTxt(ev.start))} · ${t('teams.players', { n: pool.length })}</p>
        <div class="seg">${[2, 3, 4].map((k) => `<button class="${n === k ? 'on' : ''}" data-a="teams-n" data-id="${id}" data-n="${k}">${t('teams.nTeams', { n: k })}</button>`).join('')}</div>
        <div class="row wrap-row"><button class="btn" data-a="teams-draw" data-id="${id}" data-n="${n}">🎲 ${d ? t('teams.again') : t('teams.draw')}</button>${d ? `<button class="btn ghost" data-a="teams-save" data-id="${id}">💾 ${t('teams.save')}</button>` : ''}</div>
        ${d ? teamsHtml(d.teams, true) : ''}
        <p class="small muted">${t('teams.skillHint')}</p></div>
        <div class="card"><h3>${t('teams.skills')}</h3>${pool.filter((p) => !p.k.startsWith('g:')).map((p) => `<div class="skrow"><span>${esc(p.name)}</span>${skillSelect(p.k)}</div>`).join('') || `<p class="muted">${t('teams.noPlayers')}</p>`}
          ${pool.some((p) => p.gk) ? `<h4>${t('gskill.title')}</h4><p class="small muted">${t('gskill.hint')}</p>${pool.filter((p) => p.gk).map((p) => `<div class="skrow"><span>${esc(p.name)}</span>${skillSelect(p.gk, p.gs)}</div>`).join('')}` : ''}</div>`
    };
  }
  const skillSelect = (k, def = 3) => `<span class="skill">${[1, 2, 3, 4, 5].map((n) => `<button class="${(Number(S.skills[k]) || def) >= n ? 'on' : ''}" data-a="skill" data-u="${k}" data-n="${n}" aria-label="${n}">★</button>`).join('')}</span>`;
  function carpoolCard(ev, past) {
    const rides = ev.rides || {}; const me = uid(); const mine = rides[me];
    const drivers = Object.entries(rides).filter(([, r]) => r.type === 'fahrer');
    const pass = (d) => Object.entries(rides).filter(([, r]) => r.type === 'mit' && r.driver === d).map(([k]) => k);
    const seekers = Object.entries(rides).filter(([, r]) => r.type === 'sucht' || (r.type === 'mit' && !(rides[r.driver] && rides[r.driver].type === 'fahrer'))).map(([k]) => k);
    let h = `<div class="card"><h3>${t('cp.title')}</h3>`;
    h += drivers.length ? drivers.map(([d, r]) => {
      const p = pass(d); const free = (Number(r.seats) || 0) - p.length;
      const canJoin = !past && free > 0 && d !== me && !(mine && mine.type === 'mit' && mine.driver === d) && !(mine && mine.type === 'fahrer');
      return `<div class="ride"><div>${t('cp.drives', { name: nameOf(d) })}${r.from ? t('cp.from', { from: r.from }) : ''}<br><span class="small muted">${free > 0 ? t('cp.free', { n: free }) : t('cp.full')}${p.length ? t('cp.with', { names: p.map(nameOf).join(', ') }) : ''}</span></div>
        ${canJoin ? `<button class="btn sm" data-a="ride-join" data-id="${ev.id}" data-d="${d}">${t('cp.join')}</button>` : ''}</div>`;
    }).join('') : `<p class="muted small">${t('cp.none')}</p>`;
    if (seekers.length) h += `<div class="grp"><div class="gl">${t('cp.seekers')}</div>${chips(seekers)}</div>`;
    if (!past) {
      h += '<div class="row wrap-row">';
      if (!mine) h += `<a class="btn sm" href="#/fahrt/${ev.id}">${t('cp.iDrive')}</a><button class="btn sm ghost" data-a="ride-seek" data-id="${ev.id}">${t('cp.iSeek')}</button>`;
      else h += `<button class="btn sm ghost" data-a="ride-leave" data-id="${ev.id}">${mine.type === 'fahrer' ? t('cp.withdraw') : mine.type === 'mit' ? t('cp.leave') : t('cp.stopSeek')}</button>`;
      h += '</div>';
    }
    return h + '</div>';
  }
  function viewFahrt(id) {
    const ev = S.events.find((e) => e.id === id);
    return { title: t('cp.offerT'), back: '#/termin/' + id, html: ev ? `<form class="card" data-f="ride-offer" data-id="${id}">
      <p class="muted">${esc(ev.title)} · ${esc(whenTxt(ev.start))}</p>
      <label>${t('cp.seats')}<select name="seats">${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<option ${n === 3 ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label>${t('cp.meet')}<input name="from" maxlength="80" placeholder="${t('cp.meetPh')}"></label>
      <button class="btn block">${t('cp.save')}</button></form>` : `<div class="empty">${t('ev.notFound')}</div>` };
  }
  function viewTerminForm(id) {
    const ev = id ? S.events.find((e) => e.id === id) : null;
    if (id && !ev) return { title: t('ev.session'), back: '#/termine', html: `<div class="empty">${t('ev.notFound')}</div>` };
    if (!isTrainer()) return { title: t('ev.session'), back: '#/termine', html: `<div class="empty">${t('evf.onlyCoach')}</div>` };
    const last = [...S.events].sort((a, b) => b.created - a.created)[0];
    const d = ev || { title: t('evf.defaultTitle'), start: nextSlot(last), end: 0, place: last ? last.place : '', limit: last ? last.limit : 0, notes: '', plan: [], carpool: false, minPlayers: last ? last.minPlayers || 0 : 0, minHours: last ? last.minHours || 4 : 4, fb: true };
    if (!d.end) d.end = d.start + 2 * 3600e3;
    const plan = d.plan && d.plan.length ? d.plan : [{ text: '', video: '' }];
    return {
      title: ev ? t('evf.edit') : t('evf.new'), back: ev ? '#/termin/' + ev.id : '#/termine',
      html: `<form class="card" data-f="event" data-id="${ev ? ev.id : ''}">
        <label>${t('evf.title')}<input name="title" required maxlength="60" value="${esc(d.title)}" list="titles"></label>
        <datalist id="titles">${t('evf.titles').map((x) => `<option>${esc(x)}</option>`).join('')}</datalist>
        <div class="grid3 dates"><label>${t('evf.date')}<input name="date" type="date" required value="${toDateInput(d.start)}"></label>
        <label>${t('evf.from')}<input name="from" type="time" required value="${toTimeInput(d.start)}"></label>
        <label>${t('evf.to')}<input name="to" type="time" value="${toTimeInput(d.end)}"></label></div>
        <label>${t('evf.place')}<input name="place" maxlength="100" value="${esc(d.place)}" placeholder="${t('evf.placePh')}"></label>
        <label>${t('evf.limit')} <span class="muted small">${t('evf.limitHint')}</span><input name="limit" type="number" min="0" max="200" value="${Number(d.limit) || 0}"></label>
        <label>${t('evf.notes')}<textarea name="notes" rows="3" maxlength="1000">${esc(d.notes)}</textarea></label>
        <fieldset><legend>${t('evf.plan')}</legend><div id="plan">${plan.map(planRow).join('')}</div>
          <button type="button" class="btn sm ghost" data-a="plan-add">${t('evf.addEx')}</button></fieldset>
        <label class="check"><input type="checkbox" name="carpool" ${d.carpool ? 'checked' : ''}> ${t('evf.carpool')}</label>
        <fieldset><legend>${t('min.legend')}</legend><div class="grid3"><label class="span2">${t('min.players')} <span class="muted small">${t('min.hint')}</span><input name="minPlayers" type="number" min="0" max="100" value="${Number(d.minPlayers) || 0}"></label>
          <label>${t('min.check')}<select name="minHours">${[2, 3, 4, 6, 12, 24].map((h) => `<option value="${h}" ${(Number(d.minHours) || 4) === h ? 'selected' : ''}>${t('min.hBefore', { h })}</option>`).join('')}</select></label></div></fieldset>
        <label class="check"><input type="checkbox" name="fb" ${d.fb === false ? '' : 'checked'}> ${t('fb.formOpt')}</label>
        ${!ev ? `<label>${t('evf.repeat')}<select name="repeat"><option value="1">${t('evf.once')}</option>${[2, 4, 6, 8, 10, 12, 16, 20].map((n) => `<option value="${n}">${t('evf.weekly', { n })}</option>`).join('')}</select></label>` : ''}
        <label class="check"><input type="checkbox" name="notify" ${ev ? '' : 'checked'}> ${t('evf.notify')}</label>
        <button class="btn block">${ev ? t('evf.save') : t('evf.create')}</button>
      </form>`
    };
  }
  function nextSlot(last) {
    const d = new Date();
    if (last) { const l = new Date(last.start); d.setHours(l.getHours(), l.getMinutes(), 0, 0); while (d.getDay() !== l.getDay() || d < new Date()) d.setDate(d.getDate() + 1); }
    else { d.setDate(d.getDate() + 1); d.setHours(19, 0, 0, 0); }
    return d.getTime();
  }
  function planRow(p) {
    const opts = [...S.videos].sort((a, b) => (a.title || '').localeCompare(b.title || '')).map((v) => `<option value="${v.id}" ${p.video === v.id ? 'selected' : ''}>${esc(v.title)}</option>`).join('');
    return `<div class="plan-row"><input name="ptext" maxlength="120" placeholder="${t('evf.exPh')}" value="${esc(p.text)}">
      <select name="pvideo"><option value="">${t('evf.noVideo')}</option>${opts}</select><button type="button" class="x" data-a="plan-del" aria-label="${t('remove')}">✕</button></div>`;
  }
  function viewAnwesenheit(id) {
    const ev = S.events.find((e) => e.id === id);
    if (!ev || !isTrainer()) return { title: t('att.title'), back: '#/termine', html: `<div class="empty">${t('att.na')}</div>` };
    const pre = ev.attendanceDone ? (ev.attended || {}) : Object.fromEntries(rsvpLists(ev).confirmed.map((k) => [k, true]));
    return {
      title: t('att.title'), back: '#/termin/' + id,
      html: `<form class="card" data-f="attendance" data-id="${id}"><p class="muted">${esc(ev.title)} · ${esc(whenTxt(ev.start))}<br>${t('att.hint')}</p>
        ${activeMembers().map((m) => `<label class="check line"><input type="checkbox" name="a" value="${m.id}" ${pre[m.id] ? 'checked' : ''}> ${esc(m.name)}</label>`).join('')}
        <button class="btn block">${t('evf.save')}</button></form>`
    };
  }

  // ---------------------------------------------------------- News & messages
  function viewNews() {
    const list = [...S.posts].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.ts - a.ts);
    const act = activeMembers();
    return {
      title: t('news.title'), action: `<a class="btn sm" href="#/nachricht">${t('news.write')}</a>`,
      html: list.length ? list.map((p) => {
        const target = 'posts/' + p.id; const isNew = p.author !== uid() && p.ts > PREV.news;
        const reads = p.reads || {}; const others = act.filter((m) => m.id !== p.author);
        const readN = others.filter((m) => reads[m.id]).length; const unread = others.filter((m) => !reads[m.id]);
        return `<div class="card post ${p.pinned ? 'pinned' : ''}" data-post="${p.id}">
          <div class="post-h"><span class="tag ${p.type === 'news' ? 'blue' : ''}">${p.pinned ? '📌 ' : ''}${p.type === 'news' ? t('news.info') : t('news.msg')}</span>${isNew ? `<span class="tag newt">${t('unread.newTag')}</span>` : ''}
          <span class="muted small">${esc(p.authorName || nameOf(p.author))} · ${rel(p.ts)}</span></div>
          ${p.title ? `<h3>${esc(p.title)}</h3>` : ''}<p>${linkify(p.text)}</p>
          ${reactBar(target, p)}
          ${(isTrainer() || p.author === uid()) && p.type === 'news' ? `<details class="reads"><summary>👁 ${t('read.count', { n: readN, total: others.length })}</summary>${unread.length ? `<div class="small muted">${t('read.missing')}: ${unread.map((m) => esc(m.name)).join(', ')}</div><button class="btn sm ghost" data-a="read-remind" data-id="${p.id}">🔔 ${t('read.remind', { n: unread.length })}</button>` : `<div class="small ok">${t('read.all')}</div>`}</details>` : ''}
          ${commentsBlock(target, S.openComments.has(target))}
          ${isTrainer() || p.author === uid() ? `<div class="row">${isTrainer() ? `<button class="link sm" data-a="pin" data-id="${p.id}">${p.pinned ? t('news.unpin') : t('news.pin')}</button>` : ''}<button class="link sm red" data-a="del-post" data-id="${p.id}">${t('delete')}</button></div>` : ''}
        </div>`;
      }).join('') : `<div class="empty">${t('news.none')}</div>`
    };
  }
  function viewNachricht() {
    const tr = isTrainer(); const toTrainer = route().id === 'trainer';
    return {
      title: t('msg.title'), back: toTrainer ? '#/mehr' : '#/news',
      html: `<form class="card" data-f="message">
        <fieldset><legend>${t('msg.to')}</legend>
          <label class="check line"><input type="radio" name="to" value="all" ${!toTrainer ? 'checked' : ''}> ${t('msg.all')} <span class="muted small">${t('msg.allHint')}</span></label>
          <label class="check line"><input type="radio" name="to" value="trainers" ${toTrainer ? 'checked' : ''}> ${t('msg.coaches')} <span class="muted small">${t('msg.coachesHint')}</span></label></fieldset>
        ${tr ? `<label>${t('msg.heading')}<input name="title" maxlength="80"></label><label class="check"><input type="checkbox" name="info" checked> ${t('msg.official')}</label><label class="check"><input type="checkbox" name="pin"> ${t('msg.pinIt')}</label>` : ''}
        <label>${t('msg.text')}<textarea name="text" rows="5" required maxlength="2000" placeholder="${tr ? t('msg.phCoach') : t('msg.phMember')}"></textarea></label>
        <label class="check"><input type="checkbox" name="push" checked> ${t('msg.push')}</label>
        <button class="btn block">${t('msg.send')}</button></form>`
    };
  }
  function viewPostfach() {
    if (!isTrainer()) return { title: t('more.inbox'), back: '#/mehr', html: '' };
    const list = [...S.inbox].sort((a, b) => b.ts - a.ts);
    return {
      title: t('inbox.title'), back: '#/mehr',
      html: list.length ? list.map((m) => `<div class="card post"><div class="post-h"><b>${esc(m.fromName || nameOf(m.from))}</b><span class="muted small">${rel(m.ts)}</span></div><p>${linkify(m.text)}</p><div class="row"><button class="link sm red" data-a="del-inbox" data-id="${m.id}">${t('inbox.done')}</button></div></div>`).join('') : `<div class="empty">${t('inbox.none')}</div>`
    };
  }

  // ---------------------------------------------------------- Polls
  function viewUmfragen() {
    const list = [...S.polls].sort((a, b) => (a.closed ? 1 : 0) - (b.closed ? 1 : 0) || b.ts - a.ts);
    return {
      title: t('poll.title'), action: isTrainer() ? `<a class="btn sm" href="#/umfrage-neu">${t('poll.add')}</a>` : '',
      html: list.length ? list.map((p) => {
        const votes = p.votes || {}; const total = Object.keys(votes).length; const mine = votes[uid()];
        return `<div class="card poll ${p.closed ? 'closed' : ''}"><div class="post-h"><span class="tag ${p.closed ? '' : 'blue'}">${p.closed ? t('poll.closed') : t('poll.open')}</span><span class="muted small">${t('poll.votes', { n: total })}</span></div>
          <h3>${esc(p.question)}</h3>
          ${(p.options || []).map((o, i) => {
            const voters = Object.keys(votes).filter((k) => votes[k] === i); const pct = total ? Math.round((voters.length / total) * 100) : 0;
            return `<button class="opt ${mine === i ? 'mine' : ''}" data-a="vote" data-id="${p.id}" data-i="${i}" ${p.closed ? 'disabled' : ''}>
              <span class="bar" style="width:${pct}%"></span><span class="ol">${mine === i ? '✔ ' : ''}${esc(o)}</span><span class="op">${voters.length} · ${pct}%</span></button>
              ${voters.length ? `<div class="voters small muted">${voters.map((v) => esc(nameOf(v))).join(', ')}</div>` : ''}`;
          }).join('')}
          ${isTrainer() ? `<div class="row"><button class="link sm" data-a="poll-close" data-id="${p.id}">${p.closed ? t('poll.reopen') : t('poll.close')}</button><button class="link sm red" data-a="poll-del" data-id="${p.id}">${t('delete')}</button></div>` : ''}
        </div>`;
      }).join('') : `<div class="empty">${t('poll.none')}</div>`
    };
  }
  function viewUmfrageForm() {
    return {
      title: t('pollf.title'), back: '#/umfragen',
      html: `<form class="card" data-f="poll"><label>${t('pollf.q')}<input name="q" required maxlength="140" placeholder="${t('pollf.qPh')}"></label>
        <label>${t('pollf.opts')} <span class="muted small">${t('pollf.optsHint')}</span><textarea name="opts" rows="5" required placeholder="${esc(t('pollf.optsPh')).replace(/\n/g, '&#10;')}"></textarea></label>
        <label class="check"><input type="checkbox" name="push" checked> ${t('pollf.push')}</label>
        <button class="btn block">${t('pollf.start')}</button></form>`
    };
  }

  // ---------------------------------------------------------- Videos
  const myHomework = () => S.homework.filter((h) => h.to === 'all' || (Array.isArray(h.to) && h.to.includes(uid())));
  const hwRecipients = (h) => (h.to === 'all' ? activeMembers().map((m) => m.id) : (h.to || []));
  function homeworkCards() {
    const vids = Object.fromEntries(S.videos.map((v) => [v.id, v]));
    let html = '';
    const mine = myHomework().filter((h) => vids[h.video]).sort((a, b) => (a.done && a.done[uid()] ? 1 : 0) - (b.done && b.done[uid()] ? 1 : 0) || b.ts - a.ts);
    if (mine.length) {
      html += `<h4 class="sec">📚 ${t('hw.mine')}</h4>` + mine.map((h) => {
        const v = vids[h.video]; const done = h.done && h.done[uid()];
        return `<div class="card hw ${done ? 'done' : ''}"><div class="hw-b"><b>${esc(v.title)}</b>${h.note ? `<div class="small">${esc(h.note)}</div>` : ''}${h.due ? `<div class="small muted">${t('hw.due', { date: F_.dm.format(new Date(h.due)) })}</div>` : ''}</div>
          <div class="row"><button class="btn sm ghost" data-a="play" data-id="${v.id}" data-hw="${h.id}">▶</button><button class="btn sm ${done ? 'on-yes' : ''}" data-a="hw-done" data-id="${h.id}">${done ? '✓ ' + t('hw.done') : t('hw.markDone')}</button></div></div>`;
      }).join('');
    }
    if (isTrainer() && S.homework.length) {
      html += `<details class="card"><summary><b>📋 ${t('hw.overview', { n: S.homework.length })}</b></summary>` + [...S.homework].sort((a, b) => b.ts - a.ts).map((h) => {
        const v = vids[h.video]; const rec = hwRecipients(h); const done = rec.filter((u) => h.done && h.done[u]);
        return `<div class="hwrow"><div><b>${esc(v ? v.title : '?')}</b><div class="small muted">${t('hw.progress', { n: done.length, total: rec.length })}${rec.length - done.length ? ' · ' + t('hw.open') + ': ' + rec.filter((u) => !(h.done && h.done[u])).map(nameOf).map(esc).join(', ') : ''}</div></div><button class="link sm red" data-a="hw-del" data-id="${h.id}">${t('delete')}</button></div>`;
      }).join('') + '</details>';
    }
    return html;
  }
  function viewVideos() {
    const cats = [...new Set(S.videos.map((v) => v.category).filter(Boolean))];
    const favN = (v) => Object.keys(v.fav || {}).filter((k) => v.fav[k]).length;
    const isFav = (v) => !!(v.fav && v.fav[uid()]);
    const vc = S.videoCat;
    const list = S.videos.filter((v) => (vc === '*' ? true : vc === '♥' ? isFav(v) : vc === '🔥' ? favN(v) > 0 : v.category === vc))
      .sort((a, b) => (vc === '🔥' ? favN(b) - favN(a) : 0) || b.ts - a.ts);
    const chip = (c, label) => `<button class="chip ${S.videoCat === c ? 'on' : ''}" data-a="vcat" data-c="${esc(c)}">${esc(label)}</button>`;
    return {
      title: t('vid.title'), action: isTrainer() ? `<a class="btn sm" href="#/video-neu">${t('vid.add')}</a>` : '',
      html: `${homeworkCards()}<div class="chips-row">${chip('*', t('vid.all'))}${chip('♥', '★ ' + t('fav.mine'))}${chip('🔥', '🔥 ' + t('fav.top'))}${cats.map((c) => chip(c, c)).join('')}</div>
        ${list.length ? `<div class="vgrid">${list.map((v) => {
          const y = ytId(v.url);
          return `<div class="vcard"><button class="thumb" data-a="play" data-id="${v.id}" aria-label="${t('vid.play')}">${y ? `<img loading="lazy" src="https://i.ytimg.com/vi/${y}/hqdefault.jpg" alt="">` : ''}<span class="play">▶</span></button>
            <div class="vbody"><button class="favbtn ${isFav(v) ? 'on' : ''}" data-a="fav" data-id="${v.id}" aria-label="${t('fav.toggle')}" title="${t('fav.toggle')}">${isFav(v) ? '★' : '☆'}${favN(v) ? `<b>${favN(v)}</b>` : ''}</button><span class="tag">${esc(v.category || t('vid.general'))}</span>${v.ts > PREV.videos && v.by !== uid() ? ` <span class="tag newt">${t('unread.newTag')}</span>` : ''}<h4>${esc(v.title)}</h4>${v.description ? `<p class="small muted">${esc(v.description)}</p>` : ''}
            ${isTrainer() ? `<div class="row wrap-row"><a class="link sm" href="#/aufgabe-neu/${v.id}">📚 ${t('hw.assign')}</a><a class="link sm" href="#/video-edit/${v.id}">${t('vid.edit')}</a><button class="link sm red" data-a="del-video" data-id="${v.id}">${t('delete')}</button></div>` : ''}</div></div>`;
        }).join('')}</div>` : `<div class="empty">${vc === '♥' ? t('fav.none') : t('vid.none')}</div>`}`
    };
  }
  function viewVideoForm(id) {
    const v = id ? S.videos.find((x) => x.id === id) : null;
    const cats = [...new Set([...t('vid.cats'), ...S.videos.map((x) => x.category).filter(Boolean)])];
    const d = v || { title: '', url: '', category: '', description: '' };
    return {
      title: v ? t('vidf.edit') : t('vidf.new'), back: '#/videos',
      html: `<div class="card hintbox"><h3>${t('vidf.howT')}</h3><ol class="small"><li>${t('vidf.s1')}</li><li>${t('vidf.s2')}</li><li>${t('vidf.s3')}</li></ol>
          <a class="btn sm ghost" href="https://studio.youtube.com" target="_blank" rel="noopener">${t('vidf.studio')}</a>
          <p class="small muted">${t('vidf.other')}</p></div>
        <form class="card" data-f="video" data-id="${v ? v.id : ''}">
          <label>${t('vidf.url')}<input name="url" type="url" required value="${esc(d.url)}" placeholder="https://youtu.be/…"></label>
          <label>${t('vidf.vtitle')}<input name="title" required maxlength="80" value="${esc(d.title)}"></label>
          <label>${t('vidf.cat')}<input name="category" list="vcats" maxlength="30" value="${esc(d.category)}" placeholder="${t('vidf.catPh')}"></label>
          <datalist id="vcats">${cats.map((c) => `<option>${esc(c)}</option>`).join('')}</datalist>
          <label>${t('vidf.desc')}<textarea name="description" rows="3" maxlength="500">${esc(d.description)}</textarea></label>
          ${!v ? `<label class="check"><input type="checkbox" name="push"> ${t('vidf.push')}</label>` : ''}
          <button class="btn block">${v ? t('vidf.save') : t('vidf.addBtn')}</button></form>`
    };
  }
  function viewAufgabeForm(vid) {
    if (!isTrainer()) return { title: t('hw.new'), back: '#/videos', html: '' };
    const vids = [...S.videos].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    return {
      title: t('hw.new'), back: '#/videos',
      html: `<form class="card" data-f="homework">
        <label>${t('hw.video')}<select name="video" required>${vids.map((v) => `<option value="${v.id}" ${v.id === vid ? 'selected' : ''}>${esc(v.title)}</option>`).join('')}</select></label>
        <label>${t('hw.note')}<input name="note" maxlength="140" placeholder="${t('hw.notePh')}"></label>
        <label>${t('hw.dueL')}<input name="due" type="date"></label>
        <fieldset><legend>${t('hw.to')}</legend>
          <label class="check line"><input type="radio" name="to" value="all" checked> ${t('msg.all')}</label>
          <label class="check line"><input type="radio" name="to" value="some"> ${t('hw.some')}</label>
          <div class="hw-people">${activeMembers().filter((m) => m.id !== uid()).map((m) => `<label class="check line"><input type="checkbox" name="who" value="${m.id}"> ${esc(m.name)}</label>`).join('')}</div></fieldset>
        <label class="check"><input type="checkbox" name="push" checked> ${t('msg.push')}</label>
        <button class="btn block">${t('hw.create')}</button></form>`
    };
  }
  function playVideo(id, hw) {
    const v = S.videos.find((x) => x.id === id); if (!v) return;
    const y = ytId(v.url);
    const h = hw ? S.homework.find((x) => x.id === hw) : null;
    const hwBtn = h && !(h.done && h.done[uid()]) ? `<button class="btn block" data-a="hw-done" data-id="${h.id}" data-close="1">✓ ${t('hw.markDone')}</button>` : '';
    if (!y && v.url) { window.open(v.url, '_blank', 'noopener'); return; }
    const m = document.createElement('div'); m.className = 'modal'; m.dataset.a = 'close-modal';
    m.innerHTML = `<div class="modal-box"><button class="x close" data-a="close-modal" aria-label="${t('close')}">✕</button>
      ${y ? `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${y}?autoplay=1&rel=0&playsinline=1&hl=${S.lang}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>` : `<div class="video ph-video">🏐<p>${t('demo.noVideo')}</p></div>`}
      <div class="pad"><h3>${esc(v.title)}</h3>${v.description ? `<p class="muted">${esc(v.description)}</p>` : ''}${hwBtn}</div></div>`;
    document.body.appendChild(m);
  }
  function langModal() {
    const m = document.createElement('div'); m.className = 'modal'; m.dataset.a = 'close-modal';
    m.innerHTML = `<div class="modal-box pad confirm"><h3>${t('lang.title')}</h3>${I.langs.map((l) => `<button class="langopt ${l.code === S.lang ? 'on' : ''}" data-a="lang-set" data-l="${l.code}"><span class="flag">${l.flag}</span><span>${l.name}</span>${l.code === S.lang ? '<span>✔</span>' : ''}</button>`).join('')}</div>`;
    document.body.appendChild(m);
  }

  // ---------------------------------------------------------- More
  function viewMehr() {
    const tr = isTrainer();
    const pend = S.members.filter((m) => m.status === 'pending').length;
    const perm = pushPerm();
    const pushTxt = DB.demo ? t('more.pushDemo') : perm === 'granted' ? t('more.pushOn') : perm === 'denied' ? t('more.pushBlocked') : perm === 'unsupported' ? (isIOS ? t('more.pushIos') : t('more.pushNo')) : t('more.pushOff');
    const item = (href, ic, label, sub = '', badge = 0, a = '') => `<a class="mitem" href="${href}" ${a ? `data-a="${a}"` : ''}><span class="mi">${ic}</span><span class="ml">${label}${sub ? `<small>${sub}</small>` : ''}</span>${badge ? `<i class="badge">${badge}</i>` : '<span class="chev">›</span>'}</a>`;
    const langName = (I.langs.find((l) => l.code === S.lang) || {}).name;
    return {
      title: t('more.title'),
      html: `<div class="card me"><div class="avatar">${esc((S.me.name || '?').slice(0, 1).toUpperCase())}</div><div><b>${esc(S.me.name)}</b><br><span class="muted small">${tr ? t('role.coach') : t('role.member')}</span></div><a class="link sm" href="#/profil">${t('more.change')}</a></div>
        <div class="menu">
          ${item('#/mehr', curFlag(), t('lang.label'), esc(langName), 0, 'lang-open')}
          ${item('#/push-prefs', '🔔', t('more.push'), pushTxt)}
          ${item('#/kalender-abo', '📆', t('abo.title'), t('abo.sub'))}
          ${item('#/ziele', '🎯', t('goal.title'), t('goal.sub'))}
          ${item('#/abwesend', '🏖️', t('away.title'), awayOf(S.me).some((a) => a.t >= Date.now()) ? t('away.subOn') : t('away.sub'))}
          ${item('#/turniere', '🏆', t('tour.title'), t('tour.sub'))}
          ${item('#/timer', '⏱️', t('timer.title'), t('timer.sub'))}
          ${item('#/regeln', '📖', t('rules.title'), t('rules.sub'))}
          ${item('#/quiz', '🔄', t('quiz.title'), t('quiz.sub'))}
          ${!isStandalone() ? item('#/install', '📲', t('more.install'), t('more.installSub')) : ''}
          ${item('#/nachricht/trainer', '✉️', t('more.toCoach'), t('more.toCoachSub'))}
          ${item('#/kasse', '💶', t('more.cash'), tr ? t('more.cashCoach') : t('more.cashMember'))}
          ${item('#/statistik', '📈', t('more.stats'))}
          ${item('#/mehr', '💬', t('more.invite'), t('more.inviteSub'), 0, 'invite')}
        </div>
        ${tr ? `<h4 class="sec">${t('more.coachArea')}</h4><div class="menu">
          ${item('#/mitglieder', '👥', t('more.members'), pend ? t('more.waiting', { n: pend }) : t('more.active', { n: activeMembers().length }), pend)}
          ${item('#/postfach', '📥', t('more.inbox'), t('more.inboxSub'), S.inbox.length)}
          ${item('#/design', '🎨', t('design.title'), t('design.sub'))}
        </div>` : ''}
        <div class="menu">${DB.demo ? item('#/mehr', '🔄', t('more.demoSwitch'), '', 0, 'demo-switch') + item('#/mehr', '♻️', t('demo.reset'), '', 0, 'demo-reset') : item('#/mehr', '🚪', t('logout'), '', 0, 'logout')}</div>
        <p class="center-text small muted">${esc(C.appName || 'Volleyball')} · ${t('publisher', { name: C.publisher || '' })}<br>${t('more.version', { v: '3.1' })}</p>`
    };
  }
  function viewProfil() {
    const mine = posOf(uid());
    return { title: t('profile.title'), back: '#/mehr', html: `<form class="card" data-f="profile"><label>${t('f.name')}<input name="name" required maxlength="40" value="${esc(S.me.name)}"></label>
      <fieldset><legend>${t('pos.legend')}</legend><p class="small muted">${t('pos.hint')}</p>
        <div class="posgrid">${POS.map((p) => `<label class="check line"><input type="checkbox" name="pos" value="${p}" ${mine.includes(p) ? 'checked' : ''}> <b>${t('pos.s.' + p)}</b> ${t('pos.' + p)}</label>`).join('')}</div></fieldset><button class="btn block">${t('evf.save')}</button></form>${S.user.email ? `<p class="muted small center-text">${t('profile.as', { email: S.user.email })}</p>` : ''}` };
  }
  function viewInstall() {
    const iosSteps = `<ol class="steps">${t('inst.ios')}</ol><p class="small muted">${t('inst.iosNote')}</p>`;
    const andSteps = `<ol class="steps">${t('inst.android')}</ol>`;
    return {
      title: t('inst.title'), back: S.user ? '#/mehr' : '#/',
      html: `${isStandalone() ? `<div class="alert ok">${t('inst.already')}</div>` : ''}
        ${S.installEvt ? `<button class="btn block" data-a="install">${t('inst.now')}</button>` : ''}
        <div class="card"><h3>${isIOS ? '🍏 iPhone' : '🤖 Android'}</h3>${isIOS ? iosSteps : andSteps}</div>
        <details class="card"><summary><b>${isIOS ? '🤖 Android' : '🍏 iPhone'}</b></summary>${isIOS ? andSteps : iosSteps}</details>
        <p class="small muted center-text">${t('inst.note')}</p>`
    };
  }

  // ---------- Calendar subscription
  function calUrl() { return S.cal && S.cal.key && C.pushUrl ? C.pushUrl.replace(/\/$/, '') + '/cal?k=' + encodeURIComponent(S.cal.key) : ''; }
  function viewKalenderAbo() {
    if (isTrainer() && !DB.demo && S.cal === null && C.pushUrl) { DB.set('settings/cal', { key: Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join(''), ts: Date.now() }, false).catch(() => { /* */ }); }
    const url = calUrl();
    let html = `<div class="card"><p>${t('abo.text')}</p>`;
    if (DB.demo) html += `<div class="alert warnbox">${t('abo.demo')}</div>`;
    else if (!C.pushUrl) html += `<div class="alert warnbox">${t('abo.noWorker')}</div>`;
    else if (!url) html += `<p class="muted">${isTrainer() ? t('loading') : t('abo.waitCoach')}</p>`;
    else {
      const webcal = url.replace(/^https:/, 'webcal:');
      html += `<div class="abo">
        <a class="btn block" href="${esc(webcal)}">🍏 ${t('abo.apple')}</a>
        <a class="btn block ghost" href="https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}" target="_blank" rel="noopener">🗓 ${t('abo.google')}</a>
        <button class="btn block ghost" data-a="copy-text" data-text="${esc(url)}">📋 ${t('abo.copy')}</button></div>
        <p class="small muted">${t('abo.note')}</p>`;
      if (isTrainer()) html += `<button class="link sm red" data-a="cal-newkey">${t('abo.newKey')}</button>`;
    }
    return { title: t('abo.title'), back: '#/mehr', html: html + '</div>' };
  }
  // ---------- Push preferences
  const PUSH_CATS = ['events', 'reminders', 'news', 'polls', 'videos', 'cash', 'coach'];
  function viewPushPrefs() {
    const p = S.prefs || {}; const off = new Set(p.off || []); const q = p.quiet || {};
    const perm = pushPerm();
    const hours = Array.from({ length: 24 }, (_, h) => h);
    return {
      title: t('pp.title'), back: '#/mehr',
      html: `<div class="card">${DB.demo ? `<p class="muted">${t('more.pushDemo')}</p>` : perm === 'granted' ? `<div class="alert ok">${t('more.pushOn')}</div>` : `<button class="btn block" data-a="push-on">${t('push.enable')}</button><p class="small muted">${perm === 'denied' ? t('more.pushBlocked') : isIOS && !isStandalone() ? t('push.bannerIos') : t('push.bannerTxt')}</p>`}</div>
        <form class="card" data-f="prefs"><h3>${t('pp.which')}</h3>
          ${PUSH_CATS.filter((c) => c !== 'coach' || isTrainer()).map((c) => `<label class="check line"><input type="checkbox" name="cat" value="${c}" ${off.has(c) ? '' : 'checked'}> <span>${t('pp.cat.' + c)}<br><small class="muted">${t('pp.sub.' + c)}</small></span></label>`).join('')}
          <p class="small muted">${t('pp.always')}</p>
          <h3>${t('pp.quiet')}</h3>
          <label class="check"><input type="checkbox" name="qon" ${q.on ? 'checked' : ''}> ${t('pp.quietOn')}</label>
          <div class="grid3"><label>${t('pp.from')}<select name="qfrom">${hours.map((h) => `<option value="${h}" ${(q.from ?? 22) === h ? 'selected' : ''}>${pad(h)}:00</option>`).join('')}</select></label>
          <label>${t('pp.to')}<select name="qto">${hours.map((h) => `<option value="${h}" ${(q.to ?? 7) === h ? 'selected' : ''}>${pad(h)}:00</option>`).join('')}</select></label></div>
          <p class="small muted">${t('pp.quietHint')}</p>
          <button class="btn block">${t('evf.save')}</button></form>`
    };
  }
  // ---------- Goals
  function viewZiele(who) {
    const other = who && who !== uid();
    const doc = other ? useDoc('goals/' + who) : S.goals;
    if (other && !isTrainer()) return { title: t('goal.title'), back: '#/mehr', html: '' };
    const list = (doc && doc.list) || [];
    const card = (g) => {
      const pct = g.target ? Math.min(100, Math.round(((Number(g.progress) || 0) / g.target) * 100)) : (g.done ? 100 : 0);
      return `<div class="card goal ${g.done ? 'done' : ''}"><div class="goal-h"><b>${g.done ? '✅ ' : '🎯 '}${esc(g.text)}</b>${!other ? `<button class="chip-x" data-a="goal-del" data-id="${g.id}" aria-label="${t('delete')}">✕</button>` : ''}</div>
        ${g.target ? `<div class="progress"><span style="width:${pct}%"></span></div><div class="goal-row"><span class="small">${Number(g.progress) || 0} / ${g.target}</span>${!other ? `<span class="row"><button class="btn sm ghost" data-a="goal-step" data-id="${g.id}" data-d="-1">−</button><button class="btn sm" data-a="goal-step" data-id="${g.id}" data-d="1">＋</button></span>` : ''}</div>` : ''}
        ${!other ? `<button class="link sm" data-a="goal-done" data-id="${g.id}">${g.done ? t('goal.reopen') : t('goal.markDone')}</button>` : ''}</div>`;
    };
    if (other) return { title: t('goal.of', { name: nameOf(who) }), back: '#/mitglieder', html: doc === undefined ? `<div class="empty">${t('goal.notShared')}</div>` : (list.length ? list.map(card).join('') : `<div class="empty">${t('goal.none')}</div>`) };
    return {
      title: t('goal.title'), back: '#/mehr',
      html: `<form class="card cmf goalf" data-f="goal"><input name="text" data-keep required maxlength="80" placeholder="${t('goal.ph')}" autocomplete="off"><input name="target" data-keep type="number" min="0" max="10000" placeholder="${t('goal.target')}"><button class="btn sm">＋</button></form>
        ${list.length ? [...list].sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0) || b.ts - a.ts).map(card).join('') : `<div class="empty">${t('goal.none')}<br><span class="small">${t('goal.example')}</span></div>`}
        <label class="check card"><input type="checkbox" data-a="goal-share" ${doc && doc.shared ? 'checked' : ''}> ${t('goal.share')}</label>`
    };
  }
  // ---------- Team design
  const PRESETS = [['#1756c9', '#ffb703'], ['#d62839', '#ffd166'], ['#2a9d8f', '#f4a261'], ['#6a4c93', '#ffca3a'], ['#111827', '#22c55e'], ['#e85d04', '#0f172a']];
  function viewDesign() {
    if (!isTrainer()) return { title: t('design.title'), back: '#/mehr', html: '' };
    const th = S.theme || {};
    return {
      title: t('design.title'), back: '#/mehr',
      html: `<form class="card" data-f="design">
        <label>${t('design.name')}<input name="name" maxlength="40" value="${esc(th.name || '')}" placeholder="${esc(C.groupName || 'Volleyball Group')}"></label>
        <div class="grid3"><label>${t('design.c1')}<input name="c1" type="color" value="${hexOk(th.c1) ? th.c1 : '#1756c9'}"></label><label>${t('design.c2')}<input name="c2" type="color" value="${hexOk(th.c2) ? th.c2 : '#ffb703'}"></label></div>
        <div class="presets">${PRESETS.map(([a, b]) => `<button type="button" class="preset" data-a="preset" data-c1="${a}" data-c2="${b}" style="--a:${a};--b:${b}" aria-label="${a}"></button>`).join('')}</div>
        <label>${t('design.logo')}<input name="logo" type="file" accept="image/*"></label>
        <input type="hidden" name="logoData" value="">
        <div class="logo-prev">${th.logo ? `<img src="${esc(th.logo)}" alt=""><button type="button" class="link sm red" data-a="logo-remove">${t('design.logoRemove')}</button>` : `<span class="muted small">${t('design.noLogo')}</span>`}</div>
        <p class="small muted">${t('design.hint')}</p>
        <div class="row"><button class="btn">${t('evf.save')}</button><button type="button" class="btn ghost" data-a="design-reset">${t('design.reset')}</button></div></form>`
    };
  }
  // ---------- Search
  function viewSuche() {
    return { title: t('search.title'), back: '#/termine', html: `<div class="card"><input id="q" data-keep type="search" placeholder="${t('search.ph')}" value="${esc(S.q)}" autocomplete="off"></div><div id="results">${searchResults()}</div>` };
  }
  function searchResults() {
    const q = S.q.trim().toLowerCase();
    if (q.length < 2) return `<p class="center-text muted small">${t('search.hint')}</p>`;
    const hit = (...xs) => xs.some((x) => String(x || '').toLowerCase().includes(q));
    const groups = [
      [t('tab.events'), S.events.filter((e) => hit(e.title, e.place, e.notes)).sort((a, b) => b.start - a.start).map((e) => [`#/termin/${e.id}`, e.title, whenTxt(e.start) + (e.place ? ' · ' + e.place : '')])],
      [t('tab.news'), S.posts.filter((p) => hit(p.title, p.text)).map((p) => ['#/news', p.title || p.text.slice(0, 60), (p.authorName || '') + ' · ' + rel(p.ts)])],
      [t('tab.polls'), S.polls.filter((p) => hit(p.question, ...(p.options || []))).map((p) => ['#/umfragen', p.question, ''])],
      [t('tab.videos'), S.videos.filter((v) => hit(v.title, v.category, v.description)).map((v) => ['#/videos', v.title, v.category || ''])],
      [t('search.people'), activeMembers().filter((m) => hit(m.name)).map((m) => [isTrainer() ? '#/mitglieder' : '#/mehr', m.name, m.role === 'trainer' ? t('mem.coach') : ''])],
      [t('search.comments'), S.comments.filter((c) => hit(c.text)).map((c) => [c.target.startsWith('events/') ? '#/termin/' + c.target.slice(7) : '#/news', c.text.slice(0, 70), (c.authorName || '') + ' · ' + rel(c.ts)])]
    ].filter(([, l]) => l.length);
    if (!groups.length) return `<div class="empty">${t('search.none')}</div>`;
    return groups.map(([g, l]) => `<h4 class="sec">${esc(g)} (${l.length})</h4><div class="menu">${l.slice(0, 20).map(([href, a, b]) => `<a class="mitem" href="${href}"><span class="ml">${esc(a)}${b ? `<small>${esc(b)}</small>` : ''}</span><span class="chev">›</span></a>`).join('')}</div>`).join('');
  }
  // ---------------------------------------------------------- v3: Away / holidays
  const dayStart = (v) => new Date(v + 'T00:00:00').getTime();
  const dayEnd = (v) => new Date(v + 'T23:59:59').getTime() + 999;
  function viewAbwesend() {
    const now = Date.now();
    const list = awayOf(S.me).map((a, i) => ({ ...a, i })).sort((a, b) => a.f - b.f);
    const fmt = (a) => (toDateInput(a.f) === toDateInput(a.t) ? F_.dm.format(a.f) : F_.dm.format(a.f) + ' – ' + F_.dm.format(a.t));
    return {
      title: t('away.title'), back: '#/mehr',
      html: `<form class="card" data-f="away"><p class="muted small">${t('away.text')}</p>
          <div class="grid3 dates"><label>${t('away.from')}<input name="f" type="date" required value="${toDateInput(now)}"></label><label>${t('away.to')}<input name="t" type="date" required value="${toDateInput(now + 7 * 864e5)}"></label></div>
          <label>${t('away.note')}<input name="note" maxlength="60" placeholder="${t('away.notePh')}"></label>
          <button class="btn block">${t('away.add')}</button></form>
        ${list.length ? list.map((a) => `<div class="card mrow ${a.t < now ? 'past' : ''}"><div><b>🏖️ ${esc(fmt(a))}</b>${a.f <= now && now <= a.t ? ` <span class="tag blue">${t('away.now')}</span>` : ''}${a.note ? `<div class="small muted">${esc(a.note)}</div>` : ''}</div>
          <button class="chip-x" data-a="away-del" data-i="${a.i}" aria-label="${t('delete')}">✕</button></div>`).join('') : `<div class="empty">${t('away.none')}</div>`}
        <p class="small muted center-text">${t('away.note2')}</p>`
    };
  }

  // ---------------------------------------------------------- v3: Rules & referee signals
  function viewRegeln() {
    const CT = self.CONTENT || { rules: {}, signals: {} };
    const tab = S.rulesTab;
    const data = (tab === 'signals' ? CT.signals : CT.rules);
    const list = data[S.lang] || data.en || [];
    return {
      title: t('rules.title'), back: '#/mehr',
      html: `<a class="card mitem" href="#/quiz"><span class="mi">🔄</span><span class="ml"><b>${t('quiz.title')}</b><small>${t('quiz.sub')}</small></span><span class="chev">›</span></a><div class="seg"><button class="${tab === 'rules' ? 'on' : ''}" data-a="rules-tab" data-v="rules">📖 ${t('rules.rules')}</button><button class="${tab === 'signals' ? 'on' : ''}" data-a="rules-tab" data-v="signals">🙋 ${t('rules.signals')}</button></div>
        ${list.map(([ic, h, txt]) => `<div class="card rule"><span class="ri">${ic}</span><div><b>${esc(h)}</b><p class="small">${esc(txt)}</p></div></div>`).join('')}
        <p class="small muted center-text">${t('rules.source')}</p>`
    };
  }

  // ---------------------------------------------------------- v3: Interval timer
  const TIMER_DEF = { work: 40, rest: 20, rounds: 8, sets: 1, setRest: 60, ex: '' };
  const TIMER_PRESETS = [['Tabata 20/10', { work: 20, rest: 10, rounds: 8, sets: 1, setRest: 60 }], ['30/30', { work: 30, rest: 30, rounds: 10, sets: 1, setRest: 60 }], ['45/15', { work: 45, rest: 15, rounds: 8, sets: 1, setRest: 60 }], ['Circuit 3×', { work: 40, rest: 20, rounds: 6, sets: 3, setRest: 90 }]];
  const TM = { ph: null, i: 0, left: 0, endAt: 0, run: false, iv: null, wake: null, ac: null, lastSec: -1 };
  function timerCfg() { let c = {}; try { c = JSON.parse(store.get('vb-timer') || '{}') || {}; } catch (e) { c = {}; } return { ...TIMER_DEF, ...c }; }
  const clampN = (v, a, b, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(b, Math.max(a, n)) : d; };
  function timerReadForm(f) {
    const e = f.elements;
    return { work: clampN(e.work.value, 5, 3600, 40), rest: clampN(e.rest.value, 0, 3600, 20), rounds: clampN(e.rounds.value, 1, 99, 8), sets: clampN(e.sets.value, 1, 20, 1), setRest: clampN(e.setRest.value, 0, 3600, 60), ex: e.ex.value.slice(0, 1000) };
  }
  function timerPhases(c) {
    const ex = c.ex.split('\n').map((x) => x.trim()).filter(Boolean);
    const exAt = (r) => (ex.length ? ex[r % ex.length] : '');
    const ph = [{ k: 'prep', d: 5, next: exAt(0) }];
    for (let s = 0; s < c.sets; s++) {
      for (let r = 0; r < c.rounds; r++) {
        ph.push({ k: 'work', d: c.work, r: r + 1, s: s + 1, ex: exAt(r) });
        if (r < c.rounds - 1 && c.rest > 0) ph.push({ k: 'rest', d: c.rest, r: r + 1, s: s + 1, next: exAt(r + 1) });
      }
      if (s < c.sets - 1 && c.setRest > 0) ph.push({ k: 'setRest', d: c.setRest, s: s + 1, next: exAt(0) });
    }
    ph.push({ k: 'done', d: 0 });
    return ph;
  }
  const mmss = (sec) => `${Math.floor(sec / 60)}:${pad(sec % 60)}`;
  function beep(freq, ms) {
    try {
      const ac = TM.ac || (TM.ac = new (window.AudioContext || window.webkitAudioContext)());
      if (ac.state === 'suspended') ac.resume();
      const o = ac.createOscillator(); const g = ac.createGain(); const now = ac.currentTime;
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.5, now + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, now + ms / 1000);
      o.connect(g); g.connect(ac.destination); o.start(now); o.stop(now + ms / 1000 + 0.05);
    } catch (e) { /* no audio */ }
  }
  const buzz = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* */ } };
  async function wakeOn() { try { if ('wakeLock' in navigator && !TM.wake) { TM.wake = await navigator.wakeLock.request('screen'); TM.wake.addEventListener('release', () => { TM.wake = null; }); } } catch (e) { /* not supported */ } }
  function wakeOff() { try { if (TM.wake) TM.wake.release(); } catch (e) { /* */ } TM.wake = null; }
  function timerStart(c) {
    store.set('vb-timer', JSON.stringify(c));
    TM.ph = timerPhases(c); TM.i = 0; TM.left = TM.ph[0].d; TM.lastSec = -1;
    beep(660, 120); timerResume();
  }
  function timerResume() {
    if (!TM.ph || TM.ph[TM.i].k === 'done') return;
    TM.run = true; TM.endAt = Date.now() + TM.left * 1000; wakeOn();
    clearInterval(TM.iv); TM.iv = setInterval(timerTick, 200); timerPaint();
  }
  function timerStop() { TM.run = false; clearInterval(TM.iv); TM.iv = null; wakeOff(); }
  function timerToggle() {
    if (!TM.ph) return;
    if (TM.run) { TM.left = Math.max(0, Math.ceil((TM.endAt - Date.now()) / 1000)); timerStop(); timerPaint(); } else timerResume();
  }
  function timerNext(manual) {
    if (!TM.ph) return;
    TM.i = Math.min(TM.i + 1, TM.ph.length - 1); const p = TM.ph[TM.i];
    TM.left = p.d; TM.endAt = Date.now() + p.d * 1000; TM.lastSec = -1;
    if (p.k === 'done') { timerStop(); beep(880, 250); setTimeout(() => beep(880, 250), 350); setTimeout(() => beep(1175, 600), 700); buzz([300, 100, 300, 100, 600]); }
    else if (p.k === 'work') { beep(1175, 500); buzz(400); } else { beep(523, 500); buzz([150, 80, 150]); }
    if (manual && !TM.run) TM.endAt = 0;
    timerPaint();
  }
  function timerTick() {
    if (!TM.run || !TM.ph) return;
    let rem = Math.ceil((TM.endAt - Date.now()) / 1000);
    while (TM.run && rem <= 0) { timerNext(false); if (!TM.run) return; rem = Math.ceil((TM.endAt - Date.now()) / 1000); }
    TM.left = rem;
    if (rem <= 3 && rem >= 1 && rem !== TM.lastSec) { TM.lastSec = rem; beep(880, 120); }
    timerPaint();
  }
  function timerPaint(form) {
    const box = $('#tm'); if (!box) return;
    const f = form || box.closest('form');
    const p = TM.ph ? TM.ph[TM.i] : null;
    const c = f ? timerReadForm(f) : timerCfg();
    const total = (ph) => ph.reduce((s, x) => s + x.d, 0);
    if (!p) {
      box.className = 'tm idle';
      $('#tm-phase').textContent = t('timer.ready');
      $('#tm-time').textContent = mmss(c.work);
      $('#tm-info').textContent = t('timer.total', { time: mmss(total(timerPhases(c))) });
      $('#tm-ex').textContent = '';
      $('#tm-bar').style.width = '0%';
    } else {
      box.className = 'tm ' + p.k + (TM.run ? '' : ' paused');
      $('#tm-phase').textContent = t('timer.ph.' + p.k);
      $('#tm-time').textContent = p.k === 'done' ? '✓' : mmss(TM.left);
      const info = [];
      if (p.r) info.push(t('timer.round', { n: p.r, total: TM.ph.filter((x) => x.k === 'work' && x.s === p.s).length }));
      if (p.s && c.sets > 1) info.push(t('timer.set', { n: p.s, total: c.sets }));
      const restAll = TM.ph.slice(TM.i + 1).reduce((s, x) => s + x.d, 0) + (p.k === 'done' ? 0 : TM.left);
      if (p.k !== 'done') info.push(t('timer.left', { time: mmss(restAll) }));
      $('#tm-info').textContent = info.join(' · ');
      $('#tm-ex').textContent = p.k === 'work' ? (p.ex || '') : (p.next ? t('timer.next', { ex: p.next }) : '');
      $('#tm-bar').style.width = (p.d ? Math.min(100, ((p.d - TM.left) / p.d) * 100) : 100) + '%';
    }
    const run = $('#tm-run'); if (run) run.hidden = !!p && p.k !== 'done';
    const ctl = $('#tm-ctl'); if (ctl) ctl.hidden = !p || p.k === 'done';
    const pb = $('#tm-pause'); if (pb) pb.textContent = TM.run ? '⏸ ' + t('timer.pause') : '▶ ' + t('timer.resume');
    const set = $('#tm-set'); if (set) set.hidden = !!p && p.k !== 'done';
  }
  function viewTimer() {
    const c = timerCfg();
    const num = (n, label, min, max) => `<label>${label}<input name="${n}" type="number" inputmode="numeric" min="${min}" max="${max}" value="${c[n]}"></label>`;
    return {
      title: t('timer.title'), back: '#/mehr',
      html: `<form data-f="timer" class="timerf">
        <div class="card tm idle" id="tm"><div id="tm-phase" class="tm-phase"></div><div id="tm-time" class="tm-time">0:00</div><div id="tm-ex" class="tm-ex"></div>
          <div class="progress"><span id="tm-bar" style="width:0%"></span></div><div id="tm-info" class="small tm-info"></div></div>
        <button class="btn block big" id="tm-run">▶ ${t('timer.start')}</button>
        <div class="row" id="tm-ctl" hidden><button type="button" class="btn" id="tm-pause" data-a="timer-pause">⏸ ${t('timer.pause')}</button><button type="button" class="btn ghost" data-a="timer-skip">⏭ ${t('timer.skip')}</button><button type="button" class="btn ghost" data-a="timer-reset">⏹ ${t('timer.reset')}</button></div>
        <div class="card" id="tm-set"><div class="presets-t">${TIMER_PRESETS.map(([n], i) => `<button type="button" class="chip" data-a="timer-preset" data-i="${i}">${esc(n)}</button>`).join('')}</div>
          <div class="grid3">${num('work', t('timer.work'), 5, 3600)}${num('rest', t('timer.rest'), 0, 3600)}${num('rounds', t('timer.rounds'), 1, 99)}${num('sets', t('timer.sets'), 1, 20)}${num('setRest', t('timer.setRest'), 0, 3600)}</div>
          <label>${t('timer.ex')}<textarea name="ex" rows="3" maxlength="1000" placeholder="${t('timer.exPh')}">${esc(c.ex)}</textarea></label>
          <p class="small muted">${t('timer.hint')}</p></div></form>`
    };
  }

  // ---------------------------------------------------------- v3: Tournament mode
  // Model: tournaments/{id} = { name, ev, format: 'rr'|'groups', courts, sets (1|2|3 = best of 3), pts, teams: [{n, p:[names], g}], matches: [{id, st, a, b, fa, fb, slot, c, s:[{a,b}], done}] }
  function rrRounds(ids) {
    const a = [...ids]; if (a.length % 2) a.push(-1);
    const n = a.length; const rounds = [];
    for (let r = 0; r < n - 1; r++) {
      const ms = [];
      for (let i = 0; i < n / 2; i++) { const x = a[i], y = a[n - 1 - i]; if (x >= 0 && y >= 0) ms.push(r % 2 ? [y, x] : [x, y]); }
      rounds.push(ms); a.splice(1, 0, a.pop());
    }
    return rounds;
  }
  function slotify(list, courts, startSlot) {
    const rest = [...list]; let slot = startSlot;
    while (rest.length) {
      slot++; const used = new Set(); let c = 0;
      for (let i = 0; i < rest.length && c < courts;) {
        const m = rest[i];
        if (used.has(m.a) || used.has(m.b)) { i++; continue; }
        used.add(m.a); used.add(m.b); m.slot = slot; m.c = ++c; rest.splice(i, 1);
      }
    }
    return slot;
  }
  function buildTournament(nTeams, format, courts) {
    const ids = Array.from({ length: nTeams }, (_, i) => i);
    let k = 0; const mk = (st, a, b) => ({ id: 'm' + (++k), st, a, b, fa: '', fb: '', slot: 0, c: 0, s: [], done: false });
    const groupOf = {};
    let main = [];
    if (format === 'groups') {
      ids.forEach((i) => { groupOf[i] = i % 4 === 0 || i % 4 === 3 ? 'A' : 'B'; });
      const rA = rrRounds(ids.filter((i) => groupOf[i] === 'A')); const rB = rrRounds(ids.filter((i) => groupOf[i] === 'B'));
      for (let r = 0; r < Math.max(rA.length, rB.length); r++) { (rA[r] || []).forEach(([a, b]) => main.push(mk('A', a, b))); (rB[r] || []).forEach(([a, b]) => main.push(mk('B', a, b))); }
    } else rrRounds(ids).forEach((ms) => ms.forEach(([a, b]) => main.push(mk('rr', a, b))));
    let last = slotify(main, courts, 0);
    if (format === 'groups') {
      const ko = (st, fa, fb) => ({ ...mk(st, -1, -1), fa, fb });
      const sf = [ko('sf1', 'A1', 'B2'), ko('sf2', 'B1', 'A2')];
      sf.forEach((m, i) => { m.slot = last + 1 + (courts > 1 ? 0 : i); m.c = courts > 1 ? i + 1 : 1; });
      last = sf[1].slot;
      const fin = [ko('p3', 'L:sf1', 'L:sf2'), ko('f', 'W:sf1', 'W:sf2')];
      fin.forEach((m, i) => { m.slot = last + 1 + (courts > 1 ? 0 : i); m.c = courts > 1 ? i + 1 : 1; });
      main = main.concat(sf, fin);
    }
    return { matches: main, groupOf };
  }
  function matchRes(m) {
    const sets = (m.s || []).filter((x) => x && (Number(x.a) || Number(x.b)));
    let sa = 0, sb = 0, pa = 0, pb = 0;
    sets.forEach((x) => { const a = Number(x.a) || 0, b = Number(x.b) || 0; pa += a; pb += b; if (a > b) sa++; else if (b > a) sb++; });
    return { sa, sb, pa, pb, sets, win: !m.done ? null : sa > sb ? 'a' : sb > sa ? 'b' : null };
  }
  function standings(T, st) {
    const ids = T.teams.map((_, i) => i).filter((i) => st === 'rr' || T.teams[i].g === st);
    const row = Object.fromEntries(ids.map((i) => [i, { i, p: 0, w: 0, l: 0, sw: 0, sl: 0, pf: 0, pa: 0 }]));
    T.matches.filter((m) => m.st === st && m.done).forEach((m) => {
      const r = matchRes(m); const A = row[m.a], B = row[m.b]; if (!A || !B) return;
      A.p++; B.p++; A.sw += r.sa; A.sl += r.sb; B.sw += r.sb; B.sl += r.sa; A.pf += r.pa; A.pa += r.pb; B.pf += r.pb; B.pa += r.pa;
      if (r.win === 'a') { A.w++; B.l++; } else if (r.win === 'b') { B.w++; A.l++; }
    });
    return Object.values(row).sort((x, y) => y.w - x.w || (y.sw - y.sl) - (x.sw - x.sl) || (y.pf - y.pa) - (x.pf - x.pa) || y.pf - x.pf || x.i - y.i);
  }
  function resolveTeam(T, code) {
    if (!code) return -1;
    const g = code.match(/^([AB])(\d)$/);
    if (g) { if (T.matches.some((m) => m.st === g[1] && !m.done)) return -1; const s = standings(T, g[1]); const r = s[Number(g[2]) - 1]; return r ? r.i : -1; }
    const w = code.match(/^([WL]):(\w+)$/);
    if (w) { const m = T.matches.find((x) => x.st === w[2]); if (!m || !m.done) return -1; const r = matchRes(m); if (!r.win) return -1; const win = r.win === 'a' ? teamIdx(T, m, 'a') : teamIdx(T, m, 'b'); const lose = r.win === 'a' ? teamIdx(T, m, 'b') : teamIdx(T, m, 'a'); return w[1] === 'W' ? win : lose; }
    return -1;
  }
  const teamIdx = (T, m, side) => (m[side] >= 0 ? m[side] : resolveTeam(T, m['f' + side]));
  function codeLabel(code) {
    const g = code.match(/^([AB])(\d)$/); if (g) return t('tour.placeOf', { n: g[2], g: g[1] });
    const w = code.match(/^([WL]):sf(\d)$/); if (w) return t(w[1] === 'W' ? 'tour.winnerSf' : 'tour.loserSf', { n: w[2] });
    return '?';
  }
  const teamLabel = (T, m, side) => { const i = teamIdx(T, m, side); return i >= 0 && T.teams[i] ? esc(T.teams[i].n) : `<i class="muted">${esc(codeLabel(m['f' + side]))}</i>`; };
  const stageLabel = (st) => (st === 'rr' ? '' : st === 'A' || st === 'B' ? t('tour.group', { g: st }) : st === 'sf1' || st === 'sf2' ? t('tour.st.sf') + ' ' + st.slice(-1) : t('tour.st.' + st));
  function champion(T) {
    if (T.format === 'groups') { const f = T.matches.find((m) => m.st === 'f'); if (!f || !f.done) return -1; return resolveTeam(T, 'W:f'); }
    if (T.matches.some((m) => !m.done)) return -1; const s = standings(T, 'rr'); return s[0] ? s[0].i : -1;
  }
  function viewTurniere() {
    const list = [...S.tournaments].sort((a, b) => b.ts - a.ts);
    return {
      title: t('tour.title'), back: '#/mehr', action: isTrainer() ? `<a class="btn sm" href="#/turnier-neu">${t('tour.new')}</a>` : '',
      html: list.length ? list.map((T) => {
        const done = T.matches.filter((m) => m.done).length; const ch = champion(T);
        return `<a class="card mitem tour-i" href="#/turnier/${T.id}"><span class="mi">🏆</span><span class="ml"><b>${esc(T.name)}</b><small>${t('tour.teamsN', { n: T.teams.length })} · ${t('tour.fmt.' + T.format)} · ${t('tour.progress', { n: done, total: T.matches.length })}${ch >= 0 ? ' · 🥇 ' + esc(T.teams[ch].n) : ''}</small></span><span class="chev">›</span></a>`;
      }).join('') : `<div class="empty">${t('tour.none')}${isTrainer() ? `<br><a class="btn" href="#/turnier-neu">${t('tour.new')}</a>` : ''}</div>`
    };
  }
  function viewTurnierForm(evId) {
    if (!isTrainer()) return { title: t('tour.new'), back: '#/turniere', html: `<div class="empty">${t('evf.onlyCoach')}</div>` };
    const ev = evId ? S.events.find((e) => e.id === evId) : null;
    const tm = ev && ev.teams && ev.teams.n ? Array.from({ length: ev.teams.n }, (_, i) => t('teams.team', { n: i + 1 })) : [];
    return {
      title: t('tour.new'), back: ev ? '#/termin/' + ev.id : '#/turniere',
      html: `<form class="card" data-f="tournament" data-ev="${ev ? ev.id : ''}">
        <label>${t('tour.name')}<input name="name" required maxlength="60" value="${esc(ev ? ev.title + ' – ' + t('tour.word') : t('tour.word'))}"></label>
        <label>${t('tour.teams')} <span class="muted small">${t('tour.teamsHint')}</span><textarea name="teams" rows="6" required maxlength="800" placeholder="${t('tour.teamsPh')}">${esc(tm.join('\n'))}</textarea></label>
        ${tm.length ? `<p class="small muted">${t('tour.fromEvHint')}</p>` : ''}
        <label>${t('tour.format')}<select name="format"><option value="rr">${t('tour.fmt.rr')}</option><option value="groups">${t('tour.fmt.groups')}</option></select></label>
        <div class="grid3"><label>${t('tour.courts')}<select name="courts">${[1, 2, 3, 4].map((n) => `<option ${n === 1 ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
          <label>${t('tour.sets')}<select name="sets"><option value="1">${t('tour.sets1')}</option><option value="2">${t('tour.sets2')}</option><option value="3">${t('tour.sets3')}</option></select></label>
          <label>${t('tour.pts')}<select name="pts">${[15, 21, 25].map((n) => `<option ${n === 15 ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>
        <p class="small muted">${t('tour.fmtHint')}</p>
        <label class="check"><input type="checkbox" name="push" checked> ${t('tour.push')}</label>
        <button class="btn block">${t('tour.create')}</button></form>`
    };
  }
  function scoreTxt(m) { const r = matchRes(m); return m.done ? `<b>${r.sa}:${r.sb}</b> <small class="muted">(${r.sets.map((x) => `${Number(x.a) || 0}:${Number(x.b) || 0}`).join(', ')})</small>` : '<span class="muted">– : –</span>'; }
  function matchRow(T, m) {
    const r = matchRes(m); const tag = stageLabel(m.st);
    const inner = `<span class="mc">${t('tour.court', { n: m.c })}${tag ? ` · <span class="tag">${esc(tag)}</span>` : ''}</span>
      <span class="mt ${r.win === 'a' ? 'win' : ''}">${teamLabel(T, m, 'a')}</span><span class="ms">${scoreTxt(m)}</span><span class="mt r ${r.win === 'b' ? 'win' : ''}">${teamLabel(T, m, 'b')}</span>`;
    const ready = teamIdx(T, m, 'a') >= 0 && teamIdx(T, m, 'b') >= 0;
    return isTrainer() && ready ? `<a class="match ${m.done ? 'done' : ''}" href="#/spiel/${T.id}/${m.id}">${inner}<span class="chev">✎</span></a>` : `<div class="match ${m.done ? 'done' : ''}">${inner}</div>`;
  }
  function tableHtml(T, st) {
    const rows = standings(T, st);
    return `<table class="ttab"><thead><tr><th>#</th><th class="l">${t('tour.team')}</th><th>${t('tour.colP')}</th><th>${t('tour.colW')}</th><th>${t('tour.colL')}</th><th>${t('tour.colSets')}</th><th>${t('tour.colPts')}</th></tr></thead><tbody>
      ${rows.map((x, k) => `<tr><td>${k + 1}</td><td class="l"><b>${esc(T.teams[x.i].n)}</b></td><td>${x.p}</td><td>${x.w}</td><td>${x.l}</td><td>${x.sw}:${x.sl}</td><td>${x.pf - x.pa > 0 ? '+' : ''}${x.pf - x.pa}</td></tr>`).join('')}</tbody></table>`;
  }
  function viewTurnier(id) {
    const T = S.tournaments.find((x) => x.id === id);
    if (!T) return { title: t('tour.title'), back: '#/turniere', html: `<div class="empty">${t('tour.notFound')}</div>` };
    const ev = T.ev ? S.events.find((e) => e.id === T.ev) : null;
    const ch = champion(T); const tab = S.tourTab;
    const slots = [...new Set(T.matches.map((m) => m.slot))].sort((a, b) => a - b);
    let body = '';
    if (tab === 'table') {
      body = T.format === 'groups' ? ['A', 'B'].map((g) => `<div class="card"><h3>${t('tour.group', { g })}</h3>${tableHtml(T, g)}</div>`).join('')
        + `<div class="card"><h3>${t('tour.ko')}</h3>${T.matches.filter((m) => !['A', 'B'].includes(m.st)).map((m) => matchRow(T, m)).join('')}</div>`
        : `<div class="card">${tableHtml(T, 'rr')}</div>`;
      body += `<p class="small muted center-text">${t('tour.rank')}</p>`;
    } else if (tab === 'teams') {
      body = `<div class="card"><div class="teams">${T.teams.map((tm, i) => `<div class="team" style="--tc:${TEAM_COLORS[i % 4]}"><b>${esc(tm.n)}${T.format === 'groups' ? ` <small>${t('tour.group', { g: tm.g })}</small>` : ''}</b>${(tm.p || []).map((p) => `<span>${esc(p)}</span>`).join('') || '<span class="muted small">–</span>'}</div>`).join('')}</div></div>`;
    } else {
      const next = T.matches.filter((m) => !m.done).sort((a, b) => a.slot - b.slot)[0];
      body = slots.map((sl) => `<div class="card slot ${next && next.slot === sl ? 'now' : ''}"><h4>${t('tour.slot', { n: sl })}${next && next.slot === sl ? ` <span class="tag blue">${t('tour.next')}</span>` : ''}</h4>${T.matches.filter((m) => m.slot === sl).sort((a, b) => a.c - b.c).map((m) => matchRow(T, m)).join('')}</div>`).join('');
      if (isTrainer()) body += `<p class="small muted center-text">${t('tour.tapHint')}</p>`;
    }
    const done = T.matches.filter((m) => m.done).length;
    return {
      title: T.name, back: ev ? '#/termin/' + ev.id : '#/turniere',
      html: `${ch >= 0 ? `<div class="card champ">🏆<div><small>${t('tour.champion')}</small><b>${esc(T.teams[ch].n)}</b></div></div>` : ''}
        <div class="card"><div class="small muted">${t('tour.fmt.' + T.format)} · ${t('tour.teamsN', { n: T.teams.length })} · ${t('tour.courtsN', { n: T.courts })} · ${t('tour.setsInfo.' + T.sets, { pts: T.pts })}${ev ? ` · <a href="#/termin/${ev.id}">${esc(ev.title)}</a>` : ''}</div>
          <div class="progress"><span style="width:${T.matches.length ? (done / T.matches.length) * 100 : 0}%"></span></div><div class="small muted">${t('tour.progress', { n: done, total: T.matches.length })}</div></div>
        <div class="seg">${[['plan', '📋', 'tour.tabPlan'], ['table', '📊', 'tour.tabTable'], ['teams', '👥', 'tour.tabTeams']].map(([k, ic, lb]) => `<button class="${tab === k ? 'on' : ''}" data-a="tour-tab" data-v="${k}">${ic} ${t(lb)}</button>`).join('')}</div>
        ${body}
        ${isTrainer() ? `<button class="link sm red" data-a="tour-del" data-id="${T.id}">${t('tour.delete')}</button>` : ''}`
    };
  }
  function viewSpiel(path) {
    const [tid, mid] = String(path || '').split('/');
    const T = S.tournaments.find((x) => x.id === tid); const m = T && T.matches.find((x) => x.id === mid);
    if (!T || !m || !isTrainer()) return { title: t('tour.result'), back: tid ? '#/turnier/' + tid : '#/turniere', html: `<div class="empty">${t('tour.notFound')}</div>` };
    const ko = !['rr', 'A', 'B'].includes(m.st);
    const n = ko && Number(T.sets) === 2 ? 3 : Number(T.sets) || 1; const sets = m.s || [];
    const A = teamLabel(T, m, 'a'), B = teamLabel(T, m, 'b');
    return {
      title: t('tour.result'), back: '#/turnier/' + T.id,
      html: `<form class="card" data-f="match" data-t="${T.id}" data-m="${m.id}">
        <p class="muted small">${t('tour.court', { n: m.c })} · ${t('tour.slot', { n: m.slot })}${stageLabel(m.st) ? ' · ' + esc(stageLabel(m.st)) : ''}</p>
        <div class="setgrid"><span></span><b>${A}</b><b>${B}</b>
        ${Array.from({ length: n }, (_, k) => `<span class="muted">${t('tour.setN', { n: k + 1 })}${n === 3 && k === 2 ? '<br><small>' + t('tour.ifNeeded') + '</small>' : ''}</span><input name="a${k}" type="number" inputmode="numeric" min="0" max="99" value="${sets[k] && sets[k].a != null ? sets[k].a : ''}" ${k === 0 ? 'required' : ''}><input name="b${k}" type="number" inputmode="numeric" min="0" max="99" value="${sets[k] && sets[k].b != null ? sets[k].b : ''}" ${k === 0 ? 'required' : ''}>`).join('')}</div>
        <p class="small muted">${t('tour.ptsHint', { pts: T.pts })}</p>
        <button class="btn block">${t('tour.saveResult')}</button>
        ${m.done ? `<button type="button" class="link sm red" data-a="match-clear" data-t="${T.id}" data-m="${m.id}">${t('tour.clear')}</button>` : ''}</form>`
    };
  }
  async function saveMatch(tid, mid, sets) {
    const T = S.tournaments.find((x) => x.id === tid); if (!T) return;
    const before = champion(T);
    const matches = T.matches.map((m) => (m.id === mid ? { ...m, s: sets || [], done: !!sets } : m));
    await DB.update('tournaments/' + tid, { matches, updated: Date.now() });
    const after = champion({ ...T, matches });
    if (sets && after >= 0 && before < 0 && T.notify) await push(T.notify, 'tourEnd', { name: T.name, winner: T.teams[after].n }, '#/turnier/' + tid);
    toast(t('saved')); go('#/turnier/' + tid);
  }

  // ---------------------------------------------------------- v4: 5-1 rotation quiz (court graphics + animated solution)
  const QM = 40; // px per metre
  const qxy = (p) => [p[0] * QM, p[1] * QM];
  const QZ = { i: 0, score: 0, answered: false, results: [], playing: false };
  const quizText = (q) => (q.t[S.lang] || q.t.en);
  const qLetter = (i) => 'ABCD'[i];
  function qToken(id, p, q, mini) {
    const [x, y] = qxy(p); const setter = id === 'S';
    const ghost = (q.ghost || []).includes(id) && !mini;
    const r = mini ? 22 : 15;
    const label = setter ? t('pos.s.S') : String(self.QUIZ.jersey[id]);
    const slot = q.slots && q.slots[id] && !mini ? `<text class="qslot" y="${r + 12}">P${q.slots[id]}</text>` : '';
    const optIdx = q.kind === 'player' ? (q.opts || []).indexOf(id) : -1;
    const badge = optIdx >= 0 && !mini ? `<g class="qbadge" transform="translate(${r - 2},${-r + 2})"><circle r="9"/><text dy="3.5">${qLetter(optIdx)}</text></g>` : '';
    const hl = (q.hl || []).includes(id) && !mini ? `<circle class="qhl" r="${r + 7}"/>` : '';
    return `<g class="qt ${setter ? 'set' : ''} ${ghost ? 'ghost' : ''}" id="${mini ? '' : 'qt-' + id}" style="transform:translate(${x}px,${y}px)" ${optIdx >= 0 && !mini ? `data-a="quiz-ans" data-i="${optIdx}"` : ''}>
      <ellipse class="qsh" cx="2" cy="${r * 0.55}" rx="${r * 0.95}" ry="${r * 0.45}"/>${hl}<circle class="qbody" r="${r}"/>
      <text class="qlab" dy="${mini ? 5 : 4.5}">${ghost ? '?' : esc(label)}</text>${slot}${badge}</g>`;
  }
  function courtSvg(q, mini, players) {
    const pl = players || q.pl;
    const vb = mini ? '-30 -20 420 400' : '-60 -175 480 610';
    const floorLines = (y0) => Array.from({ length: 24 }, (_, k) => `<line x1="${k * 15}" y1="${y0}" x2="${k * 15}" y2="${y0 + (y0 < 0 ? 170 : 360)}"/>`).join('');
    const nums = !mini ? Object.entries({ 1: [7.5, 7], 2: [7.5, 2], 3: [4.5, 2], 4: [1.5, 2], 5: [1.5, 7], 6: [4.5, 7] }).map(([n, p]) => `<text class="qnum" x="${p[0] * QM}" y="${p[1] * QM - 22}">${n}</text>`).join('') : '';
    const spots = q.kind === 'spot' && !mini ? q.spots.map((p, i) => { const [x, y] = qxy(p); return `<g class="qspot" id="qs-${i}" data-a="quiz-ans" data-i="${i}" transform="translate(${x},${y})"><circle r="15"/><text dy="5">${qLetter(i)}</text></g>`; }).join('') : '';
    const opp = (q.opp || []).map((p) => { const [x, y] = qxy(p); return `<g class="qt opp" style="transform:translate(${x}px,${y}px)"><ellipse class="qsh" cx="2" cy="8" rx="14" ry="7"/><circle class="qbody" r="15"/></g>`; }).join('');
    const ball = q.ball0 && !mini ? (() => { const [x, y] = qxy(q.ball0); return `<g id="q-ball" style="transform:translate(${x}px,${y}px)"><ellipse class="qbsh" id="q-bsh" rx="6" ry="3" cy="9"/><g id="q-bb">${QBALL}</g></g>`; })() : (!mini ? `<g id="q-ball" style="display:none"><ellipse class="qbsh" id="q-bsh" rx="6" ry="3" cy="9"/><g id="q-bb">${QBALL}</g></g>` : '');
    return `<svg viewBox="${vb}" class="${mini ? 'qmini' : 'qcourt'}" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="qmesh" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 0L6 6M6 0L0 6" stroke="#20242c" stroke-width=".7" opacity=".55"/></pattern>
        <linearGradient id="qfloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e98c45"/><stop offset="1" stop-color="#d9712e"/></linearGradient>
        <linearGradient id="qfree" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d6cb5"/><stop offset="1" stop-color="#1f4f8c"/></linearGradient>
        ${['w', 'y', 'g', 'r'].map((c) => `<marker id="qar-${c}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="qam-${c}"/></marker>`).join('')}</defs>
      <rect x="-60" y="-175" width="480" height="625" fill="url(#qfree)"/>
      <rect x="0" y="${mini ? -20 : -170}" width="360" height="${mini ? 20 : 170}" fill="url(#qfloor)" opacity=".8"/>
      <rect x="0" y="0" width="360" height="360" fill="url(#qfloor)"/>
      <g class="qwood">${floorLines(0)}${mini ? '' : floorLines(-170)}</g>
      <g class="qlines"><rect x="0" y="0" width="360" height="360"/><line x1="0" y1="120" x2="360" y2="120"/>${mini ? '' : '<line x1="0" y1="-120" x2="360" y2="-120"/><line x1="0" y1="-170" x2="0" y2="0"/><line x1="360" y1="-170" x2="360" y2="0"/>'}</g>
      <g id="q-nums" class="${q.sol && q.sol.some((s) => s.nums) ? 'hide' : ''}">${mini ? '' : nums}</g>
      ${mini ? '<rect x="-14" y="-6" width="388" height="6" class="qnetmini"/>' : `<g class="qnet"><rect x="-14" y="-2" width="388" height="5" class="qnetshadow"/><rect x="-12" y="-38" width="384" height="38" fill="url(#qmesh)"/><rect x="-12" y="-40" width="384" height="6" class="qband"/><rect x="-12" y="-4" width="384" height="3" class="qband2"/>
        <g class="qant"><rect x="-3" y="-62" width="5" height="62"/><rect x="358" y="-62" width="5" height="62"/></g><rect x="-22" y="-44" width="9" height="46" class="qpost"/><rect x="373" y="-44" width="9" height="46" class="qpost"/></g>`}
      ${spots}<g id="q-ar"></g>${opp}
      ${Object.entries(pl).map(([id, p]) => qToken(id, p, q, mini)).join('')}
      ${ball}<g id="q-ov"></g></svg>`;
  }
  const QBALL = '<circle r="7" fill="#fff6d8" stroke="#1f3c88" stroke-width="1.2"/><path d="M-7 0Q0 -4 7 0M-3.5 -6Q-1 0 -3.5 6M3.5 -6Q6 0 3.5 6" fill="none" stroke="#1f3c88" stroke-width="1.1"/>';
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  function qArrow(from, to, color) {
    const g = $('#q-ar'); if (!g) return;
    const [x1, y1] = qxy(from), [x2, y2] = qxy(to);
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy); if (len < 8) return;
    const sh = 18 / len; const sx = x1 + dx * sh, sy = y1 + dy * sh, ex = x2 - dx * sh, ey = y2 - dy * sh;
    const cx = (sx + ex) / 2 - dy * 0.12, cy = (sy + ey) / 2 + dx * 0.12;
    g.insertAdjacentHTML('beforeend', `<path class="qarrow c-${color}" d="M${sx} ${sy}Q${cx} ${cy} ${ex} ${ey}" pathLength="100" marker-end="url(#qar-${color})"/>`);
  }
  function qBallFly(from, to, h, ms) {
    const ball = $('#q-ball'); const bb = $('#q-bb'); const sh = $('#q-bsh'); if (!ball) return Promise.resolve();
    ball.style.display = '';
    const [x1, y1] = qxy(from), [x2, y2] = qxy(to); const H = (h || 2.5) * QM * 0.55;
    return new Promise((res) => {
      const t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / ms); const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const x = x1 + (x2 - x1) * e, y = y1 + (y2 - y1) * e; const lift = Math.sin(Math.PI * e) * H;
        ball.style.transform = `translate(${x}px,${y}px)`;
        bb.setAttribute('transform', `translate(0,${-lift}) scale(${1 + lift / H * 0.45})`);
        sh.setAttribute('opacity', String(0.45 - lift / H * 0.25));
        if (k < 1 && document.body.contains(ball)) requestAnimationFrame(step); else res();
      };
      requestAnimationFrame(step);
    });
  }
  function qMark(p, ok) {
    const [x, y] = qxy(p); const o = $('#q-ov'); if (!o) return;
    o.insertAdjacentHTML('beforeend', ok ? `<g class="qmark ok" transform="translate(${x},${y - 30})"><circle r="11"/><path d="M-5 0l3.5 4L5 -4"/></g>` : `<g class="qmark bad" transform="translate(${x},${y})"><circle r="12"/><path d="M-5 -5L5 5M5 -5L-5 5"/></g>`);
  }
  async function quizPlay(q) {
    if (QZ.playing) return; QZ.playing = true;
    const pos = { ...q.pl };
    const setT = (id, p) => { const el = $('#qt-' + id); if (el) { el.style.transform = `translate(${p[0] * QM}px,${p[1] * QM}px)`; el.classList.remove('ghost'); const l = el.querySelector('.qlab'); if (l && l.textContent === '?') l.textContent = t('pos.s.S'); } };
    try {
      for (const st of q.sol) {
        if (!$('#q-ar')) break;
        const cap = $('#q-cap'); if (cap) cap.textContent = st.label ? t('quiz.' + st.label) : '';
        if (st.nums) { const n = $('#q-nums'); if (n) { n.classList.remove('hide'); n.classList.add('reveal'); } }
        document.querySelectorAll('#q-ar .qarrow').forEach((a) => a.classList.add('old'));
        if (st.bad) st.bad.forEach((id) => { const el = $('#qt-' + id); if (el) el.classList.add('wrong'); qMark([(pos[st.bad[0]][0] + pos[st.bad[1]][0]) / 2, (pos[st.bad[0]][1] + pos[st.bad[1]][1]) / 2], false); });
        const jobs = [];
        if (st.moves) Object.entries(st.moves).forEach(([id, p]) => { qArrow(pos[id], p, id === 'S' ? 'y' : 'w'); pos[id] = p; setT(id, p); });
        if (st.ball) jobs.push(qBallFly(st.ball[0], st.ball[1], st.h, 900));
        if (st.ballX) { qArrow(st.ballX[0], st.ballX[1], 'r'); qMark(st.ballX[1], false); }
        if (st.moves) jobs.push(sleep(1000));
        await Promise.all(jobs); await sleep(450);
        if (st.bad) st.bad.forEach((id) => { const el = $('#qt-' + id); if (el) el.classList.remove('wrong'); });
      }
      const cap = $('#q-cap'); if (cap) cap.textContent = '';
    } finally { QZ.playing = false; }
  }
  function viewQuiz() {
    const QS = self.QUIZ ? self.QUIZ.questions : [];
    if (!QS.length) return { title: t('quiz.title'), back: '#/mehr', html: `<div class="empty">–</div>` };
    if (QZ.i >= QS.length) {
      const best = Math.max(Number(store.get('vb-quiz-best')) || 0, QZ.score); store.set('vb-quiz-best', String(best));
      const pct = Math.round((QZ.score / QS.length) * 100);
      return {
        title: t('quiz.title'), back: '#/mehr',
        html: `<div class="card center-text qend"><div class="qend-ic">${pct >= 85 ? '🏆' : pct >= 60 ? '💪' : '📚'}</div><h2>${t('quiz.result', { n: QZ.score, total: QS.length })}</h2>
          <p class="muted">${t(pct >= 85 ? 'quiz.r3' : pct >= 60 ? 'quiz.r2' : 'quiz.r1')}</p><p class="small muted">${t('quiz.best', { n: best, total: QS.length })}</p>
          <div class="qdots">${QZ.results.map((r) => `<span class="${r ? 'ok' : 'bad'}"></span>`).join('')}</div>
          <button class="btn block" data-a="quiz-restart">🔄 ${t('quiz.again')}</button></div>`
      };
    }
    const q = QS[QZ.i]; const tx = quizText(q);
    const legend = `<div class="qlegend"><span><i class="lg set"></i>${t('quiz.lgSetter')}</span><span><i class="lg tm"></i>${t('quiz.lgTeam')}</span>${q.opp ? `<span><i class="lg op"></i>${t('quiz.lgOpp')}</span>` : ''}<span>🏐 ${t('quiz.lgBall')}</span></div>`;
    const opts = q.kind === 'formation'
      ? `<div class="qforms">${q.forms.map((f, i) => `<button class="qopt qform" data-a="quiz-ans" data-i="${i}"><b>${qLetter(i)}</b>${courtSvg(q, true, f)}</button>`).join('')}</div>`
      : `<div class="qopts">${tx.o.map((o, i) => `<button class="qopt" data-a="quiz-ans" data-i="${i}">${q.kind === 'spot' ? '' : `<b>${qLetter(i)}</b>`}<span>${esc(o)}</span></button>`).join('')}</div>`;
    return {
      title: t('quiz.title'), back: '#/mehr',
      html: `<form data-f="quiz" class="quizf">
        ${QZ.i === 0 && !QZ.answered ? `<div class="card qintro"><b>🔄 ${t('quiz.introT')}</b><p class="small">${t('quiz.intro')}</p></div>` : ''}
        <div class="qhead"><span>${t('quiz.qn', { n: QZ.i + 1, total: QS.length })}</span><span class="qdots">${QS.map((_, k) => `<span class="${k < QZ.results.length ? (QZ.results[k] ? 'ok' : 'bad') : k === QZ.i ? 'cur' : ''}"></span>`).join('')}</span><span>⭐ ${QZ.score}</span></div>
        <div class="card qcard"><h3 class="qq">${esc(tx.q)}</h3>
          <div class="qcourt-wrap"><div class="qtilt">${courtSvg(q, false)}</div><div class="qcap" id="q-cap"></div></div>${legend}</div>
        ${opts}
        <div id="q-res"></div></form>`
    };
  }
  async function quizAnswer(i) {
    if (QZ.answered) return;
    const QS = self.QUIZ.questions; const q = QS[QZ.i]; const ok = i === q.correct; const tx = quizText(q);
    QZ.answered = true; QZ.results.push(ok); if (ok) QZ.score++;
    document.querySelectorAll('.qopt').forEach((b) => { const k = Number(b.dataset.i); b.disabled = true; b.classList.add(k === q.correct ? 'right' : k === i ? 'wrong' : 'dim'); });
    if (q.kind === 'spot') q.spots.forEach((_, k) => { const s = $('#qs-' + k); if (s) s.classList.add(k === q.correct ? 'right' : k === i ? 'wrong' : 'dim'); });
    if (q.kind === 'player') q.opts.forEach((id, k) => { const el = $('#qt-' + id); if (el) el.classList.add(k === q.correct ? 'right' : k === i ? 'wrong' : 'dim'); });
    buzz(ok ? 40 : [60, 60, 60]);
    const res = $('#q-res');
    if (res) res.innerHTML = `<div class="card qexp ${ok ? 'ok' : 'bad'}"><b>${ok ? '✅ ' + t('quiz.right') : '❌ ' + t('quiz.wrong', { a: qLetter(q.correct) })}</b><p>${esc(tx.x)}</p>
      <div class="row"><button type="button" class="btn ghost" data-a="quiz-replay">▶ ${t('quiz.replay')}</button><button type="button" class="btn" data-a="quiz-next">${QZ.i + 1 < QS.length ? t('quiz.next') + ' →' : t('quiz.finish')}</button></div></div>`;
    const wrap = $('.qcourt-wrap'); if (wrap) wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await quizPlay(q);
  }
  function quizReplay() {
    if (QZ.playing) return;
    const q = self.QUIZ.questions[QZ.i]; const box = $('.qtilt'); if (!box) return;
    box.innerHTML = courtSvg(q, false);
    if (q.kind === 'spot') q.spots.forEach((_, k) => { const s = $('#qs-' + k); if (s) s.classList.add(k === q.correct ? 'right' : 'dim'); });
    if (q.kind === 'player') q.opts.forEach((id, k) => { const el = $('#qt-' + id); if (el) el.classList.add(k === q.correct ? 'right' : 'dim'); });
    setTimeout(() => quizPlay(q), 250);
  }

  // ---------- Unread badges
  function badges() {
    const now = Date.now();
    const evComments = S.comments.filter((c) => c.target.startsWith('events/') && c.author !== uid() && c.ts > (SEEN.c[c.target] || SEEN.start)).length;
    const postComments = S.comments.filter((c) => c.target.startsWith('posts/') && c.author !== uid() && c.ts > (SEEN.c[c.target] || SEEN.start)).length;
    const b = {
      termine: S.events.filter((e) => (e.end || e.start) >= now && !e.cancelled && myStatus(e).k === 'open').length + evComments,
      news: S.posts.filter((p) => p.author !== uid() && p.ts > SEEN.news).length + postComments,
      umfragen: S.polls.filter((p) => !p.closed && (p.votes || {})[uid()] === undefined).length,
      videos: S.videos.filter((v) => v.ts > SEEN.videos).length + myHomework().filter((h) => !(h.done && h.done[uid()])).length,
      mehr: isTrainer() ? S.members.filter((m) => m.status === 'pending').length + S.inbox.length : 0
    };
    const total = Object.values(b).reduce((s, n) => s + n, 0);
    try { if ('setAppBadge' in navigator) { if (total) navigator.setAppBadge(total); else navigator.clearAppBadge(); } } catch (e) { /* */ }
    return b;
  }
  // After drawing a page: mark things as seen / read
  const readMarked = new Set();
  function afterRender(r, id) {
    if (r !== 'design' && S.previewing) { S.previewing = false; applyTheme(S.theme); }
    if (r === 'timer') timerPaint();
    if (r === 'news') {
      if (S.posts.some((p) => p.ts > SEEN.news)) { PREV.news = SEEN.news; SEEN.news = Date.now(); saveSeen(); }
      S.posts.forEach((p) => {
        if (p.author !== uid() && !(p.reads || {})[uid()] && !readMarked.has(p.id)) { readMarked.add(p.id); DB.update('posts/' + p.id, { ['reads.' + uid()]: Date.now() }).catch(() => readMarked.delete(p.id)); }
      });
      S.openComments.forEach((tg) => { if (tg.startsWith('posts/') && newComments(tg)) markComments(tg); });
    }
    if (r === 'videos' && S.videos.some((v) => v.ts > SEEN.videos)) { PREV.videos = SEEN.videos; SEEN.videos = Date.now(); saveSeen(); }
    if (r === 'termin' && id && newComments('events/' + id)) markComments('events/' + id);
    if (r === 'suche') { const q = $('#q'); if (q && document.activeElement !== q) { q.focus(); try { q.setSelectionRange(q.value.length, q.value.length); } catch (e) { /* */ } } }
  }

  // ---------------------------------------------------------- Cash box
  function paidMap(u) {
    if (isTrainer()) { const p = S.payments.find((x) => x.id === u); return (p && p.paid) || {}; }
    return u === uid() ? (S.myPay && S.myPay.paid) || {} : {};
  }
  function viewKasse() {
    const fees = [...S.fees].sort((a, b) => b.ts - a.ts);
    if (!isTrainer()) {
      const mp = paidMap(uid()); const open = fees.filter((f) => !mp[f.id]);
      return {
        title: t('cash.title'), back: '#/mehr',
        html: `<div class="card center-text"><div class="muted small">${t('cash.open')}</div><div class="sum ${open.length ? 'red' : 'ok'}">${euro(open.reduce((s, f) => s + (Number(f.amount) || 0), 0))}</div></div>
          ${fees.map((f) => `<div class="card fee"><div><b>${esc(f.title)}</b>${f.due ? `<br><span class="small muted">${t('cash.due', { date: F_.dm.format(new Date(f.due)) })}</span>` : ''}</div><div class="right"><b>${euro(f.amount)}</b><br>${mp[f.id] ? `<span class="tag green">${t('cash.paid')}</span>` : `<span class="tag red">${t('cash.unpaid')}</span>`}</div></div>`).join('') || `<div class="empty">${t('cash.none')}</div>`}
          <p class="small muted center-text">${t('cash.howPay')}</p>`
      };
    }
    const mem = activeMembers();
    return {
      title: t('cash.title'), back: '#/mehr', action: `<a class="btn sm" href="#/beitrag-neu">${t('cash.add')}</a>`,
      html: fees.map((f) => {
        const paid = mem.filter((m) => paidMap(m.id)[f.id]); const open = mem.filter((m) => !paidMap(m.id)[f.id]);
        const isOpen = S.openFee === f.id;
        return `<div class="card fee-t"><button class="fee-head" data-a="fee-toggle" data-id="${f.id}"><div><b>${esc(f.title)}</b><br><span class="small muted">${t('cash.summary', { amount: euro(f.amount), paid: paid.length, total: mem.length, sum: euro(paid.length * (Number(f.amount) || 0)) })}</span></div><span class="chev">${isOpen ? '▲' : '▼'}</span></button>
          <div class="progress"><span style="width:${mem.length ? (paid.length / mem.length) * 100 : 0}%"></span></div>
          ${isOpen ? `<div class="fee-list">${mem.map((m) => `<label class="check line"><input type="checkbox" data-a="pay" data-u="${m.id}" data-f="${f.id}" ${paidMap(m.id)[f.id] ? 'checked' : ''}> ${esc(m.name)}</label>`).join('')}
            <div class="row wrap-row">${open.length ? `<button class="btn sm ghost" data-a="fee-remind" data-id="${f.id}">${t('cash.remind', { n: open.length })}</button>` : ''}<button class="link sm red" data-a="fee-del" data-id="${f.id}">${t('cash.delete')}</button></div></div>` : ''}
        </div>`;
      }).join('') || `<div class="empty">${t('cash.noneCoach')}<br><a class="btn" href="#/beitrag-neu">${t('cash.first')}</a></div>`
    };
  }
  function viewBeitragForm() {
    return {
      title: t('feef.title'), back: '#/kasse',
      html: `<form class="card" data-f="fee"><label>${t('feef.name')}<input name="title" required maxlength="60" value="${t('feef.default', { month: F_.month.format(new Date()) })}"></label>
        <label>${t('feef.amount')}<input name="amount" type="number" min="0" step="0.5" required value="5"></label>
        <label>${t('feef.due')}<input name="due" type="date"></label>
        <label class="check"><input type="checkbox" name="push" checked> ${t('feef.push')}</label>
        <button class="btn block">${t('feef.create')}</button></form>`
    };
  }

  // ---------------------------------------------------------- Statistics
  const participants = (e) => (e.attendanceDone ? Object.keys(e.attended || {}).filter((k) => e.attended[k]) : rsvpLists(e).confirmed);
  function viewStatistik() {
    const now = Date.now(); const days = S.statRange === 'all' ? 0 : Number(S.statRange);
    const since = days ? now - days * 864e5 : 0;
    const past = S.events.filter((e) => !e.cancelled && e.start < now && e.start >= since);
    const cnt = {}; past.forEach((e) => participants(e).forEach((u) => { cnt[u] = (cnt[u] || 0) + 1; }));
    const rows = activeMembers().map((m) => ({ m, n: cnt[m.id] || 0 })).sort((a, b) => b.n - a.n || a.m.name.localeCompare(b.m.name));
    const avg = past.length ? past.reduce((s, e) => s + participants(e).length, 0) / past.length : 0;
    const medal = ['🥇', '🥈', '🥉'];
    const visible = isTrainer() ? rows : rows.filter((r) => r.m.id === uid());
    const nf = new Intl.NumberFormat(I.locales[S.lang], { maximumFractionDigits: 1, minimumFractionDigits: 1 });
    return {
      title: t('stats.title'), back: '#/mehr',
      html: `<div class="seg">${['30', '90', '365', 'all'].map((k) => `<button class="${S.statRange === k ? 'on' : ''}" data-a="stat-range" data-r="${k}">${t('stats.' + k)}</button>`).join('')}</div>
        ${isTrainer() ? (() => { const fbs = S.feedback.filter((f) => past.some((e) => e.id === f.event)); return fbs.length ? `<div class="card center-text"><div class="muted small">${t('fb.avgAll')}</div><div class="sum">${'★'.repeat(Math.round(fbs.reduce((a, f) => a + f.stars, 0) / fbs.length))} ${(fbs.reduce((a, f) => a + f.stars, 0) / fbs.length).toFixed(1)}</div><div class="small muted">${t('fb.count', { n: fbs.length })}</div></div>` : ''; })() : ''}
        <div class="kpis"><div class="kpi"><b>${past.length}</b><span>${t('stats.events')}</span></div><div class="kpi"><b>${nf.format(avg)}</b><span>${t('stats.avg')}</span></div><div class="kpi"><b>${past.length ? Math.round(((cnt[uid()] || 0) / past.length) * 100) : 0}%</b><span>${t('stats.mine')}</span></div></div>
        <div class="card">${visible.map((r) => { const i = rows.indexOf(r); const pct = past.length ? Math.round((r.n / past.length) * 100) : 0; return `<div class="stat ${r.m.id === uid() ? 'me' : ''}"><span class="sn">${i < 3 && r.n ? medal[i] : i + 1 + '.'} ${esc(r.m.name)}</span><span class="sbar"><span style="width:${pct}%"></span></span><span class="sv">${r.n} · ${pct}%</span></div>`; }).join('') || `<p class="muted">${t('stats.none')}</p>`}</div>
        <p class="small muted center-text">${t('stats.note')}${isTrainer() ? '' : t('stats.noteMember')}</p>`
    };
  }

  // ---------------------------------------------------------- Members
  function viewMitglieder() {
    if (!isTrainer()) return { title: t('mem.title'), back: '#/mehr', html: '' };
    const pend = S.members.filter((m) => m.status === 'pending');
    return {
      title: t('mem.title'), back: '#/mehr', action: `<button class="btn sm" data-a="invite">${t('mem.invite')}</button>`,
      html: `${pend.length ? `<h4 class="sec">${t('mem.waiting')}</h4>${pend.map((m) => `<div class="card mrow"><b>${esc(m.name)}</b><div class="row"><button class="btn sm" data-a="approve" data-id="${m.id}">${t('mem.approve')}</button><button class="btn sm danger" data-a="reject" data-id="${m.id}">${t('mem.reject')}</button></div></div>`).join('')}` : ''}
        <h4 class="sec">${t('mem.active', { n: activeMembers().length })}</h4>
        ${activeMembers().map((m) => `<div class="card mrow"><div><b>${esc(m.name)}</b>${posTag(posOf(m.id))} ${isAwayAt(m.id, Date.now()) ? `<span class="tag">🏖️ ${t('away.until', { date: F_.dm.format(awayOf(m).find((a) => a.f <= Date.now() && Date.now() <= a.t).t) })}</span>` : ''} ${m.role === 'trainer' ? `<span class="tag blue">${t('mem.coach')}</span>` : ''} ${m.lang ? `<span class="small">${(I.langs.find((l) => l.code === m.lang) || {}).flag || ''}</span>` : ''}<div class="row small">${skillSelect(m.id)}<a class="link sm" href="#/ziele/${m.id}">🎯 ${t('goal.short')}</a></div></div>
          ${m.id !== uid() ? `<div class="row"><button class="link sm" data-a="role" data-id="${m.id}">${m.role === 'trainer' ? t('mem.toMember') : t('mem.toCoach')}</button><button class="link sm red" data-a="reject" data-id="${m.id}">${t('mem.remove')}</button></div>` : `<span class="muted small">${t('mem.you')}</span>`}</div>`).join('')}
        <p class="small muted">${t('mem.note')} ${t('teams.skillHint')}</p>`
    };
  }

  // ---------------------------------------------------------- Actions
  function confirmDo(msg, fn) {
    return new Promise((resolve, reject) => {
      const m = document.createElement('div'); m.className = 'modal';
      m.innerHTML = `<div class="modal-box pad confirm"><p>${msg}</p><div class="row"><button class="btn ghost" data-c="0">${t('cancel')}</button><button class="btn" data-c="1">${t('ok')}</button></div></div>`;
      m.addEventListener('click', (e) => {
        const b = e.target.closest('[data-c]'); if (!b && e.target !== m) return;
        e.stopPropagation(); m.remove();
        if (b && b.dataset.c === '1') Promise.resolve().then(fn).then(resolve, reject); else resolve();
      });
      document.body.appendChild(m);
    });
  }
  const A = {
    back: (el) => back(el.dataset.to || '#/termine'),
    reload: () => location.reload(),
    'lang-set': (el) => { const m = el.closest('.modal'); if (m) m.remove(); return setLang(el.dataset.l); },
    'lang-open': () => langModal(),
    'demo-login': (el) => DB.demoLogin(el.dataset.id).then(() => go('#/termine')),
    'demo-switch': () => DB.logout(),
    'demo-reset': () => confirmDo(t('demo.resetQ'), () => DB.reset()),
    'login-tab': (el) => { S.loginTab = el.dataset.t; render(true); },
    'reset-pw': async () => {
      const email = ($('input[name=email]') || {}).value;
      if (!email) return toast(t('pw.enterEmail'));
      await DB.resetPw(email); toast(t('pw.sent'));
    },
    logout: () => confirmDo(t('logout.q'), () => DB.logout()),
    install: async () => { if (!S.installEvt) return; S.installEvt.prompt(); await S.installEvt.userChoice; S.installEvt = null; render(true); },
    'push-on': async () => { await DB.enablePush(false); toast(t('push.ok')); render(true); },
    'push-dismiss': () => { S.pushDismissed = true; store.set('vb-push-dismissed', '1'); render(true); },
    'toggle-past': () => { S.showPast = !S.showPast; render(true); },
    rsvp: (el) => setRsvp(el.dataset.id, el.dataset.s),
    remind: async (el) => {
      const ev = S.events.find((e) => e.id === el.dataset.id); const l = rsvpLists(ev);
      if (!l.open.length) return toast(t('ev.allReplied'));
      await push(l.open, 'remindRsvp', evP(ev), '#/termin/' + ev.id); toast(t('ev.reminded', { n: l.open.length }));
    },
    'cancel-ev': async (el) => {
      const ev = S.events.find((e) => e.id === el.dataset.id);
      if (ev.cancelled) { await DB.update('events/' + ev.id, { cancelled: false }); await push('all', 'reactivated', evP(ev), '#/termin/' + ev.id); return toast(t('ev.activeAgain')); }
      return confirmDo(t('ev.cancelQ'), async () => { await DB.update('events/' + ev.id, { cancelled: true }); await push('all', 'cancelled', evP(ev), '#/termin/' + ev.id); toast(t('ev.cancelledT')); });
    },
    'del-ev': (el) => confirmDo(t('ev.deleteQ'), async () => { await DB.remove('events/' + el.dataset.id); go('#/termine'); }),
    'plan-add': () => { $('#plan').insertAdjacentHTML('beforeend', planRow({ text: '', video: '' })); },
    'plan-del': (el) => { const r = el.closest('.plan-row'); if ($('#plan').children.length > 1) r.remove(); else r.querySelectorAll('input,select').forEach((i) => { i.value = ''; }); },
    'ride-join': (el) => DB.update('events/' + el.dataset.id, { ['rides.' + uid()]: { type: 'mit', driver: el.dataset.d } }).then(() => toast(t('cp.joined', { name: nameOf(el.dataset.d) }))),
    'ride-seek': (el) => DB.update('events/' + el.dataset.id, { ['rides.' + uid()]: { type: 'sucht' } }),
    'ride-leave': (el) => DB.update('events/' + el.dataset.id, { ['rides.' + uid()]: DEL }),
    pin: (el) => { const p = S.posts.find((x) => x.id === el.dataset.id); return DB.update('posts/' + p.id, { pinned: !p.pinned }); },
    'del-post': (el) => confirmDo(t('news.deleteQ'), () => DB.remove('posts/' + el.dataset.id)),
    'del-inbox': (el) => DB.remove('inbox/' + el.dataset.id),
    vote: (el) => {
      const p = S.polls.find((x) => x.id === el.dataset.id); const i = Number(el.dataset.i);
      return DB.update('polls/' + p.id, { ['votes.' + uid()]: (p.votes || {})[uid()] === i ? DEL : i });
    },
    'poll-close': (el) => { const p = S.polls.find((x) => x.id === el.dataset.id); return DB.update('polls/' + p.id, { closed: !p.closed }); },
    'poll-del': (el) => confirmDo(t('poll.deleteQ'), () => DB.remove('polls/' + el.dataset.id)),
    vcat: (el) => { S.videoCat = el.dataset.c; render(true); },
    play: (el) => playVideo(el.dataset.id, el.dataset.hw),
    'close-modal': (el, ev) => { if (ev.target === el) { const m = el.closest('.modal'); if (m) m.remove(); } },
    'del-video': (el) => confirmDo(t('vid.deleteQ'), () => DB.remove('videos/' + el.dataset.id)),
    'fee-toggle': (el) => { S.openFee = S.openFee === el.dataset.id ? null : el.dataset.id; render(true); },
    pay: (el) => DB.set('payments/' + el.dataset.u, { paid: { [el.dataset.f]: el.checked } }, true),
    'fee-remind': async (el) => {
      const f = S.fees.find((x) => x.id === el.dataset.id); const open = activeMembers().filter((m) => !paidMap(m.id)[f.id]).map((m) => m.id);
      await push(open, 'feeRemind', { text: f.title, amount: Number(f.amount) || 0 }, '#/kasse'); toast(t('cash.reminded', { n: open.length }));
    },
    'fee-del': (el) => confirmDo(t('cash.deleteQ'), () => DB.remove('fees/' + el.dataset.id)),
    'stat-range': (el) => { S.statRange = el.dataset.r; render(true); },
    approve: async (el) => { await DB.update('members/' + el.dataset.id, { status: 'active' }); await push([el.dataset.id], 'approved', { group: groupName() }, '#/termine'); toast(t('mem.approved')); },
    reject: (el) => confirmDo(t('mem.removeQ', { name: nameOf(el.dataset.id) }), () => DB.remove('members/' + el.dataset.id)),
    role: (el) => { const m = S.members.find((x) => x.id === el.dataset.id); return DB.update('members/' + m.id, { role: m.role === 'trainer' ? 'member' : 'trainer' }); },
    // ----- v2 features
    'cal-view': (el) => { S.calView = el.dataset.v; render(true); },
    'cal-move': (el) => { const d = S.calMonth ? new Date(S.calMonth) : new Date(); d.setDate(1); d.setMonth(d.getMonth() + Number(el.dataset.d)); S.calMonth = d.getTime(); S.calDay = null; render(true); },
    'cal-day': (el) => { S.calDay = S.calDay === el.dataset.k ? null : el.dataset.k; render(true); },
    react: (el) => {
      const path = el.dataset.p; const [col, id] = path.split('/');
      const obj = (col === 'events' ? S.events : S.posts).find((x) => x.id === id) || {};
      return DB.update(path, { ['react.' + uid()]: (obj.react || {})[uid()] === el.dataset.e ? DEL : el.dataset.e });
    },
    'cm-toggle': (el) => { const tg = el.dataset.t; if (S.openComments.has(tg)) S.openComments.delete(tg); else { S.openComments.add(tg); markComments(tg); } render(true); },
    'cm-del': (el) => confirmDo(t('cm.deleteQ'), () => DB.remove('comments/' + el.dataset.id)),
    'guest-del': async (el) => {
      const ev = S.events.find((e) => e.id === el.dataset.id); if (!ev) return;
      const host = el.dataset.h; const i = Number(el.dataset.i);
      const beforeL = rsvpLists(ev); const before = beforeL.confirmed;
      const arr = ((ev.guests || {})[host] || []).filter((_, k) => k !== i);
      await DB.update('events/' + ev.id, { ['guests.' + host]: arr.length ? arr : DEL });
      const nextEv = { ...ev, guests: { ...(ev.guests || {}), [host]: arr } };
      await notifyPromoted(before, rsvpLists(nextEv).confirmed, ev);
      await notifySpotFree(beforeL, nextEv);
    },
    'teams-n': (el) => { const ev = S.events.find((e) => e.id === el.dataset.id); const n = Number(el.dataset.n); S.teamDraft = { ev: ev.id, n, teams: drawTeams(playerPool(ev), n) }; render(true); },
    'teams-draw': (el) => { const ev = S.events.find((e) => e.id === el.dataset.id); const n = Number(el.dataset.n); S.teamDraft = { ev: ev.id, n, teams: drawTeams(playerPool(ev), n) }; render(true); },
    'teams-save': async (el) => {
      const d = S.teamDraft; if (!d) return;
      const teams = { n: d.n }; d.teams.forEach((tm, i) => { teams['t' + i] = tm.map((p) => p.k); });
      const ev = S.events.find((e) => e.id === el.dataset.id);
      await DB.update('events/' + el.dataset.id, { teams, teamsTs: Date.now() });
      await push(rsvpLists(ev).confirmed, 'teams', evP(ev), '#/termin/' + ev.id);
      S.teamDraft = null; toast(t('teams.saved')); go('#/termin/' + el.dataset.id);
    },
    skill: (el) => DB.set('private/skills', { s: { [el.dataset.u]: Number(el.dataset.n) } }, true),
    'read-remind': async (el) => {
      const p = S.posts.find((x) => x.id === el.dataset.id); const reads = p.reads || {};
      const unread = activeMembers().filter((m) => m.id !== p.author && !reads[m.id]).map((m) => m.id);
      await push(unread, 'readRemind', { heading: p.title || p.text.slice(0, 60) }, '#/news'); toast(t('ev.reminded', { n: unread.length }));
    },
    'hw-done': async (el) => {
      const h = S.homework.find((x) => x.id === el.dataset.id); if (!h) return;
      const done = h.done && h.done[uid()];
      await DB.update('homework/' + h.id, { ['done.' + uid()]: done ? DEL : Date.now() });
      if (el.dataset.close) { const m = el.closest('.modal'); if (m) m.remove(); }
      if (!done) toast('✅ ' + t('hw.done'));
    },
    fav: (el) => { const v = S.videos.find((x) => x.id === el.dataset.id); if (!v) return; return DB.update('videos/' + v.id, { ['fav.' + uid()]: v.fav && v.fav[uid()] ? DEL : true }); },
    'away-del': (el) => confirmDo(t('away.deleteQ'), async () => { const list = awayOf(S.me).filter((_, i) => i !== Number(el.dataset.i)); await DB.update('members/' + uid(), { away: list }); render(true); }),
    'quiz-ans': (el) => quizAnswer(Number(el.dataset.i)),
    'quiz-next': () => { QZ.i++; QZ.answered = false; render(true); window.scrollTo(0, 0); },
    'quiz-replay': () => quizReplay(),
    'quiz-restart': () => { Object.assign(QZ, { i: 0, score: 0, answered: false, results: [] }); render(true); window.scrollTo(0, 0); },
    'rules-tab': (el) => { S.rulesTab = el.dataset.v; render(true); },
    'tour-tab': (el) => { S.tourTab = el.dataset.v; render(true); },
    'tour-del': (el) => confirmDo(t('tour.deleteQ'), async () => { await DB.remove('tournaments/' + el.dataset.id); go('#/turniere'); }),
    'match-clear': (el) => confirmDo(t('tour.clearQ'), () => saveMatch(el.dataset.t, el.dataset.m, null)),
    'timer-preset': (el) => { const f = el.closest('form'); const p = TIMER_PRESETS[Number(el.dataset.i)][1]; Object.entries(p).forEach(([k, v]) => { if (f.elements[k]) f.elements[k].value = v; }); timerPaint(f); },
    'timer-pause': () => timerToggle(),
    'timer-skip': () => timerNext(true),
    'timer-reset': () => { timerStop(); TM.ph = null; render(true); },
    'hw-del': (el) => confirmDo(t('hw.deleteQ'), () => DB.remove('homework/' + el.dataset.id)),
    'copy-text': async (el) => { try { await navigator.clipboard.writeText(el.dataset.text); toast('📋 ' + t('copied')); } catch (e) { window.prompt('', el.dataset.text); } },
    'cal-newkey': () => confirmDo(t('abo.newKeyQ'), () => DB.set('settings/cal', { key: Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join(''), ts: Date.now() }, false)),
    'goal-del': (el) => confirmDo(t('goal.deleteQ'), () => saveGoals(goalList().filter((g) => g.id !== el.dataset.id))),
    'goal-step': (el) => saveGoals(goalList().map((g) => { if (g.id !== el.dataset.id) return g; const p = Math.max(0, (Number(g.progress) || 0) + Number(el.dataset.d)); return { ...g, progress: p, done: g.target ? p >= g.target : g.done }; })),
    'goal-done': (el) => saveGoals(goalList().map((g) => (g.id === el.dataset.id ? { ...g, done: !g.done } : g))),
    'goal-share': (el) => DB.set('goals/' + uid(), { list: goalList(), shared: el.checked, updated: Date.now() }, true),
    preset: (el) => { const f = el.closest('form'); f.elements.c1.value = el.dataset.c1; f.elements.c2.value = el.dataset.c2; previewTheme(f); },
    'logo-remove': (el) => { const f = el.closest('form'); f.elements.logoData.value = 'REMOVE'; f.querySelector('.logo-prev').innerHTML = `<span class="muted small">${t('design.noLogo')}</span>`; },
    'design-reset': () => confirmDo(t('design.resetQ'), async () => { await DB.remove('settings/theme'); applyTheme(null); toast(t('saved')); go('#/mehr'); }),
    invite: async () => {
      const text = (I.ui[S.lang]['invite.text'] || I.ui.en['invite.text']).replace('{url}', appUrl());
      if (navigator.share) { try { await navigator.share({ title: groupName(), text }); return; } catch (e) { if (e.name === 'AbortError') return; } }
      window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
    }
  };

  const FORMS = {
    // ----- v3 forms
    async quiz() { /* answers are buttons */ },
    async away(f) {
      const e = f.elements; const fr = dayStart(e.f.value); const to = dayEnd(e.t.value);
      if (!(to >= fr)) throw new Error(t('away.badRange'));
      const keep = awayOf(S.me).filter((a) => a.t > Date.now() - 30 * 864e5);
      await DB.update('members/' + uid(), { away: [...keep, { f: fr, t: to, note: e.note.value.trim() }].sort((a, b) => a.f - b.f).slice(-20) });
      toast('🏖️ ' + t('saved')); render(true);
    },
    async timer(f) {
      TM.ac = TM.ac || (() => { try { return new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } })();
      timerStart(timerReadForm(f));
    },
    async tournament(f) {
      const e = f.elements; const ev = f.dataset.ev ? S.events.find((x) => x.id === f.dataset.ev) : null;
      const names = e.teams.value.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 16);
      if (names.length < 2) throw new Error(t('tour.min2'));
      if (new Set(names.map((x) => x.toLowerCase())).size !== names.length) throw new Error(t('tour.dupes'));
      const format = e.format.value; if (format === 'groups' && names.length < 4) throw new Error(t('tour.min4'));
      const courts = Number(e.courts.value) || 1;
      const { matches, groupOf } = buildTournament(names.length, format, courts);
      const evTeams = ev && ev.teams && ev.teams.n ? ev.teams : null;
      const teams = names.map((n, i) => {
        const keys = evTeams && i < evTeams.n ? evTeams['t' + i] || [] : [];
        return { n, p: keys.map((k) => (k.startsWith('g:') ? (guestName(k) || '?') + ' (G)' : nameOf(k))), g: groupOf[i] || '' };
      });
      const notify = e.push.checked ? (ev ? rsvpLists(ev).confirmed : 'all') : '';
      const id = await DB.add('tournaments', { name: e.name.value.trim(), ev: ev ? ev.id : '', format, courts, sets: Number(e.sets.value) || 1, pts: Number(e.pts.value) || 25, teams, matches, notify, by: uid(), ts: Date.now() });
      if (notify && (notify === 'all' || notify.length)) await push(notify, 'tournament', { name: e.name.value.trim() }, '#/turnier/' + id);
      S.tourTab = 'plan'; toast('🏆 ' + t('tour.created')); go('#/turnier/' + id);
    },
    async match(f) {
      const T = S.tournaments.find((x) => x.id === f.dataset.t); if (!T) return;
      const m = T.matches.find((x) => x.id === f.dataset.m); const ko = !['rr', 'A', 'B'].includes(m.st);
      const sets = [];
      for (let k = 0; k < 3; k++) {
        const a = f.elements['a' + k], b = f.elements['b' + k]; if (!a || !b) break;
        if (a.value === '' && b.value === '') continue;
        if (a.value === '' || b.value === '') throw new Error(t('tour.bothScores'));
        const x = Number(a.value), y = Number(b.value);
        if (x === y) throw new Error(t('tour.noTieSet'));
        sets.push({ a: x, b: y });
      }
      if (!sets.length) throw new Error(t('tour.bothScores'));
      const r = matchRes({ s: sets, done: true });
      if ((ko || Number(T.sets) === 3) && !r.win) throw new Error(t('tour.needWinner'));
      await saveMatch(T.id, m.id, sets);
    },
    async login(f) { const e = f.elements; await DB.login(e.email.value.trim(), e.pw.value); },
    async register(f) { const e = f.elements; await DB.register(e.email.value.trim(), e.pw.value, e.name.value.trim(), S.lang); await notifyNew(e.name.value.trim()); },
    async 'profile-create'(f) { const name = f.elements.name.value.trim(); await DB.set('members/' + uid(), { name, lang: S.lang, role: 'member', status: 'pending', joined: Date.now() }); await notifyNew(name); },
    async profile(f) {
      const pos = [...f.querySelectorAll('input[name=pos]:checked')].map((i) => i.value);
      if (pos.length > 2) throw new Error(t('pos.max2'));
      await DB.update('members/' + uid(), { name: f.elements.name.value.trim(), pos }); toast(t('saved')); go('#/mehr');
    },
    async event(f) {
      const e = f.elements; const id = f.dataset.id; const ev = id ? S.events.find((x) => x.id === id) : null;
      const start = new Date(e.date.value + 'T' + e.from.value);
      let end = new Date(e.date.value + 'T' + (e.to.value || e.from.value));
      if (end <= start) end = new Date(start.getTime() + 2 * 3600e3);
      const plan = [...f.querySelectorAll('.plan-row')].map((r) => ({ text: r.querySelector('[name=ptext]').value.trim(), video: r.querySelector('[name=pvideo]').value })).filter((p) => p.text || p.video);
      const data = { title: e.title.value.trim(), place: e.place.value.trim(), limit: Math.max(0, Number(e.limit.value) || 0), notes: e.notes.value.trim(), plan, carpool: e.carpool.checked, minPlayers: Math.max(0, Number(e.minPlayers.value) || 0), minHours: Number(e.minHours.value) || 4, fb: e.fb.checked, updated: Date.now() };
      if (ev) {
        const before = rsvpLists(ev).confirmed;
        const upd = { ...data, start: start.getTime(), end: end.getTime() };
        if (upd.start !== ev.start) { upd.reminderSent = false; upd.minAlertSent = false; upd.fbAsked = false; }
        await DB.update('events/' + id, upd);
        const merged = { ...ev, ...upd };
        await notifyPromoted(before, rsvpLists(merged).confirmed, merged);
        if (e.notify.checked) await push('all', 'changed', evP(merged), '#/termin/' + id);
        toast(t('saved')); go('#/termin/' + id);
      } else {
        const n = Number(e.repeat.value) || 1; const seriesId = n > 1 ? 's' + Date.now().toString(36) : '';
        let firstId = '';
        for (let i = 0; i < n; i++) {
          const s = new Date(start); s.setDate(s.getDate() + 7 * i); const en = new Date(end); en.setDate(en.getDate() + 7 * i);
          const nid = await DB.add('events', { ...data, start: s.getTime(), end: en.getTime(), rsvp: {}, rides: {}, cancelled: false, reminderSent: false, created: Date.now(), by: uid(), seriesId });
          if (!firstId) firstId = nid;
        }
        if (e.notify.checked) await push('all', n > 1 ? 'newEvents' : 'newEvent', { ...evP({ ...data, start: start.getTime() }), n }, '#/termin/' + firstId);
        toast(t('evf.created', { n })); go('#/termine');
      }
    },
    async attendance(f) {
      const ids = [...f.querySelectorAll('input[name=a]:checked')].map((i) => i.value);
      await DB.update('events/' + f.dataset.id, { attended: Object.fromEntries(ids.map((k) => [k, true])), attendanceDone: true });
      toast(t('att.saved')); go('#/termin/' + f.dataset.id);
    },
    async 'ride-offer'(f) {
      await DB.update('events/' + f.dataset.id, { ['rides.' + uid()]: { type: 'fahrer', seats: Number(f.elements.seats.value), from: f.elements.from.value.trim() } });
      toast(t('cp.saved')); go('#/termin/' + f.dataset.id);
    },
    async message(f) {
      const e = f.elements; const to = f.querySelector('input[name=to]:checked').value; const text = e.text.value.trim(); const wantPush = e.push.checked;
      if (to === 'trainers') {
        await DB.add('inbox', { from: uid(), fromName: S.me.name, text, ts: Date.now() });
        if (wantPush) await push('trainers', 'toCoach', { name: S.me.name, text: text.slice(0, 180) }, '#/postfach');
        toast(t('msg.sentCoaches')); go('#/mehr');
      } else {
        const tr = isTrainer(); const heading = tr && e.title ? e.title.value.trim() : '';
        await DB.add('posts', { type: tr && e.info && e.info.checked ? 'news' : 'msg', title: heading, text, pinned: !!(tr && e.pin && e.pin.checked), author: uid(), authorName: S.me.name, ts: Date.now() });
        if (wantPush) await push('all', heading ? 'news' : 'msg', { heading, name: S.me.name, text: text.slice(0, 180) }, '#/news');
        toast(t('msg.sent')); go('#/news');
      }
    },
    async poll(f) {
      const e = f.elements;
      const opts = e.opts.value.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 10);
      if (opts.length < 2) throw new Error(t('pollf.min2'));
      await DB.add('polls', { question: e.q.value.trim(), options: opts, votes: {}, closed: false, by: uid(), ts: Date.now() });
      if (e.push.checked) await push('all', 'newPoll', { text: e.q.value.trim() }, '#/umfragen');
      toast(t('pollf.started')); go('#/umfragen');
    },
    async video(f) {
      const e = f.elements;
      const data = { title: e.title.value.trim(), url: e.url.value.trim(), category: e.category.value.trim(), description: e.description.value.trim() };
      if (f.dataset.id) await DB.update('videos/' + f.dataset.id, data);
      else {
        await DB.add('videos', { ...data, ts: Date.now(), by: uid() });
        if (e.push && e.push.checked) await push('all', 'newVideo', { text: data.title }, '#/videos');
      }
      toast(t('saved')); go('#/videos');
    },
    // ----- v2 forms
    async comment(f) {
      const text = f.elements.text.value.trim(); if (!text) return;
      const target = f.dataset.t;
      await DB.add('comments', { target, text, author: uid(), authorName: S.me.name, ts: Date.now() });
      f.elements.text.value = ''; markComments(target);
      if (target.startsWith('posts/')) { const p = S.posts.find((x) => 'posts/' + x.id === target); if (p && p.author !== uid()) await push([p.author], 'comment', { name: S.me.name, text: text.slice(0, 160) }, '#/news'); }
      render(true);
    },
    async guest(f) {
      const ev = S.events.find((e) => e.id === f.dataset.id); if (!ev) return;
      const arr = [...((ev.guests || {})[uid()] || []), { n: f.elements.name.value.trim(), t: Date.now(), trial: f.elements.trial.checked, s: Number((f.querySelector('input[name=gs]:checked') || {}).value) || 3 }];
      await DB.update('events/' + ev.id, { ['guests.' + uid()]: arr });
      toast(t('guest.saved')); go('#/termin/' + ev.id);
    },
    async feedback(f) {
      const e = f.elements; const evId = f.dataset.id; const anon = e.anon.checked;
      const data = { event: evId, stars: Number(f.querySelector('input[name=stars]:checked').value), text: e.text.value.trim(), anon, ts: Date.now() };
      if (!anon) { data.by = uid(); data.name = S.me.name; }
      await DB.set('feedback/' + fbId(evId), data, false);
      store.set('vb-fb-' + evId, '1'); toast(t('fb.thanks')); render(true);
    },
    async prefs(f) {
      const on = new Set([...f.querySelectorAll('input[name=cat]:checked')].map((i) => i.value));
      const off = PUSH_CATS.filter((c) => !on.has(c) && (c !== 'coach' || isTrainer()));
      await DB.set('prefs/' + uid(), { off, quiet: { on: f.elements.qon.checked, from: Number(f.elements.qfrom.value), to: Number(f.elements.qto.value) }, updated: Date.now() }, false);
      toast(t('saved')); go('#/mehr');
    },
    async goal(f) {
      const text = f.elements.text.value.trim(); if (!text) return;
      const target = Math.max(0, Number(f.elements.target.value) || 0);
      await saveGoals([...goalList(), { id: 'g' + Date.now().toString(36), text, target, progress: 0, done: false, ts: Date.now() }]);
      f.elements.text.value = ''; f.elements.target.value = ''; render(true);
    },
    async design(f) {
      const e = f.elements; const old = S.theme || {};
      let logo = old.logo || '';
      if (e.logo.files && e.logo.files[0]) logo = await resizeImage(e.logo.files[0], 256);
      else if (e.logoData.value === 'REMOVE') logo = '';
      const th = { name: e.name.value.trim(), c1: e.c1.value, c2: e.c2.value, logo, ts: Date.now() };
      await DB.set('settings/theme', th, false);
      applyTheme(th); toast(t('saved')); go('#/mehr');
    },
    async homework(f) {
      const e = f.elements; const toSome = f.querySelector('input[name=to]:checked').value === 'some';
      const who = [...f.querySelectorAll('input[name=who]:checked')].map((i) => i.value);
      if (toSome && !who.length) throw new Error(t('hw.pickSome'));
      const v = S.videos.find((x) => x.id === e.video.value);
      await DB.add('homework', { video: e.video.value, note: e.note.value.trim(), due: e.due.value || '', to: toSome ? who : 'all', done: {}, by: uid(), ts: Date.now() });
      if (e.push.checked) await push(toSome ? who : 'all', 'homework', { text: v ? v.title : '' }, '#/videos');
      toast(t('hw.created')); go('#/videos');
    },
    async fee(f) {
      const e = f.elements; const amount = Number(e.amount.value) || 0;
      await DB.add('fees', { title: e.title.value.trim(), amount, due: e.due.value || '', ts: Date.now() });
      if (e.push.checked) await push('all', 'newFee', { text: e.title.value.trim(), amount }, '#/kasse');
      toast(t('feef.created')); go('#/kasse');
    }
  };
  const goalList = () => ((S.goals && S.goals.list) || []).slice();
  const saveGoals = (list) => DB.set('goals/' + uid(), { list, shared: !!(S.goals && S.goals.shared), updated: Date.now() }, true);
  function resizeImage(file, max) {
    return new Promise((resolve, reject) => {
      const img = new Image(); const url = URL.createObjectURL(file);
      img.onload = () => { const sc = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); resolve(c.toDataURL('image/png')); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(t('design.badImage'))); };
      img.src = url;
    });
  }
  function previewTheme(f) { S.previewing = true; applyTheme({ ...(S.theme || {}), c1: f.elements.c1.value, c2: f.elements.c2.value }, true); }
  async function notifyNew(name) { try { await DB.add('outbox', { to: 'trainers', k: 'signup', p: { name }, link: '#/mitglieder', from: uid(), ts: Date.now() }); kickPush(); } catch (e) { /* */ } }

  document.addEventListener('click', async (ev) => {
    const el = ev.target.closest('[data-a]'); if (!el) return;
    const fn = A[el.dataset.a]; if (!fn) return;
    if (el.tagName === 'A' && el.getAttribute('href') === '#/mehr') ev.preventDefault();
    if (el.tagName === 'BUTTON') ev.preventDefault();
    try { await fn(el, ev); } catch (e) { toast('⚠️ ' + esc(errMsg(e)), 'err'); console.error(e); }
  });
  document.addEventListener('submit', async (ev) => {
    const f = ev.target.closest('form[data-f]'); if (!f) return;
    ev.preventDefault();
    const btn = f.querySelector('button:not([type=button])'); if (btn) btn.disabled = true;
    try { await FORMS[f.dataset.f](f); } catch (e) { toast('⚠️ ' + esc(errMsg(e)), 'err'); console.error(e); } finally { if (btn && btn.isConnected) btn.disabled = false; }
  });
  document.addEventListener('input', (e) => {
    if (e.target.id === 'q') { S.q = e.target.value; const r = $('#results'); if (r) r.innerHTML = searchResults(); }
    if (e.target.form && e.target.form.dataset.f === 'design' && e.target.type === 'color') previewTheme(e.target.form);
    if (e.target.form && e.target.form.dataset.f === 'timer' && !TM.ph) timerPaint(e.target.form);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { const m = $('.modal'); if (m) m.remove(); } });
  window.addEventListener('hashchange', () => { S.navCount++; const m = $('.modal'); if (m) m.remove(); if (TM.run && route().r !== 'timer') timerToggle(); render(true); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && TM.run) wakeOn(); });
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); S.installEvt = e; });

  // Demo: show the push that would be sent, in the current language
  function demoPushText(d) {
    const p = { ...(d.p || {}) };
    if (p.start) p.when = whenTxt(p.start);
    if (p.place != null) p.place = p.place ? ' · ' + p.place : '';
    if (p.amount != null) p.amount = euro(p.amount);
    return I.pushText(S.lang, d.k, p);
  }

  // ---------------------------------------------------------- Start
  async function start() {
    render(true);
    try { DB = await self.Data.create(C); }
    catch (e) { console.error(e); S.error = 'err.connect'; render(true); return; }
    S.ready = true;
    window.addEventListener('demo-push', (e) => {
      const d = e.detail || {};
      const who = d.to === 'all' ? t('demo.all') : d.to === 'trainers' ? t('demo.coaches') : Array.isArray(d.to) ? d.to.map(nameOf).join(', ') : '';
      const [title, body] = demoPushText(d);
      toast(`<small>📲 ${t('demo.pushTo', { who })}</small><br><b>${esc(title)}</b><br>${esc(body)}`, 'push');
    });
    DB.onForegroundMessage((n) => toast(`<b>🔔 ${esc(n.title || '')}</b><br>${esc(n.body || '')}`, 'push'));
    DB.onAuth(onAuth);
    DB.watchDoc('settings/theme', (th) => { applyTheme(th); schedule(); });
    if ('serviceWorker' in navigator && !C.noServiceWorker && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW', e));
    }
  }
  start();
})();

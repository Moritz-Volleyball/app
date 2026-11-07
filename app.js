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
    lang: null, langPicker: false
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

  function toast(msg, kind = '') {
    let box = $('#toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
    const el = document.createElement('div'); el.className = 'toast ' + kind; el.innerHTML = msg; box.appendChild(el);
    setTimeout(() => el.classList.add('out'), 3200); setTimeout(() => el.remove(), 3700);
  }
  const errMsg = (e) => { const k = e && e.code ? 'err.' + e.code : ''; const v = k ? t(k) : ''; return v && v !== k ? v : ((e && e.message) || String(e)); };

  // ---------------------------------------------------------- Event logic
  function rsvpLists(ev) {
    const r = ev.rsvp || {};
    const yes = Object.entries(r).filter(([, v]) => v && v.s === 'yes').sort((a, b) => a[1].t - b[1].t).map(([k]) => k);
    const lim = Number(ev.limit) || 0;
    const confirmed = lim > 0 ? yes.slice(0, lim) : yes;
    const waitlist = lim > 0 ? yes.slice(lim) : [];
    const no = Object.entries(r).filter(([, v]) => v && v.s === 'no').map(([k]) => k);
    const answered = new Set(Object.keys(r));
    const open = activeMembers().map((m) => m.id).filter((id) => !answered.has(id));
    return { confirmed, waitlist, no, open, lim };
  }
  function myStatus(ev) {
    const l = rsvpLists(ev); const me = uid();
    if (l.confirmed.includes(me)) return { k: 'yes', label: t('st.yes') };
    const w = l.waitlist.indexOf(me); if (w >= 0) return { k: 'wait', label: t('st.wait', { n: w + 1 }) };
    if (l.no.includes(me)) return { k: 'no', label: t('st.no') };
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
  async function setRsvp(id, s) {
    const ev = S.events.find((e) => e.id === id); if (!ev) return;
    const cur = (ev.rsvp || {})[uid()];
    const entry = s === 'yes' ? { s: 'yes', t: cur && cur.s === 'yes' ? cur.t : Date.now() } : { s: 'no', t: Date.now() };
    const before = rsvpLists(ev).confirmed;
    const nextEv = { ...ev, rsvp: { ...(ev.rsvp || {}), [uid()]: entry } };
    await DB.update('events/' + id, { ['rsvp.' + uid()]: entry });
    await notifyPromoted(before, rsvpLists(nextEv).confirmed, ev);
    const st = myStatus(nextEv);
    toast(s === 'yes' ? (st.k === 'wait' ? t('rsvp.wait', { status: st.label }) : t('rsvp.yes')) : t('rsvp.no'));
  }
  function icsFor(ev) {
    const f = (ts) => new Date(ts).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const e = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//' + e(C.publisher) + '//Volleyball//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      'UID:' + ev.id + '@volleyball-app', 'DTSTAMP:' + f(Date.now()), 'DTSTART:' + f(ev.start), 'DTEND:' + f(ev.end || ev.start + 7200e3),
      'SUMMARY:' + e(ev.title + ' – ' + (C.groupName || '')), 'LOCATION:' + e(ev.place), 'DESCRIPTION:' + e(ev.notes),
      'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:' + e(ev.title), 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  }
  function gcalUrl(ev) {
    const f = (ts) => new Date(ts).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const p = new URLSearchParams({ action: 'TEMPLATE', text: ev.title + ' – ' + (C.groupName || ''), dates: f(ev.start) + '/' + f(ev.end || ev.start + 7200e3), location: ev.place || '', details: ev.notes || '' });
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
    if (isTrainer()) { w('payments', 'payments'); w('inbox', 'inbox'); }
    else S.dataSubs.push(DB.watchDoc('payments/' + uid(), (d) => { S.myPay = d; schedule(); }));
  }
  function onAuth(u) {
    unsub(S.authSubs); unsub(S.dataSubs); S.dataKey = '';
    Object.assign(S, { user: u, me: undefined, members: [], events: [], posts: [], polls: [], videos: [], fees: [], payments: [], inbox: [], myPay: null });
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
  const FORM_ROUTES = new Set(['termin-neu', 'termin-edit', 'nachricht', 'umfrage-neu', 'video-neu', 'video-edit', 'anwesenheit', 'profil', 'beitrag-neu', 'fahrt']);
  let lastKey = '', rq = false;
  const schedule = () => { if (rq) return; rq = true; requestAnimationFrame(() => { rq = false; render(false); }); };
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
  }

  const TABS = [
    ['termine', '📅', 'tab.events', ['termine', 'termin', 'termin-neu', 'termin-edit', 'anwesenheit', 'fahrt']],
    ['news', '📣', 'tab.news', ['news', 'nachricht']],
    ['umfragen', '📊', 'tab.polls', ['umfragen', 'umfrage-neu']],
    ['videos', '🎬', 'tab.videos', ['videos', 'video-neu', 'video-edit']],
    ['mehr', '☰', 'tab.more', ['mehr', 'kasse', 'beitrag-neu', 'statistik', 'mitglieder', 'postfach', 'profil', 'install']]
  ];
  const VIEWS = {
    termine: viewTermine, termin: viewTermin, 'termin-neu': viewTerminForm, 'termin-edit': viewTerminForm, anwesenheit: viewAnwesenheit, fahrt: viewFahrt,
    news: viewNews, nachricht: viewNachricht, umfragen: viewUmfragen, 'umfrage-neu': viewUmfrageForm,
    videos: viewVideos, 'video-neu': viewVideoForm, 'video-edit': viewVideoForm,
    mehr: viewMehr, kasse: viewKasse, 'beitrag-neu': viewBeitragForm, statistik: viewStatistik, mitglieder: viewMitglieder, postfach: viewPostfach, profil: viewProfil, install: viewInstall
  };
  const curFlag = () => (I.langs.find((l) => l.code === S.lang) || I.langs[0]).flag;
  function shell(r, id) {
    const v = (VIEWS[r] || viewTermine)(id);
    const pending = isTrainer() ? S.members.filter((m) => m.status === 'pending').length + S.inbox.length : 0;
    const nav = TABS.map(([k, ic, lb, group]) => `<a href="#/${k}" class="${group.includes(r) ? 'on' : ''}"><span class="ic">${ic}${k === 'mehr' && pending ? `<i class="dot">${pending}</i>` : ''}</span><span>${t(lb)}</span></a>`).join('');
    return `${DB.demo ? `<div class="demo-bar">${t('demo.bar', { name: S.me.name })}${isTrainer() ? ' (' + t('demo.trainer') + ')' : ''} · <button data-a="demo-switch">${t('demo.switch')}</button></div>` : ''}
      <header class="top">${v.back ? `<button class="back" data-a="back" data-to="${esc(v.back)}" aria-label="${t('back')}">‹</button>` : '<div class="logo">🏐</div>'}
        <h1>${esc(v.title)}</h1>${v.action || ''}<button class="langbtn" data-a="lang-open" aria-label="${t('lang.change')}">${curFlag()}</button></header>
      <main id="main"><div class="wrap">${v.html}</div></main>
      <nav class="tabs">${nav}</nav>`;
  }

  // ---------------------------------------------------------- Language picker
  function viewLangPicker() {
    // Title in all three languages, because the language is not chosen yet
    return `<div class="login lang-pick">
      <div class="brand"><div class="ball">🏐</div><h2>${esc(C.groupName || 'Volleyball')}</h2></div>
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
    return `<div class="brand"><div class="ball">🏐</div><h2>${esc(C.groupName || 'Volleyball')}</h2><p class="muted">${t('publisher', { name: C.publisher || '' })}</p>
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
  function evCard(ev) {
    const l = rsvpLists(ev); const st = myStatus(ev); const past = (ev.end || ev.start) < Date.now();
    const pills = [`<span class="pill ok">✅ ${l.confirmed.length}${l.lim ? '/' + l.lim : ''}</span>`];
    if (l.waitlist.length) pills.push(`<span class="pill wait">${t('ev.waitN', { n: l.waitlist.length })}</span>`);
    if (ev.carpool) pills.push(`<span class="pill">${t('ev.carpool')}</span>`);
    if (ev.plan && ev.plan.length) pills.push(`<span class="pill">${t('ev.plan')}</span>`);
    return `<div class="card ev ${ev.cancelled ? 'cancelled' : ''} ${past ? 'past' : ''}">
      <a class="ev-top" href="#/termin/${ev.id}">
        <div class="ev-date"><b>${F_.shortDay.format(ev.start)}</b><span>${F_.dm.format(ev.start)}</span></div>
        <div class="ev-body"><div class="ev-title">${esc(ev.title)}${ev.cancelled ? ` <span class="tag red">${t('ev.cancelledTag')}</span>` : ''}</div>
          <div class="muted small">${timeRange(ev)}${ev.place ? ' · ' + esc(ev.place) : ''}</div>
          <div class="pills">${pills.join('')}</div></div>
        <div class="st st-${st.k}">${st.label}</div></a>
      ${!past && !ev.cancelled ? `<div class="ev-actions">${rsvpButtons(ev, st, false)}</div>` : ''}
    </div>`;
  }
  function viewTermine() {
    const now = Date.now();
    const sorted = [...S.events].sort((a, b) => a.start - b.start);
    const up = sorted.filter((e) => (e.end || e.start) >= now);
    const past = sorted.filter((e) => (e.end || e.start) < now).reverse().slice(0, 12);
    const open = up.filter((e) => !e.cancelled && myStatus(e).k === 'open').length;
    return {
      title: t('ev.title'),
      action: isTrainer() ? `<a class="btn sm" href="#/termin-neu">${t('ev.add')}</a>` : '',
      html: `${pushBanner()}
        ${open ? `<div class="hint">${t('ev.openHint', { n: open })}</div>` : ''}
        ${up.length ? up.map(evCard).join('') : `<div class="empty">${t('ev.none')}${isTrainer() ? `<br><a class="btn" href="#/termin-neu">${t('ev.first')}</a>` : ''}</div>`}
        ${past.length ? `<button class="link" data-a="toggle-past">${S.showPast ? t('ev.hidePast') : t('ev.showPast')}</button>${S.showPast ? past.map(evCard).join('') : ''}` : ''}`
    };
  }
  const chips = (ids, cls = '') => (ids.length ? ids.map((id) => `<span class="chip ${cls}">${esc(nameOf(id))}</span>`).join('') : '<span class="muted small">–</span>');
  function viewTermin(id) {
    const ev = S.events.find((e) => e.id === id);
    if (!ev) return { title: t('ev.session'), back: '#/termine', html: `<div class="empty">${t('ev.notFound')}</div>` };
    const l = rsvpLists(ev); const st = myStatus(ev); const now = Date.now();
    const past = (ev.end || ev.start) < now; const started = ev.start < now;
    const vids = Object.fromEntries(S.videos.map((v) => [v.id, v]));
    const plan = (ev.plan || []).filter((p) => p.text || p.video);
    const ics = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(icsFor(ev));
    const attended = Object.keys(ev.attended || {}).filter((k) => ev.attended[k]);
    let html = `<div class="card">
      ${ev.cancelled ? `<div class="alert red">${t('ev.cancelled')}</div>` : ''}
      <h2 class="ev-h">${esc(ev.title)}</h2>
      <div class="info"><span>📅</span><div>${esc(F_.long.format(ev.start))}<br><b>${timeRange(ev)}</b></div></div>
      ${ev.place ? `<div class="info"><span>📍</span><div><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.place)}" target="_blank" rel="noopener">${esc(ev.place)}</a></div></div>` : ''}
      ${ev.notes ? `<div class="info"><span>📝</span><div>${linkify(ev.notes)}</div></div>` : ''}
      ${l.lim ? `<div class="info"><span>👥</span><div>${t('ev.places', { n: l.lim, free: Math.max(0, l.lim - l.confirmed.length) })}</div></div>` : ''}
      ${!past && !ev.cancelled ? `<div class="rsvp-big">${rsvpButtons(ev, st, true)}</div>
        <p class="center-text small">${t('ev.yourStatus')} <b class="st-t st-${st.k}">${st.label}</b>${st.k === 'wait' ? t('ev.waitExplain') : ''}</p>` : ''}
    </div>`;
    html += `<div class="card"><h3>${t('ev.participants')}</h3>
      <div class="grp"><div class="gl">${t('ev.confirmed', { n: l.confirmed.length + (l.lim ? '/' + l.lim : '') })}</div>${chips(l.confirmed, 'ok')}</div>
      ${l.waitlist.length ? `<div class="grp"><div class="gl">${t('ev.waitlist', { n: l.waitlist.length })}</div>${l.waitlist.map((x, i) => `<span class="chip wait">${i + 1}. ${esc(nameOf(x))}</span>`).join('')}</div>` : ''}
      <div class="grp"><div class="gl">${t('ev.declined', { n: l.no.length })}</div>${chips(l.no, 'no')}</div>
      ${!past ? `<div class="grp"><div class="gl">${t('ev.noReply', { n: l.open.length })}</div>${chips(l.open)}</div>` : ''}
      ${ev.attendanceDone ? `<div class="grp"><div class="gl">${t('ev.attended', { n: attended.length })}</div>${chips(attended, 'ok')}</div>` : ''}
    </div>`;
    if (plan.length) {
      html += `<div class="card"><h3>${t('ev.planT')}</h3><ol class="plan">${plan.map((p) => {
        const v = p.video && vids[p.video];
        return `<li><span>${esc(p.text || (v ? v.title : ''))}</span>${v ? `<button class="btn sm ghost" data-a="play" data-id="${v.id}">${t('ev.video')}</button>` : ''}</li>`;
      }).join('')}</ol></div>`;
    }
    if (ev.carpool) html += carpoolCard(ev, past);
    html += `<div class="card"><h3>${t('ev.cal')}</h3><div class="row wrap-row">
      <a class="btn ghost sm" href="${ics}" download="${esc(ev.title.replace(/[^\p{L}\p{N}-]+/gu, '_'))}.ics">${t('ev.ics')}</a>
      <a class="btn ghost sm" href="${gcalUrl(ev)}" target="_blank" rel="noopener">${t('ev.gcal')}</a></div></div>`;
    if (isTrainer()) {
      html += `<div class="card"><h3>${t('ev.coach')}</h3><div class="row wrap-row">
        <a class="btn sm ghost" href="#/termin-edit/${ev.id}">${t('ev.edit')}</a>
        ${!past && !ev.cancelled ? `<button class="btn sm ghost" data-a="remind" data-id="${ev.id}">${t('ev.remind', { n: l.open.length })}</button>` : ''}
        ${started ? `<a class="btn sm ghost" href="#/anwesenheit/${ev.id}">${t('ev.attendance')}</a>` : ''}
        ${!past ? `<button class="btn sm ghost" data-a="cancel-ev" data-id="${ev.id}">${ev.cancelled ? t('ev.reactivate') : t('ev.cancel')}</button>` : ''}
        <button class="btn sm danger" data-a="del-ev" data-id="${ev.id}">${t('ev.delete')}</button></div>
        ${!past ? `<p class="muted small">${t('ev.autoRemind')}</p>` : ''}</div>`;
    }
    return { title: ev.title, back: '#/termine', html };
  }
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
    const d = ev || { title: t('evf.defaultTitle'), start: nextSlot(last), end: 0, place: last ? last.place : '', limit: last ? last.limit : 0, notes: '', plan: [], carpool: false };
    if (!d.end) d.end = d.start + 2 * 3600e3;
    const plan = d.plan && d.plan.length ? d.plan : [{ text: '', video: '' }];
    return {
      title: ev ? t('evf.edit') : t('evf.new'), back: ev ? '#/termin/' + ev.id : '#/termine',
      html: `<form class="card" data-f="event" data-id="${ev ? ev.id : ''}">
        <label>${t('evf.title')}<input name="title" required maxlength="60" value="${esc(d.title)}" list="titles"></label>
        <datalist id="titles">${t('evf.titles').map((x) => `<option>${esc(x)}</option>`).join('')}</datalist>
        <div class="grid3"><label>${t('evf.date')}<input name="date" type="date" required value="${toDateInput(d.start)}"></label>
        <label>${t('evf.from')}<input name="from" type="time" required value="${toTimeInput(d.start)}"></label>
        <label>${t('evf.to')}<input name="to" type="time" value="${toTimeInput(d.end)}"></label></div>
        <label>${t('evf.place')}<input name="place" maxlength="100" value="${esc(d.place)}" placeholder="${t('evf.placePh')}"></label>
        <label>${t('evf.limit')} <span class="muted small">${t('evf.limitHint')}</span><input name="limit" type="number" min="0" max="200" value="${Number(d.limit) || 0}"></label>
        <label>${t('evf.notes')}<textarea name="notes" rows="3" maxlength="1000">${esc(d.notes)}</textarea></label>
        <fieldset><legend>${t('evf.plan')}</legend><div id="plan">${plan.map(planRow).join('')}</div>
          <button type="button" class="btn sm ghost" data-a="plan-add">${t('evf.addEx')}</button></fieldset>
        <label class="check"><input type="checkbox" name="carpool" ${d.carpool ? 'checked' : ''}> ${t('evf.carpool')}</label>
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
    return {
      title: t('news.title'), action: `<a class="btn sm" href="#/nachricht">${t('news.write')}</a>`,
      html: list.length ? list.map((p) => `<div class="card post ${p.pinned ? 'pinned' : ''}">
          <div class="post-h"><span class="tag ${p.type === 'news' ? 'blue' : ''}">${p.pinned ? '📌 ' : ''}${p.type === 'news' ? t('news.info') : t('news.msg')}</span>
          <span class="muted small">${esc(p.authorName || nameOf(p.author))} · ${rel(p.ts)}</span></div>
          ${p.title ? `<h3>${esc(p.title)}</h3>` : ''}<p>${linkify(p.text)}</p>
          ${isTrainer() || p.author === uid() ? `<div class="row">${isTrainer() ? `<button class="link sm" data-a="pin" data-id="${p.id}">${p.pinned ? t('news.unpin') : t('news.pin')}</button>` : ''}<button class="link sm red" data-a="del-post" data-id="${p.id}">${t('delete')}</button></div>` : ''}
        </div>`).join('') : `<div class="empty">${t('news.none')}</div>`
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
  function viewVideos() {
    const cats = [...new Set(S.videos.map((v) => v.category).filter(Boolean))];
    const list = S.videos.filter((v) => S.videoCat === '*' || v.category === S.videoCat).sort((a, b) => b.ts - a.ts);
    const chip = (c, label) => `<button class="chip ${S.videoCat === c ? 'on' : ''}" data-a="vcat" data-c="${esc(c)}">${esc(label)}</button>`;
    return {
      title: t('vid.title'), action: isTrainer() ? `<a class="btn sm" href="#/video-neu">${t('vid.add')}</a>` : '',
      html: `<div class="chips-row">${chip('*', t('vid.all'))}${cats.map((c) => chip(c, c)).join('')}</div>
        ${list.length ? `<div class="vgrid">${list.map((v) => {
          const y = ytId(v.url);
          return `<div class="vcard"><button class="thumb" data-a="play" data-id="${v.id}" aria-label="${t('vid.play')}">${y ? `<img loading="lazy" src="https://i.ytimg.com/vi/${y}/hqdefault.jpg" alt="">` : ''}<span class="play">▶</span></button>
            <div class="vbody"><span class="tag">${esc(v.category || t('vid.general'))}</span><h4>${esc(v.title)}</h4>${v.description ? `<p class="small muted">${esc(v.description)}</p>` : ''}
            ${isTrainer() ? `<div class="row"><a class="link sm" href="#/video-edit/${v.id}">${t('vid.edit')}</a><button class="link sm red" data-a="del-video" data-id="${v.id}">${t('delete')}</button></div>` : ''}</div></div>`;
        }).join('')}</div>` : `<div class="empty">${t('vid.none')}</div>`}`
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
  function playVideo(id) {
    const v = S.videos.find((x) => x.id === id); if (!v) return;
    const y = ytId(v.url);
    if (!y && v.url) { window.open(v.url, '_blank', 'noopener'); return; }
    const m = document.createElement('div'); m.className = 'modal'; m.dataset.a = 'close-modal';
    m.innerHTML = `<div class="modal-box"><button class="x close" data-a="close-modal" aria-label="${t('close')}">✕</button>
      ${y ? `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${y}?autoplay=1&rel=0&playsinline=1&hl=${S.lang}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>` : `<div class="video ph-video">🏐<p>${t('demo.noVideo')}</p></div>`}
      <div class="pad"><h3>${esc(v.title)}</h3>${v.description ? `<p class="muted">${esc(v.description)}</p>` : ''}</div></div>`;
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
          ${item('#/mehr', '🔔', t('more.push'), pushTxt, 0, perm === 'granted' || DB.demo ? '' : 'push-on')}
          ${!isStandalone() ? item('#/install', '📲', t('more.install'), t('more.installSub')) : ''}
          ${item('#/nachricht/trainer', '✉️', t('more.toCoach'), t('more.toCoachSub'))}
          ${item('#/kasse', '💶', t('more.cash'), tr ? t('more.cashCoach') : t('more.cashMember'))}
          ${item('#/statistik', '📈', t('more.stats'))}
          ${item('#/mehr', '💬', t('more.invite'), t('more.inviteSub'), 0, 'invite')}
        </div>
        ${tr ? `<h4 class="sec">${t('more.coachArea')}</h4><div class="menu">
          ${item('#/mitglieder', '👥', t('more.members'), pend ? t('more.waiting', { n: pend }) : t('more.active', { n: activeMembers().length }), pend)}
          ${item('#/postfach', '📥', t('more.inbox'), t('more.inboxSub'), S.inbox.length)}
        </div>` : ''}
        <div class="menu">${DB.demo ? item('#/mehr', '🔄', t('more.demoSwitch'), '', 0, 'demo-switch') + item('#/mehr', '♻️', t('demo.reset'), '', 0, 'demo-reset') : item('#/mehr', '🚪', t('logout'), '', 0, 'logout')}</div>
        <p class="center-text small muted">${esc(C.appName || 'Volleyball')} · ${t('publisher', { name: C.publisher || '' })}<br>${t('more.version', { v: '1.1' })}</p>`
    };
  }
  function viewProfil() {
    return { title: t('profile.title'), back: '#/mehr', html: `<form class="card" data-f="profile"><label>${t('f.name')}<input name="name" required maxlength="40" value="${esc(S.me.name)}"></label><button class="btn block">${t('evf.save')}</button></form>${S.user.email ? `<p class="muted small center-text">${t('profile.as', { email: S.user.email })}</p>` : ''}` };
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
        ${activeMembers().map((m) => `<div class="card mrow"><div><b>${esc(m.name)}</b> ${m.role === 'trainer' ? `<span class="tag blue">${t('mem.coach')}</span>` : ''} ${m.lang ? `<span class="small">${(I.langs.find((l) => l.code === m.lang) || {}).flag || ''}</span>` : ''}</div>
          ${m.id !== uid() ? `<div class="row"><button class="link sm" data-a="role" data-id="${m.id}">${m.role === 'trainer' ? t('mem.toMember') : t('mem.toCoach')}</button><button class="link sm red" data-a="reject" data-id="${m.id}">${t('mem.remove')}</button></div>` : `<span class="muted small">${t('mem.you')}</span>`}</div>`).join('')}
        <p class="small muted">${t('mem.note')}</p>`
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
    play: (el) => playVideo(el.dataset.id),
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
    approve: async (el) => { await DB.update('members/' + el.dataset.id, { status: 'active' }); await push([el.dataset.id], 'approved', { group: C.groupName || '' }, '#/termine'); toast(t('mem.approved')); },
    reject: (el) => confirmDo(t('mem.removeQ', { name: nameOf(el.dataset.id) }), () => DB.remove('members/' + el.dataset.id)),
    role: (el) => { const m = S.members.find((x) => x.id === el.dataset.id); return DB.update('members/' + m.id, { role: m.role === 'trainer' ? 'member' : 'trainer' }); },
    invite: async () => {
      const text = (I.ui[S.lang]['invite.text'] || I.ui.en['invite.text']).replace('{url}', appUrl());
      if (navigator.share) { try { await navigator.share({ title: C.groupName, text }); return; } catch (e) { if (e.name === 'AbortError') return; } }
      window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
    }
  };

  const FORMS = {
    async login(f) { const e = f.elements; await DB.login(e.email.value.trim(), e.pw.value); },
    async register(f) { const e = f.elements; await DB.register(e.email.value.trim(), e.pw.value, e.name.value.trim(), S.lang); await notifyNew(e.name.value.trim()); },
    async 'profile-create'(f) { const name = f.elements.name.value.trim(); await DB.set('members/' + uid(), { name, lang: S.lang, role: 'member', status: 'pending', joined: Date.now() }); await notifyNew(name); },
    async profile(f) { await DB.update('members/' + uid(), { name: f.elements.name.value.trim() }); toast(t('saved')); go('#/mehr'); },
    async event(f) {
      const e = f.elements; const id = f.dataset.id; const ev = id ? S.events.find((x) => x.id === id) : null;
      const start = new Date(e.date.value + 'T' + e.from.value);
      let end = new Date(e.date.value + 'T' + (e.to.value || e.from.value));
      if (end <= start) end = new Date(start.getTime() + 2 * 3600e3);
      const plan = [...f.querySelectorAll('.plan-row')].map((r) => ({ text: r.querySelector('[name=ptext]').value.trim(), video: r.querySelector('[name=pvideo]').value })).filter((p) => p.text || p.video);
      const data = { title: e.title.value.trim(), place: e.place.value.trim(), limit: Math.max(0, Number(e.limit.value) || 0), notes: e.notes.value.trim(), plan, carpool: e.carpool.checked, updated: Date.now() };
      if (ev) {
        const before = rsvpLists(ev).confirmed;
        const upd = { ...data, start: start.getTime(), end: end.getTime() };
        if (upd.start !== ev.start) upd.reminderSent = false;
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
    async fee(f) {
      const e = f.elements; const amount = Number(e.amount.value) || 0;
      await DB.add('fees', { title: e.title.value.trim(), amount, due: e.due.value || '', ts: Date.now() });
      if (e.push.checked) await push('all', 'newFee', { text: e.title.value.trim(), amount }, '#/kasse');
      toast(t('feef.created')); go('#/kasse');
    }
  };
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
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { const m = $('.modal'); if (m) m.remove(); } });
  window.addEventListener('hashchange', () => { S.navCount++; const m = $('.modal'); if (m) m.remove(); render(true); });
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
      const who = d.to === 'all' ? t('msg.all').replace(/^\S+\s/, '') : d.to === 'trainers' ? t('msg.coaches').replace(/^\S+\s/, '') : Array.isArray(d.to) ? d.to.map(nameOf).join(', ') : '';
      const [title, body] = demoPushText(d);
      toast(`<small>📲 ${t('demo.pushTo', { who })}</small><br><b>${esc(title)}</b><br>${esc(body)}`, 'push');
    });
    DB.onForegroundMessage((n) => toast(`<b>🔔 ${esc(n.title || '')}</b><br>${esc(n.body || '')}`, 'push'));
    DB.onAuth(onAuth);
    if ('serviceWorker' in navigator && !C.noServiceWorker && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW', e));
    }
  }
  start();
})();

// Data layer: same interface for Firebase (live) and demo (local in the browser).
(function () {
  'use strict';
  const DEL = { __del: true };
  const arrayUnion = (...v) => ({ __arru: v });
  const FB_VERSION = '10.12.2';
  const err = (code) => { const e = new Error(code); e.code = code; return e; };
  const clone = (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));

  // ---------------------------------------------------------- DEMO
  function seed() {
    const now = new Date();
    const H = 3600e3, D = 24 * H;
    const m = (id, name, role = 'member', status = 'active') => [id, { name, role, status, joined: Date.now() - 90 * D }];
    const members = Object.fromEntries([
      m('u_moritz', 'Moritz', 'trainer'), m('u_lena', 'Lena'), m('u_jonas', 'Jonas'), m('u_sara', 'Sara'),
      m('u_ali', 'Ali'), m('u_mia', 'Mia'), m('u_paul', 'Paul'), m('u_nina', 'Nina'), m('u_tim', 'Tim'),
      m('u_eva', 'Eva'), m('u_ben', 'Ben'), m('u_lara', 'Lara'), m('u_tom', 'Tom', 'member', 'pending')
    ]);
    const ids = Object.keys(members).filter((k) => members[k].status === 'active');
    // nächster Dienstag 19:00
    const tue = new Date(now); tue.setHours(19, 0, 0, 0);
    while (tue.getDay() !== 2 || tue < now) tue.setDate(tue.getDate() + 1);
    const events = {};
    const plan1 = [{ text: 'Warm-up + mobility (10 min)', video: 'v1' }, { text: 'Setting in pairs', video: 'v2' }, { text: 'Serve receive', video: 'v4' }, { text: 'Final game 6 vs 6', video: '' }];
    for (let i = -8; i < 4; i++) {
      const s = new Date(tue); s.setDate(s.getDate() + 7 * i);
      const e = new Date(s); e.setHours(21, 0);
      const rsvp = {};
      ids.forEach((u, k) => {
        const r = (k * 7 + i * 3 + 11) % 10;
        if (i >= 0 && u === 'u_lena') return; // Lena hat noch nicht geantwortet
        if (r < 7) rsvp[u] = { s: 'yes', t: s.getTime() - 5 * D + k * H };
        else if (r < 9) rsvp[u] = { s: 'no', t: s.getTime() - 3 * D };
      });
      if (i === 0) { rsvp.u_moritz = { s: 'yes', t: s.getTime() - 6 * D }; }
      events['e' + (i + 10)] = {
        title: 'Training', start: s.getTime(), end: e.getTime(), place: 'Park Sports Hall, Court 2',
        limit: 12, notes: i === 0 ? 'Please bring indoor shoes. Drinks together afterwards?' : '',
        plan: i === 0 ? plan1 : [], carpool: false, rsvp, rides: {}, cancelled: false, reminderSent: i < 0,
        created: s.getTime() - 14 * D, by: 'u_moritz'
      };
      if (i < 0) { events['e' + (i + 10)].attendanceDone = true; events['e' + (i + 10)].attended = Object.fromEntries(Object.entries(rsvp).filter(([, v]) => v.s === 'yes').map(([k]) => [k, true])); }
    }
    const sat = new Date(tue); sat.setDate(sat.getDate() + 11); sat.setHours(9, 30, 0, 0);
    const satEnd = new Date(sat); satEnd.setHours(17, 0);
    events.turnier = {
      title: 'City Cup Mixed Tournament', start: sat.getTime(), end: satEnd.getTime(), place: 'North Arena',
      limit: 8, notes: 'We enter 1 team (6 + 2 subs). Entry fee €10 per person.', plan: [], carpool: true,
      rsvp: { u_moritz: { s: 'yes', t: 1 }, u_sara: { s: 'yes', t: 2 }, u_ali: { s: 'yes', t: 3 }, u_mia: { s: 'yes', t: 4 }, u_jonas: { s: 'yes', t: 5 }, u_paul: { s: 'yes', t: 6 }, u_nina: { s: 'yes', t: 7 }, u_tim: { s: 'yes', t: 8 }, u_eva: { s: 'yes', t: 9 }, u_ben: { s: 'no', t: 10 } },
      rides: { u_ali: { type: 'fahrer', seats: 3, from: 'Train station, 8:45' }, u_mia: { type: 'mit', driver: 'u_ali' }, u_eva: { type: 'sucht' } },
      cancelled: false, reminderSent: false, created: Date.now() - 4 * D, by: 'u_moritz'
    };
    return {
      session: null,
      cols: {
        members, events,
        posts: {
          p1: { type: 'news', title: 'New hall times from December', text: 'From December we train on Tuesdays 19:00–21:00 in Court 2.\nNo training over the Christmas holidays (23 Dec – 6 Jan).', pinned: true, author: 'u_moritz', authorName: 'Moritz', ts: Date.now() - 2 * D },
          p2: { type: 'msg', title: '', text: 'Can anyone bring a spare ball? Mine is flat 😅', pinned: false, author: 'u_sara', authorName: 'Sara', ts: Date.now() - 5 * H }
        },
        polls: {
          q1: { question: 'Christmas party – which date works?', options: ['Fri 12 Dec', 'Sat 13 Dec', 'Fri 19 Dec'], votes: { u_sara: 0, u_ali: 1, u_mia: 0, u_paul: 2, u_nina: 0 }, closed: false, by: 'u_moritz', ts: Date.now() - D }
        },
        videos: {
          v1: { title: 'Volleyball warm-up routine', url: '', category: 'Warm-up', description: 'Full warm-up in 10 minutes.', ts: Date.now() - 20 * D, demo: true },
          v2: { title: 'Setting – basic technique', url: '', category: 'Setting', description: 'Hand shape, body position, common mistakes.', ts: Date.now() - 15 * D, demo: true },
          v3: { title: 'Passing for beginners', url: '', category: 'Passing', description: 'Arms together, play from the legs.', ts: Date.now() - 10 * D, demo: true },
          v4: { title: 'Receiving a float serve', url: '', category: 'Serve receive', description: 'Footwork and platform.', ts: Date.now() - 5 * D, demo: true }
        },
        fees: {
          f1: { title: 'Hall rent ' + new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(now), amount: 5, due: '', ts: Date.now() - 3 * D },
          f2: { title: 'Tournament entry fee', amount: 10, due: '', ts: Date.now() - D }
        },
        payments: {
          u_moritz: { paid: { f1: true, f2: true } }, u_sara: { paid: { f1: true } }, u_ali: { paid: { f1: true, f2: true } },
          u_jonas: { paid: { f1: true } }, u_mia: { paid: { f2: true } }
        },
        inbox: {
          i1: { from: 'u_jonas', fromName: 'Jonas', text: "I'll be about 15 min late on Tuesday, my train is delayed.", ts: Date.now() - 3 * H }
        },
        outbox: {}, tokens: {}
      }
    };
  }

  function makeLocal() {
    const KEY = 'vb-demo-v2';
    let state = null;
    try { state = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* kein Speicher */ }
    if (!state || !state.cols) state = seed();
    const listeners = new Set();
    const authCbs = [];
    let uid = state.session;
    const save = () => {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignorieren */ }
      listeners.forEach((l) => l());
    };
    const col = (n) => (state.cols[n] = state.cols[n] || {});
    const split = (p) => p.split('/');
    const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
    const putVal = (o, k, v) => {
      if (v === DEL || (v && v.__del)) delete o[k];
      else if (v && v.__arru) { const a = Array.isArray(o[k]) ? o[k] : []; v.__arru.forEach((x) => { if (!a.includes(x)) a.push(x); }); o[k] = a; }
      else o[k] = clone(v);
    };
    const deepMerge = (t, s) => {
      for (const [k, v] of Object.entries(s)) {
        if (v && typeof v === 'object' && !Array.isArray(v) && !v.__arru && !v.__del) { if (!t[k] || typeof t[k] !== 'object') t[k] = {}; deepMerge(t[k], v); }
        else putVal(t, k, v);
      }
    };
    const fire = () => authCbs.forEach((cb) => cb(uid ? { uid } : null));
    return {
      demo: true,
      onAuth(cb) { authCbs.push(cb); setTimeout(() => cb(uid ? { uid } : null), 0); },
      uid: () => uid,
      demoUsers: () => Object.entries(col('members')).map(([id, d]) => ({ id, ...d })),
      async demoLogin(u) { uid = u; state.session = u; save(); fire(); },
      async logout() { uid = null; state.session = null; save(); fire(); },
      reset() { try { localStorage.removeItem(KEY); } catch (e) { /* */ } state = seed(); uid = null; save(); fire(); },
      watchCol(name, cb) {
        const f = () => cb(Object.entries(col(name)).map(([id, d]) => ({ id, ...clone(d) })));
        listeners.add(f); setTimeout(f, 0); return () => listeners.delete(f);
      },
      watchDoc(path, cb) {
        const [c, id] = split(path);
        const f = () => { const d = col(c)[id]; cb(d ? { id, ...clone(d) } : null); };
        listeners.add(f); setTimeout(f, 0); return () => listeners.delete(f);
      },
      async add(name, data) {
        const id = rid(); col(name)[id] = clone(data); save();
        if (name === 'outbox') window.dispatchEvent(new CustomEvent('demo-push', { detail: data }));
        return id;
      },
      async set(path, data, merge) {
        const [c, id] = split(path);
        if (merge && col(c)[id]) deepMerge(col(c)[id], data); else { col(c)[id] = {}; deepMerge(col(c)[id], data); }
        save();
      },
      async update(path, fields) {
        const [c, id] = split(path);
        const doc = col(c)[id]; if (!doc) throw err('notfound');
        for (const [k, v] of Object.entries(fields)) {
          const parts = k.split('.'); let o = doc;
          for (let i = 0; i < parts.length - 1; i++) { if (!o[parts[i]] || typeof o[parts[i]] !== 'object') o[parts[i]] = {}; o = o[parts[i]]; }
          putVal(o, parts[parts.length - 1], v);
        }
        save();
      },
      async remove(path) { const [c, id] = split(path); delete col(c)[id]; save(); },
      async enablePush() { throw err('demo/nopush'); },
      onForegroundMessage() { /* Demo: siehe demo-push */ }
    };
  }

  // ---------------------------------------------------------- FIREBASE
  async function makeFirebase(cfg) {
    const base = `https://www.gstatic.com/firebasejs/${FB_VERSION}/`;
    const [A, Au, F, M] = await Promise.all(['firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js', 'firebase-messaging.js'].map((f) => import(base + f)));
    const app = A.initializeApp(cfg.firebase);
    const auth = Au.getAuth(app);
    const db = F.getFirestore(app);
    const conv = (o) => {
      const r = {};
      for (const [k, v] of Object.entries(o)) {
        if (v === undefined) continue;
        if (v === DEL || (v && v.__del)) r[k] = F.deleteField();
        else if (v && v.__arru) r[k] = F.arrayUnion(...v.__arru);
        else r[k] = v;
      }
      return r;
    };
    const strip = (o) => JSON.parse(JSON.stringify(o)); // entfernt undefined
    let messaging = null;
    const getMsg = async () => { if (messaging) return messaging; if (!(await M.isSupported())) return null; messaging = M.getMessaging(app); return messaging; };
    return {
      demo: false,
      onAuth: (cb) => Au.onAuthStateChanged(auth, (u) => cb(u ? { uid: u.uid, email: u.email } : null)),
      uid: () => auth.currentUser && auth.currentUser.uid,
      async register(email, pw, name, lang) {
        const c = await Au.createUserWithEmailAndPassword(auth, email, pw);
        await F.setDoc(F.doc(db, 'members', c.user.uid), { name, lang: lang || 'en', role: 'member', status: 'pending', joined: Date.now() });
        return c.user.uid;
      },
      login: (e, p) => Au.signInWithEmailAndPassword(auth, e, p),
      resetPw: (e) => Au.sendPasswordResetEmail(auth, e),
      logout: () => Au.signOut(auth),
      watchCol(name, cb) {
        return F.onSnapshot(F.collection(db, name), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), (e) => console.warn('watch', name, e.code));
      },
      watchDoc(path, cb) {
        return F.onSnapshot(F.doc(db, path), (d) => cb(d.exists() ? { id: d.id, ...d.data() } : null), (e) => console.warn('watch', path, e.code));
      },
      add: async (name, data) => (await F.addDoc(F.collection(db, name), strip(data))).id,
      set: (path, data, merge) => F.setDoc(F.doc(db, path), conv(strip(data)), { merge: !!merge }),
      update: (path, fields) => F.updateDoc(F.doc(db, path), conv(fields)),
      remove: (path) => F.deleteDoc(F.doc(db, path)),
      async enablePush(silent) {
        const msg = await getMsg();
        if (!msg || !('Notification' in window)) throw err('push/unsupported');
        if (!cfg.vapidKey) throw err('push/novapid');
        const perm = silent ? Notification.permission : await Notification.requestPermission();
        if (perm !== 'granted') throw err('push/denied');
        const reg = await navigator.serviceWorker.ready;
        const token = await M.getToken(msg, { vapidKey: cfg.vapidKey, serviceWorkerRegistration: reg });
        if (!token) throw err('push/notoken');
        await F.setDoc(F.doc(db, 'tokens', auth.currentUser.uid), { list: F.arrayUnion(token), updated: Date.now() }, { merge: true });
        return token;
      },
      async onForegroundMessage(cb) { const msg = await getMsg(); if (msg) M.onMessage(msg, (p) => cb(p.notification || {}, p.fcmOptions || {})); }
    };
  }

  self.Data = {
    DEL, arrayUnion,
    async create(cfg) { return cfg && cfg.firebase ? makeFirebase(cfg) : makeLocal(); }
  };
})();

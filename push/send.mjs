// Kostenloser Push-Versand – läuft alle paar Minuten als GitHub-Action.
// 1) verschickt alle Nachrichten aus der Warteschlange "outbox"
// 2) verschickt automatische Erinnerungen vor Terminen
import admin from 'firebase-admin';
import fs from 'node:fs';
import vm from 'node:vm';

// Shared translations (same file the app uses)
const ctx = { self: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(new URL('../i18n.js', import.meta.url), 'utf8'), ctx);
const I18N = ctx.self.I18N;
const TZ = process.env.TZ_NAME || 'Europe/Budapest';

const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
if (!sa.project_id) { console.error('Secret FIREBASE_SERVICE_ACCOUNT fehlt.'); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const fcm = admin.messaging();

const APP_URL = (process.env.APP_URL || '').replace(/\/?$/, '/');
const REMINDER_HOURS = Number(process.env.REMINDER_HOURS || 24);
const ICON = APP_URL ? APP_URL + 'icons/icon-192.png' : undefined;

const members = (await db.collection('members').get()).docs.map((d) => ({ id: d.id, ...d.data() }));
const active = members.filter((m) => m.status === 'active');
const langOf = Object.fromEntries(members.map((m) => [m.id, I18N.locales[m.lang] ? m.lang : 'en']));
const tokenDocs = Object.fromEntries((await db.collection('tokens').get()).docs.map((d) => [d.id, d.data().list || []]));

function resolve(to, from) {
  let ids;
  if (to === 'all') ids = active.map((m) => m.id);
  else if (to === 'trainers') ids = active.filter((m) => m.role === 'trainer').map((m) => m.id);
  else if (Array.isArray(to)) ids = to;
  else ids = [];
  return [...new Set(ids)].filter((id) => id !== from);
}

// Build the text in each recipient's language
function textFor(lang, k, p) {
  const loc = I18N.locales[lang] || 'en-GB';
  const q = { ...(p || {}) };
  if (q.start) q.when = new Intl.DateTimeFormat(loc, { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ }).format(new Date(q.start));
  if (q.place != null) q.place = q.place ? ' · ' + q.place : '';
  if (q.amount != null) q.amount = new Intl.NumberFormat(loc, { style: 'currency', currency: 'EUR' }).format(q.amount);
  return I18N.pushText(lang, k, q);
}
async function sendKey(uids, k, p, link) {
  const byLang = {};
  uids.forEach((u) => { (byLang[langOf[u] || 'en'] = byLang[langOf[u] || 'en'] || []).push(u); });
  let n = 0;
  for (const [lang, list] of Object.entries(byLang)) {
    const [title, body] = textFor(lang, k, p);
    n += await send(list, title.slice(0, 120), body.slice(0, 300), link);
  }
  return n;
}
async function send(uids, title, body, link) {
  const pairs = uids.flatMap((u) => (tokenDocs[u] || []).map((t) => [u, t]));
  if (!pairs.length) return 0;
  let ok = 0;
  for (let i = 0; i < pairs.length; i += 500) {
    const chunk = pairs.slice(i, i + 500);
    const res = await fcm.sendEachForMulticast({
      tokens: chunk.map((p) => p[1]),
      notification: { title, body },
      webpush: {
        notification: { icon: ICON, badge: ICON },
        fcmOptions: APP_URL ? { link: APP_URL + (link || '') } : undefined
      }
    });
    ok += res.successCount;
    // ungültige Geräte-Adressen aufräumen
    const dead = {};
    res.responses.forEach((r, k) => {
      const code = r.error && r.error.code;
      if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token' || code === 'messaging/invalid-argument') {
        const [u, t] = chunk[k]; (dead[u] = dead[u] || []).push(t);
      }
    });
    for (const [u, list] of Object.entries(dead)) {
      await db.doc('tokens/' + u).set({ list: admin.firestore.FieldValue.arrayRemove(...list) }, { merge: true });
    }
  }
  return ok;
}

// 1) Warteschlange
const outbox = await db.collection('outbox').get();
for (const d of outbox.docs) {
  const m = d.data();
  try {
    const to = resolve(m.to, m.from);
    const n = m.k ? await sendKey(to, m.k, m.p, m.link || '') : await send(to, String(m.title || '').slice(0, 120), String(m.body || '').slice(0, 300), m.link || '');
    console.log(`outbox ${d.id}: ${n} zugestellt`);
  } catch (e) { console.error('Fehler bei', d.id, e.message); }
  await d.ref.delete();
}

// 2) Automatic reminders
const now = Date.now();
const soon = await db.collection('events').where('start', '>', now).where('start', '<=', now + REMINDER_HOURS * 3600e3).get();
for (const d of soon.docs) {
  const ev = d.data();
  if (ev.reminderSent || ev.cancelled) continue;
  const r = ev.rsvp || {};
  const yes = Object.entries(r).filter(([, v]) => v && v.s === 'yes').sort((a, b) => a[1].t - b[1].t).map(([k]) => k);
  const lim = Number(ev.limit) || 0;
  const confirmed = lim > 0 ? yes.slice(0, lim) : yes;
  const open = active.map((m) => m.id).filter((id) => !r[id]);
  const p = { title: ev.title, start: ev.start, place: ev.place || '' };
  const link = '#/termin/' + d.id;
  const a = await sendKey(open, 'autoOpen', p, link);
  const b = await sendKey(confirmed, 'autoYes', p, link);
  await d.ref.update({ reminderSent: true });
  console.log(`reminder ${d.id}: ${a} open, ${b} confirmed`);
}
console.log('fertig');
process.exit(0);

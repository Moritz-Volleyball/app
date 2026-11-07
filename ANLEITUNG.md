# Volleyball-App – Einrichtung (kostenlos, ca. 30–45 Minuten)

Herausgeber: **Moritz**

Die App ist eine **Web-App (PWA)**. Ihr verschickt per WhatsApp einen **Link**. Jeder legt die App damit auf den Home-Bildschirm, mit eigenem Icon wie eine normale App. Sie läuft auf **Android und iPhone** und kann Push-Nachrichten empfangen.

Alles läuft über kostenlose Dienste, und man braucht **keine Kreditkarte**:

| Wofür | Dienst | Kosten |
|---|---|---|
| App ins Internet stellen | GitHub Pages | 0 € |
| Konten, Daten, Push-Zustellung | Google Firebase, Tarif „Spark“ | 0 € |
| Push verschicken + Erinnerungen | GitHub Actions (öffentliches Repo) | 0 € |
| Lehrvideos | YouTube, „nicht gelistet“ | 0 € |

> Die kostenlosen Grenzen (z. B. 50.000 Lesezugriffe pro Tag) reichen für eine Gruppe mit 50 Leuten um ein Vielfaches.
> **Wichtig:** In Firebase **nie** auf den Tarif „Blaze“ upgraden, dann kann auch nichts kosten.

---

## Schritt 1 – Firebase-Projekt anlegen

1. Auf <https://console.firebase.google.com> mit einem Google-Konto anmelden (am besten eins für die Gruppe, z. B. von Moritz).
2. **Projekt hinzufügen** → Name z. B. `volleyball-gruppe` → Google Analytics **ausschalten** → Erstellen.
3. **Authentication** → Jetzt starten → Anmeldeanbieter **E-Mail/Passwort** → aktivieren → Speichern.
4. **Firestore Database** → Datenbank erstellen → Standort **eur3 (Europa)** → im **Produktionsmodus** starten.
5. Firestore → Reiter **Regeln** → alles löschen → den Inhalt der Datei `firestore.rules` einfügen → **Veröffentlichen**.
6. Zahnrad ⚙️ → **Projekteinstellungen** → unten **Web-App hinzufügen** (Symbol `</>`) → Name „Volleyball“ → registrieren. Den angezeigten Block `firebaseConfig = { … }` kopieren.
7. Projekteinstellungen → Reiter **Cloud Messaging** → unten **Web-Push-Zertifikate** → **Schlüsselpaar generieren** → den langen Schlüssel kopieren.
8. Projekteinstellungen → Reiter **Dienstkonten** → **Neuen privaten Schlüssel generieren** → eine `.json`-Datei wird heruntergeladen. **Diese Datei geheim halten** und nirgends hochladen außer in Schritt 3.

## Schritt 2 – `config.js` ausfüllen

In `config.js`:

```js
firebase: {
  apiKey: "…",
  authDomain: "…",
  projectId: "…",
  storageBucket: "…",
  messagingSenderId: "…",
  appId: "…"
},
vapidKey: 'DER-SCHLÜSSEL-AUS-SCHRITT-1.7',
```

Hier kannst du auch `groupName` (Name der Gruppe, z. B. „Volleyball Group“) ändern.
Der `apiKey` darf öffentlich sein. Geschützt werden die Daten durch die Regeln aus Schritt 1.5.

## Schritt 3 – Auf GitHub veröffentlichen

1. Auf <https://github.com> ein kostenloses Konto anlegen. **Tipp:** Benutzername z. B. `moritz-volleyball`, dann lautet die Adresse `https://moritz-volleyball.github.io/…`, und jeder sieht am Link, dass die App von Moritz kommt.
2. **New repository** → Name `app` → **Public** → Create.
3. **Add file → Upload files** → den **Inhalt** dieses Ordners hineinziehen (inkl. der Ordner `icons`, `push`, `.github`) → Commit.
   *Hinweis:* Der Ordner `.github` ist auf manchen Computern versteckt. Falls er fehlt: im Repo **Add file → Create new file**, als Namen `.github/workflows/push.yml` eintippen und den Inhalt der Datei einfügen.
4. **Settings → Pages** → Source: **Deploy from a branch** → Branch `main` / `(root)` → Save. Nach 1–2 Minuten ist die App erreichbar unter `https://BENUTZERNAME.github.io/app/`.
5. **Settings → Secrets and variables → Actions**:
   - Reiter **Secrets** → *New repository secret* → Name `FIREBASE_SERVICE_ACCOUNT` → den **kompletten Inhalt** der `.json`-Datei aus Schritt 1.8 einfügen.
   - Reiter **Variables** → *New repository variable* → Name `APP_URL` → Wert `https://BENUTZERNAME.github.io/app/`.
   - Optional: Variable `REMINDER_HOURS` (Standard `24`), um einzustellen, wie viele Stunden vor dem Termin erinnert wird.
6. Reiter **Actions** → ggf. „I understand… enable“ klicken → **Push-Nachrichten** → **Run workflow**, um es einmal zu testen (grüner Haken = ok).
7. In Firebase → Authentication → **Einstellungen → Autorisierte Domains** → `BENUTZERNAME.github.io` hinzufügen.

## Schritt 4 – Moritz zum Trainer machen

1. Die App-Adresse öffnen → **Neu registrieren** (Moritz).
2. Firebase → Firestore → Sammlung `members` → das Dokument mit Moritz' Namen öffnen:
   - `status` auf `active` ändern
   - `role` auf `trainer` ändern
3. App neu laden. Jetzt ist Moritz Trainer und kann alle Weiteren **in der App** freischalten (Mehr → Mitglieder) und auch weitere Trainer ernennen.

## Schritt 5 – Gruppe einladen

In der App: **More → Invite via WhatsApp** (DE: Mehr → Gruppe per WhatsApp einladen). Damit wird ein fertiger Text mit Link und Installations-Hinweisen geteilt, in der eingestellten Sprache.

- **iPhone:** Link in **Safari** öffnen → Teilen ⬆︎ → „Zum Home-Bildschirm“ → App vom Icon öffnen → *Mehr → Push-Nachrichten* aktivieren. (Push ab iOS 16.4.)
- **Android:** Link in **Chrome** öffnen → „App installieren“ → Push erlauben.

Neue Leute registrieren sich selbst. Die Trainer bekommen eine Push-Nachricht und schalten sie frei.

---

## Sprachen

- **Englisch ist die Hauptsprache**, dazu gibt es **Russisch** und **Deutsch**.
- Beim **ersten Öffnen** erscheint ein Fenster zur Sprachwahl. Danach lässt sich die Sprache jederzeit über die **Flagge oben rechts** oder unter **More → Language** wechseln.
- **Push-Nachrichten** bekommt jedes Mitglied **in seiner eigenen Sprache**, auch wenn der Absender eine andere eingestellt hat.
- Was ihr selbst schreibt (Termin-Titel, News, Nachrichten), wird **nicht** übersetzt und erscheint so, wie es eingegeben wurde.
- Alle Texte stehen in der Datei `i18n.js`. Dort lassen sich Formulierungen ändern oder später weitere Sprachen ergänzen.
- Hauptsprache ändern: in `config.js` → `defaultLang: 'en'` (oder `'ru'` / `'de'`).

## Wie die Push-Nachrichten funktionieren

- Alles, was die App „verschickt“ (neue Termine, News, Nachrichten an Trainer, Nachrücken von der Warteliste, Umfragen, Kassen-Erinnerungen), landet zuerst in einer Warteschlange.
- Die GitHub-Action schaut **alle 5 Minuten** nach und verschickt die Nachrichten. Push kommt also mit **bis zu ca. 5–15 Minuten Verzögerung** an. Das ist der Preis für „komplett kostenlos“.
- **Automatische Erinnerung:** 24 Std. vor jedem Termin bekommen alle ohne Antwort „Kommst du?“ und alle mit Zusage „Bald geht's los“.
- Wer Push nicht aktiviert hat, sieht alles trotzdem in der App.

## Lehrvideos hochladen

YouTube-App → **＋** → Video hochladen → Sichtbarkeit **„Nicht gelistet“** → Link kopieren → in der App unter **Videos → ＋ Video** einfügen. Videos lassen sich im Trainingsplan eines Termins direkt verknüpfen.

## Updates

Datei auf GitHub ändern bzw. neu hochladen. Alle Handys bekommen die neue Version automatisch beim nächsten Öffnen, ohne neu zu installieren.

## Häufige Fragen

- **„Verifizierter Herausgeber“?** Web-Apps haben kein solches Siegel, brauchen aber auch keins: Es kommt keine Sicherheitswarnung, weil nichts aus unbekannter Quelle installiert wird. Herausgeber „Moritz“ steht in der App, und mit einem passenden GitHub-Namen auch im Link.
- **Echte Android-App-Datei (APK)?** Lässt sich später aus dieser Web-App erzeugen (z. B. mit pwabuilder.com, kostenlos). Ein verifizierter Herausgeber kostet bei Google aber einmalig 25 $. Das kostenlose Hobby-Konto erlaubt max. 20 Geräte. Für iPhones gibt es keinen kostenlosen Weg, eine App-Datei zu verteilen.
- **Datenschutz:** Gespeichert werden nur Name, E-Mail (für die Anmeldung) und die Angaben in der App, in Firebase-Rechenzentren in Europa (eur3).

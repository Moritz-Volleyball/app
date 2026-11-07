// ============================================================
//  KONFIGURATION – nur diese Datei musst du anpassen.
//  Solange "firebase" auf null steht, läuft die App im DEMO-MODUS
//  (Testdaten nur auf dem eigenen Handy, keine echten Push-Nachrichten).
// ============================================================
self.APP_CONFIG = {
  appName: 'Volleyball',            // Name unter dem App-Icon
  defaultLang: 'en',                // Hauptsprache: 'en', 'ru' oder 'de'
  groupName: 'Volleyball Group',    // wird in der App angezeigt
  publisher: 'Moritz',              // Herausgeber

  // Aus der Firebase-Konsole kopieren (Projekteinstellungen → Deine Apps → Web-App → Config):
  firebase: {
    apiKey: "AIzaSyBlpjkatZ0rqn4wZGdvgGoW-MclhKjQBPk",
    authDomain: "volleyball-app-arcadia.firebaseapp.com",
    projectId: "volleyball-app-arcadia",
    storageBucket: "volleyball-app-arcadia.firebasestorage.app",
    messagingSenderId: "517543239973",
    appId: "1:517543239973:web:f63926093d8225f08afacc"
  },
  /* Beispiel:
  firebase: {
    apiKey: "AIza...",
    authDomain: "dein-projekt.firebaseapp.com",
    projectId: "dein-projekt",
    storageBucket: "dein-projekt.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abc123"
  },
  */

  // Firebase-Konsole → Projekteinstellungen → Cloud Messaging → Web-Push-Zertifikate → Schlüsselpaar
  vapidKey: 'BImkc1FPD2Fi3ksUZKlmrU9qezQqCJemcXmVVhJkpO2NxOP_OtvbR0LFP-KCdQPoEp7l-yNE-_kHnfrkY1qnsMQ',

  // Adresse des Push-Dienstes (Cloudflare Worker), z. B. 'https://volleyball-push.DEINNAME.workers.dev'
  pushUrl: 'https://volleyball-push.smilehype130.workers.dev',

  // Video-Kategorien kommen automatisch aus der gewählten Sprache (i18n.js)
};

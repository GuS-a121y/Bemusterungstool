# 🌩️ G+S Bemusterungstool - Cloudflare Edition v4.0

Digitales Bemusterungstool für Wohnimmobilien auf **Cloudflare Workers + D1**.

## ⚡ Quick Start

```bash
# 1. Dependencies installieren
npm install

# 2. Bei Cloudflare anmelden
wrangler login

# 3. D1 Datenbank erstellen
wrangler d1 create bemusterungstool
# → Database ID kopieren und in wrangler.toml eintragen

# 4. Datenbank initialisieren
wrangler d1 execute bemusterungstool --file=./schema.sql

# 5. Lokal testen
npm run dev
# → http://localhost:8787

# 6. Produktiv deployen
npm run deploy
# → Live auf workers.dev!
```

**Fertig in 5 Minuten! 🎉**

---

## 📦 Paket-Inhalt

```
gs-bemusterungstool-cloudflare/
├── worker.js                      # Cloudflare Worker Backend
├── wrangler.toml                  # Cloudflare Konfiguration
├── schema.sql                     # D1 Datenbank-Schema
├── package.json                   # NPM Dependencies
├── public/                        # Frontend Assets
│   └── index.html                 # Single-File Frontend (v4.0)
├── DEPLOYMENT-CLOUDFLARE.md       # Deployment-Anleitung
└── README.md                      # Diese Datei
```

---

## ✨ Features v4.0

### Technologie
- ✅ **Cloudflare Workers** - Edge Computing
- ✅ **D1 Database** - SQLite on the Edge
- ✅ **Global CDN** - Ultra-schnell weltweit
- ✅ **Automatic SSL** - HTTPS out-of-the-box
- ✅ **Zero Config** - Keine Server-Verwaltung

### Funktionen
- ✅ Projekt-Logo & Begrüßungsbild
- ✅ Admin-Dashboard
- ✅ Kunden-Wizard
- ✅ Lightbox für Bilder
- ✅ PDF & Excel Export
- ✅ Filter & Auswertung
- ✅ Footer mit Datenschutz & Impressum

---

## 🚀 Deployment

### Lokal entwickeln
```bash
npm run dev
# → http://localhost:8787
```

### Produktiv deployen
```bash
npm run deploy
# → https://gs-bemusterungstool.DEIN-NAME.workers.dev
```

### Custom Domain
```bash
wrangler deploy --route="bemusterung.deine-domain.de/*"
```

---

## 📊 Datenbank

### Schema laden
```bash
npm run db:init
```

### Daten abfragen
```bash
wrangler d1 execute bemusterungstool --command="SELECT * FROM projects"
```

### Backup erstellen
```bash
wrangler d1 execute bemusterungstool --command="SELECT * FROM projects" > backup.json
```

---

## 🔑 Login

### Admin
```
5x auf Logo klicken
Passwort: admin
```

### Kunde (Demo)
```
Code: DEMO123
```

---

## 💰 Kosten

### Free Tier
- ✅ 100.000 Requests/Tag
- ✅ 5 GB D1 Storage
- ✅ 5 Millionen Reads/Tag

**→ Kostenlos für Start!**

### Paid ($5/Monat)
- ✅ Unbegrenzte Requests
- ✅ 25 GB Storage
- ✅ Unbegrenzte Reads/Writes

---

## 📖 Dokumentation

- **DEPLOYMENT-CLOUDFLARE.md** - Vollständige Anleitung
- **Cloudflare Docs:** https://developers.cloudflare.com/workers/
- **D1 Docs:** https://developers.cloudflare.com/d1/

---

## 🔧 NPM Scripts

```bash
npm run dev        # Lokal entwickeln
npm run deploy     # Produktiv deployen
npm run db:create  # D1 Datenbank erstellen
npm run db:init    # Schema laden
npm run tail       # Live-Logs ansehen
```

---

## 🆘 Troubleshooting

### "Database not found"
```bash
# Database ID in wrangler.toml prüfen
wrangler d1 list
```

### "Unauthorized"
```bash
# Neu anmelden
wrangler login
```

### CORS Fehler
```bash
# Browser-Cache leeren
# Hard Reload (Cmd/Ctrl + Shift + R)
```

---

## 🔗 Links

- **Dashboard:** https://dash.cloudflare.com
- **Workers:** https://developers.cloudflare.com/workers/
- **D1:** https://developers.cloudflare.com/d1/
- **G+S Gruppe:** https://www.g-s-wohnbau.de

---

## 📜 Lizenz

Proprietär - © 2026 G+S Gruppe

---

**Version:** 4.0  
**Status:** ✅ Produktionsbereit

🌩️ **Powered by Cloudflare Workers + D1**

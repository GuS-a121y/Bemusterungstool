# 🌩️ Cloudflare Deployment - G+S Bemusterungstool v4.0

Komplette Anleitung für das Deployment auf Cloudflare Workers + D1.

## 📋 Voraussetzungen

### Cloudflare Account
- ✅ Kostenloses Cloudflare-Konto: https://dash.cloudflare.com/sign-up
- ✅ Domain (optional, Cloudflare bietet workers.dev Subdomain)

### Lokal installiert
- ✅ Node.js 18+ (https://nodejs.org)
- ✅ npm oder yarn
- ✅ Git (optional)

---

## 🚀 Deployment in 5 Schritten

### Schritt 1: Cloudflare Account & Wrangler Setup

```bash
# 1. Wrangler CLI installieren
npm install -g wrangler

# 2. Bei Cloudflare anmelden
wrangler login
# Browser öffnet sich → Anmelden & Autorisieren

# 3. Erfolgreich? Testen:
wrangler whoami
```

---

### Schritt 2: D1 Datenbank erstellen

```bash
# In Projekt-Ordner wechseln
cd gs-bemusterungstool-cloudflare

# D1 Datenbank erstellen
wrangler d1 create bemusterungstool

# Ausgabe merken:
# database_id = "xxxx-xxxx-xxxx-xxxx"
```

**Wichtig:** Kopiere die `database_id` aus der Ausgabe!

```bash
# Database ID in wrangler.toml eintragen
nano wrangler.toml

# Ändere diese Zeile:
database_id = "DEINE-DATABASE-ID-HIER"
```

---

### Schritt 3: Datenbank initialisieren

```bash
# Schema mit Demo-Daten laden
wrangler d1 execute bemusterungstool --file=./schema.sql

# Ausgabe sollte sein:
# ✅ Tabellen erstellt
# ✅ Demo-Daten eingefügt
```

**Datenbank testen:**
```bash
# Projekte anzeigen
wrangler d1 execute bemusterungstool --command="SELECT * FROM projects"

# Sollte zeigen: "Wohnpark Sonnenhöhe"
```

---

### Schritt 4: Lokal testen

```bash
# Development-Server starten
npm run dev

# Ausgabe:
# ⛅️ wrangler 3.22.0
# 🚧 Running on http://localhost:8787

# Browser öffnen:
open http://localhost:8787

# Testen:
# - Admin-Login: 5x auf Logo → admin
# - Kunden-Login: Code DEMO123
```

**Funktioniert? Weiter zu Schritt 5!**

---

### Schritt 5: Produktiv deployen

```bash
# Deployment
npm run deploy

# Ausgabe:
# ✅ Uploading Worker
# ✅ Uploading assets
# ✨ Deployment complete!
# 
# Published at:
# https://gs-bemusterungstool.DEIN-NAME.workers.dev
```

**Fertig! 🎉**

Deine App ist jetzt live unter:
- `https://gs-bemusterungstool.DEIN-NAME.workers.dev`

---

## 🔧 Konfiguration

### Custom Domain (optional)

Wenn du eine eigene Domain hast:

```bash
# 1. Domain zu Cloudflare hinzufügen (Dashboard)
# 2. Route hinzufügen:

wrangler deploy --route="bemusterung.deine-domain.de/*"
```

Oder in `wrangler.toml`:
```toml
routes = [
    { pattern = "bemusterung.deine-domain.de/*", zone_name = "deine-domain.de" }
]
```

### Umgebungsvariablen

Für Produktions-Secrets:

```bash
# Admin-Passwort als Secret
wrangler secret put ADMIN_PASSWORD
# Eingeben: dein-sicheres-passwort

# In worker.js verwenden:
# env.ADMIN_PASSWORD
```

---

## 📊 Cloudflare Dashboard

### Workers & Pages
```
Dashboard → Workers & Pages
→ gs-bemusterungstool
→ Hier siehst du:
  - Deployments
  - Logs
  - Metriken
  - Settings
```

### D1 Database
```
Dashboard → Storage & Databases → D1
→ bemusterungstool
→ Hier kannst du:
  - Daten ansehen
  - SQL ausführen
  - Backups erstellen
```

---

## 🔄 Updates deployen

### Code ändern
```bash
# 1. Dateien ändern (worker.js oder public/index.html)
# 2. Testen:
npm run dev

# 3. Deployen:
npm run deploy

# Fertig! Live in ~30 Sekunden
```

### Datenbank-Schema ändern
```bash
# 1. Neue Migration erstellen
nano migrations/001_add_column.sql

# 2. Ausführen:
wrangler d1 execute bemusterungstool --file=./migrations/001_add_column.sql

# 3. Worker neu deployen:
npm run deploy
```

---

## 💾 Backup & Restore

### Backup erstellen
```bash
# Alle Tabellen exportieren
wrangler d1 execute bemusterungstool --command="SELECT * FROM projects" > backup-projects.json
wrangler d1 execute bemusterungstool --command="SELECT * FROM apartments" > backup-apartments.json
wrangler d1 execute bemusterungstool --command="SELECT * FROM selections" > backup-selections.json
```

### Restore
```bash
# Über SQL-Datei:
wrangler d1 execute bemusterungstool --file=./backup.sql
```

---

## 📈 Monitoring & Logs

### Live-Logs ansehen
```bash
# Echtzeit-Logs
wrangler tail

# Nur Fehler
wrangler tail --status error

# Bestimmte Route
wrangler tail --search "/api/projects"
```

### Metriken im Dashboard
```
Dashboard → Workers → gs-bemusterungstool → Metrics

Siehst du:
- Requests pro Minute
- Fehlerrate
- Durchschnittliche Response-Zeit
- Bandbreite
```

---

## 🔍 Troubleshooting

### Problem: "Database not found"

**Lösung:**
```bash
# 1. Database ID prüfen
wrangler d1 list

# 2. Richtige ID in wrangler.toml?
cat wrangler.toml | grep database_id

# 3. Binding korrekt?
# Sollte sein: binding = "DB"
```

### Problem: "Assets not found"

**Lösung:**
```bash
# 1. public/ Ordner existiert?
ls -la public/

# 2. index.html vorhanden?
ls -la public/index.html

# 3. Neu deployen:
npm run deploy
```

### Problem: "Unauthorized"

**Lösung:**
```bash
# 1. Neu anmelden
wrangler login

# 2. Account prüfen
wrangler whoami

# 3. Neu deployen
npm run deploy
```

### Problem: CORS Fehler

**Lösung:**
```javascript
// In worker.js sind CORS Headers schon gesetzt:
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  ...
};

// Falls Problem bleibt:
// → Browser-Cache leeren
// → Hard Reload (Cmd/Ctrl + Shift + R)
```

---

## 💰 Kosten

### Free Tier (kostenlos)
- ✅ 100.000 Requests/Tag
- ✅ 10ms CPU-Zeit pro Request
- ✅ 5 GB D1 Storage
- ✅ 5 Millionen D1 Reads/Tag
- ✅ 100.000 D1 Writes/Tag

**→ Völlig ausreichend für Start!**

### Paid Plan ($5/Monat)
- ✅ Unbegrenzte Requests
- ✅ 50ms CPU-Zeit pro Request
- ✅ 25 GB D1 Storage
- ✅ Unbegrenzte D1 Reads/Writes

---

## 🎯 Best Practices

### 1. Entwicklung lokal
```bash
# Immer erst lokal testen:
npm run dev

# Dann deployen:
npm run deploy
```

### 2. Versions-Tags
```bash
# Git-Tags für Versionen:
git tag v4.0.0
git push --tags

# Im Dashboard sichtbar
```

### 3. Staging-Environment
```toml
# In wrangler.toml:
[env.staging]
name = "gs-bemusterungstool-staging"

# Deployen:
wrangler deploy --env staging
```

### 4. Monitoring
```bash
# Regelmäßig Logs checken:
wrangler tail

# Fehler-Alerts einrichten:
# Dashboard → Notifications
```

### 5. Backups
```bash
# Wöchentliche Backups:
# Cronjob oder GitHub Actions

# Beispiel-Script:
./backup.sh # Siehe unten
```

---

## 📝 Backup-Script

Erstelle `backup.sh`:

```bash
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/$DATE"

mkdir -p $BACKUP_DIR

echo "📦 Erstelle Backup..."

# Projekte
wrangler d1 execute bemusterungstool \
  --command="SELECT * FROM projects" \
  > $BACKUP_DIR/projects.json

# Kategorien
wrangler d1 execute bemusterungstool \
  --command="SELECT * FROM categories" \
  > $BACKUP_DIR/categories.json

# Optionen
wrangler d1 execute bemusterungstool \
  --command="SELECT * FROM options" \
  > $BACKUP_DIR/options.json

# Wohnungen
wrangler d1 execute bemusterungstool \
  --command="SELECT * FROM apartments" \
  > $BACKUP_DIR/apartments.json

# Zugänge
wrangler d1 execute bemusterungstool \
  --command="SELECT * FROM customer_access" \
  > $BACKUP_DIR/customer_access.json

# Bemusterungen
wrangler d1 execute bemusterungstool \
  --command="SELECT * FROM selections" \
  > $BACKUP_DIR/selections.json

echo "✅ Backup erstellt: $BACKUP_DIR"
```

```bash
# Ausführbar machen:
chmod +x backup.sh

# Ausführen:
./backup.sh
```

---

## 🔗 Nützliche Links

- **Cloudflare Dashboard:** https://dash.cloudflare.com
- **Wrangler Docs:** https://developers.cloudflare.com/workers/wrangler/
- **D1 Docs:** https://developers.cloudflare.com/d1/
- **Workers Docs:** https://developers.cloudflare.com/workers/
- **Community Forum:** https://community.cloudflare.com

---

## ✅ Deployment-Checkliste

- [ ] Node.js installiert (`node --version`)
- [ ] Wrangler installiert (`wrangler --version`)
- [ ] Cloudflare-Account erstellt
- [ ] Wrangler Login (`wrangler login`)
- [ ] D1 Datenbank erstellt (`wrangler d1 create`)
- [ ] Database ID in wrangler.toml eingetragen
- [ ] Schema geladen (`wrangler d1 execute`)
- [ ] Lokal getestet (`npm run dev`)
- [ ] Produktiv deployed (`npm run deploy`)
- [ ] URL funktioniert
- [ ] Admin-Login funktioniert (5x Logo)
- [ ] Kunden-Login funktioniert (DEMO123)
- [ ] Logo hochladen getestet
- [ ] Bemusterung durchgeführt
- [ ] PDF-Download funktioniert

---

## 🎉 Fertig!

Deine App läuft jetzt auf:
- **Cloudflare Workers** (global verteilt)
- **D1 Database** (SQLite-basiert)
- **Edge Network** (ultra-schnell)

**Vorteile:**
- ✅ Kostenlos für kleine/mittlere Projekte
- ✅ Unbegrenzte Skalierung möglich
- ✅ Global verteilt (schnell überall)
- ✅ Automatische SSL/HTTPS
- ✅ DDoS-Schutz inklusive
- ✅ 99.99% Uptime SLA

**Version:** 4.0  
**Datum:** Januar 2026

🌩️ **Viel Erfolg mit Cloudflare!**

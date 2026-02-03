# GS Gruppe Bemusterungstool

Digitale Webapp für die Wohnungsausstattungswahl.

## Features

- **Admin-Bereich**: Projekte, Wohnungen und Bemusterungsoptionen verwalten
- **Kunden-Wizard**: Schrittweise Ausstattungswahl mit Preisübersicht
- **PDF-Export**: Automatische Generierung der Bemusterungsbestätigung
- **DSGVO-konform**: Cloudflare D1 mit EU-Hosting

## Tech-Stack

- Frontend: React + TypeScript + Tailwind CSS
- Backend: Cloudflare Pages Functions
- Datenbank: Cloudflare D1 (SQLite)
- PDF: jsPDF

## Deployment auf Cloudflare

### 1. Repository erstellen

```bash
cd bemusterung-app
git init
git add .
git commit -m "Initial commit"
```

Pushen Sie zu GitHub/GitLab.

### 2. D1 Datenbank erstellen

```bash
# Cloudflare CLI installieren (falls nicht vorhanden)
npm install -g wrangler

# Bei Cloudflare anmelden
wrangler login

# Datenbank erstellen
wrangler d1 create bemusterung-db

# Die ausgegebene database_id in wrangler.toml eintragen!
```

### 3. wrangler.toml anpassen

Ersetzen Sie `YOUR_DATABASE_ID_HERE` mit der echten Database-ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "bemusterung-db"
database_id = "ihre-echte-id-hier"
```

### 4. Datenbank-Schema anwenden

```bash
# Lokal testen
wrangler d1 execute bemusterung-db --local --file=./migrations/0001_initial_schema.sql

# Produktiv
wrangler d1 execute bemusterung-db --remote --file=./migrations/0001_initial_schema.sql
```

### 5. Cloudflare Pages verbinden

1. Gehen Sie zu [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Workers & Pages → Create Application → Pages
3. Connect to Git → Repository auswählen
4. Build settings:
   - Framework preset: `None`
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Environment variables: Keine benötigt
6. D1 Database binding hinzufügen:
   - Variable name: `DB`
   - D1 database: `bemusterung-db`

### 6. Deploy

Jeder Push zu `main` deployed automatisch.

## Lokale Entwicklung

```bash
# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev

# Mit D1 lokal testen
npm run pages:dev
```

## Demo-Zugangsdaten

- **Admin-Login**: admin@gs-gruppe.de / demo123
- **Kunden-Link**: /bemusterung/ABC123 (nach Erstellung einer Wohnung)

## Projektstruktur

```
bemusterung-app/
├── src/
│   ├── components/     # Wiederverwendbare Komponenten
│   ├── pages/          # Seiten-Komponenten
│   ├── lib/            # API-Client, Typen, Utilities
│   └── styles/         # Globale Styles
├── functions/
│   └── api/            # Cloudflare Functions (Backend)
├── migrations/         # SQL-Schemas
├── public/             # Statische Assets (Logo)
└── wrangler.toml       # Cloudflare Konfiguration
```

## Nächste Schritte (optional)

- [ ] Bild-Upload für Optionen (Cloudflare R2)
- [ ] E-Mail-Versand bei Abschluss
- [ ] Excel-Export für Admins
- [ ] Mehrsprachigkeit

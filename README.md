# Bemusterungstool - G&S Gruppe

Digitales Bemusterungssystem für Wohnungsausstattung. Ermöglicht Kunden die Online-Auswahl von Ausstattungsoptionen für ihre neue Wohnung.

## Features

### Admin-Dashboard
- Projekte verwalten (Bauprojekte/Wohnanlagen)
- Wohnungen anlegen mit automatischer Code-Generierung
- Bemusterungskategorien definieren (Bodenbeläge, Sanitär, Elektro, etc.)
- Ausstattungsoptionen mit Bildern und Preisen pflegen
- Übersicht aller Bemusterungen und deren Status
- Excel-Export aller Entscheidungen

### Kunden-Wizard
- Schrittweise Auswahl durch alle Kategorien
- Bildvorschau und Preisanzeige
- Dynamische Gesamtpreisberechnung
- Verbindliche Abgabe der Auswahl

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Cloudflare Pages Functions (Workers)
- **Datenbank:** Cloudflare D1 (SQLite)
- **Bildspeicher:** Cloudflare R2

## Installation & Deployment

### Voraussetzungen

- Node.js 18+
- Cloudflare Account
- Wrangler CLI (`npm install -g wrangler`)

### 1. Repository klonen

```bash
git clone <repository-url>
cd bemusterung-app
npm install
```

### 2. Cloudflare Ressourcen erstellen

```bash
# Bei Cloudflare einloggen
wrangler login

# D1 Datenbank erstellen
wrangler d1 create bemusterung-db

# R2 Bucket erstellen
wrangler r2 bucket create bemusterung-images
```

### 3. Konfiguration anpassen

Bearbeite `wrangler.toml` und trage die D1 Database-ID ein:

```toml
[[d1_databases]]
binding = "DB"
database_name = "bemusterung-db"
database_id = "DEINE_DATABASE_ID_HIER"  # ← Hier eintragen
```

### 4. Datenbank-Schema erstellen

```bash
# Schema anwenden (mit Testdaten)
wrangler d1 execute bemusterung-db --file=./schema.sql

# Oder ohne Testdaten (nur Struktur)
wrangler d1 execute bemusterung-db --file=./schema-clean.sql
```

### 5. Lokal entwickeln

```bash
# Entwicklungsserver starten
npm run dev

# Mit D1 und R2 Bindings (Preview)
wrangler pages dev dist --d1=bemusterung-db --r2=bemusterung-images
```

### 6. Deployment

```bash
# Build erstellen
npm run build

# Zu Cloudflare Pages deployen
wrangler pages deploy dist
```

## Projektstruktur

```
bemusterung-app/
├── src/
│   ├── components/     # React-Komponenten
│   ├── pages/          # Seiten (Home, Admin, Customer)
│   ├── lib/            # Hilfsfunktionen
│   ├── App.jsx         # Haupt-App
│   ├── main.jsx        # Entry Point
│   └── index.css       # Globale Styles
├── functions/
│   └── api/            # Cloudflare Pages Functions
│       ├── projects.js
│       ├── apartments.js
│       ├── categories.js
│       ├── options.js
│       ├── upload.js
│       ├── export.js
│       ├── validate-code.js
│       └── customer/[code].js
├── public/
│   └── logo.jpg
├── schema.sql          # DB-Schema mit Testdaten
├── wrangler.toml       # Cloudflare Konfiguration
├── package.json
└── vite.config.js
```

## API Endpunkte

### Öffentlich
- `GET /api/validate-code?code=XXX` - Zugangscode validieren
- `GET /api/customer/[code]` - Kundendaten für Bemusterung
- `POST /api/customer/[code]` - Auswahl absenden

### Admin
- `GET/POST/PUT/DELETE /api/projects` - Projekte verwalten
- `GET/POST/PUT/DELETE /api/apartments` - Wohnungen verwalten
- `GET/POST/PUT/DELETE /api/categories` - Kategorien verwalten
- `GET/POST/PUT/DELETE /api/options` - Optionen verwalten
- `POST/DELETE /api/upload` - Bilder hochladen/löschen
- `GET /api/export?project_id=X` - Excel-Export

## Zugangscodes

Zugangscodes werden automatisch generiert im Format: `XXX-YYYYYY`
- `XXX` = Projektpräfix (erste 3 Buchstaben des Projektnamens)
- `YYYYYY` = Zufällige alphanumerische Zeichen

Beispiel: `WPS-A3B7K9` für "Wohnpark Am See"

Die Codes werden im Admin-Dashboard angezeigt und können manuell an Kunden weitergegeben werden.

## Umgebungsvariablen

Keine zusätzlichen Umgebungsvariablen erforderlich. Alle Bindings werden über `wrangler.toml` konfiguriert.

## Support

Bei Fragen oder Problemen wenden Sie sich an die IT-Abteilung der G&S Gruppe.

---

© 2024 G&S Gruppe

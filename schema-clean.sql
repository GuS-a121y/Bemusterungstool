-- Bemusterungstool Datenbank Schema (Clean)
-- =========================================
-- Nur Tabellenstruktur, keine Testdaten

-- Projekte (z.B. "Wohnpark Am See", "Stadtvillen Mitte")
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    intro_text TEXT,
    project_logo TEXT,
    project_image TEXT,
    status TEXT DEFAULT 'aktiv' CHECK(status IN ('aktiv', 'abgeschlossen', 'archiviert')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Wohnungen innerhalb eines Projekts
CREATE TABLE IF NOT EXISTS apartments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    floor TEXT,
    size_sqm REAL,
    rooms INTEGER,
    customer_name TEXT,
    customer_email TEXT,
    access_code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'offen' CHECK(status IN ('offen', 'in_bearbeitung', 'abgeschlossen')),
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Bemusterungskategorien pro Projekt (z.B. Bodenbeläge, Sanitär)
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Ausstattungsoptionen pro Kategorie
CREATE TABLE IF NOT EXISTS options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL DEFAULT 0,
    image_url TEXT,
    is_default INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Kundenauswahl (eine Auswahl pro Kategorie pro Wohnung)
-- option_id kann negativ sein für individuelle Optionen (dann ist es -apartment_custom_options.id)
CREATE TABLE IF NOT EXISTS selections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    apartment_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    option_id INTEGER NOT NULL,
    selected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(apartment_id, category_id)
);

-- Ausgeblendete Optionen pro Wohnung
CREATE TABLE IF NOT EXISTS apartment_hidden_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    apartment_id INTEGER NOT NULL,
    option_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
    FOREIGN KEY (option_id) REFERENCES options(id) ON DELETE CASCADE,
    UNIQUE(apartment_id, option_id)
);

-- Individuelle Optionen pro Wohnung
CREATE TABLE IF NOT EXISTS apartment_custom_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    apartment_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL DEFAULT 0,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Indizes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_apartments_project ON apartments(project_id);
CREATE INDEX IF NOT EXISTS idx_apartments_code ON apartments(access_code);
CREATE INDEX IF NOT EXISTS idx_categories_project ON categories(project_id);
CREATE INDEX IF NOT EXISTS idx_options_category ON options(category_id);
CREATE INDEX IF NOT EXISTS idx_selections_apartment ON selections(apartment_id);

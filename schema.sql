-- G+S Bemusterungstool Database Schema v4.0 für Cloudflare D1
-- SQLite-kompatibel

-- Projekte
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'Aktiv' CHECK(status IN ('Aktiv', 'Inaktiv', 'Archiviert')),
    start_date TEXT,
    end_date TEXT,
    logo TEXT,
    welcome_image TEXT,
    welcome_text TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created ON projects(created_at);

-- Kategorien
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_categories_project ON categories(project_id);

-- Optionen
CREATE TABLE IF NOT EXISTS options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL DEFAULT 0,
    icon TEXT,
    image TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE INDEX idx_options_category ON options(category_id);

-- Wohnungen
CREATE TABLE IF NOT EXISTS apartments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    number TEXT NOT NULL,
    floor INTEGER,
    size INTEGER,
    status TEXT DEFAULT 'Bemusterung offen',
    hidden_options TEXT,
    custom_options TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_apartments_project ON apartments(project_id);
CREATE INDEX idx_apartments_status ON apartments(status);
CREATE UNIQUE INDEX idx_apartments_unique ON apartments(project_id, number);

-- Kundenzugänge
CREATE TABLE IF NOT EXISTS customer_access (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    apartment_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE
);

CREATE INDEX idx_customer_access_apartment ON customer_access(apartment_id);
CREATE INDEX idx_customer_access_code ON customer_access(code);

-- Bemusterungen
CREATE TABLE IF NOT EXISTS selections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    apartment_id INTEGER NOT NULL,
    choices TEXT NOT NULL,
    status TEXT DEFAULT 'Abgeschlossen' CHECK(status IN ('Entwurf', 'Abgeschlossen')),
    completed_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE
);

CREATE INDEX idx_selections_apartment ON selections(apartment_id);
CREATE INDEX idx_selections_status ON selections(status);
CREATE INDEX idx_selections_completed ON selections(completed_at);

-- Demo-Daten
INSERT INTO projects (name, status, start_date, end_date, welcome_text) VALUES 
('Wohnpark Sonnenhöhe', 'Aktiv', '2024-01-15', '2024-12-31', 
 'Herzlich willkommen zur Bemusterung Ihrer neuen Wohnung! Auf den folgenden Seiten können Sie Ihre persönlichen Ausstattungswünsche auswählen. Nehmen Sie sich Zeit und treffen Sie Ihre Auswahl in Ruhe.');

INSERT INTO categories (project_id, name, description) VALUES 
(1, 'Bodenbeläge', 'Wählen Sie Ihren bevorzugten Bodenbelag'),
(1, 'Sanitärausstattung', 'Wählen Sie Ihre Sanitärausstattung'),
(1, 'Elektroinstallation', 'Wählen Sie Ihre Elektroausstattung');

INSERT INTO options (category_id, name, description, price, icon) VALUES 
(1, 'Eiche Natur', 'Hochwertiges Parkettlaminat in natürlicher Eiche', 0, '🪵'),
(1, 'Eiche Grau', 'Modernes graues Parkettlaminat', 850, '🪵'),
(1, 'Fliesen Marmor-Optik', 'Elegante Fliesen in Marmoroptik', 1200, '⬜'),
(2, 'Standard weiß', 'Klassische weiße Sanitärobjekte', 0, '🚿'),
(2, 'Premium grau', 'Hochwertige graue Sanitärobjekte', 1500, '🚿'),
(2, 'Designer schwarz-matt', 'Exklusive schwarze Designer-Sanitärobjekte', 2800, '🚿'),
(3, 'Standard', 'Basis-Elektroinstallation', 0, '💡'),
(3, 'Komfort', 'Erweiterte Elektroinstallation mit zusätzlichen Steckdosen', 680, '💡'),
(3, 'Smart Home', 'Vollständige Smart-Home-Integration', 3200, '🏠');

INSERT INTO apartments (project_id, number, floor, size, status) VALUES 
(1, 'A-01', 1, 65, 'Bemusterung offen'),
(1, 'A-02', 1, 78, 'Bemusterung offen'),
(1, 'B-01', 2, 92, 'Bemusterung offen');

INSERT INTO customer_access (apartment_id, customer_name, code) VALUES 
(1, 'Familie Mustermann', 'DEMO123');

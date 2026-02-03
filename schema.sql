-- Bemusterungstool Datenbank Schema
-- ==================================

-- Projekte (z.B. "Wohnpark Am See", "Stadtvillen Mitte")
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
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
CREATE TABLE IF NOT EXISTS selections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    apartment_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    option_id INTEGER NOT NULL,
    selected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (option_id) REFERENCES options(id) ON DELETE CASCADE,
    UNIQUE(apartment_id, category_id)
);

-- Indizes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_apartments_project ON apartments(project_id);
CREATE INDEX IF NOT EXISTS idx_apartments_code ON apartments(access_code);
CREATE INDEX IF NOT EXISTS idx_categories_project ON categories(project_id);
CREATE INDEX IF NOT EXISTS idx_options_category ON options(category_id);
CREATE INDEX IF NOT EXISTS idx_selections_apartment ON selections(apartment_id);

-- =============================================
-- TESTDATEN
-- =============================================

-- Testprojekt 1: Wohnpark Am See
INSERT INTO projects (name, description, address, status) VALUES 
('Wohnpark Am See', 'Modernes Wohnprojekt mit 24 Einheiten direkt am Stadtpark', 'Seestraße 15-21, 12345 Musterstadt', 'aktiv');

-- Testprojekt 2: Stadtvillen Mitte
INSERT INTO projects (name, description, address, status) VALUES 
('Stadtvillen Mitte', 'Exklusive Stadtvillen im Herzen der Altstadt', 'Marktplatz 8-10, 12345 Musterstadt', 'aktiv');

-- Wohnungen für Projekt 1
INSERT INTO apartments (project_id, name, floor, size_sqm, rooms, customer_name, customer_email, access_code, status) VALUES 
(1, 'Wohnung 1.01', 'EG', 78.5, 3, 'Familie Müller', 'mueller@email.de', 'WPS-A1B2C3', 'offen'),
(1, 'Wohnung 1.02', 'EG', 92.0, 4, 'Herr Schmidt', 'schmidt@email.de', 'WPS-D4E5F6', 'offen'),
(1, 'Wohnung 2.01', '1. OG', 85.0, 3, 'Frau Weber', 'weber@email.de', 'WPS-G7H8I9', 'in_bearbeitung'),
(1, 'Wohnung 2.02', '1. OG', 110.5, 4, 'Familie Becker', 'becker@email.de', 'WPS-J1K2L3', 'abgeschlossen');

-- Wohnungen für Projekt 2
INSERT INTO apartments (project_id, name, floor, size_sqm, rooms, customer_name, customer_email, access_code, status) VALUES 
(2, 'Villa A', 'EG-2.OG', 185.0, 5, 'Dr. Hoffmann', 'hoffmann@email.de', 'SVM-M4N5O6', 'offen'),
(2, 'Villa B', 'EG-2.OG', 195.0, 6, 'Familie Fischer', 'fischer@email.de', 'SVM-P7Q8R9', 'offen');

-- Kategorien für Projekt 1
INSERT INTO categories (project_id, name, description, sort_order) VALUES 
(1, 'Bodenbeläge Wohnbereich', 'Auswahl des Bodenbelags für Wohn- und Essbereich', 1),
(1, 'Bodenbeläge Nassbereich', 'Fliesen für Bad und Gäste-WC', 2),
(1, 'Sanitärobjekte', 'Ausstattung für Badezimmer', 3),
(1, 'Innentüren', 'Türdesign für alle Innentüren', 4),
(1, 'Elektroausstattung', 'Schalter- und Steckdosenprogramm', 5);

-- Kategorien für Projekt 2
INSERT INTO categories (project_id, name, description, sort_order) VALUES 
(2, 'Premium Bodenbeläge', 'Exklusive Holz- und Natursteinböden', 1),
(2, 'Badezimmer Deluxe', 'Hochwertige Sanitärausstattung', 2),
(2, 'Smart Home', 'Intelligente Haussteuerung', 3);

-- Optionen für Kategorie "Bodenbeläge Wohnbereich" (ID 1)
INSERT INTO options (category_id, name, description, price, is_default, sort_order) VALUES 
(1, 'Eiche Natur', 'Parkett Eiche, gebürstet und geölt, Landhausdiele', 0, 1, 1),
(1, 'Eiche Grau', 'Parkett Eiche, grau lasiert, Landhausdiele', 850, 0, 2),
(1, 'Nussbaum Amerikanisch', 'Parkett Nussbaum, matt lackiert', 1200, 0, 3),
(1, 'Vinyl Designboden Eiche', 'Hochwertiger Vinyl-Designboden in Eichenoptik', -350, 0, 4);

-- Optionen für Kategorie "Bodenbeläge Nassbereich" (ID 2)
INSERT INTO options (category_id, name, description, price, is_default, sort_order) VALUES 
(2, 'Feinsteinzeug Weiß 60x60', 'Großformatige weiße Bodenfliesen, matt', 0, 1, 1),
(2, 'Feinsteinzeug Anthrazit 60x60', 'Großformatige anthrazitfarbene Bodenfliesen', 450, 0, 2),
(2, 'Naturstein Optik Beige 30x60', 'Fliesen in Natursteinoptik', 680, 0, 3),
(2, 'Mosaik Grau', 'Mosaikfliesen für bodengleiche Dusche', 520, 0, 4);

-- Optionen für Kategorie "Sanitärobjekte" (ID 3)
INSERT INTO options (category_id, name, description, price, is_default, sort_order) VALUES 
(3, 'Standard Paket', 'Wand-WC, Waschtisch 60cm, Duschwanne 90x90', 0, 1, 1),
(3, 'Komfort Paket', 'Wand-WC spülrandlos, Waschtisch 80cm, bodengleiche Dusche', 1850, 0, 2),
(3, 'Premium Paket', 'Wand-WC spülrandlos, Doppelwaschtisch, Walk-In Dusche, freistehende Badewanne', 4200, 0, 3);

-- Optionen für Kategorie "Innentüren" (ID 4)
INSERT INTO options (category_id, name, description, price, is_default, sort_order) VALUES 
(4, 'Weiß lackiert glatt', 'Innentüren weiß lackiert, glatte Oberfläche', 0, 1, 1),
(4, 'Weiß lackiert mit Lichtausschnitt', 'Innentüren weiß mit Glasausschnitt', 180, 0, 2),
(4, 'Eiche furniert', 'Innentüren mit Echtholzfurnier Eiche', 420, 0, 3),
(4, 'Anthrazit CPL', 'Innentüren in Anthrazit CPL-Beschichtung', 280, 0, 4);

-- Optionen für Kategorie "Elektroausstattung" (ID 5)
INSERT INTO options (category_id, name, description, price, is_default, sort_order) VALUES 
(5, 'Standard Weiß', 'Schalterprogramm in Reinweiß glänzend', 0, 1, 1),
(5, 'Aluminium gebürstet', 'Schalterprogramm in Aluminium-Optik', 650, 0, 2),
(5, 'Anthrazit matt', 'Schalterprogramm in Anthrazit matt', 480, 0, 3),
(5, 'Glas Weiß', 'Schalterprogramm mit Glasrahmen weiß', 890, 0, 4);

-- Eine Beispiel-Auswahl für abgeschlossene Wohnung (Wohnung 2.02, ID 4)
INSERT INTO selections (apartment_id, category_id, option_id) VALUES 
(4, 1, 2),  -- Eiche Grau
(4, 2, 3),  -- Naturstein Optik
(4, 3, 2),  -- Komfort Paket
(4, 4, 3),  -- Eiche furniert
(4, 5, 2); -- Aluminium gebürstet

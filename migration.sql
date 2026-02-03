-- MIGRATION: Führe diese Befehle einzeln in der D1 Konsole aus!

-- 1. Neue Spalten für Projekte hinzufügen
ALTER TABLE projects ADD COLUMN intro_text TEXT

-- 2. Projektlogo Spalte
ALTER TABLE projects ADD COLUMN project_logo TEXT

-- 3. Projektbild Spalte  
ALTER TABLE projects ADD COLUMN project_image TEXT

-- Falls selections Tabelle Probleme macht:
-- 4. Alte Daten sichern
CREATE TABLE IF NOT EXISTS selections_backup AS SELECT * FROM selections

-- 5. Alte Tabelle löschen
DROP TABLE IF EXISTS selections

-- 6. Neue Tabelle OHNE Foreign Key für option_id erstellen
CREATE TABLE selections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    apartment_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    option_id INTEGER NOT NULL,
    selected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(apartment_id, category_id)
)

-- 7. Daten wiederherstellen
INSERT INTO selections (apartment_id, category_id, option_id, selected_at) SELECT apartment_id, category_id, option_id, selected_at FROM selections_backup

-- 8. Backup löschen
DROP TABLE selections_backup

-- 9. Hidden Options Tabelle
CREATE TABLE IF NOT EXISTS apartment_hidden_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    apartment_id INTEGER NOT NULL,
    option_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(apartment_id, option_id)
)

-- 10. Custom Options Tabelle
CREATE TABLE IF NOT EXISTS apartment_custom_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    apartment_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL DEFAULT 0,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- Bemusterungstool Database Schema for Cloudflare D1
-- =====================================================

-- Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'entwurf' CHECK (status IN ('entwurf', 'aktiv', 'abgeschlossen')),
  start_date TEXT,
  end_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Apartments (Wohnungen)
CREATE TABLE IF NOT EXISTS apartments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  floor TEXT,
  size REAL,
  rooms INTEGER,
  customer_name TEXT,
  customer_email TEXT,
  access_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'offen' CHECK (status IN ('offen', 'in_bearbeitung', 'abgeschlossen')),
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Categories (Bemusterungskategorien)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Options (Ausstattungsoptionen)
CREATE TABLE IF NOT EXISTS options (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price REAL DEFAULT 0,
  image_url TEXT,
  is_default INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Selections (Kundenwahlen)
CREATE TABLE IF NOT EXISTS selections (
  id TEXT PRIMARY KEY,
  apartment_id TEXT NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL REFERENCES options(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(apartment_id, category_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_apartments_project ON apartments(project_id);
CREATE INDEX IF NOT EXISTS idx_apartments_access_code ON apartments(access_code);
CREATE INDEX IF NOT EXISTS idx_categories_project ON categories(project_id);
CREATE INDEX IF NOT EXISTS idx_options_category ON options(category_id);
CREATE INDEX IF NOT EXISTS idx_selections_apartment ON selections(apartment_id);

-- Insert default admin user (password: demo123)
-- Note: In production, use proper bcrypt hashing
INSERT OR IGNORE INTO admin_users (id, email, password_hash, name) 
VALUES ('1', 'admin@gs-gruppe.de', 'demo123', 'Administrator');

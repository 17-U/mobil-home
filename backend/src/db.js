const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const config = require('./config');

fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });

const db = new Database(config.databasePath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT,
  sort        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  reference        TEXT NOT NULL UNIQUE,
  slug             TEXT NOT NULL UNIQUE,
  category_id      INTEGER NOT NULL REFERENCES categories(id),
  title            TEXT NOT NULL,
  brand            TEXT,
  model            TEXT,
  year             INTEGER,
  condition        TEXT NOT NULL DEFAULT 'occasion', -- neuf | occasion | piece
  origin           TEXT,          -- Anglais | Français
  status_label     TEXT,
  location         TEXT,
  availability     TEXT,
  price            REAL,          -- NULL = sur devis
  price_from       INTEGER NOT NULL DEFAULT 0,
  length_m         REAL,
  width_m          REAL,
  surface_m2       REAL,
  bedrooms         INTEGER,
  sleeps           INTEGER,
  bathrooms        INTEGER,
  kitchen          TEXT,
  features         TEXT NOT NULL DEFAULT '[]',
  price_conditions TEXT,
  description      TEXT,
  images           TEXT NOT NULL DEFAULT '[]',
  stock            INTEGER,       -- NULL = fabriqué à la commande
  is_published     INTEGER NOT NULL DEFAULT 1,
  is_featured      INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

CREATE TABLE IF NOT EXISTS orders (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  number            TEXT NOT NULL UNIQUE,
  type              TEXT NOT NULL,              -- commande | devis
  status            TEXT NOT NULL DEFAULT 'nouvelle',
  first_name        TEXT NOT NULL,
  last_name         TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT NOT NULL,
  address           TEXT,
  postal_code       TEXT,
  city              TEXT,
  country           TEXT,
  delivery_zone     TEXT,
  notes             TEXT,
  payment_method    TEXT,                       -- virement | carte | rendez_vous | aucun
  subtotal          REAL NOT NULL DEFAULT 0,
  deposit_amount    REAL NOT NULL DEFAULT 0,
  paid_amount       REAL NOT NULL DEFAULT 0,
  has_quote_items   INTEGER NOT NULL DEFAULT 0,
  stripe_session_id TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INTEGER REFERENCES products(id) ON DELETE SET NULL,
  reference   TEXT NOT NULL,
  title       TEXT NOT NULL,
  image       TEXT,
  unit_price  REAL,
  quantity    INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS order_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status     TEXT NOT NULL,
  note       TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS leads (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  phone      TEXT,
  email      TEXT,
  message    TEXT,
  is_read    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

module.exports = db;

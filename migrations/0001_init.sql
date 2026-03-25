CREATE TABLE IF NOT EXISTS stations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  postcode TEXT DEFAULT '',
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  amenities TEXT DEFAULT '[]',
  opening_hours TEXT,
  phone TEXT,
  fetched_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fuel_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  station_id TEXT NOT NULL REFERENCES stations(id),
  fuel_type TEXT NOT NULL CHECK(fuel_type IN ('unleaded','diesel','premium','e10','lpg')),
  price REAL NOT NULL CHECK(price > 0 AND price < 10),
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  client_ip TEXT
);

CREATE INDEX IF NOT EXISTS idx_prices_station ON fuel_prices(station_id);
CREATE INDEX IF NOT EXISTS idx_prices_submitted ON fuel_prices(submitted_at);

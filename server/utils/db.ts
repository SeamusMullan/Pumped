import Database from 'better-sqlite3'
import { resolve } from 'path'
import { mkdirSync } from 'fs'

const DB_DIR = resolve(process.cwd(), 'data')
const DB_PATH = resolve(DB_DIR, 'pumped.db')

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db

  mkdirSync(DB_DIR, { recursive: true })
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')

  _db.exec(`
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
  `)

  return _db
}

export function upsertStation(station: {
  id: string
  name: string
  brand: string
  address: string
  city: string
  postcode: string
  lat: number
  lng: number
  amenities: string[]
  openingHours?: string
  phone?: string
}) {
  const db = getDb()
  db.prepare(`
    INSERT INTO stations (id, name, brand, address, city, postcode, lat, lng, amenities, opening_hours, phone, fetched_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      brand = excluded.brand,
      address = excluded.address,
      city = excluded.city,
      postcode = excluded.postcode,
      lat = excluded.lat,
      lng = excluded.lng,
      amenities = excluded.amenities,
      opening_hours = excluded.opening_hours,
      phone = excluded.phone,
      fetched_at = excluded.fetched_at
  `).run(
    station.id,
    station.name,
    station.brand,
    station.address,
    station.city,
    station.postcode,
    station.lat,
    station.lng,
    JSON.stringify(station.amenities),
    station.openingHours ?? null,
    station.phone ?? null,
  )
}

export function getLatestPrices(stationIds: string[]): Record<string, Array<{ type: string; price: number; updatedAt: string }>> {
  if (!stationIds.length) return {}
  const db = getDb()

  const placeholders = stationIds.map(() => '?').join(',')
  const rows = db.prepare(`
    SELECT fp.station_id, fp.fuel_type, fp.price, fp.submitted_at
    FROM fuel_prices fp
    INNER JOIN (
      SELECT station_id, fuel_type, MAX(submitted_at) as max_submitted
      FROM fuel_prices
      WHERE submitted_at > datetime('now', '-7 days')
      AND station_id IN (${placeholders})
      GROUP BY station_id, fuel_type
    ) latest ON fp.station_id = latest.station_id
      AND fp.fuel_type = latest.fuel_type
      AND fp.submitted_at = latest.max_submitted
  `).all(...stationIds) as Array<{ station_id: string; fuel_type: string; price: number; submitted_at: string }>

  const result: Record<string, Array<{ type: string; price: number; updatedAt: string }>> = {}
  for (const row of rows) {
    if (!result[row.station_id]) result[row.station_id] = []
    result[row.station_id].push({
      type: row.fuel_type,
      price: row.price,
      updatedAt: row.submitted_at,
    })
  }
  return result
}

export function insertPrice(stationId: string, fuelType: string, price: number, clientIp: string | null) {
  const db = getDb()
  db.prepare(`
    INSERT INTO fuel_prices (station_id, fuel_type, price, client_ip)
    VALUES (?, ?, ?, ?)
  `).run(stationId, fuelType, price, clientIp)
}

export function checkRateLimit(clientIp: string): boolean {
  const db = getDb()
  const row = db.prepare(`
    SELECT COUNT(*) as cnt FROM fuel_prices
    WHERE client_ip = ? AND submitted_at > datetime('now', '-1 hour')
  `).get(clientIp) as { cnt: number }
  return row.cnt < 20
}

export function stationExists(stationId: string): boolean {
  const db = getDb()
  const row = db.prepare('SELECT 1 FROM stations WHERE id = ?').get(stationId)
  return !!row
}

export function getPriceHistory(stationId: string, days: number = 7) {
  const db = getDb()
  return db.prepare(`
    SELECT fuel_type, price, submitted_at
    FROM fuel_prices
    WHERE station_id = ? AND submitted_at > datetime('now', '-' || ? || ' days')
    ORDER BY submitted_at DESC
  `).all(stationId, days) as Array<{ fuel_type: string; price: number; submitted_at: string }>
}

export function getAllStationsFromDb() {
  const db = getDb()
  return db.prepare('SELECT * FROM stations').all() as Array<{
    id: string
    name: string
    brand: string
    address: string
    city: string
    postcode: string
    lat: number
    lng: number
    amenities: string
    opening_hours: string | null
    phone: string | null
    fetched_at: string
  }>
}

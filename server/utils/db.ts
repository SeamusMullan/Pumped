import type { H3Event } from 'h3'

export function getDb(event: H3Event): D1Database | null {
  try {
    const db = event.context?.cloudflare?.env?.DB
    return db ?? null
  }
  catch {
    return null
  }
}

export async function upsertStation(db: D1Database, station: {
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
  await db.prepare(`
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
  `).bind(
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
  ).run()
}

export async function getLatestPrices(db: D1Database, stationIds: string[]): Promise<Record<string, Array<{ type: string; price: number; updatedAt: string }>>> {
  if (!stationIds.length) return {}

  const placeholders = stationIds.map(() => '?').join(',')
  const { results: rows } = await db.prepare(`
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
  `).bind(...stationIds).all<{ station_id: string; fuel_type: string; price: number; submitted_at: string }>()

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

export async function insertPrice(db: D1Database, stationId: string, fuelType: string, price: number, clientIp: string | null) {
  await db.prepare(`
    INSERT INTO fuel_prices (station_id, fuel_type, price, client_ip)
    VALUES (?, ?, ?, ?)
  `).bind(stationId, fuelType, price, clientIp).run()
}

export async function checkRateLimit(db: D1Database, clientIp: string): Promise<boolean> {
  const row = await db.prepare(`
    SELECT COUNT(*) as cnt FROM fuel_prices
    WHERE client_ip = ? AND submitted_at > datetime('now', '-1 hour')
  `).bind(clientIp).first<{ cnt: number }>()
  return (row?.cnt ?? 0) < 20
}

export async function stationExists(db: D1Database, stationId: string): Promise<boolean> {
  const row = await db.prepare('SELECT 1 FROM stations WHERE id = ?').bind(stationId).first()
  return !!row
}

export async function getPriceHistory(db: D1Database, stationId: string, days: number = 7) {
  // Use CAST to ensure days is treated as integer in the SQL expression
  const { results } = await db.prepare(`
    SELECT fuel_type, price, submitted_at
    FROM fuel_prices
    WHERE station_id = ? AND submitted_at > datetime('now', '-' || CAST(? AS INTEGER) || ' days')
    ORDER BY submitted_at DESC
  `).bind(stationId, days).all<{ fuel_type: string; price: number; submitted_at: string }>()
  return results
}

/**
 * Anonymize IP addresses older than 30 days for GDPR compliance.
 * Should be called periodically (e.g. daily via cron or on deploy).
 */
export async function anonymizeOldIps(db: D1Database) {
  await db.prepare(`
    UPDATE fuel_prices SET client_ip = 'anonymized'
    WHERE client_ip != 'anonymized'
      AND client_ip IS NOT NULL
      AND submitted_at < datetime('now', '-30 days')
  `).run()
}

export async function getAllStationsFromDb(db: D1Database) {
  const { results } = await db.prepare('SELECT * FROM stations').all<{
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
  }>()
  return results
}

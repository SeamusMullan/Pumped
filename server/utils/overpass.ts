import type { Station } from '~/types/station'
import { upsertStation, getAllStationsFromDb, getLatestPrices } from './db'

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

interface OverpassResponse {
  elements: OverpassElement[]
}

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

const OVERPASS_QUERY = `
[out:json][timeout:60];
area["ISO3166-1"="IE"]["admin_level"="2"]->.roi;
(
  node["amenity"="fuel"](area.roi);
  way["amenity"="fuel"](area.roi);
  relation["amenity"="fuel"](area.roi);
);
out center body;
`

// In-memory cache
let cachedStations: Station[] | null = null
let cacheTimestamp = 0
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

function mapElement(el: OverpassElement): Station | null {
  const tags = el.tags ?? {}
  const lat = el.lat ?? el.center?.lat
  const lon = el.lon ?? el.center?.lon

  if (!lat || !lon) return null

  const amenities: string[] = []
  if (tags.car_wash === 'yes' || tags['wash:self_service'] === 'yes') amenities.push('car-wash')
  if (tags.shop && tags.shop !== 'no') amenities.push('shop')
  if (tags.atm === 'yes') amenities.push('atm')
  if (tags.cafe === 'yes' || tags.coffee === 'yes') amenities.push('coffee')
  if (tags.toilets === 'yes') amenities.push('toilets')
  if (tags.restaurant === 'yes' || tags.cuisine) amenities.push('restaurant')

  const address = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ')

  return {
    id: `${el.type}/${el.id}`,
    name: tags.name || tags.brand || 'Unknown Station',
    brand: tags.brand || tags.operator || '',
    address,
    city: tags['addr:city'] || '',
    postcode: tags['addr:postcode'] || '',
    lat,
    lng: lon,
    prices: [], // filled from DB later
    amenities,
    openingHours: tags.opening_hours,
    phone: tags.phone || tags['contact:phone'],
  }
}

async function fetchFromOverpass(db: D1Database | null): Promise<Station[]> {
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
  })

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as OverpassResponse
  const stations: Station[] = []

  for (const el of data.elements) {
    const station = mapElement(el)
    if (station) {
      stations.push(station)
      // Persist to DB as fallback (if DB available)
      if (db) {
        await upsertStation(db, station)
      }
    }
  }

  return stations
}

async function loadFromDb(db: D1Database | null): Promise<Station[]> {
  if (!db) return []
  const rows = await getAllStationsFromDb(db)
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    brand: row.brand,
    address: row.address,
    city: row.city,
    postcode: row.postcode,
    lat: row.lat,
    lng: row.lng,
    prices: [],
    amenities: JSON.parse(row.amenities || '[]'),
    openingHours: row.opening_hours ?? undefined,
    phone: row.phone ?? undefined,
  }))
}

export async function getStations(db: D1Database | null): Promise<Station[]> {
  const now = Date.now()

  // Return cache if fresh
  if (cachedStations && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedStations
  }

  try {
    console.log('[overpass] Fetching stations from Overpass API...')
    const stations = await fetchFromOverpass(db)
    console.log(`[overpass] Fetched ${stations.length} stations`)
    cachedStations = stations
    cacheTimestamp = now
    return stations
  }
  catch (err) {
    console.error('[overpass] Failed to fetch from Overpass, falling back to DB:', err)
    // Fallback to DB
    const dbStations = await loadFromDb(db)
    if (dbStations.length) {
      cachedStations = dbStations
      cacheTimestamp = now
      return dbStations
    }
    throw new Error('No station data available. Overpass API is unreachable and no cached data exists.')
  }
}

export async function attachPrices(db: D1Database | null, stations: Station[]): Promise<Station[]> {
  if (!db) return stations
  const ids = stations.map(s => s.id)
  const priceMap = await getLatestPrices(db, ids)

  return stations.map(s => ({
    ...s,
    prices: (priceMap[s.id] || []).map(p => ({
      type: p.type as Station['prices'][0]['type'],
      price: p.price,
      updatedAt: p.updatedAt,
    })),
  }))
}

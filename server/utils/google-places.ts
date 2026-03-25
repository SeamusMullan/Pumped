import type { Station, FuelPrice } from '~/types/station'
import { LRUCache } from '~/server/utils/sanitize'

interface GoogleFuelPrice {
  type: string
  price: {
    currencyCode: string
    units: string
    nanos: number
  }
  updateTime: string
}

interface GoogleFuelOptions {
  fuelPrices: GoogleFuelPrice[]
}

interface GooglePlace {
  id: string
  displayName?: { text: string; languageCode: string }
  formattedAddress?: string
  shortFormattedAddress?: string
  location?: { latitude: number; longitude: number }
  internationalPhoneNumber?: string
  regularOpeningHours?: {
    weekdayDescriptions: string[]
  }
  fuelOptions?: GoogleFuelOptions
  types?: string[]
}

interface NearbySearchResponse {
  places: GooglePlace[]
}

// Map Google fuel type names to our fuel types
const FUEL_TYPE_MAP: Record<string, FuelPrice['type']> = {
  'DIESEL': 'diesel',
  'REGULAR_UNLEADED': 'unleaded',
  'MIDGRADE': 'unleaded',
  'PREMIUM': 'premium',
  'E10': 'e10',
  'SP95': 'unleaded',
  'SP95_E10': 'e10',
  'SP98': 'premium',
  'LPG': 'lpg',
}

function googlePriceToNumber(price: { units: string; nanos: number }): number {
  return parseFloat(price.units) + price.nanos / 1_000_000_000
}

function mapGooglePlace(place: GooglePlace): Station | null {
  if (!place.location) return null

  const prices: FuelPrice[] = []
  if (place.fuelOptions?.fuelPrices) {
    for (const fp of place.fuelOptions.fuelPrices) {
      const mapped = FUEL_TYPE_MAP[fp.type]
      if (mapped && fp.price) {
        prices.push({
          type: mapped,
          price: Math.round(googlePriceToNumber(fp.price) * 1000) / 1000,
          updatedAt: fp.updateTime || new Date().toISOString(),
        })
      }
    }
  }

  // Build opening hours string from weekday descriptions
  const openingHours = place.regularOpeningHours?.weekdayDescriptions?.join('; ')

  return {
    id: `google/${place.id}`,
    name: place.displayName?.text || 'Unknown Station',
    brand: '', // Google doesn't have a separate brand field
    address: place.shortFormattedAddress || place.formattedAddress || '',
    city: '',
    postcode: '',
    lat: place.location.latitude,
    lng: place.location.longitude,
    prices,
    amenities: [],
    openingHours,
    phone: place.internationalPhoneNumber,
  }
}

// LRU cache keyed by lat/lng grid — max 500 entries to prevent memory exhaustion
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes (Google prices update more often)
const cache = new LRUCache<Station[]>(500, CACHE_TTL)

function cacheKey(lat: number, lng: number): string {
  // Round to ~1km grid to improve cache hits for nearby queries
  const rlat = Math.round(lat * 100) / 100
  const rlng = Math.round(lng * 100) / 100
  return `${rlat},${rlng}`
}

export async function searchNearbyStations(
  apiKey: string,
  lat: number,
  lng: number,
  radiusMeters: number = 10000,
): Promise<Station[]> {
  const key = cacheKey(lat, lng)
  const cached = cache.get(key)
  if (cached) {
    return cached
  }

  const fieldMask = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.shortFormattedAddress',
    'places.location',
    'places.internationalPhoneNumber',
    'places.regularOpeningHours',
    'places.fuelOptions',
    'places.types',
  ].join(',')

  const body = {
    includedTypes: ['gas_station'],
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: radiusMeters,
      },
    },
  }

  const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fieldMask,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Google Places API error ${response.status}: ${text}`)
  }

  const data = (await response.json()) as NearbySearchResponse
  const stations: Station[] = []

  if (data.places) {
    for (const place of data.places) {
      const station = mapGooglePlace(place)
      if (station) stations.push(station)
    }
  }

  cache.set(key, stations)
  return stations
}

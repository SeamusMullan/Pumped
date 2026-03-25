import { LRUCache } from '~/server/utils/sanitize'
import { getGoogleApiKey } from '~/server/utils/db'

interface PlaceResult {
  lat: number
  lng: number
  name: string
  address: string
}

// LRU cache — max 2000 entries, 24h TTL
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours
const placeCache = new LRUCache<PlaceResult>(2000, CACHE_TTL)

export default defineEventHandler(async (event) => {
  const placeId = getRouterParam(event, 'placeId')
  if (!placeId) {
    throw createError({ statusCode: 400, statusMessage: 'Place ID is required' })
  }

  // Check cache
  const cached = placeCache.get(placeId)
  if (cached) {
    return cached
  }

  const apiKey = getGoogleApiKey(event)

  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'Google Places API key not configured' })
  }

  const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'location,displayName,formattedAddress',
    },
  })

  if (!response.ok) {
    const text = await response.text()
    console.error('[geocode] Place details error:', text)
    throw createError({ statusCode: 502, statusMessage: 'Failed to resolve location' })
  }

  const data = await response.json() as {
    location?: { latitude: number; longitude: number }
    displayName?: { text: string }
    formattedAddress?: string
  }

  if (!data.location) {
    throw createError({ statusCode: 404, statusMessage: 'Location not found' })
  }

  const result = {
    lat: data.location.latitude,
    lng: data.location.longitude,
    name: data.displayName?.text || '',
    address: data.formattedAddress || '',
  }

  placeCache.set(placeId, result)
  return result
})

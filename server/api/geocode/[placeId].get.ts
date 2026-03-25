// Cache place details — place IDs are stable so these can be cached long
interface PlaceResult {
  lat: number
  lng: number
  name: string
  address: string
}

const placeCache = new Map<string, { result: PlaceResult; timestamp: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

export default defineEventHandler(async (event) => {
  const placeId = getRouterParam(event, 'placeId')
  if (!placeId) {
    throw createError({ statusCode: 400, statusMessage: 'Place ID is required' })
  }

  // Check cache
  const cached = placeCache.get(placeId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result
  }

  const config = useRuntimeConfig()
  const apiKey = config.googlePlacesApiKey

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

  placeCache.set(placeId, { result, timestamp: Date.now() })
  return result
})

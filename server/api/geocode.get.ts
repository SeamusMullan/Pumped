import { LRUCache } from '~/server/utils/sanitize'
import { getGoogleApiKey } from '~/server/utils/db'

interface AutocompleteResult {
  placeId: string
  name: string
  description: string
}

// LRU cache — max 1000 entries to prevent memory exhaustion
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const autocompleteCache = new LRUCache<AutocompleteResult[]>(1000, CACHE_TTL)

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = (query.q as string || '').trim().toLowerCase()

  if (!q || q.length < 2) {
    return []
  }

  // Check cache
  const cached = autocompleteCache.get(q)
  if (cached) {
    return cached
  }

  const apiKey = getGoogleApiKey(event)

  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'Google Places API key not configured' })
  }

  const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
    },
    body: JSON.stringify({
      input: q,
      includedRegionCodes: ['IE', 'GB'],
      languageCode: 'en',
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    console.error('[geocode] Autocomplete error:', text)
    throw createError({ statusCode: 502, statusMessage: 'Geocoding failed' })
  }

  const data = await response.json() as {
    suggestions?: Array<{
      placePrediction?: {
        placeId: string
        text: { text: string }
        structuredFormat?: {
          mainText: { text: string }
          secondaryText?: { text: string }
        }
      }
    }>
  }

  if (!data.suggestions?.length) {
    autocompleteCache.set(q, [])
    return []
  }

  const results = []
  const suggestions = data.suggestions.slice(0, 5)

  for (const suggestion of suggestions) {
    const pred = suggestion.placePrediction
    if (!pred) continue

    results.push({
      placeId: pred.placeId,
      name: pred.structuredFormat?.mainText?.text || pred.text.text,
      description: pred.structuredFormat?.secondaryText?.text || '',
    })
  }

  autocompleteCache.set(q, results)
  return results
})

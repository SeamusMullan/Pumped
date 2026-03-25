import { getStations, attachPrices } from '~/server/utils/overpass'
import { searchNearbyStations } from '~/server/utils/google-places'

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Always fetch a fixed radius from Google to maximize cache hits.
// Client-side filtering handles the user's chosen distance.
const GOOGLE_FETCH_RADIUS_M = 20_000 // 20 km

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const lat = query.lat ? parseFloat(query.lat as string) : null
  const lng = query.lng ? parseFloat(query.lng as string) : null

  const config = useRuntimeConfig()
  const googleApiKey = config.googlePlacesApiKey

  // Use Google Places API if key is configured and location is provided
  if (googleApiKey && lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
    try {
      console.log(`[google-places] Searching near ${lat},${lng} radius=${GOOGLE_FETCH_RADIUS_M}m`)
      let stations = await searchNearbyStations(googleApiKey, lat, lng, GOOGLE_FETCH_RADIUS_M)

      // Calculate distances
      stations = stations.map(s => ({
        ...s,
        distanceKm: haversineDistance(lat, lng, s.lat, s.lng),
      }))

      // Also attach any user-submitted prices from the DB
      stations = attachPrices(stations)

      return stations
    }
    catch (err) {
      console.error('[google-places] Failed, falling back to Overpass:', err)
      // Fall through to Overpass
    }
  }

  // Fallback: Overpass API (no location required, fetches all Ireland stations)
  let stations = await getStations()

  if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
    stations = stations
      .map(s => ({
        ...s,
        distanceKm: haversineDistance(lat, lng, s.lat, s.lng),
      }))
      .filter(s => (s.distanceKm ?? Infinity) <= 50)
  }

  stations = attachPrices(stations)

  return stations
})

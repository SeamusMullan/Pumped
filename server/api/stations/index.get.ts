import { getStations, attachPrices } from '~/server/utils/overpass'

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const lat = query.lat ? parseFloat(query.lat as string) : null
  const lng = query.lng ? parseFloat(query.lng as string) : null
  const radius = query.radius ? Math.min(parseFloat(query.radius as string), 100) : 50

  let stations = await getStations()

  // Filter by distance if location provided
  if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
    stations = stations
      .map(s => ({
        ...s,
        distanceKm: haversineDistance(lat, lng, s.lat, s.lng),
      }))
      .filter(s => (s.distanceKm ?? Infinity) <= radius)
  }

  // Attach user-submitted prices
  stations = attachPrices(stations)

  return stations
})

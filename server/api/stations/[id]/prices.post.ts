import { insertPrice, checkRateLimit, stationExists, upsertStation, getDb } from '~/server/utils/db'
import { escapeHtml, getClientIp } from '~/server/utils/sanitize'

const VALID_FUEL_TYPES = ['unleaded', 'diesel', 'premium', 'e10', 'lpg'] as const

export default defineEventHandler(async (event) => {
  const db = getDb(event)
  const stationId = decodeURIComponent(getRouterParam(event, 'id') ?? '')
  if (!stationId) {
    throw createError({ statusCode: 400, statusMessage: 'Station ID is required' })
  }

  const body = await readBody<{ fuelType: string; price: number; station?: { name: string; lat: number; lng: number; address?: string } }>(event)

  // Validate fuel type
  if (!body.fuelType || !VALID_FUEL_TYPES.includes(body.fuelType as typeof VALID_FUEL_TYPES[number])) {
    throw createError({ statusCode: 400, statusMessage: `Invalid fuel type. Must be one of: ${VALID_FUEL_TYPES.join(', ')}` })
  }

  // Validate price
  const price = Number(body.price)
  if (isNaN(price) || price <= 0 || price >= 10) {
    throw createError({ statusCode: 400, statusMessage: 'Price must be between 0 and 10' })
  }

  // Round to 3 decimal places
  const roundedPrice = Math.round(price * 1000) / 1000

  // If station doesn't exist in DB, auto-create it (e.g. Google Places stations)
  // Only allow station IDs that look like they came from Google Places or Overpass
  if (!await stationExists(db, stationId)) {
    if (!stationId.startsWith('google/') && !stationId.match(/^(node|way|relation)\/\d+$/)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid station ID format' })
    }

    if (body.station && body.station.name && body.station.lat && body.station.lng) {
      // Sanitize user-provided strings
      const name = escapeHtml(body.station.name.slice(0, 200))
      const address = escapeHtml((body.station.address || '').slice(0, 500))

      // Validate coordinates are reasonable (roughly IE/GB area)
      if (body.station.lat < 49 || body.station.lat > 61 || body.station.lng < -11 || body.station.lng > 2) {
        throw createError({ statusCode: 400, statusMessage: 'Station location is out of supported area' })
      }

      await upsertStation(db, {
        id: stationId,
        name,
        brand: '',
        address,
        city: '',
        postcode: '',
        lat: body.station.lat,
        lng: body.station.lng,
        amenities: [],
      })
    }
    else {
      throw createError({ statusCode: 404, statusMessage: 'Station not found. Include station details for new stations.' })
    }
  }

  // Rate limit — use Cloudflare's trusted header, not spoofable X-Forwarded-For
  const clientIp = getClientIp(event)
  if (!await checkRateLimit(db, clientIp)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many submissions. Please try again later.' })
  }

  await insertPrice(db, stationId, body.fuelType, roundedPrice, clientIp)

  return {
    success: true,
    price: {
      type: body.fuelType,
      price: roundedPrice,
      updatedAt: new Date().toISOString(),
    },
  }
})

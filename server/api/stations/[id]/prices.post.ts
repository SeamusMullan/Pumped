import { insertPrice, checkRateLimit, stationExists } from '~/server/utils/db'

const VALID_FUEL_TYPES = ['unleaded', 'diesel', 'premium', 'e10', 'lpg'] as const

export default defineEventHandler(async (event) => {
  const stationId = decodeURIComponent(getRouterParam(event, 'id') ?? '')
  if (!stationId) {
    throw createError({ statusCode: 400, statusMessage: 'Station ID is required' })
  }

  const body = await readBody<{ fuelType: string; price: number }>(event)

  // Validate fuel type
  if (!body.fuelType || !VALID_FUEL_TYPES.includes(body.fuelType as any)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid fuel type. Must be one of: ${VALID_FUEL_TYPES.join(', ')}` })
  }

  // Validate price
  const price = Number(body.price)
  if (isNaN(price) || price <= 0 || price >= 10) {
    throw createError({ statusCode: 400, statusMessage: 'Price must be between 0 and 10' })
  }

  // Round to 3 decimal places
  const roundedPrice = Math.round(price * 1000) / 1000

  // Check station exists
  if (!stationExists(stationId)) {
    throw createError({ statusCode: 404, statusMessage: 'Station not found' })
  }

  // Rate limit
  const clientIp = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  if (!checkRateLimit(clientIp)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many submissions. Please try again later.' })
  }

  insertPrice(stationId, body.fuelType, roundedPrice, clientIp)

  return {
    success: true,
    price: {
      type: body.fuelType,
      price: roundedPrice,
      updatedAt: new Date().toISOString(),
    },
  }
})

import { getPriceHistory, stationExists, getDb } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const db = getDb(event)
  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database not available' })
  }
  const stationId = decodeURIComponent(getRouterParam(event, 'id') ?? '')
  if (!stationId) {
    throw createError({ statusCode: 400, statusMessage: 'Station ID is required' })
  }

  if (!await stationExists(db, stationId)) {
    throw createError({ statusCode: 404, statusMessage: 'Station not found' })
  }

  const query = getQuery(event)
  const days = Math.min(Math.max(parseInt(query.days as string) || 7, 1), 30)

  const history = await getPriceHistory(db, stationId, days)

  return history.map(row => ({
    type: row.fuel_type,
    price: row.price,
    updatedAt: row.submitted_at,
  }))
})

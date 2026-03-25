import { getPriceHistory, stationExists } from '~/server/utils/db'

export default defineEventHandler((event) => {
  const stationId = decodeURIComponent(getRouterParam(event, 'id') ?? '')
  if (!stationId) {
    throw createError({ statusCode: 400, statusMessage: 'Station ID is required' })
  }

  if (!stationExists(stationId)) {
    throw createError({ statusCode: 404, statusMessage: 'Station not found' })
  }

  const query = getQuery(event)
  const days = Math.min(Math.max(parseInt(query.days as string) || 7, 1), 30)

  const history = getPriceHistory(stationId, days)

  return history.map(row => ({
    type: row.fuel_type,
    price: row.price,
    updatedAt: row.submitted_at,
  }))
})

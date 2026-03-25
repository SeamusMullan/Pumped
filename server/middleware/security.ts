import { getClientIp } from '~/server/utils/sanitize'
import { LRUCache } from '~/server/utils/sanitize'

// Rate limit tracking for read endpoints (per IP)
const readRateLimits = new LRUCache<number[]>(10_000, 60 * 1000)
const READ_RATE_LIMIT = 60 // requests per minute
const RATE_LIMITED_PATHS = ['/api/stations', '/api/geocode']

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const method = getMethod(event)

  // --- CSP & Security Headers ---
  setResponseHeaders(event, {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://*.tile.openstreetmap.org",
      "connect-src 'self'",
      "font-src 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(self)',
  })

  // --- CSRF Protection for state-changing methods ---
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const origin = getRequestHeader(event, 'origin')
    const host = getRequestHeader(event, 'host')

    // Allow requests with no origin (same-origin form posts, server-to-server)
    // but block requests from mismatched origins
    if (origin && host) {
      try {
        const originHost = new URL(origin).host
        if (originHost !== host) {
          throw createError({
            statusCode: 403,
            statusMessage: 'Cross-origin requests are not allowed',
          })
        }
      }
      catch (e) {
        if ((e as { statusCode?: number }).statusCode === 403) throw e
        throw createError({
          statusCode: 403,
          statusMessage: 'Invalid origin header',
        })
      }
    }
  }

  // --- Rate Limiting for read endpoints ---
  if (method === 'GET' && RATE_LIMITED_PATHS.some(p => url.pathname.startsWith(p))) {
    const ip = getClientIp(event)
    const now = Date.now()
    const windowMs = 60 * 1000

    let timestamps = readRateLimits.get(ip) || []
    timestamps = timestamps.filter(t => now - t < windowMs)

    if (timestamps.length >= READ_RATE_LIMIT) {
      setResponseHeader(event, 'Retry-After', '60')
      throw createError({
        statusCode: 429,
        statusMessage: 'Too many requests. Please try again later.',
      })
    }

    timestamps.push(now)
    readRateLimits.set(ip, timestamps)
  }
})

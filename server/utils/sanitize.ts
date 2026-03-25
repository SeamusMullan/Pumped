/**
 * HTML-escape a string to prevent XSS when inserting into HTML contexts.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Simple LRU cache with a max size and TTL.
 * Used to prevent unbounded memory growth on Cloudflare Workers.
 */
export class LRUCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>()
  private readonly maxSize: number
  private readonly ttlMs: number

  constructor(maxSize: number, ttlMs: number) {
    this.maxSize = maxSize
    this.ttlMs = ttlMs
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined

    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key)
      return undefined
    }

    // Move to end (most recently used)
    this.cache.delete(key)
    this.cache.set(key, entry)
    return entry.value
  }

  set(key: string, value: T): void {
    // Delete first so it moves to end
    this.cache.delete(key)

    // Evict oldest entries if at capacity
    while (this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value
      if (oldest !== undefined) this.cache.delete(oldest)
    }

    this.cache.set(key, { value, timestamp: Date.now() })
  }

  get size(): number {
    return this.cache.size
  }
}

/**
 * Get the real client IP on Cloudflare (cannot be spoofed by the client).
 * Falls back through trusted headers in priority order.
 */
export function getClientIp(event: { node: { req: { headers: Record<string, string | string[] | undefined> } } }): string {
  // CF-Connecting-IP is set by Cloudflare and cannot be spoofed
  const cfIp = event.node.req.headers['cf-connecting-ip']
  if (cfIp) return Array.isArray(cfIp) ? cfIp[0] : cfIp

  // Fallback for local dev — use remote address
  const remoteAddress = event.node.req.headers['x-real-ip']
  if (remoteAddress) return Array.isArray(remoteAddress) ? remoteAddress[0] : remoteAddress

  return 'unknown'
}

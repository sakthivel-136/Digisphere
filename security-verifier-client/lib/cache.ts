/**
 * lib/cache.ts
 *
 * Lightweight in-memory cache with TTL (time-to-live).
 * Prevents repeated API calls for data that rarely changes mid-session
 * (e.g. factory list, QR codes per factory).
 *
 * Usage:
 *   setCache('factories', data, 300)   // cache 5 minutes
 *   getCache<Factory[]>('factories')   // null if expired
 *   invalidateCache('factories')       // bust after mutation
 */

interface CacheEntry {
  data: unknown
  expiresAt: number
}

const store = new Map<string, CacheEntry>()

/** Store a value in cache for `ttlSeconds` seconds (default: 5 minutes) */
export function setCache<T>(key: string, data: T, ttlSeconds = 300): void {
  store.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 })
}

/** Retrieve a cached value, or null if missing/expired */
export function getCache<T>(key: string): T | null {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }
  return entry.data as T
}

/** Remove a single cache key (call after create/update/delete mutations) */
export function invalidateCache(key: string): void {
  store.delete(key)
}

/** Clear the entire cache (e.g. on logout) */
export function clearAllCache(): void {
  store.clear()
}

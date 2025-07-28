// server/utils/cache.ts
// Simple in-memory cache for OANDA API responses

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class ServerCache {
  private cache = new Map<string, CacheEntry<any>>()
  private pendingRequests = new Map<string, Promise<any>>()

  /**
   * Get cached data or execute fetch function if cache miss/expired
   */
  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs: number = 30000 // 30 seconds default
  ): Promise<T> {
    // Check if we have a pending request for this key (request deduplication)
    const pendingRequest = this.pendingRequests.get(key)
    if (pendingRequest) {
      return pendingRequest
    }

    // Check cache
    const cached = this.cache.get(key)
    if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
      return cached.data
    }

    // Create and store pending request
    const promise = this.executeWithDeduplication(key, fetchFn, ttlMs)
    this.pendingRequests.set(key, promise)

    try {
      const result = await promise
      return result
    } finally {
      // Remove from pending requests when done
      this.pendingRequests.delete(key)
    }
  }

  private async executeWithDeduplication<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs: number
  ): Promise<T> {
    try {
      const data = await fetchFn()

      // Store in cache
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl: ttlMs
      })

      return data
    } catch (error) {
      // Don't cache errors, but clean up pending request
      throw error
    }
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key)
    this.pendingRequests.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
    this.pendingRequests.clear()
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      entries: Array.from(this.cache.keys())
    }
  }
}

// Export singleton instance
export const serverCache = new ServerCache()

// Cleanup expired entries every 5 minutes
setInterval(() => {
  serverCache.cleanup()
}, 5 * 60 * 1000)

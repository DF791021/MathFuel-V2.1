/**
 * In-memory cache for AI-generated insights
 * Reduces API calls and improves response times
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

// Cache TTL: 24 hours (in milliseconds)
const DEFAULT_TTL = 24 * 60 * 60 * 1000;

/**
 * Generate cache key for a student's insights
 */
export function generateCacheKey(playerId: number, type: string): string {
  return `insights:${playerId}:${type}`;
}

/**
 * Set cache entry
 */
export function setCacheEntry(key: string, data: any, ttl: number = DEFAULT_TTL): void {
  const now = Date.now();
  cache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + ttl,
  });
}

/**
 * Get cache entry
 */
export function getCacheEntry(key: string): any | null {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  // Check if cache has expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Check if cache entry exists and is valid
 */
export function isCached(key: string): boolean {
  const entry = cache.get(key);

  if (!entry) {
    return false;
  }

  // Check if cache has expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return false;
  }

  return true;
}

/**
 * Invalidate cache entry
 */
export function invalidateCache(key: string): void {
  cache.delete(key);
}

/**
 * Invalidate all insights for a student
 */
export function invalidateStudentInsights(playerId: number): void {
  const keysToDelete: string[] = [];

  cache.forEach((_, key) => {
    if (key.startsWith(`insights:${playerId}:`)) {
      keysToDelete.push(key);
    }
  });

  for (const key of keysToDelete) {
    cache.delete(key);
  }
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  cache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  entries: number;
} {
  return {
    size: cache.size,
    entries: cache.size,
  };
}

/**
 * Get cache hit rate (for monitoring)
 */
let cacheHits = 0;
let cacheMisses = 0;

export function recordCacheHit(): void {
  cacheHits++;
}

export function recordCacheMiss(): void {
  cacheMisses++;
}

export function getCacheHitRate(): number {
  const total = cacheHits + cacheMisses;
  if (total === 0) return 0;
  return (cacheHits / total) * 100;
}

export function resetCacheStats(): void {
  cacheHits = 0;
  cacheMisses = 0;
}

import { GoalSuggestion } from "./aiGoalSuggestions";

interface CachedSuggestion {
  suggestions: GoalSuggestion[];
  timestamp: number;
  performanceHash: string;
}

// In-memory cache with 1 hour TTL
const suggestionCache = new Map<number, CachedSuggestion>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Generate a hash of performance data to detect changes
 */
export function generatePerformanceHash(data: Record<string, unknown>): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Get cached suggestions if available and not expired
 */
export function getCachedSuggestions(
  playerId: number,
  performanceHash: string
): GoalSuggestion[] | null {
  const cached = suggestionCache.get(playerId);

  if (!cached) {
    return null;
  }

  // Check if cache is expired
  const isExpired = Date.now() - cached.timestamp > CACHE_TTL;
  if (isExpired) {
    suggestionCache.delete(playerId);
    return null;
  }

  // Check if performance data has changed
  if (cached.performanceHash !== performanceHash) {
    suggestionCache.delete(playerId);
    return null;
  }

  return cached.suggestions;
}

/**
 * Cache suggestions for a student
 */
export function cacheSuggestions(
  playerId: number,
  suggestions: GoalSuggestion[],
  performanceHash: string
): void {
  suggestionCache.set(playerId, {
    suggestions,
    timestamp: Date.now(),
    performanceHash,
  });
}

/**
 * Clear cache for a specific student
 */
export function clearStudentCache(playerId: number): void {
  suggestionCache.delete(playerId);
}

/**
 * Clear all cached suggestions
 */
export function clearAllCache(): void {
  suggestionCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const stats = {
    totalCached: suggestionCache.size,
    entries: [] as Array<{
      playerId: number;
      age: number;
      ageMinutes: number;
    }>,
  };

  suggestionCache.forEach((value, playerId) => {
    const age = Date.now() - value.timestamp;
    stats.entries.push({
      playerId,
      age,
      ageMinutes: Math.round(age / 60000),
    });
  });

  return stats;
}

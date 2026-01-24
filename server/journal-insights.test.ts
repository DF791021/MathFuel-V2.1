import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  validateAnalysisResults,
  JournalEntry,
  AnalysisResults,
} from "./_core/journalAnalysis";
import {
  generateCacheKey,
  setCacheEntry,
  getCacheEntry,
  isCached,
  invalidateCache,
  invalidateStudentInsights,
  clearAllCache,
  getCacheStats,
  resetCacheStats,
  recordCacheHit,
  recordCacheMiss,
  getCacheHitRate,
} from "./_core/insightCache";

describe("Journal Insights Analysis", () => {
  describe("validateAnalysisResults", () => {
    it("should validate complete analysis results", () => {
      const validResults: AnalysisResults = {
        progressTrend: {
          insightType: "progress_trend",
          insight: "Student is improving steadily",
          supportingData: "Accuracy increased from 60% to 75%",
        },
        challengePatterns: {
          insightType: "challenge_pattern",
          insight: "Struggles with complex questions",
          supportingData: "Accuracy drops 20% on multi-part questions",
        },
        strategyEffectiveness: {
          insightType: "strategy_effectiveness",
          insight: "Practice sessions are effective",
          supportingData: "Scores improve 15% after practice",
        },
        motivationLevel: {
          insightType: "motivation_level",
          insight: "Student is highly motivated",
          supportingData: "Consistent journal entries and positive mood",
        },
        learningStyle: {
          insightType: "learning_style",
          insight: "Prefers visual and hands-on learning",
          supportingData: "Better performance with diagrams and activities",
        },
        summary: "Overall positive learning trajectory",
      };

      expect(validateAnalysisResults(validResults)).toBe(true);
    });

    it("should reject incomplete analysis results", () => {
      const incompleteResults = {
        progressTrend: {
          insightType: "progress_trend",
          insight: "Student is improving",
          // Missing supportingData
        },
        challengePatterns: {
          insightType: "challenge_pattern",
          insight: "Struggles with complex questions",
          supportingData: "Accuracy drops 20%",
        },
        strategyEffectiveness: {
          insightType: "strategy_effectiveness",
          insight: "Practice sessions are effective",
          supportingData: "Scores improve 15%",
        },
        motivationLevel: {
          insightType: "motivation_level",
          insight: "Student is motivated",
          supportingData: "Positive engagement",
        },
        learningStyle: {
          insightType: "learning_style",
          insight: "Visual learner",
          supportingData: "Better with diagrams",
        },
        summary: "Positive trajectory",
      };

      expect(validateAnalysisResults(incompleteResults)).toBe(false);
    });

    it("should reject missing required fields", () => {
      const missingFields = {
        progressTrend: {
          insightType: "progress_trend",
          insight: "Student is improving",
          supportingData: "Accuracy increased",
        },
        // Missing challengePatterns
        strategyEffectiveness: {
          insightType: "strategy_effectiveness",
          insight: "Practice works",
          supportingData: "Scores improve",
        },
        motivationLevel: {
          insightType: "motivation_level",
          insight: "Motivated",
          supportingData: "Positive",
        },
        learningStyle: {
          insightType: "learning_style",
          insight: "Visual",
          supportingData: "Diagrams",
        },
        summary: "Good progress",
      };

      expect(validateAnalysisResults(missingFields)).toBe(false);
    });
  });

  describe("Insight Caching", () => {
    beforeEach(() => {
      clearAllCache();
      resetCacheStats();
    });

    it("should generate correct cache keys", () => {
      const key1 = generateCacheKey(1, "progress_trend");
      const key2 = generateCacheKey(1, "challenge_pattern");
      const key3 = generateCacheKey(2, "progress_trend");

      expect(key1).toBe("insights:1:progress_trend");
      expect(key2).toBe("insights:1:challenge_pattern");
      expect(key3).toBe("insights:2:progress_trend");
      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
    });

    it("should set and retrieve cache entries", () => {
      const key = generateCacheKey(1, "progress_trend");
      const data = { insight: "Test insight", supportingData: "Test data" };

      setCacheEntry(key, data);
      const retrieved = getCacheEntry(key);

      expect(retrieved).toEqual(data);
    });

    it("should check if cache entry exists", () => {
      const key = generateCacheKey(1, "progress_trend");
      const data = { insight: "Test", supportingData: "Data" };

      expect(isCached(key)).toBe(false);

      setCacheEntry(key, data);
      expect(isCached(key)).toBe(true);
    });

    it("should invalidate specific cache entry", () => {
      const key = generateCacheKey(1, "progress_trend");
      const data = { insight: "Test", supportingData: "Data" };

      setCacheEntry(key, data);
      expect(isCached(key)).toBe(true);

      invalidateCache(key);
      expect(isCached(key)).toBe(false);
    });

    it("should invalidate all student insights", () => {
      const key1 = generateCacheKey(1, "progress_trend");
      const key2 = generateCacheKey(1, "challenge_pattern");
      const key3 = generateCacheKey(2, "progress_trend");
      const data = { insight: "Test", supportingData: "Data" };

      setCacheEntry(key1, data);
      setCacheEntry(key2, data);
      setCacheEntry(key3, data);

      expect(isCached(key1)).toBe(true);
      expect(isCached(key2)).toBe(true);
      expect(isCached(key3)).toBe(true);

      invalidateStudentInsights(1);

      expect(isCached(key1)).toBe(false);
      expect(isCached(key2)).toBe(false);
      expect(isCached(key3)).toBe(true); // Different student
    });

    it("should clear all cache", () => {
      const key1 = generateCacheKey(1, "progress_trend");
      const key2 = generateCacheKey(2, "challenge_pattern");
      const data = { insight: "Test", supportingData: "Data" };

      setCacheEntry(key1, data);
      setCacheEntry(key2, data);

      expect(isCached(key1)).toBe(true);
      expect(isCached(key2)).toBe(true);

      clearAllCache();

      expect(isCached(key1)).toBe(false);
      expect(isCached(key2)).toBe(false);
    });

    it("should track cache statistics", () => {
      const key = generateCacheKey(1, "progress_trend");
      const data = { insight: "Test", supportingData: "Data" };

      setCacheEntry(key, data);

      const stats = getCacheStats();
      expect(stats.entries).toBe(1);
      expect(stats.size).toBe(1);
    });

    it("should calculate cache hit rate", () => {
      recordCacheHit();
      recordCacheHit();
      recordCacheMiss();

      const hitRate = getCacheHitRate();
      expect(hitRate).toBe((2 / 3) * 100); // 66.67%
    });

    it("should reset cache statistics", () => {
      recordCacheHit();
      recordCacheHit();
      recordCacheMiss();

      let hitRate = getCacheHitRate();
      expect(hitRate).toBeGreaterThan(0);

      resetCacheStats();
      hitRate = getCacheHitRate();
      expect(hitRate).toBe(0);
    });

    it("should handle cache expiration", async () => {
      const key = generateCacheKey(1, "progress_trend");
      const data = { insight: "Test", supportingData: "Data" };

      // Set cache with 100ms TTL
      setCacheEntry(key, data, 100);
      expect(isCached(key)).toBe(true);

      // Wait for cache to expire
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(isCached(key)).toBe(false);
    });

    it("should return null for expired cache entries", async () => {
      const key = generateCacheKey(1, "progress_trend");
      const data = { insight: "Test", supportingData: "Data" };

      setCacheEntry(key, data, 100);
      expect(getCacheEntry(key)).toEqual(data);

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(getCacheEntry(key)).toBeNull();
    });
  });

  describe("Cache Key Generation", () => {
    it("should generate unique keys for different students", () => {
      const key1 = generateCacheKey(1, "progress_trend");
      const key2 = generateCacheKey(2, "progress_trend");

      expect(key1).not.toBe(key2);
    });

    it("should generate unique keys for different insight types", () => {
      const key1 = generateCacheKey(1, "progress_trend");
      const key2 = generateCacheKey(1, "challenge_pattern");

      expect(key1).not.toBe(key2);
    });

    it("should generate consistent keys", () => {
      const key1a = generateCacheKey(1, "progress_trend");
      const key1b = generateCacheKey(1, "progress_trend");

      expect(key1a).toBe(key1b);
    });
  });
});

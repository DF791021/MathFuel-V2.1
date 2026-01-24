import { describe, it, expect, beforeEach } from "vitest";
import {
  validateGoalSuggestions,
  type StudentPerformanceData,
} from "./_core/aiGoalSuggestions";
import {
  generatePerformanceHash,
  getCachedSuggestions,
  cacheSuggestions,
  clearStudentCache,
  getCacheStats,
} from "./_core/suggestionCache";

describe("AI Goal Suggestions", () => {
  describe("validateGoalSuggestions", () => {
    it("should validate correct goal suggestions", async () => {
      const suggestions = [
        {
          goalType: "accuracy",
          goalName: "Improve Accuracy to 85%",
          targetValue: 85,
          priority: "high" as const,
          rationale: "Current accuracy is 75%, improve by 10%",
        },
      ];

      const result = await validateGoalSuggestions(suggestions);
      expect(result).toBe(true);
    });

    it("should reject empty suggestions array", async () => {
      const result = await validateGoalSuggestions([]);
      expect(result).toBe(false);
    });

    it("should reject invalid goal type", async () => {
      const suggestions = [
        {
          goalType: "invalid_type",
          goalName: "Test Goal",
          targetValue: 100,
          priority: "high" as const,
          rationale: "Test rationale",
        },
      ];

      const result = await validateGoalSuggestions(suggestions);
      expect(result).toBe(false);
    });

    it("should reject invalid priority", async () => {
      const suggestions = [
        {
          goalType: "accuracy",
          goalName: "Test Goal",
          targetValue: 100,
          priority: "invalid" as any,
          rationale: "Test rationale",
        },
      ];

      const result = await validateGoalSuggestions(suggestions);
      expect(result).toBe(false);
    });

    it("should reject zero or negative target values", async () => {
      const suggestions = [
        {
          goalType: "accuracy",
          goalName: "Test Goal",
          targetValue: 0,
          priority: "high" as const,
          rationale: "Test rationale",
        },
      ];

      const result = await validateGoalSuggestions(suggestions);
      expect(result).toBe(false);
    });

    it("should reject empty goal names", async () => {
      const suggestions = [
        {
          goalType: "accuracy",
          goalName: "",
          targetValue: 100,
          priority: "high" as const,
          rationale: "Test rationale",
        },
      ];

      const result = await validateGoalSuggestions(suggestions);
      expect(result).toBe(false);
    });

    it("should validate multiple suggestions", async () => {
      const suggestions = [
        {
          goalType: "accuracy",
          goalName: "Improve Accuracy",
          targetValue: 85,
          priority: "high" as const,
          rationale: "Current accuracy is 75%",
        },
        {
          goalType: "score",
          goalName: "Increase Average Score",
          targetValue: 120,
          priority: "medium" as const,
          rationale: "Current average is 100",
        },
        {
          goalType: "games_played",
          goalName: "Play More Games",
          targetValue: 50,
          priority: "low" as const,
          rationale: "Increase engagement",
        },
      ];

      const result = await validateGoalSuggestions(suggestions);
      expect(result).toBe(true);
    });
  });

  describe("Performance Hashing", () => {
    it("should generate consistent hash for same data", () => {
      const data = {
        avgAccuracy: 75,
        avgScore: 100,
        gamesPlayed: 20,
      };

      const hash1 = generatePerformanceHash(data);
      const hash2 = generatePerformanceHash(data);

      expect(hash1).toBe(hash2);
    });

    it("should generate different hash for different data", () => {
      const data1 = { avgAccuracy: 75, avgScore: 100 };
      const data2 = { avgAccuracy: 80, avgScore: 100 };

      const hash1 = generatePerformanceHash(data1);
      const hash2 = generatePerformanceHash(data2);

      expect(hash1).not.toBe(hash2);
    });

    it("should handle complex nested data", () => {
      const data = {
        avgAccuracy: 75,
        weakTopics: [
          { topic: "Vegetables", mastery: 60 },
          { topic: "Proteins", mastery: 70 },
        ],
        strongTopics: ["Fruits", "Dairy"],
      };

      const hash = generatePerformanceHash(data);
      expect(typeof hash).toBe("string");
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe("Suggestion Caching", () => {
    beforeEach(() => {
      clearStudentCache(1);
      clearStudentCache(2);
    });

    it("should cache and retrieve suggestions", () => {
      const playerId = 1;
      const suggestions = [
        {
          goalType: "accuracy" as const,
          goalName: "Test Goal",
          targetValue: 85,
          priority: "high" as const,
          rationale: "Test rationale",
        },
      ];
      const hash = "test-hash-123";

      cacheSuggestions(playerId, suggestions, hash);
      const cached = getCachedSuggestions(playerId, hash);

      expect(cached).toEqual(suggestions);
    });

    it("should return null for non-existent cache", () => {
      const cached = getCachedSuggestions(999, "test-hash");
      expect(cached).toBeNull();
    });

    it("should return null when performance hash changes", () => {
      const playerId = 1;
      const suggestions = [
        {
          goalType: "accuracy" as const,
          goalName: "Test Goal",
          targetValue: 85,
          priority: "high" as const,
          rationale: "Test rationale",
        },
      ];

      cacheSuggestions(playerId, suggestions, "hash-1");
      const cached = getCachedSuggestions(playerId, "hash-2");

      expect(cached).toBeNull();
    });

    it("should clear individual student cache", () => {
      const playerId = 1;
      const suggestions = [
        {
          goalType: "accuracy" as const,
          goalName: "Test Goal",
          targetValue: 85,
          priority: "high" as const,
          rationale: "Test rationale",
        },
      ];

      cacheSuggestions(playerId, suggestions, "test-hash");
      clearStudentCache(playerId);
      const cached = getCachedSuggestions(playerId, "test-hash");

      expect(cached).toBeNull();
    });

    it("should track cache statistics", () => {
      const suggestions = [
        {
          goalType: "accuracy" as const,
          goalName: "Test Goal",
          targetValue: 85,
          priority: "high" as const,
          rationale: "Test rationale",
        },
      ];

      cacheSuggestions(1, suggestions, "hash-1");
      cacheSuggestions(2, suggestions, "hash-2");

      const stats = getCacheStats();

      expect(stats.totalCached).toBe(2);
      expect(stats.entries.length).toBe(2);
      expect(stats.entries[0].playerId).toBeDefined();
      expect(stats.entries[0].age).toBeGreaterThanOrEqual(0);
    });

    it("should handle cache for multiple students independently", () => {
      const suggestions1 = [
        {
          goalType: "accuracy" as const,
          goalName: "Goal 1",
          targetValue: 85,
          priority: "high" as const,
          rationale: "Rationale 1",
        },
      ];

      const suggestions2 = [
        {
          goalType: "score" as const,
          goalName: "Goal 2",
          targetValue: 120,
          priority: "medium" as const,
          rationale: "Rationale 2",
        },
      ];

      cacheSuggestions(1, suggestions1, "hash-1");
      cacheSuggestions(2, suggestions2, "hash-2");

      const cached1 = getCachedSuggestions(1, "hash-1");
      const cached2 = getCachedSuggestions(2, "hash-2");

      expect(cached1).toEqual(suggestions1);
      expect(cached2).toEqual(suggestions2);
      expect(cached1).not.toEqual(cached2);
    });
  });

  describe("Goal Type Validation", () => {
    it("should accept all valid goal types", async () => {
      const validTypes = [
        "accuracy",
        "score",
        "games_played",
        "streak",
        "topic_mastery",
      ];

      for (const type of validTypes) {
        const suggestions = [
          {
            goalType: type,
            goalName: `Test ${type}`,
            targetValue: 100,
            priority: "high" as const,
            rationale: "Test",
          },
        ];

        const result = await validateGoalSuggestions(suggestions);
        expect(result).toBe(true);
      }
    });
  });

  describe("Priority Level Validation", () => {
    it("should accept all valid priority levels", async () => {
      const priorities = ["low", "medium", "high"];

      for (const priority of priorities) {
        const suggestions = [
          {
            goalType: "accuracy",
            goalName: "Test Goal",
            targetValue: 100,
            priority: priority as "low" | "medium" | "high",
            rationale: "Test",
          },
        ];

        const result = await validateGoalSuggestions(suggestions);
        expect(result).toBe(true);
      }
    });
  });

  describe("Target Value Validation", () => {
    it("should accept positive numeric target values", async () => {
      const validValues = [1, 10, 50, 100, 1000, 99.5];

      for (const value of validValues) {
        const suggestions = [
          {
            goalType: "accuracy",
            goalName: "Test Goal",
            targetValue: value,
            priority: "high" as const,
            rationale: "Test",
          },
        ];

        const result = await validateGoalSuggestions(suggestions);
        expect(result).toBe(true);
      }
    });

    it("should reject negative target values", async () => {
      const suggestions = [
        {
          goalType: "accuracy",
          goalName: "Test Goal",
          targetValue: -50,
          priority: "high" as const,
          rationale: "Test",
        },
      ];

      const result = await validateGoalSuggestions(suggestions);
      expect(result).toBe(false);
    });
  });
});

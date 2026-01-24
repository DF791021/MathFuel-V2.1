import { describe, it, expect } from "vitest";
import {
  rankRecommendations,
  filterRecommendationsByType,
  getTopRecommendations,
} from "./_core/goalRecommendations";
import type { GoalRecommendation } from "./_core/goalRecommendations";

describe("Goal Recommendations", () => {
  const mockRecommendations: GoalRecommendation[] = [
    {
      title: "Improve Accuracy",
      description: "Work on accuracy in nutrition questions",
      type: "accuracy",
      targetValue: 85,
      priority: "high",
      rationale: "You struggle with accuracy in complex questions",
      estimatedDaysToComplete: 14,
      relatedInsight: "Challenge Pattern",
    },
    {
      title: "Increase Daily Score",
      description: "Aim for higher scores each game",
      type: "score",
      targetValue: 90,
      priority: "medium",
      rationale: "Your average score is below class average",
      estimatedDaysToComplete: 21,
      relatedInsight: "Progress Trend",
    },
    {
      title: "Play More Games",
      description: "Increase engagement with daily games",
      type: "games_played",
      targetValue: 10,
      priority: "low",
      rationale: "More practice leads to better learning",
      estimatedDaysToComplete: 7,
      relatedInsight: "Motivation Level",
    },
    {
      title: "Build a Streak",
      description: "Play games consistently every day",
      type: "streak",
      targetValue: 30,
      priority: "high",
      rationale: "Consistency improves retention",
      estimatedDaysToComplete: 30,
      relatedInsight: "Learning Style",
    },
    {
      title: "Master Nutrition Topics",
      description: "Focus on weak nutrition topics",
      type: "topic_mastery",
      targetValue: 80,
      priority: "medium",
      rationale: "You have gaps in nutrition knowledge",
      estimatedDaysToComplete: 28,
      relatedInsight: "Challenge Pattern",
    },
  ];

  describe("rankRecommendations", () => {
    it("should rank by priority first", () => {
      const ranked = rankRecommendations(mockRecommendations);

      // High priority items should come first
      const highPriorityCount = ranked.filter((r) => r.priority === "high").length;
      const firstHighPriority = ranked.findIndex((r) => r.priority === "high");
      const lastHighPriority = ranked.length - 1 - [...ranked].reverse().findIndex((r) => r.priority === "high");

      expect(firstHighPriority).toBeLessThan(lastHighPriority);
    });

    it("should rank by completion time within same priority", () => {
      const singlePriority = mockRecommendations.filter((r) => r.priority === "high");
      const ranked = rankRecommendations(singlePriority);

      // Shorter completion times should come first
      for (let i = 0; i < ranked.length - 1; i++) {
        expect(ranked[i].estimatedDaysToComplete).toBeLessThanOrEqual(
          ranked[i + 1].estimatedDaysToComplete
        );
      }
    });

    it("should maintain all recommendations", () => {
      const ranked = rankRecommendations(mockRecommendations);
      expect(ranked.length).toBe(mockRecommendations.length);
    });

    it("should not mutate original array", () => {
      const original = [...mockRecommendations];
      rankRecommendations(mockRecommendations);
      expect(mockRecommendations).toEqual(original);
    });
  });

  describe("filterRecommendationsByType", () => {
    it("should filter by single type", () => {
      const filtered = filterRecommendationsByType(mockRecommendations, ["accuracy"]);
      expect(filtered.length).toBe(1);
      expect(filtered[0].type).toBe("accuracy");
    });

    it("should filter by multiple types", () => {
      const filtered = filterRecommendationsByType(mockRecommendations, [
        "accuracy",
        "score",
      ]);
      expect(filtered.length).toBe(2);
      expect(filtered.every((r) => ["accuracy", "score"].includes(r.type))).toBe(true);
    });

    it("should return empty array for non-matching types", () => {
      const filtered = filterRecommendationsByType(mockRecommendations, [
        "nonexistent" as any,
      ]);
      expect(filtered.length).toBe(0);
    });

    it("should preserve order", () => {
      const filtered = filterRecommendationsByType(mockRecommendations, [
        "score",
        "accuracy",
      ]);
      const scoreIndex = mockRecommendations.findIndex((r) => r.type === "score");
      const accuracyIndex = mockRecommendations.findIndex((r) => r.type === "accuracy");

      if (scoreIndex < accuracyIndex) {
        expect(filtered[0].type).toBe("score");
        expect(filtered[1].type).toBe("accuracy");
      }
    });
  });

  describe("getTopRecommendations", () => {
    it("should return top N recommendations", () => {
      const top3 = getTopRecommendations(mockRecommendations, 3);
      expect(top3.length).toBe(3);
    });

    it("should return all if count exceeds available", () => {
      const top10 = getTopRecommendations(mockRecommendations, 10);
      expect(top10.length).toBe(mockRecommendations.length);
    });

    it("should return default 5 if count not specified", () => {
      const top = getTopRecommendations(mockRecommendations);
      expect(top.length).toBe(5);
    });

    it("should rank before returning top", () => {
      const top3 = getTopRecommendations(mockRecommendations, 3);

      // All should be high priority since there are 2 high priority items
      const highPriorityInTop = top3.filter((r) => r.priority === "high").length;
      expect(highPriorityInTop).toBeGreaterThan(0);
    });

    it("should handle empty array", () => {
      const top = getTopRecommendations([], 5);
      expect(top.length).toBe(0);
    });

    it("should handle count of 0", () => {
      const top = getTopRecommendations(mockRecommendations, 0);
      expect(top.length).toBe(0);
    });
  });

  describe("Recommendation Validation", () => {
    it("should have valid target values", () => {
      mockRecommendations.forEach((rec) => {
        expect(rec.targetValue).toBeGreaterThan(0);
      });
    });

    it("should have valid estimated days", () => {
      mockRecommendations.forEach((rec) => {
        expect(rec.estimatedDaysToComplete).toBeGreaterThan(0);
        expect(rec.estimatedDaysToComplete).toBeLessThanOrEqual(90);
      });
    });

    it("should have valid priority levels", () => {
      mockRecommendations.forEach((rec) => {
        expect(["high", "medium", "low"]).toContain(rec.priority);
      });
    });

    it("should have valid goal types", () => {
      mockRecommendations.forEach((rec) => {
        expect([
          "accuracy",
          "score",
          "games_played",
          "streak",
          "topic_mastery",
        ]).toContain(rec.type);
      });
    });

    it("should have non-empty descriptions", () => {
      mockRecommendations.forEach((rec) => {
        expect(rec.title.length).toBeGreaterThan(0);
        expect(rec.description.length).toBeGreaterThan(0);
        expect(rec.rationale.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Recommendation Combinations", () => {
    it("should filter and rank correctly", () => {
      const highPriority = filterRecommendationsByType(mockRecommendations, [
        "accuracy",
        "streak",
      ]);
      const ranked = rankRecommendations(highPriority);

      expect(ranked.length).toBe(2);
      expect(ranked.every((r) => ["accuracy", "streak"].includes(r.type))).toBe(true);
    });

    it("should get top filtered recommendations", () => {
      const filtered = filterRecommendationsByType(mockRecommendations, [
        "accuracy",
        "score",
        "games_played",
      ]);
      const top2 = getTopRecommendations(filtered, 2);

      expect(top2.length).toBe(2);
      expect(
        top2.every((r) => ["accuracy", "score", "games_played"].includes(r.type))
      ).toBe(true);
    });
  });
});

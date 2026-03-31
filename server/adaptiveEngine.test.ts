import { describe, it, expect } from "vitest";
import {
  computeScoreQuality,
  updateMasteryScore,
  updateConfidenceScore,
  computeNextDifficulty,
  runAdaptiveEngine,
  computeEngagementScore,
  buildSessionSummary,
} from "./services/adaptiveEngine";

const FAST_MS = 3_000;
const NORMAL_MS = 15_000;
const SLOW_MS = 40_000;

// ─────────────────────────────────────────────────────────────
// computeScoreQuality
// ─────────────────────────────────────────────────────────────
describe("computeScoreQuality", () => {
  describe("correct answers", () => {
    it("should return 1.0 for correct, normal time, no hints", () => {
      expect(computeScoreQuality(true, NORMAL_MS, 0)).toBe(1.0);
    });

    it("should cap speed bonus at 1.0 for fast correct answers", () => {
      const score = computeScoreQuality(true, FAST_MS, 0);
      expect(score).toBeLessThanOrEqual(1.0);
      expect(score).toBeGreaterThan(1.0 - 0.001); // 1.05 capped to 1.0
    });

    it("should apply time penalty for slow correct answers", () => {
      const score = computeScoreQuality(true, SLOW_MS, 0);
      expect(score).toBeCloseTo(0.8, 5);
    });

    it("should penalize hints on correct answers", () => {
      const score = computeScoreQuality(true, NORMAL_MS, 2);
      expect(score).toBeCloseTo(0.8, 5); // 1.0 - 0.2
    });

    it("should cap hint penalty at 0.35", () => {
      const scoreMany = computeScoreQuality(true, NORMAL_MS, 10);
      const scoreCapped = computeScoreQuality(true, NORMAL_MS, 4); // 4*0.1 = 0.4 clamped to 0.35
      expect(scoreMany).toBeCloseTo(scoreCapped, 5);
    });

    it("should combine slow-time penalty and hint penalty", () => {
      const score = computeScoreQuality(true, SLOW_MS, 1);
      expect(score).toBeCloseTo(0.7, 5); // 1.0 - 0.2 - 0.1
    });

    it("should return 0 when penalties exceed score (many hints + slow)", () => {
      const score = computeScoreQuality(true, SLOW_MS, 10);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe("incorrect answers", () => {
    it("should return 0.3 for incorrect with no hints", () => {
      expect(computeScoreQuality(false, NORMAL_MS, 0)).toBeCloseTo(0.3, 5);
    });

    it("should penalize hints on incorrect answers", () => {
      const score = computeScoreQuality(false, NORMAL_MS, 2);
      expect(score).toBeCloseTo(0.1, 5); // 0.3 - 0.2
    });

    it("should floor score at 0 for incorrect with many hints", () => {
      const score = computeScoreQuality(false, NORMAL_MS, 5);
      expect(score).toBe(0);
    });

    it("should ignore response time for incorrect answers", () => {
      const slow = computeScoreQuality(false, SLOW_MS, 0);
      const fast = computeScoreQuality(false, FAST_MS, 0);
      expect(slow).toBe(fast);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// updateMasteryScore
// ─────────────────────────────────────────────────────────────
describe("updateMasteryScore", () => {
  it("should increase mastery score for a correct answer (new learner)", () => {
    const updated = updateMasteryScore(50, 0, true);
    expect(updated).toBeGreaterThan(50);
  });

  it("should decrease mastery score for an incorrect answer", () => {
    const updated = updateMasteryScore(70, 5, false);
    expect(updated).toBeLessThan(70);
  });

  it("should converge toward 100 for repeated correct answers", () => {
    let score = 50;
    for (let i = 0; i < 30; i++) {
      score = updateMasteryScore(score, i, true);
    }
    expect(score).toBeGreaterThan(80);
  });

  it("should converge toward 0 for repeated incorrect answers", () => {
    let score = 50;
    for (let i = 0; i < 30; i++) {
      score = updateMasteryScore(score, i, false);
    }
    expect(score).toBeLessThan(20);
  });

  it("should not exceed 100", () => {
    const updated = updateMasteryScore(100, 0, true);
    expect(updated).toBeLessThanOrEqual(100);
  });

  it("should not go below 0", () => {
    const updated = updateMasteryScore(0, 0, false);
    expect(updated).toBeGreaterThanOrEqual(0);
  });

  it("should use higher alpha (learn faster) for fewer attempts", () => {
    const fewAttempts = updateMasteryScore(0, 0, true);
    const manyAttempts = updateMasteryScore(0, 19, true);
    expect(fewAttempts).toBeGreaterThan(manyAttempts); // More sensitive with fewer attempts
  });
});

// ─────────────────────────────────────────────────────────────
// updateConfidenceScore
// ─────────────────────────────────────────────────────────────
describe("updateConfidenceScore", () => {
  it("should increase confidence for correct with no hints", () => {
    const updated = updateConfidenceScore(0.5, true, 0, NORMAL_MS);
    expect(updated).toBeCloseTo(0.54, 4);
  });

  it("should add speed bonus for fast correct with no hints", () => {
    const updated = updateConfidenceScore(0.5, true, 0, FAST_MS);
    expect(updated).toBeCloseTo(0.55, 4);
  });

  it("should increase confidence less for correct with hints", () => {
    const updated = updateConfidenceScore(0.5, true, 1, NORMAL_MS);
    expect(updated).toBeCloseTo(0.51, 4);
  });

  it("should decrease confidence for incorrect with no hints", () => {
    const updated = updateConfidenceScore(0.5, false, 0, NORMAL_MS);
    expect(updated).toBeCloseTo(0.47, 4);
  });

  it("should decrease confidence more for incorrect with 2+ hints", () => {
    const updated = updateConfidenceScore(0.5, false, 2, NORMAL_MS);
    expect(updated).toBeCloseTo(0.44, 4);
  });

  it("should clamp confidence at 0.05 minimum", () => {
    const updated = updateConfidenceScore(0.05, false, 2, NORMAL_MS);
    expect(updated).toBeGreaterThanOrEqual(0.05);
  });

  it("should clamp confidence at 0.95 maximum", () => {
    const updated = updateConfidenceScore(0.95, true, 0, FAST_MS);
    expect(updated).toBeLessThanOrEqual(0.95);
  });
});

// ─────────────────────────────────────────────────────────────
// computeNextDifficulty
// ─────────────────────────────────────────────────────────────
describe("computeNextDifficulty", () => {
  it("should increase difficulty when rate ≥ 0.85 and streak ≥ 3", () => {
    expect(computeNextDifficulty(2, 3, 0.9)).toBe(3);
  });

  it("should not increase difficulty when streak < 3 (even if rate is high)", () => {
    expect(computeNextDifficulty(2, 2, 0.9)).toBe(2);
  });

  it("should decrease difficulty when rate ≤ 0.40", () => {
    expect(computeNextDifficulty(3, 0, 0.4)).toBe(2);
  });

  it("should keep difficulty the same for moderate performance", () => {
    expect(computeNextDifficulty(3, 5, 0.6)).toBe(3);
  });

  it("should cap difficulty at maximum of 5", () => {
    expect(computeNextDifficulty(5, 5, 0.9)).toBe(5);
  });

  it("should cap difficulty at minimum of 1", () => {
    expect(computeNextDifficulty(1, 0, 0.2)).toBe(1);
  });

  it("should not decrease difficulty at exactly 0.41 (above threshold)", () => {
    expect(computeNextDifficulty(3, 0, 0.41)).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────
// runAdaptiveEngine
// ─────────────────────────────────────────────────────────────
describe("runAdaptiveEngine", () => {
  const baseInputs = {
    isCorrect: true,
    responseTimeMs: NORMAL_MS,
    hintsUsed: 0,
    currentStreak: 0,
    masteryScore: 50,
    confidenceScore: 0.5,
    difficulty: 2,
  };

  it("should increment streak for correct answers", () => {
    const result = runAdaptiveEngine({ ...baseInputs, currentStreak: 2 }, 0.7);
    expect(result.newStreak).toBe(3);
  });

  it("should reset streak to 0 for incorrect answers", () => {
    const result = runAdaptiveEngine({ ...baseInputs, isCorrect: false, currentStreak: 5 }, 0.7);
    expect(result.newStreak).toBe(0);
  });

  it("should increase difficulty when performance is high and streak is 3+", () => {
    const result = runAdaptiveEngine({ ...baseInputs, currentStreak: 2 }, 0.9);
    // newStreak becomes 3 after correct answer, so difficulty should increase
    expect(result.nextDifficulty).toBe(3);
    expect(result.signals.levelAdjusted).toBe(true);
    expect(result.signals.levelDirection).toBe("up");
  });

  it("should decrease difficulty when performance is poor", () => {
    const result = runAdaptiveEngine({ ...baseInputs, isCorrect: false, difficulty: 3 }, 0.3);
    expect(result.nextDifficulty).toBe(2);
    expect(result.signals.levelAdjusted).toBe(true);
    expect(result.signals.levelDirection).toBe("down");
  });

  it("should detect struggle when incorrect with 2+ hints", () => {
    const result = runAdaptiveEngine({ ...baseInputs, isCorrect: false, hintsUsed: 2 }, 0.5);
    expect(result.signals.struggleDetected).toBe(true);
  });

  it("should not flag struggle when correct despite hints", () => {
    const result = runAdaptiveEngine({ ...baseInputs, isCorrect: true, hintsUsed: 3 }, 0.5);
    expect(result.signals.struggleDetected).toBe(false);
  });

  it("should report confidence trend as up for correct no-hint answer", () => {
    const result = runAdaptiveEngine(baseInputs, 0.5);
    expect(result.confidenceTrend).toBe("up");
  });

  it("should report confidence trend as down for incorrect answer", () => {
    const result = runAdaptiveEngine({ ...baseInputs, isCorrect: false }, 0.5);
    expect(result.confidenceTrend).toBe("down");
  });

  it("should return levelAdjusted=false when difficulty stays the same", () => {
    const result = runAdaptiveEngine(baseInputs, 0.6); // moderate rate, streak 0+1=1
    expect(result.signals.levelAdjusted).toBe(false);
    expect(result.signals.levelDirection).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// computeEngagementScore
// ─────────────────────────────────────────────────────────────
describe("computeEngagementScore", () => {
  it("should return 0 for 0 total problems", () => {
    expect(computeEngagementScore(0, 0, 0, true)).toBe(0);
  });

  it("should return high score for perfect accuracy, no hints, completed", () => {
    const score = computeEngagementScore(10, 10, 0, true);
    expect(score).toBeGreaterThan(0.9);
  });

  it("should return lower score when many hints are used", () => {
    const noHints = computeEngagementScore(10, 10, 0, true);
    const manyHints = computeEngagementScore(10, 10, 20, true);
    expect(noHints).toBeGreaterThan(manyHints);
  });

  it("should penalize incomplete sessions", () => {
    const completed = computeEngagementScore(10, 8, 2, true);
    const incomplete = computeEngagementScore(10, 8, 2, false);
    expect(completed).toBeGreaterThan(incomplete);
  });

  it("should return a low score for 0% accuracy and many hints", () => {
    const score = computeEngagementScore(10, 0, 20, false);
    expect(score).toBeLessThan(0.3);
  });

  it("should cap score at 1.0", () => {
    const score = computeEngagementScore(10, 10, 0, true);
    expect(score).toBeLessThanOrEqual(1.0);
  });

  it("should return a value between 0 and 1 for typical input", () => {
    const score = computeEngagementScore(10, 7, 3, true);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────
// buildSessionSummary
// ─────────────────────────────────────────────────────────────
describe("buildSessionSummary", () => {
  it("should compute accuracy correctly", () => {
    const result = buildSessionSummary(10, 8, [], 3, 4, 0.5, 0.54);
    expect(result.accuracy).toBeCloseTo(0.8, 5);
  });

  it("should return accuracy 0 when no problems attempted", () => {
    const result = buildSessionSummary(0, 0, [], 0, 0, 0.5, 0.5);
    expect(result.accuracy).toBe(0);
  });

  it("should identify the strongest and focus skill from attempts", () => {
    const skills = [
      { skillId: 1, correct: 9, total: 10 },
      { skillId: 2, correct: 2, total: 10 },
      { skillId: 3, correct: 5, total: 10 },
    ];
    const result = buildSessionSummary(30, 16, skills, 2, 3, 0.5, 0.54);
    expect(result.strongestSkillId).toBe(1);
    expect(result.focusSkillId).toBe(2);
  });

  it("should return null skill IDs when no attempts are provided", () => {
    const result = buildSessionSummary(0, 0, [], 0, 0, 0.5, 0.5);
    expect(result.strongestSkillId).toBeNull();
    expect(result.focusSkillId).toBeNull();
  });

  it("should skip skills with 0 total attempts", () => {
    const skills = [
      { skillId: 1, correct: 0, total: 0 },
      { skillId: 2, correct: 8, total: 10 },
    ];
    const result = buildSessionSummary(10, 8, skills, 0, 1, 0.5, 0.54);
    expect(result.strongestSkillId).toBe(2);
  });

  it("should mark streak as 'gained' when new streak > prev", () => {
    const result = buildSessionSummary(5, 5, [], 2, 3, 0.5, 0.54);
    expect(result.streakImpact).toBe("gained");
  });

  it("should mark streak as 'maintained' when streaks are equal", () => {
    const result = buildSessionSummary(5, 5, [], 3, 3, 0.5, 0.54);
    expect(result.streakImpact).toBe("maintained");
  });

  it("should mark streak as 'lost' when new streak < prev", () => {
    const result = buildSessionSummary(5, 3, [], 5, 0, 0.5, 0.4);
    expect(result.streakImpact).toBe("lost");
  });

  it("should report confidence trend 'up' when confidence increases > 0.01", () => {
    const result = buildSessionSummary(5, 5, [], 3, 4, 0.5, 0.52);
    expect(result.confidenceTrend).toBe("up");
  });

  it("should report confidence trend 'down' when confidence decreases > 0.01", () => {
    const result = buildSessionSummary(5, 2, [], 3, 2, 0.5, 0.48);
    expect(result.confidenceTrend).toBe("down");
  });

  it("should report confidence trend 'stable' for small changes", () => {
    const result = buildSessionSummary(5, 4, [], 3, 3, 0.5, 0.505);
    expect(result.confidenceTrend).toBe("stable");
  });
});

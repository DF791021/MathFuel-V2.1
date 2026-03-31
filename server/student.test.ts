import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Unit tests for MathFuel student router logic.
 * Tests dashboard aggregation, progress calculation, and recommendation generation.
 * Pure functions extracted from the router procedures are tested directly.
 */

// ─────────────────────────────────────────────────────────────
// Helper logic extracted from getDashboard
// ─────────────────────────────────────────────────────────────

type MasteryRecord = {
  masteryLevel: "not_started" | "practicing" | "close" | "mastered";
  masteryScore: number;
  confidenceScore: string | number;
};

function computeDashboardMastery(mastery: MasteryRecord[]) {
  const totalMastered = mastery.filter((m) => m.masteryLevel === "mastered").length;
  const totalPracticing = mastery.filter(
    (m) => m.masteryLevel === "practicing" || m.masteryLevel === "close"
  ).length;
  const overallAccuracy =
    mastery.length > 0
      ? Math.round(mastery.reduce((sum, m) => sum + m.masteryScore, 0) / mastery.length)
      : 0;
  const avgConfidence =
    mastery.length > 0
      ? mastery.reduce((sum, m) => sum + parseFloat(m.confidenceScore as string ?? "0.5"), 0) /
        mastery.length
      : 0.5;
  return {
    totalSkills: mastery.length,
    mastered: totalMastered,
    practicing: totalPracticing,
    overallAccuracy,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
  };
}

// ─────────────────────────────────────────────────────────────
// Helper logic extracted from getProgress
// ─────────────────────────────────────────────────────────────

type SessionRecord = {
  status: string;
  totalProblems?: number;
  correctAnswers?: number;
};

function computeProgressOverview(sessions: SessionRecord[], currentStreak: number) {
  const completedSessions = sessions.filter((s) => s.status === "completed");
  const totalAttempts = completedSessions.reduce((s, sess) => s + (sess.totalProblems ?? 0), 0);
  const totalCorrect = completedSessions.reduce((s, sess) => s + (sess.correctAnswers ?? 0), 0);
  return {
    sessionsCompleted: completedSessions.length,
    totalAttempts,
    accuracy: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) / 100 : 0,
    currentStreakDays: currentStreak,
  };
}

// ─────────────────────────────────────────────────────────────
// Helper logic extracted from getRecommendations
// ─────────────────────────────────────────────────────────────

type MasteryWithSkill = {
  skillId: number;
  skillName?: string | null;
  masteryLevel: string;
  masteryScore: number;
  confidenceScore: string | number;
  lastPracticedAt?: Date | null;
};

function computeRecommendations(mastery: MasteryWithSkill[], nowMs: number) {
  const threeDaysAgo = new Date(nowMs - 3 * 24 * 60 * 60 * 1000);

  type Rec = {
    skillId: number;
    skillName: string;
    reason: string;
    reasonType: "close" | "stale" | "struggling";
    masteryScore: number;
    confidenceScore: number;
    masteryLevel: string;
  };

  const recommendations: Rec[] = [];

  for (const m of mastery) {
    const skillName = m.skillName ?? "Unknown Skill";
    const confidence = parseFloat(m.confidenceScore as string ?? "0.5");

    if (m.masteryLevel === "close") {
      recommendations.push({
        skillId: m.skillId,
        skillName,
        reason: "Almost mastered — one more push!",
        reasonType: "close",
        masteryScore: m.masteryScore,
        confidenceScore: confidence,
        masteryLevel: m.masteryLevel,
      });
    } else if (
      m.masteryLevel === "practicing" &&
      m.lastPracticedAt &&
      new Date(m.lastPracticedAt) < threeDaysAgo
    ) {
      recommendations.push({
        skillId: m.skillId,
        skillName,
        reason: "You haven't practiced this in a while!",
        reasonType: "stale",
        masteryScore: m.masteryScore,
        confidenceScore: confidence,
        masteryLevel: m.masteryLevel,
      });
    } else if (m.masteryLevel === "practicing" && (m.masteryScore < 50 || confidence < 0.4)) {
      recommendations.push({
        skillId: m.skillId,
        skillName,
        reason: "Keep practicing to build your confidence!",
        reasonType: "struggling",
        masteryScore: m.masteryScore,
        confidenceScore: confidence,
        masteryLevel: m.masteryLevel,
      });
    }
  }

  const order: Record<string, number> = { close: 0, stale: 1, struggling: 2 };
  recommendations.sort((a, b) => order[a.reasonType] - order[b.reasonType]);
  return recommendations.slice(0, 3);
}

// ─────────────────────────────────────────────────────────────
// Helper logic extracted from generateWeeklyReport
// ─────────────────────────────────────────────────────────────

type DayStat = { problemsAttempted?: number; problemsCorrect?: number };

function computeWeeklyAccuracy(stats: DayStat[]) {
  const totalAttempts = stats.reduce((s, d) => s + (d.problemsAttempted ?? 0), 0);
  const totalCorrect = stats.reduce((s, d) => s + (d.problemsCorrect ?? 0), 0);
  return totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) / 100 : 0;
}

// ─────────────────────────────────────────────────────────────
// getDashboard mastery aggregation
// ─────────────────────────────────────────────────────────────
describe("Student getDashboard – mastery aggregation", () => {
  it("should count mastered skills correctly", () => {
    const mastery: MasteryRecord[] = [
      { masteryLevel: "mastered", masteryScore: 95, confidenceScore: "0.8" },
      { masteryLevel: "mastered", masteryScore: 92, confidenceScore: "0.9" },
      { masteryLevel: "close", masteryScore: 75, confidenceScore: "0.6" },
      { masteryLevel: "practicing", masteryScore: 40, confidenceScore: "0.4" },
    ];
    const result = computeDashboardMastery(mastery);
    expect(result.mastered).toBe(2);
  });

  it("should count practicing AND close skills in totalPracticing", () => {
    const mastery: MasteryRecord[] = [
      { masteryLevel: "close", masteryScore: 75, confidenceScore: "0.6" },
      { masteryLevel: "practicing", masteryScore: 40, confidenceScore: "0.4" },
      { masteryLevel: "mastered", masteryScore: 95, confidenceScore: "0.9" },
    ];
    const result = computeDashboardMastery(mastery);
    expect(result.practicing).toBe(2);
  });

  it("should return 0 accuracy and 0.5 confidence for empty mastery", () => {
    const result = computeDashboardMastery([]);
    expect(result.overallAccuracy).toBe(0);
    expect(result.avgConfidence).toBe(0.5);
    expect(result.totalSkills).toBe(0);
  });

  it("should compute overallAccuracy as rounded average of masteryScores", () => {
    const mastery: MasteryRecord[] = [
      { masteryLevel: "mastered", masteryScore: 90, confidenceScore: "0.8" },
      { masteryLevel: "practicing", masteryScore: 50, confidenceScore: "0.5" },
    ];
    const result = computeDashboardMastery(mastery);
    expect(result.overallAccuracy).toBe(70);
  });

  it("should compute avgConfidence from confidence scores", () => {
    const mastery: MasteryRecord[] = [
      { masteryLevel: "mastered", masteryScore: 90, confidenceScore: "0.8" },
      { masteryLevel: "practicing", masteryScore: 50, confidenceScore: "0.6" },
    ];
    const result = computeDashboardMastery(mastery);
    expect(result.avgConfidence).toBeCloseTo(0.7, 2);
  });

  it("should parse confidenceScore from string format", () => {
    const mastery: MasteryRecord[] = [
      { masteryLevel: "mastered", masteryScore: 90, confidenceScore: "0.75" },
    ];
    const result = computeDashboardMastery(mastery);
    expect(result.avgConfidence).toBe(0.75);
  });

  it("should handle numeric confidenceScore values", () => {
    const mastery: MasteryRecord[] = [
      { masteryLevel: "mastered", masteryScore: 90, confidenceScore: 0.8 },
    ];
    const result = computeDashboardMastery(mastery);
    expect(result.avgConfidence).toBeCloseTo(0.8, 2);
  });
});

// ─────────────────────────────────────────────────────────────
// getProgress overview calculation
// ─────────────────────────────────────────────────────────────
describe("Student getProgress – overview calculation", () => {
  it("should count only completed sessions", () => {
    const sessions: SessionRecord[] = [
      { status: "completed", totalProblems: 10, correctAnswers: 8 },
      { status: "abandoned", totalProblems: 5, correctAnswers: 2 },
      { status: "completed", totalProblems: 8, correctAnswers: 6 },
    ];
    const result = computeProgressOverview(sessions, 3);
    expect(result.sessionsCompleted).toBe(2);
  });

  it("should sum attempts only from completed sessions", () => {
    const sessions: SessionRecord[] = [
      { status: "completed", totalProblems: 10, correctAnswers: 8 },
      { status: "abandoned", totalProblems: 5, correctAnswers: 2 },
    ];
    const result = computeProgressOverview(sessions, 0);
    expect(result.totalAttempts).toBe(10);
  });

  it("should compute accuracy across all completed sessions", () => {
    const sessions: SessionRecord[] = [
      { status: "completed", totalProblems: 10, correctAnswers: 8 },
      { status: "completed", totalProblems: 10, correctAnswers: 6 },
    ];
    const result = computeProgressOverview(sessions, 0);
    expect(result.accuracy).toBe(0.7);
  });

  it("should return 0 accuracy when no attempts", () => {
    const result = computeProgressOverview([], 5);
    expect(result.accuracy).toBe(0);
  });

  it("should use the provided currentStreak value", () => {
    const result = computeProgressOverview([], 7);
    expect(result.currentStreakDays).toBe(7);
  });

  it("should handle sessions with undefined totalProblems/correctAnswers", () => {
    const sessions: SessionRecord[] = [
      { status: "completed" }, // no counts
    ];
    const result = computeProgressOverview(sessions, 0);
    expect(result.totalAttempts).toBe(0);
    expect(result.accuracy).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// getRecommendations logic
// ─────────────────────────────────────────────────────────────
describe("Student getRecommendations – recommendation generation", () => {
  const now = Date.now();
  const fourDaysAgo = new Date(now - 4 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now - 1 * 24 * 60 * 60 * 1000);

  it("should recommend 'close' skills with reason type 'close'", () => {
    const mastery: MasteryWithSkill[] = [
      { skillId: 1, skillName: "Addition", masteryLevel: "close", masteryScore: 75, confidenceScore: "0.6" },
    ];
    const recs = computeRecommendations(mastery, now);
    expect(recs).toHaveLength(1);
    expect(recs[0].reasonType).toBe("close");
    expect(recs[0].skillId).toBe(1);
  });

  it("should recommend 'stale' skills not practiced in 3+ days", () => {
    const mastery: MasteryWithSkill[] = [
      {
        skillId: 2,
        skillName: "Subtraction",
        masteryLevel: "practicing",
        masteryScore: 60,
        confidenceScore: "0.5",
        lastPracticedAt: fourDaysAgo,
      },
    ];
    const recs = computeRecommendations(mastery, now);
    expect(recs).toHaveLength(1);
    expect(recs[0].reasonType).toBe("stale");
  });

  it("should not recommend stale for skills practiced recently", () => {
    const mastery: MasteryWithSkill[] = [
      {
        skillId: 2,
        skillName: "Subtraction",
        masteryLevel: "practicing",
        masteryScore: 60,
        confidenceScore: "0.5",
        lastPracticedAt: yesterday,
      },
    ];
    const recs = computeRecommendations(mastery, now);
    expect(recs).toHaveLength(0);
  });

  it("should recommend 'struggling' skills with low mastery score", () => {
    const mastery: MasteryWithSkill[] = [
      {
        skillId: 3,
        skillName: "Multiplication",
        masteryLevel: "practicing",
        masteryScore: 30,
        confidenceScore: "0.6",
      },
    ];
    const recs = computeRecommendations(mastery, now);
    expect(recs).toHaveLength(1);
    expect(recs[0].reasonType).toBe("struggling");
  });

  it("should recommend 'struggling' skills with low confidence score", () => {
    const mastery: MasteryWithSkill[] = [
      {
        skillId: 4,
        skillName: "Division",
        masteryLevel: "practicing",
        masteryScore: 60,
        confidenceScore: "0.3",
      },
    ];
    const recs = computeRecommendations(mastery, now);
    expect(recs).toHaveLength(1);
    expect(recs[0].reasonType).toBe("struggling");
  });

  it("should not recommend mastered skills", () => {
    const mastery: MasteryWithSkill[] = [
      { skillId: 5, skillName: "Counting", masteryLevel: "mastered", masteryScore: 95, confidenceScore: "0.9" },
    ];
    const recs = computeRecommendations(mastery, now);
    expect(recs).toHaveLength(0);
  });

  it("should sort recommendations: close first, then stale, then struggling", () => {
    const mastery: MasteryWithSkill[] = [
      {
        skillId: 3,
        skillName: "Multiplication",
        masteryLevel: "practicing",
        masteryScore: 30,
        confidenceScore: "0.5",
      },
      {
        skillId: 2,
        skillName: "Subtraction",
        masteryLevel: "practicing",
        masteryScore: 60,
        confidenceScore: "0.5",
        lastPracticedAt: fourDaysAgo,
      },
      {
        skillId: 1,
        skillName: "Addition",
        masteryLevel: "close",
        masteryScore: 75,
        confidenceScore: "0.6",
      },
    ];
    const recs = computeRecommendations(mastery, now);
    expect(recs[0].reasonType).toBe("close");
    expect(recs[1].reasonType).toBe("stale");
    expect(recs[2].reasonType).toBe("struggling");
  });

  it("should return at most 3 recommendations", () => {
    const mastery: MasteryWithSkill[] = [
      { skillId: 1, skillName: "A", masteryLevel: "close", masteryScore: 75, confidenceScore: "0.6" },
      { skillId: 2, skillName: "B", masteryLevel: "close", masteryScore: 72, confidenceScore: "0.6" },
      { skillId: 3, skillName: "C", masteryLevel: "close", masteryScore: 70, confidenceScore: "0.6" },
      { skillId: 4, skillName: "D", masteryLevel: "close", masteryScore: 71, confidenceScore: "0.6" },
    ];
    const recs = computeRecommendations(mastery, now);
    expect(recs.length).toBeLessThanOrEqual(3);
  });

  it("should return empty array when no recommendations qualify", () => {
    const mastery: MasteryWithSkill[] = [
      { skillId: 1, skillName: "Counting", masteryLevel: "mastered", masteryScore: 95, confidenceScore: "0.9" },
      {
        skillId: 2,
        skillName: "Addition",
        masteryLevel: "practicing",
        masteryScore: 60,
        confidenceScore: "0.5",
        lastPracticedAt: yesterday,
      },
    ];
    const recs = computeRecommendations(mastery, now);
    expect(recs).toHaveLength(0);
  });

  it("should use 'Unknown Skill' when skillName is null", () => {
    const mastery: MasteryWithSkill[] = [
      { skillId: 6, skillName: null, masteryLevel: "close", masteryScore: 75, confidenceScore: "0.6" },
    ];
    const recs = computeRecommendations(mastery, now);
    expect(recs[0].skillName).toBe("Unknown Skill");
  });
});

// ─────────────────────────────────────────────────────────────
// generateWeeklyReport – accuracy calculation
// ─────────────────────────────────────────────────────────────
describe("Student generateWeeklyReport – accuracy calculation", () => {
  it("should compute accuracy from daily stats", () => {
    const stats: DayStat[] = [
      { problemsAttempted: 10, problemsCorrect: 8 },
      { problemsAttempted: 5, problemsCorrect: 3 },
    ];
    expect(computeWeeklyAccuracy(stats)).toBeCloseTo(0.73, 2);
  });

  it("should return 0 accuracy for no attempts", () => {
    expect(computeWeeklyAccuracy([])).toBe(0);
  });

  it("should handle missing fields in stats entries", () => {
    const stats: DayStat[] = [
      { problemsAttempted: undefined, problemsCorrect: undefined },
    ];
    expect(computeWeeklyAccuracy(stats)).toBe(0);
  });

  it("should handle perfect accuracy", () => {
    const stats: DayStat[] = [
      { problemsAttempted: 10, problemsCorrect: 10 },
    ];
    expect(computeWeeklyAccuracy(stats)).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────
// Confidence trend logic (used in weekly report summary)
// ─────────────────────────────────────────────────────────────
describe("Student weekly report – confidence trend", () => {
  function getConfidenceTrend(avgConfidence: number) {
    return avgConfidence >= 0.6 ? "up" : avgConfidence <= 0.4 ? "down" : "stable";
  }

  it("should return 'up' for high confidence", () => {
    expect(getConfidenceTrend(0.7)).toBe("up");
  });

  it("should return 'down' for low confidence", () => {
    expect(getConfidenceTrend(0.3)).toBe("down");
  });

  it("should return 'stable' for mid-range confidence", () => {
    expect(getConfidenceTrend(0.5)).toBe("stable");
  });

  it("should return 'up' at exactly 0.6", () => {
    expect(getConfidenceTrend(0.6)).toBe("up");
  });

  it("should return 'down' at exactly 0.4", () => {
    expect(getConfidenceTrend(0.4)).toBe("down");
  });
});

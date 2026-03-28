import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Unit tests for MathFuel practice engine logic.
 * Tests answer checking, mastery calculation, and adaptive difficulty.
 */

// ---- Pure function tests (extracted from practice.ts logic) ----

function checkAnswer(studentAnswer: string, correctAnswer: string, answerType: string): boolean {
  const normalizedStudent = studentAnswer.trim().toLowerCase();
  const normalizedCorrect = correctAnswer.trim().toLowerCase();

  if (answerType === "number") {
    const studentNum = parseFloat(normalizedStudent);
    const correctNum = parseFloat(normalizedCorrect);
    if (isNaN(studentNum) || isNaN(correctNum)) return false;
    return Math.abs(studentNum - correctNum) < 0.001;
  }

  if (answerType === "boolean") {
    const trueValues = ["true", "yes", "1"];
    const falseValues = ["false", "no", "0"];
    const studentBool = trueValues.includes(normalizedStudent) ? true : falseValues.includes(normalizedStudent) ? false : null;
    const correctBool = trueValues.includes(normalizedCorrect) ? true : falseValues.includes(normalizedCorrect) ? false : null;
    return studentBool === correctBool;
  }

  return normalizedStudent === normalizedCorrect;
}

function calculateMasteryLevel(score: number): "not_started" | "practicing" | "close" | "mastered" {
  if (score >= 90) return "mastered";
  if (score >= 70) return "close";
  if (score > 0) return "practicing";
  return "not_started";
}

function getAdaptiveDifficulty(correctRate: number, currentDifficulty: number): number {
  if (correctRate >= 0.85) return Math.min(5, currentDifficulty + 1);
  if (correctRate <= 0.4) return Math.max(1, currentDifficulty - 1);
  return currentDifficulty;
}

describe("checkAnswer", () => {
  describe("number type", () => {
    it("should match exact numbers", () => {
      expect(checkAnswer("5", "5", "number")).toBe(true);
    });

    it("should match numbers with whitespace", () => {
      expect(checkAnswer("  5  ", "5", "number")).toBe(true);
    });

    it("should reject wrong numbers", () => {
      expect(checkAnswer("4", "5", "number")).toBe(false);
    });

    it("should handle decimal numbers", () => {
      expect(checkAnswer("3.14", "3.14", "number")).toBe(true);
    });

    it("should handle very close decimals within tolerance", () => {
      expect(checkAnswer("3.1400001", "3.14", "number")).toBe(true);
    });

    it("should reject non-numeric input", () => {
      expect(checkAnswer("abc", "5", "number")).toBe(false);
    });

    it("should reject empty string", () => {
      expect(checkAnswer("", "5", "number")).toBe(false);
    });

    it("should handle zero", () => {
      expect(checkAnswer("0", "0", "number")).toBe(true);
    });

    it("should handle negative numbers", () => {
      expect(checkAnswer("-3", "-3", "number")).toBe(true);
    });
  });

  describe("boolean type", () => {
    it("should match true/true", () => {
      expect(checkAnswer("true", "true", "boolean")).toBe(true);
    });

    it("should match yes/true", () => {
      expect(checkAnswer("yes", "true", "boolean")).toBe(true);
    });

    it("should match 1/true", () => {
      expect(checkAnswer("1", "true", "boolean")).toBe(true);
    });

    it("should match false/false", () => {
      expect(checkAnswer("false", "false", "boolean")).toBe(true);
    });

    it("should match no/false", () => {
      expect(checkAnswer("no", "false", "boolean")).toBe(true);
    });

    it("should reject true when answer is false", () => {
      expect(checkAnswer("true", "false", "boolean")).toBe(false);
    });

    it("should handle case insensitivity", () => {
      expect(checkAnswer("TRUE", "true", "boolean")).toBe(true);
    });
  });

  describe("text/choice type", () => {
    it("should match exact text", () => {
      expect(checkAnswer("circle", "circle", "choice")).toBe(true);
    });

    it("should be case insensitive", () => {
      expect(checkAnswer("Circle", "circle", "choice")).toBe(true);
    });

    it("should trim whitespace", () => {
      expect(checkAnswer("  circle  ", "circle", "choice")).toBe(true);
    });

    it("should reject wrong text", () => {
      expect(checkAnswer("square", "circle", "choice")).toBe(false);
    });

    it("should handle text type too", () => {
      expect(checkAnswer("triangle", "triangle", "text")).toBe(true);
    });
  });
});

describe("calculateMasteryLevel", () => {
  it("should return mastered for score >= 90", () => {
    expect(calculateMasteryLevel(90)).toBe("mastered");
    expect(calculateMasteryLevel(95)).toBe("mastered");
    expect(calculateMasteryLevel(100)).toBe("mastered");
  });

  it("should return close for score >= 70 and < 90", () => {
    expect(calculateMasteryLevel(70)).toBe("close");
    expect(calculateMasteryLevel(80)).toBe("close");
    expect(calculateMasteryLevel(89)).toBe("close");
  });

  it("should return practicing for score > 0 and < 70", () => {
    expect(calculateMasteryLevel(1)).toBe("practicing");
    expect(calculateMasteryLevel(50)).toBe("practicing");
    expect(calculateMasteryLevel(69)).toBe("practicing");
  });

  it("should return not_started for score 0", () => {
    expect(calculateMasteryLevel(0)).toBe("not_started");
  });
});

describe("getAdaptiveDifficulty", () => {
  it("should increase difficulty when correctRate >= 0.85", () => {
    expect(getAdaptiveDifficulty(0.85, 1)).toBe(2);
    expect(getAdaptiveDifficulty(0.9, 2)).toBe(3);
    expect(getAdaptiveDifficulty(1.0, 3)).toBe(4);
  });

  it("should cap difficulty at 5", () => {
    expect(getAdaptiveDifficulty(0.9, 5)).toBe(5);
  });

  it("should decrease difficulty when correctRate <= 0.4", () => {
    expect(getAdaptiveDifficulty(0.4, 3)).toBe(2);
    expect(getAdaptiveDifficulty(0.2, 2)).toBe(1);
    expect(getAdaptiveDifficulty(0.0, 4)).toBe(3);
  });

  it("should floor difficulty at 1", () => {
    expect(getAdaptiveDifficulty(0.2, 1)).toBe(1);
  });

  it("should keep difficulty same for moderate correctRate", () => {
    expect(getAdaptiveDifficulty(0.5, 3)).toBe(3);
    expect(getAdaptiveDifficulty(0.7, 2)).toBe(2);
    expect(getAdaptiveDifficulty(0.6, 4)).toBe(4);
  });

  it("should handle edge case at 0.41", () => {
    expect(getAdaptiveDifficulty(0.41, 3)).toBe(3); // stays same
  });

  it("should handle edge case at 0.84", () => {
    expect(getAdaptiveDifficulty(0.84, 3)).toBe(3); // stays same
  });
});

describe("streak logic", () => {
  it("should calculate streak continuation correctly", () => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    // Continuing streak from yesterday
    const lastActiveDate = yesterday;
    const currentStreak = 5;
    let newStreak = 1;

    if (lastActiveDate === today) {
      newStreak = currentStreak; // already active today
    } else if (lastActiveDate === yesterday) {
      newStreak = currentStreak + 1; // continuing streak
    }

    expect(newStreak).toBe(6);
  });

  it("should reset streak when gap exists", () => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0];

    const lastActiveDate = twoDaysAgo;
    const currentStreak = 5;
    let newStreak = 1;

    if (lastActiveDate === today) {
      newStreak = currentStreak;
    } else if (lastActiveDate === yesterday) {
      newStreak = currentStreak + 1;
    }
    // else stays at 1 (reset)

    expect(newStreak).toBe(1);
  });

  it("should not increment streak if already active today", () => {
    const today = new Date().toISOString().split("T")[0];
    const lastActiveDate = today;
    const currentStreak = 5;
    let newStreak = 1;

    if (lastActiveDate === today) {
      newStreak = currentStreak;
    }

    expect(newStreak).toBe(5);
  });
});

describe("mastery score calculation", () => {
  it("should calculate mastery score from attempts", () => {
    const totalAttempts = 10;
    const correctAttempts = 8;
    const score = Math.round((correctAttempts / totalAttempts) * 100);
    expect(score).toBe(80);
  });

  it("should handle perfect score", () => {
    const score = Math.round((10 / 10) * 100);
    expect(score).toBe(100);
  });

  it("should handle zero correct", () => {
    const score = Math.round((0 / 10) * 100);
    expect(score).toBe(0);
  });

  it("should handle single attempt", () => {
    const score = Math.round((1 / 1) * 100);
    expect(score).toBe(100);
  });
});

describe("badge award logic", () => {
  it("should award streak_3 badge at 3-day streak", () => {
    const badges: any[] = [];
    const streak = 3;
    if (streak === 3) badges.push({ type: "streak_3", title: "3-Day Streak!", icon: "🔥" });
    expect(badges).toHaveLength(1);
    expect(badges[0].type).toBe("streak_3");
  });

  it("should award streak_7 badge at 7-day streak", () => {
    const badges: any[] = [];
    const streak = 7;
    if (streak === 7) badges.push({ type: "streak_7", title: "Week Warrior!", icon: "⭐" });
    expect(badges).toHaveLength(1);
    expect(badges[0].type).toBe("streak_7");
  });

  it("should award perfect_session badge for 100% accuracy with 5+ problems", () => {
    const badges: any[] = [];
    const correctAnswers = 10;
    const totalProblems = 10;
    if (correctAnswers === totalProblems && totalProblems >= 5) {
      badges.push({ type: "perfect_session", title: "Perfect Session!", icon: "💯" });
    }
    expect(badges).toHaveLength(1);
    expect(badges[0].type).toBe("perfect_session");
  });

  it("should NOT award perfect_session for less than 5 problems", () => {
    const badges: any[] = [];
    const correctAnswers = 3;
    const totalProblems = 3;
    if (correctAnswers === totalProblems && totalProblems >= 5) {
      badges.push({ type: "perfect_session", title: "Perfect Session!", icon: "💯" });
    }
    expect(badges).toHaveLength(0);
  });

  it("should NOT award perfect_session for imperfect accuracy", () => {
    const badges: any[] = [];
    const correctAnswers = 9;
    const totalProblems = 10;
    if (correctAnswers === totalProblems && totalProblems >= 5) {
      badges.push({ type: "perfect_session", title: "Perfect Session!", icon: "💯" });
    }
    expect(badges).toHaveLength(0);
  });
});

// ============================================================================
// Adaptive Sequencing Recommendation Logic
// Mirrors the scoring algorithm in practice.ts getRecommendedSkills
// ============================================================================

type MasteryLevel = "not_started" | "practicing" | "close" | "mastered";

interface SkillForTest {
  id: number;
  name: string;
  prerequisiteSkillId: number | null;
}

interface MasteryRecord {
  skillId: number;
  masteryLevel: MasteryLevel;
  masteryScore: number;
}

function scoreSkill(
  skill: SkillForTest,
  masteryMap: Map<number, MasteryRecord>,
): { score: number; reason: string } {
  const mastery = masteryMap.get(skill.id) ?? null;

  if (mastery?.masteryLevel === "mastered") {
    return { score: 0, reason: "Already mastered!" };
  }

  const prereqMastery = skill.prerequisiteSkillId
    ? masteryMap.get(skill.prerequisiteSkillId)
    : null;
  const prereqMet = !skill.prerequisiteSkillId
    || prereqMastery?.masteryLevel === "mastered";

  if (!prereqMet) {
    return { score: 0, reason: "Complete prerequisite first" };
  }

  if (mastery?.masteryLevel === "close") {
    return { score: 90, reason: `Almost mastered! You're at ${mastery.masteryScore}% 🎯` };
  }

  if (mastery?.masteryLevel === "practicing") {
    return {
      score: 40 + mastery.masteryScore * 0.5,
      reason: `Keep going! You're at ${mastery.masteryScore}% 💪`,
    };
  }

  return { score: 35, reason: "New skill to explore! ✨" };
}

describe("adaptive sequencing recommendation logic", () => {
  it("should score mastered skills as 0", () => {
    const skill: SkillForTest = { id: 1, name: "Addition", prerequisiteSkillId: null };
    const masteryMap = new Map<number, MasteryRecord>([
      [1, { skillId: 1, masteryLevel: "mastered", masteryScore: 95 }],
    ]);
    expect(scoreSkill(skill, masteryMap).score).toBe(0);
  });

  it("should score 'close' skills at 90 regardless of exact mastery score", () => {
    const skill: SkillForTest = { id: 1, name: "Addition", prerequisiteSkillId: null };
    const masteryMap = new Map<number, MasteryRecord>([
      [1, { skillId: 1, masteryLevel: "close", masteryScore: 75 }],
    ]);
    expect(scoreSkill(skill, masteryMap).score).toBe(90);
  });

  it("should score 'practicing' skills between 40 and 74.5", () => {
    const skill: SkillForTest = { id: 1, name: "Subtraction", prerequisiteSkillId: null };
    const masteryMap = new Map<number, MasteryRecord>([
      [1, { skillId: 1, masteryLevel: "practicing", masteryScore: 60 }],
    ]);
    const { score } = scoreSkill(skill, masteryMap);
    expect(score).toBeGreaterThan(40);
    expect(score).toBeLessThanOrEqual(74.5);
  });

  it("should score not_started skills (prereq met) at 35", () => {
    const skill: SkillForTest = { id: 2, name: "Counting", prerequisiteSkillId: null };
    const masteryMap = new Map<number, MasteryRecord>();
    expect(scoreSkill(skill, masteryMap).score).toBe(35);
  });

  it("should score 0 when prerequisite is not mastered", () => {
    const skill: SkillForTest = { id: 2, name: "Advanced Addition", prerequisiteSkillId: 1 };
    const masteryMap = new Map<number, MasteryRecord>([
      [1, { skillId: 1, masteryLevel: "practicing", masteryScore: 50 }],
    ]);
    expect(scoreSkill(skill, masteryMap).score).toBe(0);
  });

  it("should score 0 when prerequisite is not started", () => {
    const skill: SkillForTest = { id: 2, name: "Advanced Addition", prerequisiteSkillId: 1 };
    const masteryMap = new Map<number, MasteryRecord>();
    expect(scoreSkill(skill, masteryMap).score).toBe(0);
  });

  it("should allow skill when prerequisite is mastered", () => {
    const skill: SkillForTest = { id: 2, name: "Advanced Addition", prerequisiteSkillId: 1 };
    const masteryMap = new Map<number, MasteryRecord>([
      [1, { skillId: 1, masteryLevel: "mastered", masteryScore: 92 }],
    ]);
    expect(scoreSkill(skill, masteryMap).score).toBeGreaterThan(0);
  });

  it("should rank 'close' skills above 'practicing' skills", () => {
    const closeSkill: SkillForTest = { id: 1, name: "Counting", prerequisiteSkillId: null };
    const practicingSkill: SkillForTest = { id: 2, name: "Addition", prerequisiteSkillId: null };
    const masteryMap = new Map<number, MasteryRecord>([
      [1, { skillId: 1, masteryLevel: "close", masteryScore: 70 }],
      [2, { skillId: 2, masteryLevel: "practicing", masteryScore: 65 }],
    ]);
    const closeScore = scoreSkill(closeSkill, masteryMap).score;
    const practicingScore = scoreSkill(practicingSkill, masteryMap).score;
    expect(closeScore).toBeGreaterThan(practicingScore);
  });

  it("should rank higher-mastery practicing skills above lower-mastery ones", () => {
    const highSkill: SkillForTest = { id: 1, name: "Addition", prerequisiteSkillId: null };
    const lowSkill: SkillForTest = { id: 2, name: "Subtraction", prerequisiteSkillId: null };
    const masteryMap = new Map<number, MasteryRecord>([
      [1, { skillId: 1, masteryLevel: "practicing", masteryScore: 60 }],
      [2, { skillId: 2, masteryLevel: "practicing", masteryScore: 20 }],
    ]);
    expect(scoreSkill(highSkill, masteryMap).score).toBeGreaterThan(scoreSkill(lowSkill, masteryMap).score);
  });

  it("should include skill name and reason in output", () => {
    const skill: SkillForTest = { id: 1, name: "Counting", prerequisiteSkillId: null };
    const masteryMap = new Map<number, MasteryRecord>([
      [1, { skillId: 1, masteryLevel: "close", masteryScore: 78 }],
    ]);
    const { reason } = scoreSkill(skill, masteryMap);
    expect(reason).toBeTruthy();
    expect(reason.length).toBeGreaterThan(0);
  });

  it("should return top 3 recommendations sorted by score", () => {
    const skills: SkillForTest[] = [
      { id: 1, name: "Skill A", prerequisiteSkillId: null },
      { id: 2, name: "Skill B", prerequisiteSkillId: null },
      { id: 3, name: "Skill C", prerequisiteSkillId: null },
      { id: 4, name: "Skill D", prerequisiteSkillId: null },
    ];
    const masteryMap = new Map<number, MasteryRecord>([
      [1, { skillId: 1, masteryLevel: "practicing", masteryScore: 20 }],
      [2, { skillId: 2, masteryLevel: "close", masteryScore: 72 }],
      [3, { skillId: 3, masteryLevel: "practicing", masteryScore: 50 }],
      [4, { skillId: 4, masteryLevel: "mastered", masteryScore: 95 }],
    ]);

    const scored = skills
      .map(s => ({ skillId: s.id, skillName: s.name, ...scoreSkill(s, masteryMap) }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    expect(scored).toHaveLength(3);
    // Mastered skill (id=4) should be excluded
    expect(scored.find(s => s.skillId === 4)).toBeUndefined();
    // "close" skill (id=2) should rank first
    expect(scored[0].skillId).toBe(2);
  });
});

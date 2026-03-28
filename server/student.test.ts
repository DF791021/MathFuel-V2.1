import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

/**
 * Unit tests for the student router.
 * Covers dashboard aggregation, mastery queries, streaks, badges, and stats ranges.
 * All database calls are mocked.
 */

// ── Mock db module ──
const mockGetStudentMastery = vi.fn();
const mockGetStudentStreak = vi.fn();
const mockGetStudentBadges = vi.fn();
const mockGetStudentSessions = vi.fn();
const mockGetStudentSkillMasteryRecord = vi.fn();
const mockGetStudentStatsRange = vi.fn();

vi.mock("./db", () => ({
  getStudentMastery: (...args: any[]) => mockGetStudentMastery(...args),
  getStudentStreak: (...args: any[]) => mockGetStudentStreak(...args),
  getStudentBadges: (...args: any[]) => mockGetStudentBadges(...args),
  getStudentSessions: (...args: any[]) => mockGetStudentSessions(...args),
  getStudentSkillMasteryRecord: (...args: any[]) => mockGetStudentSkillMasteryRecord(...args),
  getStudentStatsRange: (...args: any[]) => mockGetStudentStatsRange(...args),
}));

// ── Import after mocks ──
import { studentRouter } from "./routers/student";

// ── Test helpers ──
function createCaller(user?: { id: number; role: string } | null) {
  const ctx: any = { user: user ?? null, req: {}, res: {} };
  return studentRouter.createCaller(ctx);
}

const student = { id: 42, role: "student" as const };

// Sample data fixtures
const masteryRecords = [
  { skillId: 1, masteryLevel: "mastered", masteryScore: 95 },
  { skillId: 2, masteryLevel: "practicing", masteryScore: 55 },
  { skillId: 3, masteryLevel: "close", masteryScore: 75 },
  { skillId: 4, masteryLevel: "not_started", masteryScore: 0 },
];

const streakRecord = {
  currentStreak: 5,
  longestStreak: 10,
  totalActiveDays: 30,
  lastActiveDate: "2024-01-15",
};

const badges = [
  { id: 1, type: "streak_3", title: "3-Day Streak!", icon: "🔥" },
  { id: 2, type: "perfect_session", title: "Perfect Session!", icon: "💯" },
];

const recentSessions = [
  { id: 100, studentId: 42, createdAt: "2024-01-15" },
  { id: 101, studentId: 42, createdAt: "2024-01-14" },
];

// ── Tests ──

describe("student router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authorization ──

  describe("authorization", () => {
    it("should throw UNAUTHORIZED when no user is present for getDashboard", async () => {
      const caller = createCaller(null);
      await expect(caller.getDashboard()).rejects.toThrow(TRPCError);
    });

    it("should throw UNAUTHORIZED when no user is present for getMastery", async () => {
      const caller = createCaller(null);
      await expect(caller.getMastery()).rejects.toThrow(TRPCError);
    });

    it("should throw UNAUTHORIZED when no user is present for getStreak", async () => {
      const caller = createCaller(null);
      await expect(caller.getStreak()).rejects.toThrow(TRPCError);
    });

    it("should throw UNAUTHORIZED when no user is present for getBadges", async () => {
      const caller = createCaller(null);
      await expect(caller.getBadges()).rejects.toThrow(TRPCError);
    });

    it("should throw UNAUTHORIZED when no user is present for getSkillMastery", async () => {
      const caller = createCaller(null);
      await expect(caller.getSkillMastery({ skillId: 1 })).rejects.toThrow(TRPCError);
    });

    it("should throw UNAUTHORIZED when no user is present for getStatsRange", async () => {
      const caller = createCaller(null);
      await expect(
        caller.getStatsRange({ startDate: "2024-01-01", endDate: "2024-01-31" })
      ).rejects.toThrow(TRPCError);
    });
  });

  // ── getDashboard ──

  describe("getDashboard", () => {
    beforeEach(() => {
      mockGetStudentMastery.mockResolvedValue(masteryRecords);
      mockGetStudentStreak.mockResolvedValue(streakRecord);
      mockGetStudentBadges.mockResolvedValue(badges);
      mockGetStudentSessions.mockResolvedValue(recentSessions);
    });

    it("should return a complete dashboard for an authenticated student", async () => {
      const caller = createCaller(student);
      const result = await caller.getDashboard();

      expect(result).toHaveProperty("streak");
      expect(result).toHaveProperty("mastery");
      expect(result).toHaveProperty("badges");
      expect(result).toHaveProperty("recentSessions");
    });

    it("should calculate mastery statistics correctly", async () => {
      const caller = createCaller(student);
      const result = await caller.getDashboard();

      // 1 mastered, 1 practicing + 1 close = 2 practicing, 4 total
      expect(result.mastery.totalSkills).toBe(4);
      expect(result.mastery.mastered).toBe(1);
      expect(result.mastery.practicing).toBe(2); // practicing + close
    });

    it("should calculate overall accuracy as the average mastery score", async () => {
      const caller = createCaller(student);
      const result = await caller.getDashboard();

      // (95 + 55 + 75 + 0) / 4 = 56.25 → rounds to 56
      expect(result.mastery.overallAccuracy).toBe(56);
    });

    it("should return 0 overall accuracy when mastery list is empty", async () => {
      mockGetStudentMastery.mockResolvedValue([]);
      const caller = createCaller(student);
      const result = await caller.getDashboard();
      expect(result.mastery.overallAccuracy).toBe(0);
    });

    it("should return streak defaults when streak is null", async () => {
      mockGetStudentStreak.mockResolvedValue(null);
      const caller = createCaller(student);
      const result = await caller.getDashboard();
      expect(result.streak).toEqual({
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
      });
    });

    it("should include the live streak data when present", async () => {
      const caller = createCaller(student);
      const result = await caller.getDashboard();
      expect(result.streak).toEqual(streakRecord);
    });

    it("should cap badges to the first 10", async () => {
      const manyBadges = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        type: `badge_${i}`,
        title: `Badge ${i}`,
        icon: "⭐",
      }));
      mockGetStudentBadges.mockResolvedValue(manyBadges);
      const caller = createCaller(student);
      const result = await caller.getDashboard();
      expect(result.badges).toHaveLength(10);
    });

    it("should call getStudentSessions with limit 5", async () => {
      const caller = createCaller(student);
      await caller.getDashboard();
      expect(mockGetStudentSessions).toHaveBeenCalledWith(student.id, 5);
    });

    it("should call all db functions with the authenticated user id", async () => {
      const caller = createCaller(student);
      await caller.getDashboard();
      expect(mockGetStudentMastery).toHaveBeenCalledWith(student.id);
      expect(mockGetStudentStreak).toHaveBeenCalledWith(student.id);
      expect(mockGetStudentBadges).toHaveBeenCalledWith(student.id);
    });

    it("should propagate db errors", async () => {
      mockGetStudentMastery.mockRejectedValue(new Error("DB down"));
      const caller = createCaller(student);
      await expect(caller.getDashboard()).rejects.toThrow("DB down");
    });
  });

  // ── getMastery ──

  describe("getMastery", () => {
    it("should return mastery records for the authenticated user", async () => {
      mockGetStudentMastery.mockResolvedValue(masteryRecords);
      const caller = createCaller(student);
      const result = await caller.getMastery();
      expect(result).toEqual(masteryRecords);
      expect(mockGetStudentMastery).toHaveBeenCalledWith(student.id);
    });

    it("should return empty array when student has no mastery records", async () => {
      mockGetStudentMastery.mockResolvedValue([]);
      const caller = createCaller(student);
      const result = await caller.getMastery();
      expect(result).toEqual([]);
    });

    it("should propagate db errors", async () => {
      mockGetStudentMastery.mockRejectedValue(new Error("timeout"));
      const caller = createCaller(student);
      await expect(caller.getMastery()).rejects.toThrow("timeout");
    });
  });

  // ── getSkillMastery ──

  describe("getSkillMastery", () => {
    it("should return mastery record for a specific skill", async () => {
      const record = masteryRecords[0];
      mockGetStudentSkillMasteryRecord.mockResolvedValue(record);
      const caller = createCaller(student);
      const result = await caller.getSkillMastery({ skillId: 1 });
      expect(result).toEqual(record);
      expect(mockGetStudentSkillMasteryRecord).toHaveBeenCalledWith(student.id, 1);
    });

    it("should return null when student has not started a skill", async () => {
      mockGetStudentSkillMasteryRecord.mockResolvedValue(null);
      const caller = createCaller(student);
      const result = await caller.getSkillMastery({ skillId: 999 });
      expect(result).toBeNull();
    });

    it("should pass skillId and userId correctly", async () => {
      mockGetStudentSkillMasteryRecord.mockResolvedValue(null);
      const caller = createCaller(student);
      await caller.getSkillMastery({ skillId: 55 });
      expect(mockGetStudentSkillMasteryRecord).toHaveBeenCalledWith(student.id, 55);
    });

    it("should propagate db errors", async () => {
      mockGetStudentSkillMasteryRecord.mockRejectedValue(new Error("query error"));
      const caller = createCaller(student);
      await expect(caller.getSkillMastery({ skillId: 1 })).rejects.toThrow("query error");
    });
  });

  // ── getStreak ──

  describe("getStreak", () => {
    it("should return the student streak record", async () => {
      mockGetStudentStreak.mockResolvedValue(streakRecord);
      const caller = createCaller(student);
      const result = await caller.getStreak();
      expect(result).toEqual(streakRecord);
      expect(mockGetStudentStreak).toHaveBeenCalledWith(student.id);
    });

    it("should return default zeros when streak is null", async () => {
      mockGetStudentStreak.mockResolvedValue(null);
      const caller = createCaller(student);
      const result = await caller.getStreak();
      expect(result).toEqual({
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
        lastActiveDate: null,
      });
    });

    it("should return default zeros when streak is undefined", async () => {
      mockGetStudentStreak.mockResolvedValue(undefined);
      const caller = createCaller(student);
      const result = await caller.getStreak();
      expect(result).toEqual({
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
        lastActiveDate: null,
      });
    });

    it("should propagate db errors", async () => {
      mockGetStudentStreak.mockRejectedValue(new Error("DB error"));
      const caller = createCaller(student);
      await expect(caller.getStreak()).rejects.toThrow("DB error");
    });
  });

  // ── getBadges ──

  describe("getBadges", () => {
    it("should return all badges for the student", async () => {
      mockGetStudentBadges.mockResolvedValue(badges);
      const caller = createCaller(student);
      const result = await caller.getBadges();
      expect(result).toEqual(badges);
      expect(mockGetStudentBadges).toHaveBeenCalledWith(student.id);
    });

    it("should return empty array when student has no badges", async () => {
      mockGetStudentBadges.mockResolvedValue([]);
      const caller = createCaller(student);
      const result = await caller.getBadges();
      expect(result).toEqual([]);
    });

    it("should return all badges (no cap unlike dashboard)", async () => {
      const manyBadges = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        type: `badge_${i}`,
      }));
      mockGetStudentBadges.mockResolvedValue(manyBadges);
      const caller = createCaller(student);
      const result = await caller.getBadges();
      expect(result).toHaveLength(20);
    });

    it("should propagate db errors", async () => {
      mockGetStudentBadges.mockRejectedValue(new Error("fetch failed"));
      const caller = createCaller(student);
      await expect(caller.getBadges()).rejects.toThrow("fetch failed");
    });
  });

  // ── getStatsRange ──

  describe("getStatsRange", () => {
    it("should return daily stats for a date range", async () => {
      const stats = [
        { date: "2024-01-01", problemsAttempted: 10, correctAnswers: 8 },
        { date: "2024-01-02", problemsAttempted: 5, correctAnswers: 5 },
      ];
      mockGetStudentStatsRange.mockResolvedValue(stats);
      const caller = createCaller(student);
      const result = await caller.getStatsRange({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });
      expect(result).toEqual(stats);
      expect(mockGetStudentStatsRange).toHaveBeenCalledWith(
        student.id,
        "2024-01-01",
        "2024-01-31"
      );
    });

    it("should return empty array when no stats in the range", async () => {
      mockGetStudentStatsRange.mockResolvedValue([]);
      const caller = createCaller(student);
      const result = await caller.getStatsRange({
        startDate: "2023-01-01",
        endDate: "2023-01-07",
      });
      expect(result).toEqual([]);
    });

    it("should pass date strings directly to the db", async () => {
      mockGetStudentStatsRange.mockResolvedValue([]);
      const caller = createCaller(student);
      await caller.getStatsRange({ startDate: "2024-06-01", endDate: "2024-06-30" });
      expect(mockGetStudentStatsRange).toHaveBeenCalledWith(
        student.id,
        "2024-06-01",
        "2024-06-30"
      );
    });

    it("should work for a single-day range", async () => {
      mockGetStudentStatsRange.mockResolvedValue([
        { date: "2024-03-15", problemsAttempted: 7, correctAnswers: 6 },
      ]);
      const caller = createCaller(student);
      const result = await caller.getStatsRange({
        startDate: "2024-03-15",
        endDate: "2024-03-15",
      });
      expect(result).toHaveLength(1);
    });

    it("should propagate db errors", async () => {
      mockGetStudentStatsRange.mockRejectedValue(new Error("range query failed"));
      const caller = createCaller(student);
      await expect(
        caller.getStatsRange({ startDate: "2024-01-01", endDate: "2024-01-31" })
      ).rejects.toThrow("range query failed");
    });
  });
});

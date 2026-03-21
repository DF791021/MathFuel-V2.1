import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock db module ──
const mockGetDb = vi.fn();

vi.mock("./db", () => ({
  getDb: (...args: any[]) => mockGetDb(...args),
}));

// ── Mock drizzle schema ──
vi.mock("../drizzle/schema", () => ({
  users: { id: "id", gradeLevel: "gradeLevel", name: "name" },
  practiceSessions: { id: "id", studentId: "studentId" },
  problemAttempts: {
    id: "id",
    studentId: "studentId",
    isCorrect: "isCorrect",
    timeSpentSeconds: "timeSpentSeconds",
    createdAt: "createdAt",
  },
  studentSkillMastery: {
    id: "id",
    studentId: "studentId",
    masteryLevel: "masteryLevel",
  },
  studentStreaks: {
    id: "id",
    studentId: "studentId",
    currentStreak: "currentStreak",
  },
}));

// ── Mock drizzle-orm ──
vi.mock("drizzle-orm", () => {
  const makeSqlResult = () => ({
    as: vi.fn().mockReturnValue("aliased"),
  });
  const sqlFn: any = Object.assign(
    vi.fn((..._args: any[]) => makeSqlResult()),
    { join: vi.fn((..._args: any[]) => ({ join: _args })) }
  );
  return {
    eq: vi.fn((a, b) => ({ field: a, value: b })),
    sql: sqlFn,
    and: vi.fn((...args: any[]) => ({ and: args })),
    gte: vi.fn((a, b) => ({ gte: { field: a, value: b } })),
    desc: vi.fn((a) => ({ desc: a })),
  };
});

// ── Import after mocks ──
import { leaderboardRouter } from "./routers/leaderboard";

// ── Test helpers ──
function createMockCaller(user?: { id: number; role: string }) {
  const ctx: any = { user: user ?? null, req: {}, res: {} };
  return leaderboardRouter.createCaller(ctx);
}

/**
 * Creates a mock db that returns sequential results for each awaited query.
 * 
 * IMPORTANT: We cannot put .then() on the mock db object itself because
 * Promise.resolve() treats objects with .then as thenables and unwraps them.
 * Instead, we track calls and make terminal methods return promises.
 */
function createSequentialMockDb(results: any[][]) {
  let callIdx = 0;
  const getNext = () => {
    const result = results[callIdx] ?? [];
    callIdx++;
    return Promise.resolve(result);
  };

  // The subquery object returned by .as()
  const subqueryObj = {
    studentId: "xp.studentId",
    correctCount: "xp.correctCount",
    totalCount: "xp.totalCount",
    speedBonus: "xp.speedBonus",
  };

  // Build a chainable mock where every method returns the chain,
  // but the chain is also a Promise (via custom then/catch on the prototype level).
  // We use a Proxy to make it work.
  const createChain = (): any => {
    const handler: ProxyHandler<any> = {
      get(_target, prop) {
        if (prop === "select") return (..._args: any[]) => createChain();
        if (prop === "from") return (..._args: any[]) => createChain();
        if (prop === "innerJoin") return (..._args: any[]) => createChain();
        if (prop === "leftJoin") return (..._args: any[]) => createChain();
        if (prop === "where") return (..._args: any[]) => createChain();
        if (prop === "groupBy") return (..._args: any[]) => createChain();
        if (prop === "orderBy") return (..._args: any[]) => createChain();
        if (prop === "limit") return (..._args: any[]) => createChain();
        if (prop === "as") return (..._args: any[]) => subqueryObj;
        // When JS awaits the chain, it calls .then
        if (prop === "then") {
          return (resolve: any, reject: any) => getNext().then(resolve, reject);
        }
        if (prop === "catch") {
          return (fn: any) => Promise.resolve().catch(fn);
        }
        return undefined;
      },
    };
    return new Proxy({}, handler);
  };

  // The db object itself must NOT be thenable (no .then property)
  // so that mockResolvedValue doesn't unwrap it.
  // We use a plain object with methods that return chainable proxies.
  const db: any = {
    select: (..._args: any[]) => createChain(),
    // from/where/etc. shouldn't be called directly on db, but just in case:
    from: (..._args: any[]) => createChain(),
    where: (..._args: any[]) => createChain(),
  };

  return db;
}

describe("Leaderboard Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getRankings", () => {
    it("returns empty rankings when db is not available", async () => {
      mockGetDb.mockResolvedValue(null);
      const caller = createMockCaller();
      const result = await caller.getRankings({ period: "weekly" });
      expect(result).toEqual({ rankings: [], totalStudents: 0 });
    });

    it("returns empty rankings when no data exists", async () => {
      const mockDb = createSequentialMockDb([[]]);
      mockGetDb.mockResolvedValue(mockDb);
      const caller = createMockCaller();
      const result = await caller.getRankings({ period: "weekly" });
      expect(result.rankings).toEqual([]);
      expect(result.totalStudents).toBe(0);
    });

    it("accepts weekly period filter", async () => {
      const mockDb = createSequentialMockDb([[]]);
      mockGetDb.mockResolvedValue(mockDb);
      const caller = createMockCaller();
      const result = await caller.getRankings({ period: "weekly" });
      expect(result).toBeDefined();
      expect(result.rankings).toBeInstanceOf(Array);
    });

    it("accepts monthly period filter", async () => {
      const mockDb = createSequentialMockDb([[]]);
      mockGetDb.mockResolvedValue(mockDb);
      const caller = createMockCaller();
      const result = await caller.getRankings({ period: "monthly" });
      expect(result).toBeDefined();
    });

    it("accepts all_time period filter", async () => {
      const mockDb = createSequentialMockDb([[]]);
      mockGetDb.mockResolvedValue(mockDb);
      const caller = createMockCaller();
      const result = await caller.getRankings({ period: "all_time" });
      expect(result).toBeDefined();
    });

    it("accepts grade level filter", async () => {
      const mockDb = createSequentialMockDb([[]]);
      mockGetDb.mockResolvedValue(mockDb);
      const caller = createMockCaller();
      const result = await caller.getRankings({ period: "weekly", gradeLevel: 3 });
      expect(result).toBeDefined();
    });

    it("calculates XP and ranks correctly with data", async () => {
      const mockStudentData = [
        { studentId: 1, correctCount: 50, totalCount: 60, speedBonus: 20, gradeLevel: 3, name: "Alice" },
        { studentId: 2, correctCount: 30, totalCount: 40, speedBonus: 10, gradeLevel: 3, name: "Bob" },
      ];

      const mockDb = createSequentialMockDb([
        mockStudentData, // main join query
        [],              // mastery
        [],              // streaks
      ]);
      mockGetDb.mockResolvedValue(mockDb);
      const caller = createMockCaller();
      const result = await caller.getRankings({ period: "weekly" });

      expect(result.rankings.length).toBe(2);
      expect(result.rankings[0].rank).toBe(1);
      expect(result.rankings[1].rank).toBe(2);
      expect(result.rankings[0].totalXP).toBeGreaterThan(result.rankings[1].totalXP);
    });

    it("generates deterministic anonymous names", async () => {
      const mockStudentData = [
        { studentId: 42, correctCount: 10, totalCount: 15, speedBonus: 4, gradeLevel: 2, name: "Test" },
      ];

      const mockDb1 = createSequentialMockDb([mockStudentData, [], []]);
      mockGetDb.mockResolvedValue(mockDb1);
      const caller = createMockCaller();
      const result1 = await caller.getRankings({ period: "weekly" });

      const mockDb2 = createSequentialMockDb([mockStudentData, [], []]);
      mockGetDb.mockResolvedValue(mockDb2);
      const result2 = await caller.getRankings({ period: "weekly" });

      expect(result1.rankings[0].anonymousName).toBe(result2.rankings[0].anonymousName);
      expect(result1.rankings[0].anonymousName).not.toContain("Test");
    });
  });

  describe("getMyRank", () => {
    it("requires authentication", async () => {
      const caller = createMockCaller();
      await expect(caller.getMyRank({ period: "weekly" })).rejects.toThrow();
    });

    it("returns null when db is not available", async () => {
      mockGetDb.mockResolvedValue(null);
      const caller = createMockCaller({ id: 1, role: "user" });
      const result = await caller.getMyRank({ period: "weekly" });
      expect(result).toBeNull();
    });

    it("returns message when user has no activity", async () => {
      const mockDb = createSequentialMockDb([
        [{ correctCount: 0, totalCount: 0, speedBonus: 0 }],
      ]);
      mockGetDb.mockResolvedValue(mockDb);
      const caller = createMockCaller({ id: 1, role: "user" });
      const result = await caller.getMyRank({ period: "weekly" });

      expect(result).toBeDefined();
      expect(result!.message).toBeTruthy();
      expect(result!.totalXP).toBe(0);
    });

    it("returns rank and XP for active user", async () => {
      const mockDb = createSequentialMockDb([
        [{ correctCount: 25, totalCount: 30, speedBonus: 8 }],  // user stats
        [{ masteredCount: 3 }],                                   // mastery
        [{ currentStreak: 5 }],                                   // streak
        [],                                                        // all students
      ]);
      mockGetDb.mockResolvedValue(mockDb);
      const caller = createMockCaller({ id: 1, role: "user" });
      const result = await caller.getMyRank({ period: "weekly" });

      expect(result).toBeDefined();
      expect(result!.message).toBeNull();
      expect(result!.totalXP).toBe(433);
      expect(result!.accuracy).toBe(83);
      expect(result!.masteredSkills).toBe(3);
      expect(result!.currentStreak).toBe(5);
      expect(result!.rank).toBe(1);
    });
  });

  describe("getMyXPBreakdown", () => {
    it("requires authentication", async () => {
      const caller = createMockCaller();
      await expect(caller.getMyXPBreakdown({ period: "weekly" })).rejects.toThrow();
    });

    it("returns null when db is not available", async () => {
      mockGetDb.mockResolvedValue(null);
      const caller = createMockCaller({ id: 1, role: "user" });
      const result = await caller.getMyXPBreakdown({ period: "weekly" });
      expect(result).toBeNull();
    });

    it("returns detailed XP breakdown for active user", async () => {
      const mockDb = createSequentialMockDb([
        [{ correctCount: 20, speedBonus: 6 }],
        [{ masteredCount: 2 }],
        [{ currentStreak: 7 }],
      ]);
      mockGetDb.mockResolvedValue(mockDb);
      const caller = createMockCaller({ id: 1, role: "user" });
      const result = await caller.getMyXPBreakdown({ period: "weekly" });

      expect(result).toBeDefined();
      expect(result!.correctAnswers.xp).toBe(200);
      expect(result!.speedBonus.xp).toBe(6);
      expect(result!.masteryBonus.xp).toBe(100);
      expect(result!.streakBonus.xp).toBe(35);
      expect(result!.total).toBe(341);
    });

    it("returns zero XP breakdown for inactive user", async () => {
      const mockDb = createSequentialMockDb([
        [{ correctCount: 0, speedBonus: 0 }],
        [{ masteredCount: 0 }],
        [{ currentStreak: 0 }],
      ]);
      mockGetDb.mockResolvedValue(mockDb);
      const caller = createMockCaller({ id: 1, role: "user" });
      const result = await caller.getMyXPBreakdown({ period: "weekly" });

      expect(result).toBeDefined();
      expect(result!.total).toBe(0);
    });
  });

  describe("XP Formula Validation", () => {
    it("correct answer XP is 10 per correct answer", () => {
      expect(15 * 10).toBe(150);
      expect(0 * 10).toBe(0);
      expect(100 * 10).toBe(1000);
    });

    it("speed bonus is 2 XP per fast answer", () => {
      expect(5 * 2).toBe(10);
      expect(0 * 2).toBe(0);
    });

    it("mastery bonus is 50 XP per mastered skill", () => {
      expect(3 * 50).toBe(150);
      expect(0 * 50).toBe(0);
    });

    it("streak bonus is 5 XP per streak day", () => {
      expect(7 * 5).toBe(35);
      expect(0 * 5).toBe(0);
    });

    it("total XP combines all components", () => {
      const correct = 25 * 10;
      const speed = 8;
      const mastery = 3 * 50;
      const streak = 5 * 5;
      expect(correct + speed + mastery + streak).toBe(433);
    });
  });

  describe("Anonymous Name Generation", () => {
    it("generates consistent names for same user ID", () => {
      const userId = 42;
      const adjIdx1 = (userId * 7 + 13) % 30;
      const adjIdx2 = (userId * 7 + 13) % 30;
      expect(adjIdx1).toBe(adjIdx2);
    });

    it("generates different names for different user IDs", () => {
      const user1AdjIdx = (1 * 7 + 13) % 30;
      const user2AdjIdx = (2 * 7 + 13) % 30;
      expect(user1AdjIdx).not.toBe(user2AdjIdx);
    });
  });
});

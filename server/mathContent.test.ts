import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Unit tests for the mathContent router.
 * Covers all public endpoints: domains, skills, and problems.
 * All database calls are mocked.
 */

// ── Mock db module ──
const mockGetDomainsByGrade = vi.fn();
const mockGetAllDomains = vi.fn();
const mockGetSkillsByDomain = vi.fn();
const mockGetSkillsByGrade = vi.fn();
const mockGetSkillById = vi.fn();
const mockGetProblemsBySkill = vi.fn();

vi.mock("./db", () => ({
  getDomainsByGrade: (...args: any[]) => mockGetDomainsByGrade(...args),
  getAllDomains: (...args: any[]) => mockGetAllDomains(...args),
  getSkillsByDomain: (...args: any[]) => mockGetSkillsByDomain(...args),
  getSkillsByGrade: (...args: any[]) => mockGetSkillsByGrade(...args),
  getSkillById: (...args: any[]) => mockGetSkillById(...args),
  getProblemsBySkill: (...args: any[]) => mockGetProblemsBySkill(...args),
}));

// ── Import after mocks ──
import { mathContentRouter } from "./routers/mathContent";

// ── Test helpers ──
function createCaller(user?: { id: number; role: string } | null) {
  const ctx: any = { user: user ?? null, req: {}, res: {} };
  return mathContentRouter.createCaller(ctx);
}

// Sample data fixtures
const sampleDomains = [
  { id: 1, name: "Number Sense", gradeLevel: 3, description: "Basic numeracy" },
  { id: 2, name: "Fractions", gradeLevel: 3, description: "Parts of a whole" },
];

const sampleSkills = [
  { id: 10, domainId: 1, name: "Counting to 100", difficulty: 1 },
  { id: 11, domainId: 1, name: "Skip counting", difficulty: 2 },
];

const sampleProblems = [
  { id: 100, skillId: 10, question: "What is 2+3?", answer: "5", difficulty: 1, answerType: "number" },
  { id: 101, skillId: 10, question: "What is 4+5?", answer: "9", difficulty: 1, answerType: "number" },
];

// ── Tests ──

describe("mathContent router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── getDomains ──

  describe("getDomains", () => {
    it("should return domains for a valid grade level", async () => {
      mockGetDomainsByGrade.mockResolvedValue(sampleDomains);
      const caller = createCaller(null);
      const result = await caller.getDomains({ gradeLevel: 3 });
      expect(result).toEqual(sampleDomains);
      expect(mockGetDomainsByGrade).toHaveBeenCalledWith(3);
    });

    it("should return domains for minimum grade level (1)", async () => {
      mockGetDomainsByGrade.mockResolvedValue([{ id: 1, name: "Counting", gradeLevel: 1 }]);
      const caller = createCaller(null);
      const result = await caller.getDomains({ gradeLevel: 1 });
      expect(result).toHaveLength(1);
      expect(mockGetDomainsByGrade).toHaveBeenCalledWith(1);
    });

    it("should return domains for maximum grade level (12)", async () => {
      mockGetDomainsByGrade.mockResolvedValue([{ id: 50, name: "Calculus", gradeLevel: 12 }]);
      const caller = createCaller(null);
      const result = await caller.getDomains({ gradeLevel: 12 });
      expect(mockGetDomainsByGrade).toHaveBeenCalledWith(12);
    });

    it("should reject grade level below 1", async () => {
      const caller = createCaller(null);
      await expect(caller.getDomains({ gradeLevel: 0 })).rejects.toThrow();
    });

    it("should reject grade level above 12", async () => {
      const caller = createCaller(null);
      await expect(caller.getDomains({ gradeLevel: 13 })).rejects.toThrow();
    });

    it("should return empty array when no domains exist for grade", async () => {
      mockGetDomainsByGrade.mockResolvedValue([]);
      const caller = createCaller(null);
      const result = await caller.getDomains({ gradeLevel: 11 });
      expect(result).toEqual([]);
    });

    it("should be accessible without authentication", async () => {
      mockGetDomainsByGrade.mockResolvedValue(sampleDomains);
      // No user context — public endpoint
      const caller = createCaller(null);
      await expect(caller.getDomains({ gradeLevel: 3 })).resolves.toBeDefined();
    });

    it("should propagate db errors", async () => {
      mockGetDomainsByGrade.mockRejectedValue(new Error("DB unavailable"));
      const caller = createCaller(null);
      await expect(caller.getDomains({ gradeLevel: 5 })).rejects.toThrow("DB unavailable");
    });
  });

  // ── getAllDomains ──

  describe("getAllDomains", () => {
    it("should return all domains across all grades", async () => {
      const allDomains = [
        ...sampleDomains,
        { id: 3, name: "Algebra", gradeLevel: 8, description: "Variables and equations" },
      ];
      mockGetAllDomains.mockResolvedValue(allDomains);
      const caller = createCaller(null);
      const result = await caller.getAllDomains();
      expect(result).toEqual(allDomains);
      expect(mockGetAllDomains).toHaveBeenCalledTimes(1);
    });

    it("should return empty array when no domains exist", async () => {
      mockGetAllDomains.mockResolvedValue([]);
      const caller = createCaller(null);
      const result = await caller.getAllDomains();
      expect(result).toEqual([]);
    });

    it("should be accessible without authentication", async () => {
      mockGetAllDomains.mockResolvedValue(sampleDomains);
      const caller = createCaller(null);
      await expect(caller.getAllDomains()).resolves.toBeDefined();
    });

    it("should propagate db errors", async () => {
      mockGetAllDomains.mockRejectedValue(new Error("connection refused"));
      const caller = createCaller(null);
      await expect(caller.getAllDomains()).rejects.toThrow("connection refused");
    });
  });

  // ── getSkillsByDomain ──

  describe("getSkillsByDomain", () => {
    it("should return skills for a given domain", async () => {
      mockGetSkillsByDomain.mockResolvedValue(sampleSkills);
      const caller = createCaller(null);
      const result = await caller.getSkillsByDomain({ domainId: 1 });
      expect(result).toEqual(sampleSkills);
      expect(mockGetSkillsByDomain).toHaveBeenCalledWith(1);
    });

    it("should return empty array when domain has no skills", async () => {
      mockGetSkillsByDomain.mockResolvedValue([]);
      const caller = createCaller(null);
      const result = await caller.getSkillsByDomain({ domainId: 999 });
      expect(result).toEqual([]);
    });

    it("should pass the domainId through correctly", async () => {
      mockGetSkillsByDomain.mockResolvedValue([]);
      const caller = createCaller(null);
      await caller.getSkillsByDomain({ domainId: 42 });
      expect(mockGetSkillsByDomain).toHaveBeenCalledWith(42);
    });

    it("should propagate db errors", async () => {
      mockGetSkillsByDomain.mockRejectedValue(new Error("query timeout"));
      const caller = createCaller(null);
      await expect(caller.getSkillsByDomain({ domainId: 1 })).rejects.toThrow("query timeout");
    });
  });

  // ── getSkillsByGrade ──

  describe("getSkillsByGrade", () => {
    it("should return all skills for a grade", async () => {
      mockGetSkillsByGrade.mockResolvedValue(sampleSkills);
      const caller = createCaller(null);
      const result = await caller.getSkillsByGrade({ gradeLevel: 3 });
      expect(result).toEqual(sampleSkills);
      expect(mockGetSkillsByGrade).toHaveBeenCalledWith(3);
    });

    it("should reject grade level below 1", async () => {
      const caller = createCaller(null);
      await expect(caller.getSkillsByGrade({ gradeLevel: 0 })).rejects.toThrow();
    });

    it("should reject grade level above 12", async () => {
      const caller = createCaller(null);
      await expect(caller.getSkillsByGrade({ gradeLevel: 13 })).rejects.toThrow();
    });

    it("should return empty array when no skills for grade", async () => {
      mockGetSkillsByGrade.mockResolvedValue([]);
      const caller = createCaller(null);
      const result = await caller.getSkillsByGrade({ gradeLevel: 7 });
      expect(result).toEqual([]);
    });

    it("should propagate db errors", async () => {
      mockGetSkillsByGrade.mockRejectedValue(new Error("DB error"));
      const caller = createCaller(null);
      await expect(caller.getSkillsByGrade({ gradeLevel: 3 })).rejects.toThrow("DB error");
    });
  });

  // ── getSkill ──

  describe("getSkill", () => {
    it("should return a single skill by id", async () => {
      const skill = { id: 10, domainId: 1, name: "Counting to 100", difficulty: 1 };
      mockGetSkillById.mockResolvedValue(skill);
      const caller = createCaller(null);
      const result = await caller.getSkill({ id: 10 });
      expect(result).toEqual(skill);
      expect(mockGetSkillById).toHaveBeenCalledWith(10);
    });

    it("should return null/undefined when skill does not exist", async () => {
      mockGetSkillById.mockResolvedValue(null);
      const caller = createCaller(null);
      const result = await caller.getSkill({ id: 9999 });
      expect(result).toBeNull();
    });

    it("should pass the skill id through correctly", async () => {
      mockGetSkillById.mockResolvedValue(null);
      const caller = createCaller(null);
      await caller.getSkill({ id: 77 });
      expect(mockGetSkillById).toHaveBeenCalledWith(77);
    });

    it("should propagate db errors", async () => {
      mockGetSkillById.mockRejectedValue(new Error("not found in db"));
      const caller = createCaller(null);
      await expect(caller.getSkill({ id: 1 })).rejects.toThrow("not found in db");
    });
  });

  // ── getProblemsBySkill ──

  describe("getProblemsBySkill", () => {
    it("should return problems for a skill without difficulty filter", async () => {
      mockGetProblemsBySkill.mockResolvedValue(sampleProblems);
      const caller = createCaller(null);
      const result = await caller.getProblemsBySkill({ skillId: 10 });
      expect(result).toEqual(sampleProblems);
      expect(mockGetProblemsBySkill).toHaveBeenCalledWith(10, undefined);
    });

    it("should pass difficulty filter when provided", async () => {
      const easyProblems = sampleProblems.filter(p => p.difficulty === 1);
      mockGetProblemsBySkill.mockResolvedValue(easyProblems);
      const caller = createCaller(null);
      const result = await caller.getProblemsBySkill({ skillId: 10, difficulty: 1 });
      expect(mockGetProblemsBySkill).toHaveBeenCalledWith(10, 1);
      expect(result).toEqual(easyProblems);
    });

    it("should accept difficulty values 1 through 5", async () => {
      mockGetProblemsBySkill.mockResolvedValue([]);
      const caller = createCaller(null);
      for (const difficulty of [1, 2, 3, 4, 5]) {
        await caller.getProblemsBySkill({ skillId: 1, difficulty });
        expect(mockGetProblemsBySkill).toHaveBeenLastCalledWith(1, difficulty);
      }
    });

    it("should reject difficulty below 1", async () => {
      const caller = createCaller(null);
      await expect(
        caller.getProblemsBySkill({ skillId: 10, difficulty: 0 })
      ).rejects.toThrow();
    });

    it("should reject difficulty above 5", async () => {
      const caller = createCaller(null);
      await expect(
        caller.getProblemsBySkill({ skillId: 10, difficulty: 6 })
      ).rejects.toThrow();
    });

    it("should return empty array when no problems exist", async () => {
      mockGetProblemsBySkill.mockResolvedValue([]);
      const caller = createCaller(null);
      const result = await caller.getProblemsBySkill({ skillId: 9999 });
      expect(result).toEqual([]);
    });

    it("should be accessible without authentication", async () => {
      mockGetProblemsBySkill.mockResolvedValue(sampleProblems);
      const caller = createCaller(null);
      await expect(
        caller.getProblemsBySkill({ skillId: 10 })
      ).resolves.toBeDefined();
    });

    it("should propagate db errors", async () => {
      mockGetProblemsBySkill.mockRejectedValue(new Error("timeout"));
      const caller = createCaller(null);
      await expect(
        caller.getProblemsBySkill({ skillId: 10 })
      ).rejects.toThrow("timeout");
    });
  });
});

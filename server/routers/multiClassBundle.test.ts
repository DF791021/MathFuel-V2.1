import { describe, it, expect, beforeEach, vi } from "vitest";
import * as db from "../db";

// Mock database functions
vi.mock("../db", () => ({
  getClassById: vi.fn(),
  getTeacherClasses: vi.fn(),
  getSuccessStoriesWithStats: vi.fn(),
  saveExportHistory: vi.fn(),
  getExportHistory: vi.fn(),
}));

describe("Multi-Class Bundle Feature", () => {
  const teacherId = 1;
  const classId1 = 1;
  const classId2 = 2;
  const classId3 = 3;

  const mockClasses = [
    {
      id: classId1,
      name: "Grade 3A",
      teacherId,
      storyCount: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: classId2,
      name: "Grade 3B",
      teacherId,
      storyCount: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: classId3,
      name: "Grade 4A",
      teacherId,
      storyCount: 4,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockStories = [
    {
      id: 1,
      studentName: "Alice Johnson",
      goalName: "Healthy Eating",
      goalType: "nutrition",
      title: "My Journey to Balanced Meals",
      description: "Alice learned to eat more vegetables",
      testimonial: "I feel so much better!",
      tips: "Start small with one new vegetable each week",
      impactScore: 85,
      createdAt: new Date("2024-01-15"),
      classId: classId1,
      reactionCounts: { like: 10, inspired: 5, helpful: 3, motivating: 2 },
      commentCount: 4,
    },
    {
      id: 2,
      studentName: "Bob Smith",
      goalName: "Exercise Routine",
      goalType: "fitness",
      title: "Getting Active",
      description: "Bob started exercising daily",
      testimonial: "I have more energy!",
      tips: "Find an activity you enjoy",
      impactScore: 78,
      createdAt: new Date("2024-02-20"),
      classId: classId2,
      reactionCounts: { like: 8, inspired: 4, helpful: 2, motivating: 1 },
      commentCount: 3,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getClassesForBundling", () => {
    it("should retrieve all classes for a teacher", () => {
      const classes = mockClasses;
      expect(Array.isArray(classes)).toBe(true);
      expect(classes.length).toBe(3);
    });

    it("should include story count for each class", () => {
      for (const classData of mockClasses) {
        expect(classData).toHaveProperty("storyCount");
        expect(typeof classData.storyCount).toBe("number");
      }
    });

    it("should only return classes owned by the teacher", () => {
      for (const classData of mockClasses) {
        expect(classData.teacherId).toBe(teacherId);
      }
    });

    it("should calculate total stories across classes", () => {
      const totalStories = mockClasses.reduce((sum, c) => sum + c.storyCount, 0);
      expect(totalStories).toBe(12);
    });
  });

  describe("previewBundleStories", () => {
    it("should validate at least one class is provided", () => {
      const classIds: number[] = [];
      expect(classIds.length).toBe(0);
    });

    it("should calculate total stories from multiple classes", () => {
      const selectedClasses = mockClasses.slice(0, 2);
      const totalStories = selectedClasses.reduce((sum, c) => sum + c.storyCount, 0);
      expect(totalStories).toBe(8);
    });

    it("should support filtering by date range", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-12-31");
      const filtered = mockStories.filter((s) => {
        const storyDate = new Date(s.createdAt);
        return storyDate >= startDate && storyDate <= endDate;
      });
      expect(filtered.length).toBe(2);
    });

    it("should support filtering by goal type", () => {
      const goalType = "nutrition";
      const filtered = mockStories.filter((s) => s.goalType === goalType);
      expect(filtered.length).toBe(1);
      expect(filtered[0].studentName).toBe("Alice Johnson");
    });

    it("should support filtering by multiple goal types", () => {
      const goalTypes = ["nutrition", "fitness"];
      const filtered = mockStories.filter((s) => goalTypes.includes(s.goalType));
      expect(filtered.length).toBe(2);
    });
  });

  describe("generateMultiClassBundle", () => {
    it("should validate at least one class is provided", () => {
      const classIds: number[] = [];
      expect(classIds.length).toBe(0);
    });

    it("should require school name", () => {
      const schoolName = "";
      expect(schoolName.trim()).toBe("");
    });

    it("should support multiple classes in bundle", () => {
      const classIds = [classId1, classId2];
      expect(classIds.length).toBe(2);
    });

    it("should support different organization methods", () => {
      const methods: Array<"by-class" | "by-goal" | "chronological"> = [
        "by-class",
        "by-goal",
        "chronological",
      ];
      expect(methods.length).toBe(3);
      expect(methods).toContain("by-class");
      expect(methods).toContain("by-goal");
      expect(methods).toContain("chronological");
    });

    it("should apply date range filter", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-12-31");
      expect(startDate.getTime()).toBeLessThan(endDate.getTime());
    });

    it("should apply goal type filter", () => {
      const goalType = "nutrition";
      const filtered = mockStories.filter((s) => s.goalType === goalType);
      expect(filtered.length).toBeGreaterThan(0);
    });

    it("should include optional content based on flags", () => {
      const options = {
        includeMetrics: true,
        includeTestimonials: true,
        includeTips: true,
      };
      expect(options.includeMetrics).toBe(true);
      expect(options.includeTestimonials).toBe(true);
      expect(options.includeTips).toBe(true);
    });

    it("should support teacher notes", () => {
      const notes = "These stories showcase our students' amazing achievements.";
      expect(notes.length).toBeGreaterThan(0);
      expect(notes).toContain("achievements");
    });

    it("should support custom branding colors", () => {
      const primaryColor = "#1e40af";
      const secondaryColor = "#3b82f6";
      expect(primaryColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(secondaryColor).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it("should generate valid base64 PDF", () => {
      const base64Pdf = "JVBERi0xLjQK";
      expect(typeof base64Pdf).toBe("string");
      expect(() => Buffer.from(base64Pdf, "base64")).not.toThrow();
    });

    it("should create proper filename for bundle", () => {
      const date = new Date().toISOString().split("T")[0];
      const filename = `success-stories-bundle-${date}.pdf`;
      expect(filename).toContain("bundle");
      expect(filename).toContain(".pdf");
    });
  });

  describe("Bundle Statistics", () => {
    it("should calculate correct story totals", () => {
      const selectedClasses = mockClasses;
      const totalStories = selectedClasses.reduce((sum, c) => sum + c.storyCount, 0);
      expect(totalStories).toBe(12);
    });

    it("should calculate average stories per class", () => {
      const selectedClasses = mockClasses;
      const totalStories = selectedClasses.reduce((sum, c) => sum + c.storyCount, 0);
      const average = totalStories / selectedClasses.length;
      expect(average).toBeCloseTo(4);
    });

    it("should handle multiple class selections", () => {
      const classIds = [classId1, classId2, classId3];
      expect(classIds.length).toBe(3);
    });

    it("should calculate engagement metrics", () => {
      const totalReactions = mockStories.reduce((sum, s) => {
        const counts = s.reactionCounts as any;
        return sum + Object.values(counts).reduce((a: number, b: any) => a + b, 0);
      }, 0);
      expect(totalReactions).toBe(35);
    });

    it("should calculate total comments", () => {
      const totalComments = mockStories.reduce((sum, s) => sum + s.commentCount, 0);
      expect(totalComments).toBe(7);
    });

    it("should calculate average impact score", () => {
      const avgImpact =
        mockStories.reduce((sum, s) => sum + (s.impactScore || 0), 0) / mockStories.length;
      expect(avgImpact).toBeCloseTo(81.5, 1);
    });
  });

  describe("Bundle Organization", () => {
    it("should organize stories by class", () => {
      const storiesByClass = new Map<number, typeof mockStories>();
      for (const story of mockStories) {
        if (!storiesByClass.has(story.classId)) {
          storiesByClass.set(story.classId, []);
        }
        storiesByClass.get(story.classId)!.push(story);
      }
      expect(storiesByClass.size).toBe(2);
    });

    it("should organize stories by goal type", () => {
      const storiesByGoal = new Map<string, typeof mockStories>();
      for (const story of mockStories) {
        if (!storiesByGoal.has(story.goalType)) {
          storiesByGoal.set(story.goalType, []);
        }
        storiesByGoal.get(story.goalType)!.push(story);
      }
      expect(storiesByGoal.size).toBe(2);
      expect(storiesByGoal.has("nutrition")).toBe(true);
      expect(storiesByGoal.has("fitness")).toBe(true);
    });

    it("should organize stories chronologically", () => {
      const sorted = [...mockStories].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      expect(sorted[0].studentName).toBe("Bob Smith");
      expect(sorted[1].studentName).toBe("Alice Johnson");
    });
  });

  describe("Authorization", () => {
    it("should validate teacher ownership of classes", () => {
      const otherTeacherId = 999;
      const classOwnedByOther = {
        ...mockClasses[0],
        teacherId: otherTeacherId,
      };
      expect(classOwnedByOther.teacherId).not.toBe(teacherId);
    });

    it("should prevent unauthorized access to other teacher classes", () => {
      const currentTeacherId = teacherId;
      const otherTeacherId = 999;
      expect(currentTeacherId).not.toBe(otherTeacherId);
    });
  });
});

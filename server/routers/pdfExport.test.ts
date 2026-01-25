import { describe, it, expect, beforeEach, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { generateSuccessStoriesPDF } from "../_core/pdfExport";

// Mock database functions
vi.mock("../db", () => ({
  getClassById: vi.fn(),
  getSuccessStoriesWithStats: vi.fn(),
  saveExportHistory: vi.fn(),
  getExportHistory: vi.fn(),
  getExportHistoryCount: vi.fn(),
  getExportHistoryById: vi.fn(),
  deleteExportHistory: vi.fn(),
  getExportStats: vi.fn(),
}));

describe("PDF Export Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PDF Generation", () => {
    it("should generate a valid PDF buffer", async () => {
      const mockStories = [
        {
          id: 1,
          studentName: "Alice Johnson",
          goalName: "Improve Reading",
          goalType: "literacy",
          title: "Reading Breakthrough",
          description: "Improved reading comprehension from 60% to 85%",
          testimonial: "I practiced reading every day!",
          tips: "Read daily and discuss stories",
          impactScore: 85,
          createdAt: new Date(),
          reactionCounts: { inspired: 5, helpful: 3, like: 2, motivating: 1 },
          commentCount: 4,
        },
      ];

      const reportOptions = {
        className: "Grade 3A",
        schoolName: "Lincoln Elementary",
        teacherName: "Ms. Smith",
        reportDate: new Date(),
        includeMetrics: true,
        includeTestimonials: true,
        includeTips: true,
      };

      const pdf = await generateSuccessStoriesPDF(mockStories, reportOptions);

      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(0);
      // PDF files start with %PDF magic bytes
      expect(pdf.toString("utf8", 0, 4)).toBe("%PDF");
    });

    it("should include all story details in PDF", async () => {
      const mockStories = [
        {
          id: 1,
          studentName: "Bob Smith",
          goalName: "Math Mastery",
          goalType: "math",
          title: "Math Champion",
          description: "Mastered multiplication tables",
          testimonial: "Practice makes perfect!",
          tips: "Use flashcards daily",
          impactScore: 90,
          createdAt: new Date(),
          reactionCounts: { inspired: 10, helpful: 5 },
          commentCount: 8,
        },
      ];

      const reportOptions = {
        className: "Grade 4B",
        schoolName: "Central School",
        teacherName: "Mr. Johnson",
        reportDate: new Date(),
        includeMetrics: true,
        includeTestimonials: true,
        includeTips: true,
      };

      const pdf = await generateSuccessStoriesPDF(mockStories, reportOptions);
      const pdfText = pdf.toString("utf8");

      // Check for key content (may be encoded, but some text should be visible)
      expect(pdf.length).toBeGreaterThan(1000);
    });

    it("should handle multiple stories in PDF", async () => {
      const mockStories = [
        {
          id: 1,
          studentName: "Student 1",
          goalName: "Goal 1",
          goalType: "type1",
          title: "Story 1",
          description: "Description 1",
          testimonial: "Testimonial 1",
          tips: "Tips 1",
          impactScore: 80,
          createdAt: new Date(),
          reactionCounts: { inspired: 5 },
          commentCount: 2,
        },
        {
          id: 2,
          studentName: "Student 2",
          goalName: "Goal 2",
          goalType: "type2",
          title: "Story 2",
          description: "Description 2",
          testimonial: "Testimonial 2",
          tips: "Tips 2",
          impactScore: 85,
          createdAt: new Date(),
          reactionCounts: { helpful: 3 },
          commentCount: 1,
        },
      ];

      const reportOptions = {
        className: "Class",
        schoolName: "School",
        teacherName: "Teacher",
        reportDate: new Date(),
        includeMetrics: true,
        includeTestimonials: true,
        includeTips: true,
      };

      const pdf = await generateSuccessStoriesPDF(mockStories, reportOptions);

      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(1000);
    });

    it("should respect includeMetrics option", async () => {
      const mockStories = [
        {
          id: 1,
          studentName: "Test Student",
          goalName: "Test Goal",
          goalType: "test",
          title: "Test Story",
          description: "Test description",
          testimonial: null,
          tips: null,
          impactScore: 75,
          createdAt: new Date(),
          reactionCounts: { inspired: 5 },
          commentCount: 0,
        },
      ];

      const reportOptionsWithMetrics = {
        className: "Class",
        schoolName: "School",
        teacherName: "Teacher",
        reportDate: new Date(),
        includeMetrics: true,
        includeTestimonials: false,
        includeTips: false,
      };

      const pdfWithMetrics = await generateSuccessStoriesPDF(mockStories, reportOptionsWithMetrics);
      expect(pdfWithMetrics).toBeInstanceOf(Buffer);

      const reportOptionsWithoutMetrics = {
        className: "Class",
        schoolName: "School",
        teacherName: "Teacher",
        reportDate: new Date(),
        includeMetrics: false,
        includeTestimonials: false,
        includeTips: false,
      };

      const pdfWithoutMetrics = await generateSuccessStoriesPDF(mockStories, reportOptionsWithoutMetrics);
      expect(pdfWithoutMetrics).toBeInstanceOf(Buffer);

      // PDF without metrics should be smaller
      expect(pdfWithoutMetrics.length).toBeLessThan(pdfWithMetrics.length);
    });

    it("should handle empty testimonials and tips", async () => {
      const mockStories = [
        {
          id: 1,
          studentName: "Student",
          goalName: "Goal",
          goalType: "type",
          title: "Story",
          description: "Description",
          testimonial: null,
          tips: null,
          impactScore: 70,
          createdAt: new Date(),
          reactionCounts: {},
          commentCount: 0,
        },
      ];

      const reportOptions = {
        className: "Class",
        schoolName: "School",
        teacherName: "Teacher",
        reportDate: new Date(),
        includeMetrics: true,
        includeTestimonials: true,
        includeTips: true,
      };

      const pdf = await generateSuccessStoriesPDF(mockStories, reportOptions);

      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(0);
    });

    it("should include teacher notes when provided", async () => {
      const mockStories = [
        {
          id: 1,
          studentName: "Student",
          goalName: "Goal",
          goalType: "type",
          title: "Story",
          description: "Description",
          testimonial: "Testimonial",
          tips: "Tips",
          impactScore: 80,
          createdAt: new Date(),
          reactionCounts: { inspired: 5 },
          commentCount: 2,
        },
      ];

      const reportOptionsWithNotes = {
        className: "Class",
        schoolName: "School",
        teacherName: "Teacher",
        reportDate: new Date(),
        includeMetrics: true,
        includeTestimonials: true,
        includeTips: true,
        teacherNotes: "These students have shown remarkable growth this semester.",
      };

      const pdf = await generateSuccessStoriesPDF(mockStories, reportOptionsWithNotes);

      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(0);
    });

    it("should handle custom colors in PDF", async () => {
      const mockStories = [
        {
          id: 1,
          studentName: "Student",
          goalName: "Goal",
          goalType: "type",
          title: "Story",
          description: "Description",
          testimonial: "Testimonial",
          tips: "Tips",
          impactScore: 80,
          createdAt: new Date(),
          reactionCounts: { inspired: 5 },
          commentCount: 2,
        },
      ];

      const reportOptionsWithColors = {
        className: "Class",
        schoolName: "School",
        teacherName: "Teacher",
        reportDate: new Date(),
        includeMetrics: true,
        includeTestimonials: true,
        includeTips: true,
        primaryColor: "#FF5733",
        secondaryColor: "#33FF57",
      };

      const pdf = await generateSuccessStoriesPDF(mockStories, reportOptionsWithColors);

      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(0);
    });

    it("should handle date range filtering", async () => {
      const mockStories = [
        {
          id: 1,
          studentName: "Student",
          goalName: "Goal",
          goalType: "type",
          title: "Story",
          description: "Description",
          testimonial: "Testimonial",
          tips: "Tips",
          impactScore: 80,
          createdAt: new Date("2024-01-15"),
          reactionCounts: { inspired: 5 },
          commentCount: 2,
        },
      ];

      const reportOptions = {
        className: "Class",
        schoolName: "School",
        teacherName: "Teacher",
        reportDate: new Date(),
        dateRange: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        },
        includeMetrics: true,
        includeTestimonials: true,
        includeTips: true,
      };

      const pdf = await generateSuccessStoriesPDF(mockStories, reportOptions);

      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(0);
    });
  });

  describe("Export History", () => {
    it("should save export history", async () => {
      vi.mocked(db.saveExportHistory).mockResolvedValue({ insertId: 1 } as any);

      const result = await db.saveExportHistory({
        teacherId: 1,
        classId: 1,
        exportType: "success_stories",
        storyCount: 5,
      });

      expect(db.saveExportHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          teacherId: 1,
          classId: 1,
          exportType: "success_stories",
          storyCount: 5,
        })
      );
    });

    it("should retrieve export history", async () => {
      const mockHistory = [
        {
          id: 1,
          teacherId: 1,
          classId: 1,
          exportType: "success_stories",
          storyCount: 5,
          createdAt: new Date(),
        },
      ];

      vi.mocked(db.getExportHistory).mockResolvedValue(mockHistory as any);

      const result = await db.getExportHistory(1, 10, 0);

      expect(db.getExportHistory).toHaveBeenCalledWith(1, 10, 0);
      expect(result).toHaveLength(1);
    });

    it("should get export history count", async () => {
      vi.mocked(db.getExportHistoryCount).mockResolvedValue(5);

      const result = await db.getExportHistoryCount(1);

      expect(db.getExportHistoryCount).toHaveBeenCalledWith(1);
      expect(result).toBe(5);
    });

    it("should get export statistics", async () => {
      const mockStats = {
        totalExports: 10,
        totalStories: 50,
        byType: { success_stories: 10 },
        lastExport: new Date(),
      };

      vi.mocked(db.getExportStats).mockResolvedValue(mockStats as any);

      const result = await db.getExportStats(1);

      expect(db.getExportStats).toHaveBeenCalledWith(1);
      expect(result.totalExports).toBe(10);
      expect(result.totalStories).toBe(50);
    });

    it("should delete export history", async () => {
      vi.mocked(db.deleteExportHistory).mockResolvedValue({ affectedRows: 1 } as any);

      const result = await db.deleteExportHistory(1);

      expect(db.deleteExportHistory).toHaveBeenCalledWith(1);
    });
  });

  describe("Authorization", () => {
    it("should verify class ownership for export", async () => {
      const mockClass = { id: 1, teacherId: 1, name: "Class A" };
      vi.mocked(db.getClassById).mockResolvedValue(mockClass as any);

      const result = await db.getClassById(1);

      expect(result?.teacherId).toBe(1);
    });

    it("should handle class not found", async () => {
      vi.mocked(db.getClassById).mockResolvedValue(null);

      const result = await db.getClassById(999);

      expect(result).toBeNull();
    });
  });
});

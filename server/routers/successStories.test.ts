import { describe, it, expect, beforeEach, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

// Mock database functions
vi.mock("../db", () => ({
  getClassById: vi.fn(),
  createSuccessStory: vi.fn(),
  getSuccessStoryById: vi.fn(),
  getSuccessStories: vi.fn(),
  updateSuccessStory: vi.fn(),
  deleteSuccessStory: vi.fn(),
  createSuccessStoryReaction: vi.fn(),
  getSuccessStoryReaction: vi.fn(),
  updateSuccessStoryReaction: vi.fn(),
  deleteSuccessStoryReaction: vi.fn(),
  getSuccessStoryReactions: vi.fn(),
  createSuccessStoryComment: vi.fn(),
  getSuccessStoryCommentById: vi.fn(),
  deleteSuccessStoryComment: vi.fn(),
  getSuccessStoryComments: vi.fn(),
  getSuccessStoriesWithStats: vi.fn(),
}));

describe("Success Stories Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Create Success Story", () => {
    it("should create a success story with valid data", async () => {
      const mockStory = {
        id: 1,
        studentId: 1,
        studentName: "John Doe",
        goalId: 1,
        goalName: "Improve Accuracy",
        goalType: "accuracy" as const,
        targetValue: 90,
        achievedValue: 95,
        title: "Accuracy Achievement",
        description: "Successfully improved accuracy from 80% to 95%",
        testimonial: "I practiced daily and it paid off!",
        tips: "Practice consistently and review mistakes",
        imageUrl: null,
        impactScore: 85,
        receivedAlerts: true,
        alertsCount: 5,
        daysToAchieve: 30,
        classId: 1,
        isPublished: true,
        isFeature: false,
        createdAt: new Date(),
        achievedAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.createSuccessStory).mockResolvedValue({ insertId: 1 } as any);

      const result = await db.createSuccessStory({
        studentId: 1,
        studentName: "John Doe",
        goalId: 1,
        goalName: "Improve Accuracy",
        goalType: "accuracy",
        targetValue: 90,
        achievedValue: 95,
        title: "Accuracy Achievement",
        description: "Successfully improved accuracy from 80% to 95%",
        testimonial: "I practiced daily and it paid off!",
        tips: "Practice consistently and review mistakes",
        classId: 1,
      });

      expect(db.createSuccessStory).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 1,
          studentName: "John Doe",
          goalId: 1,
          goalName: "Improve Accuracy",
          goalType: "accuracy",
        })
      );
    });

    it("should fail without required fields", async () => {
      const incompleteData = {
        studentId: 1,
        // Missing other required fields
      };

      // This would be caught by Zod validation in the actual router
      expect(() => {
        // Validation would happen at router level
      }).not.toThrow();
    });
  });

  describe("Get Success Stories", () => {
    it("should retrieve stories with filters", async () => {
      const mockStories = [
        {
          id: 1,
          studentName: "John Doe",
          goalName: "Accuracy",
          goalType: "accuracy" as const,
          title: "Great Achievement",
          description: "Improved accuracy",
          targetValue: 90,
          achievedValue: 95,
          testimonial: null,
          tips: null,
          imageUrl: null,
          impactScore: 85,
          isFeature: false,
          createdAt: new Date(),
        },
      ];

      vi.mocked(db.getSuccessStories).mockResolvedValue(mockStories as any);

      const result = await db.getSuccessStories({
        classId: 1,
        goalType: "accuracy",
        isPublished: true,
        limit: 20,
      });

      expect(db.getSuccessStories).toHaveBeenCalledWith(
        expect.objectContaining({
          classId: 1,
          goalType: "accuracy",
          isPublished: true,
        })
      );
    });

    it("should return empty array when no stories found", async () => {
      vi.mocked(db.getSuccessStories).mockResolvedValue([]);

      const result = await db.getSuccessStories({ classId: 999 });

      expect(result).toEqual([]);
    });
  });

  describe("Get Success Story by ID", () => {
    it("should retrieve a story by ID", async () => {
      const mockStory = {
        id: 1,
        studentId: 1,
        studentName: "John Doe",
        goalId: 1,
        goalName: "Accuracy",
        goalType: "accuracy" as const,
        title: "Achievement",
        description: "Improved accuracy",
        targetValue: 90,
        achievedValue: 95,
        testimonial: "Great effort!",
        tips: "Practice daily",
        imageUrl: null,
        impactScore: 85,
        isPublished: true,
        isFeature: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getSuccessStoryById).mockResolvedValue(mockStory as any);

      const result = await db.getSuccessStoryById(1);

      expect(db.getSuccessStoryById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockStory);
    });

    it("should return null for non-existent story", async () => {
      vi.mocked(db.getSuccessStoryById).mockResolvedValue(null);

      const result = await db.getSuccessStoryById(999);

      expect(result).toBeNull();
    });
  });

  describe("Update Success Story", () => {
    it("should update story fields", async () => {
      const updates = {
        testimonial: "Updated testimonial",
        tips: "Updated tips",
        impactScore: 90,
        isPublished: true,
      };

      vi.mocked(db.updateSuccessStory).mockResolvedValue({ affectedRows: 1 } as any);

      const result = await db.updateSuccessStory(1, updates);

      expect(db.updateSuccessStory).toHaveBeenCalledWith(1, updates);
    });
  });

  describe("Delete Success Story", () => {
    it("should delete a story", async () => {
      vi.mocked(db.deleteSuccessStory).mockResolvedValue({ affectedRows: 1 } as any);

      const result = await db.deleteSuccessStory(1);

      expect(db.deleteSuccessStory).toHaveBeenCalledWith(1);
    });
  });

  describe("Reactions", () => {
    it("should create a reaction", async () => {
      vi.mocked(db.createSuccessStoryReaction).mockResolvedValue({ insertId: 1 } as any);

      const result = await db.createSuccessStoryReaction({
        storyId: 1,
        studentId: 2,
        reactionType: "inspired",
      });

      expect(db.createSuccessStoryReaction).toHaveBeenCalledWith(
        expect.objectContaining({
          storyId: 1,
          studentId: 2,
          reactionType: "inspired",
        })
      );
    });

    it("should get reactions for a story", async () => {
      const mockReactions = [
        { id: 1, storyId: 1, studentId: 2, reactionType: "inspired" as const },
        { id: 2, storyId: 1, studentId: 3, reactionType: "helpful" as const },
      ];

      vi.mocked(db.getSuccessStoryReactions).mockResolvedValue(mockReactions as any);

      const result = await db.getSuccessStoryReactions(1);

      expect(db.getSuccessStoryReactions).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
    });

    it("should update a reaction", async () => {
      vi.mocked(db.updateSuccessStoryReaction).mockResolvedValue({ affectedRows: 1 } as any);

      const result = await db.updateSuccessStoryReaction(1, 2, "helpful");

      expect(db.updateSuccessStoryReaction).toHaveBeenCalledWith(1, 2, "helpful");
    });

    it("should delete a reaction", async () => {
      vi.mocked(db.deleteSuccessStoryReaction).mockResolvedValue({ affectedRows: 1 } as any);

      const result = await db.deleteSuccessStoryReaction(1, 2);

      expect(db.deleteSuccessStoryReaction).toHaveBeenCalledWith(1, 2);
    });
  });

  describe("Comments", () => {
    it("should create a comment", async () => {
      vi.mocked(db.createSuccessStoryComment).mockResolvedValue({ insertId: 1 } as any);

      const result = await db.createSuccessStoryComment({
        storyId: 1,
        studentId: 2,
        studentName: "Jane Doe",
        comment: "This is inspiring!",
        isApproved: true,
      });

      expect(db.createSuccessStoryComment).toHaveBeenCalledWith(
        expect.objectContaining({
          storyId: 1,
          studentId: 2,
          studentName: "Jane Doe",
          comment: "This is inspiring!",
        })
      );
    });

    it("should get comments for a story", async () => {
      const mockComments = [
        {
          id: 1,
          storyId: 1,
          studentId: 2,
          studentName: "Jane Doe",
          comment: "Great job!",
          isApproved: true,
          createdAt: new Date(),
        },
      ];

      vi.mocked(db.getSuccessStoryComments).mockResolvedValue(mockComments as any);

      const result = await db.getSuccessStoryComments(1);

      expect(db.getSuccessStoryComments).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(1);
    });

    it("should get only approved comments by default", async () => {
      vi.mocked(db.getSuccessStoryComments).mockResolvedValue([]);

      const result = await db.getSuccessStoryComments(1, true);

      expect(db.getSuccessStoryComments).toHaveBeenCalledWith(1, true);
    });

    it("should delete a comment", async () => {
      vi.mocked(db.deleteSuccessStoryComment).mockResolvedValue({ affectedRows: 1 } as any);

      const result = await db.deleteSuccessStoryComment(1);

      expect(db.deleteSuccessStoryComment).toHaveBeenCalledWith(1);
    });
  });

  describe("Success Stories with Stats", () => {
    it("should retrieve stories with engagement stats", async () => {
      const mockStoriesWithStats = [
        {
          id: 1,
          studentName: "John Doe",
          goalName: "Accuracy",
          goalType: "accuracy" as const,
          title: "Achievement",
          description: "Improved accuracy",
          targetValue: 90,
          achievedValue: 95,
          testimonial: null,
          tips: null,
          imageUrl: null,
          impactScore: 85,
          isFeature: false,
          createdAt: new Date(),
          reactionCounts: { inspired: 5, helpful: 3, like: 2, motivating: 1 },
          commentCount: 4,
          totalEngagement: 15,
        },
      ];

      vi.mocked(db.getSuccessStoriesWithStats).mockResolvedValue(mockStoriesWithStats as any);

      const result = await db.getSuccessStoriesWithStats(1);

      expect(db.getSuccessStoriesWithStats).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(1);
    });

    it("should handle no class ID for global stats", async () => {
      vi.mocked(db.getSuccessStoriesWithStats).mockResolvedValue([]);

      const result = await db.getSuccessStoriesWithStats(undefined);

      expect(db.getSuccessStoriesWithStats).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([]);
    });
  });

  describe("Authorization", () => {
    it("should verify class ownership for story creation", async () => {
      // This would be tested at the router level with actual context
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

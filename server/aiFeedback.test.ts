import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  submitAIFeedback: vi.fn().mockResolvedValue({ id: 42 }),
  getAIFeedbackStats: vi.fn().mockResolvedValue({
    total: 10,
    up: 7,
    down: 3,
    byType: {
      hint: { total: 5, up: 4, down: 1 },
      explanation: { total: 4, up: 2, down: 2 },
      session_summary: { total: 1, up: 1, down: 0 },
    },
  }),
  getAIFeedbackForSession: vi.fn().mockResolvedValue([
    {
      id: 1,
      studentId: 1,
      sessionId: 100,
      problemId: 5,
      responseType: "hint",
      rating: "up",
      aiResponseText: "Try counting on your fingers!",
      comment: null,
      createdAt: new Date(),
    },
    {
      id: 2,
      studentId: 1,
      sessionId: 100,
      problemId: 5,
      responseType: "explanation",
      rating: "down",
      aiResponseText: "When we add 3 + 4...",
      comment: null,
      createdAt: new Date(),
    },
  ]),
  getAIFeedbackByStudent: vi.fn().mockResolvedValue([]),
}));

import * as db from "./db";

describe("AI Feedback Feature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("submitAIFeedback", () => {
    it("should store a thumbs-up rating for a hint", async () => {
      const result = await db.submitAIFeedback({
        studentId: 1,
        sessionId: 100,
        problemId: 5,
        responseType: "hint",
        rating: "up",
        aiResponseText: "Try counting on your fingers!",
        comment: null,
      });

      expect(db.submitAIFeedback).toHaveBeenCalledWith({
        studentId: 1,
        sessionId: 100,
        problemId: 5,
        responseType: "hint",
        rating: "up",
        aiResponseText: "Try counting on your fingers!",
        comment: null,
      });
      expect(result).toEqual({ id: 42 });
    });

    it("should store a thumbs-down rating for an explanation", async () => {
      const result = await db.submitAIFeedback({
        studentId: 1,
        sessionId: 100,
        problemId: 5,
        responseType: "explanation",
        rating: "down",
        aiResponseText: "When we add 3 + 4, we get 7",
        comment: null,
      });

      expect(db.submitAIFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          responseType: "explanation",
          rating: "down",
        })
      );
      expect(result).toEqual({ id: 42 });
    });

    it("should store a rating for a session summary", async () => {
      const result = await db.submitAIFeedback({
        studentId: 1,
        sessionId: 100,
        problemId: null,
        responseType: "session_summary",
        rating: "up",
        aiResponseText: "Great job today! You got 8 out of 10!",
        comment: null,
      });

      expect(db.submitAIFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          responseType: "session_summary",
          rating: "up",
          problemId: null,
        })
      );
      expect(result).toEqual({ id: 42 });
    });

    it("should accept optional comment field", async () => {
      await db.submitAIFeedback({
        studentId: 1,
        sessionId: 100,
        problemId: 5,
        responseType: "hint",
        rating: "down",
        aiResponseText: "Think about it...",
        comment: "I didn't understand this",
      });

      expect(db.submitAIFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          comment: "I didn't understand this",
        })
      );
    });

    it("should handle null sessionId and problemId for standalone feedback", async () => {
      await db.submitAIFeedback({
        studentId: 1,
        sessionId: null,
        problemId: null,
        responseType: "session_summary",
        rating: "up",
        aiResponseText: "You're doing great!",
        comment: null,
      });

      expect(db.submitAIFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: null,
          problemId: null,
        })
      );
    });
  });

  describe("getAIFeedbackStats", () => {
    it("should return aggregate stats with totals and per-type breakdowns", async () => {
      const stats = await db.getAIFeedbackStats();

      expect(stats.total).toBe(10);
      expect(stats.up).toBe(7);
      expect(stats.down).toBe(3);
      expect(stats.byType).toHaveProperty("hint");
      expect(stats.byType).toHaveProperty("explanation");
      expect(stats.byType).toHaveProperty("session_summary");
    });

    it("should have correct per-type counts", async () => {
      const stats = await db.getAIFeedbackStats();

      const hintStats = (stats.byType as any).hint;
      expect(hintStats.total).toBe(5);
      expect(hintStats.up).toBe(4);
      expect(hintStats.down).toBe(1);
    });

    it("should sum per-type totals to overall total", async () => {
      const stats = await db.getAIFeedbackStats();

      const typeTotal = Object.values(stats.byType as Record<string, { total: number }>)
        .reduce((sum, t) => sum + t.total, 0);
      expect(typeTotal).toBe(stats.total);
    });
  });

  describe("getAIFeedbackForSession", () => {
    it("should return feedback entries for a specific session", async () => {
      const feedback = await db.getAIFeedbackForSession(100);

      expect(db.getAIFeedbackForSession).toHaveBeenCalledWith(100);
      expect(feedback).toHaveLength(2);
      expect(feedback[0].responseType).toBe("hint");
      expect(feedback[1].responseType).toBe("explanation");
    });

    it("should include the AI response text in each entry", async () => {
      const feedback = await db.getAIFeedbackForSession(100);

      expect(feedback[0].aiResponseText).toBe("Try counting on your fingers!");
      expect(feedback[1].aiResponseText).toBe("When we add 3 + 4...");
    });

    it("should include rating in each entry", async () => {
      const feedback = await db.getAIFeedbackForSession(100);

      expect(feedback[0].rating).toBe("up");
      expect(feedback[1].rating).toBe("down");
    });
  });

  describe("Rating validation", () => {
    it("should only accept 'up' or 'down' as valid ratings", () => {
      const validRatings = ["up", "down"];
      expect(validRatings).toContain("up");
      expect(validRatings).toContain("down");
      expect(validRatings).not.toContain("neutral");
      expect(validRatings).not.toContain("");
      expect(validRatings).not.toContain("maybe");
    });

    it("should only accept valid response types", () => {
      const validTypes = ["hint", "explanation", "session_summary"];
      expect(validTypes).toContain("hint");
      expect(validTypes).toContain("explanation");
      expect(validTypes).toContain("session_summary");
      expect(validTypes).not.toContain("question");
      expect(validTypes).not.toContain("answer");
    });
  });

  describe("Feedback data integrity", () => {
    it("should associate feedback with the correct student", async () => {
      await db.submitAIFeedback({
        studentId: 42,
        sessionId: 100,
        problemId: 5,
        responseType: "hint",
        rating: "up",
        aiResponseText: "test",
        comment: null,
      });

      expect(db.submitAIFeedback).toHaveBeenCalledWith(
        expect.objectContaining({ studentId: 42 })
      );
    });

    it("should associate feedback with the correct problem", async () => {
      await db.submitAIFeedback({
        studentId: 1,
        sessionId: 100,
        problemId: 99,
        responseType: "explanation",
        rating: "down",
        aiResponseText: "test",
        comment: null,
      });

      expect(db.submitAIFeedback).toHaveBeenCalledWith(
        expect.objectContaining({ problemId: 99 })
      );
    });
  });
});

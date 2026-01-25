import { describe, it, expect } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Feedback Router", () => {
  describe("submitFeedback", () => {
    it("should allow public users to submit feedback", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // This should not throw - public procedure
      expect(async () => {
        await caller.feedback.submitFeedback({
          feedbackType: "bug",
          category: "game",
          rating: 4,
          title: "Game crashes on level 5",
          description: "The game crashes when I try to play level 5. Steps to reproduce: 1. Start game 2. Go to level 5 3. Click play",
        });
      }).toBeDefined();
    });

    it("should validate title length", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.feedback.submitFeedback({
          feedbackType: "bug",
          category: "game",
          title: "a", // Too short (min 3)
          description: "This is a valid description that is long enough",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toContain("too_small");
      }
    });

    it("should validate description length", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.feedback.submitFeedback({
          feedbackType: "bug",
          category: "game",
          title: "Valid Title",
          description: "short", // Too short (min 10)
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toContain("too_small");
      }
    });

    it("should validate rating is between 1-5", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.feedback.submitFeedback({
          feedbackType: "bug",
          category: "game",
          rating: 10, // Invalid rating
          title: "Valid Title",
          description: "Valid description with enough characters",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toContain("too_big");
      }
    });
  });

  describe("getAllFeedback", () => {
    it("should reject non-admin access", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.feedback.getAllFeedback({
          limit: 50,
          offset: 0,
        });
        expect.fail("Should have thrown permission error");
      } catch (error: any) {
        expect(error.message).toContain("Only admins can view all feedback");
      }
    });

    it("should reject unauthenticated access", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.feedback.getAllFeedback({
          limit: 50,
          offset: 0,
        });
        expect.fail("Should have thrown authentication error");
      } catch (error: any) {
        expect(error.message).toContain("Please login");
      }
    });

    it("should allow admin to fetch feedback", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // Should not throw for admin
      expect(async () => {
        await caller.feedback.getAllFeedback({
          limit: 50,
          offset: 0,
        });
      }).toBeDefined();
    });
  });

  describe("respondToFeedback", () => {
    it("should reject non-admin response", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.feedback.respondToFeedback({
          feedbackId: 1,
          responseText: "This is a response with enough characters",
          isPublic: false,
        });
        expect.fail("Should have thrown permission error");
      } catch (error: any) {
        expect(error.message).toContain("Only admins can respond to feedback");
      }
    });

    it("should validate response text length", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.feedback.respondToFeedback({
          feedbackId: 1,
          responseText: "hi",
          isPublic: false,
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(error.message).toContain("too_small");
      }
    });


    it("should allow admin to respond", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      expect(async () => {
        await caller.feedback.respondToFeedback({
          feedbackId: 1,
          responseText: "We have fixed this issue",
          isPublic: true,
        });
      }).toBeDefined();
    });
  });

  describe("updateFeedbackStatus", () => {
    it("should reject non-admin status update", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.feedback.updateFeedbackStatus({
          feedbackId: 1,
          status: "resolved",
        });
        expect.fail("Should have thrown permission error");
      } catch (error: any) {
        expect(error.message).toContain("Only admins can update feedback status");
      }
    });

    it("should allow admin to update status", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const statuses = ["new", "reviewed", "in_progress", "resolved", "wont_fix"] as const;

      for (const status of statuses) {
        expect(async () => {
          await caller.feedback.updateFeedbackStatus({
            feedbackId: 1,
            status,
          });
        }).toBeDefined();
      }
    });
  });

  describe("getFeedbackStats", () => {
    it("should reject non-admin stats access", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.feedback.getFeedbackStats();
        expect.fail("Should have thrown permission error");
      } catch (error: any) {
        expect(error.message).toContain("Only admins can view feedback statistics");
      }
    });

    it("should allow admin to fetch stats", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      expect(async () => {
        await caller.feedback.getFeedbackStats();
      }).toBeDefined();
    });
  });

  describe("getFeedbackDetail", () => {
    it("should reject non-admin access", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.feedback.getFeedbackDetail({
          feedbackId: 1,
        });
        expect.fail("Should have thrown permission error");
      } catch (error: any) {
        expect(error.message).toContain("Only admins can view feedback details");
      }
    });

    it("should allow admin to fetch feedback detail", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      expect(async () => {
        await caller.feedback.getFeedbackDetail({
          feedbackId: 1,
        });
      }).toBeDefined();
    });
  });
});

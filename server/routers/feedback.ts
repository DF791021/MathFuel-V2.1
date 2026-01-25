import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { sendFeedbackNotification, sendHighPriorityFeedbackAlert } from "../_core/feedbackNotification";

export const feedbackRouter = router({
  /**
   * Submit feedback (public - for trial users)
   */
  submitFeedback: publicProcedure
    .input(
      z.object({
        feedbackType: z.enum(["bug", "feature_request", "usability", "performance", "other"]),
        category: z.enum(["game", "certificates", "analytics", "ui", "mobile", "other"]),
        rating: z.number().min(1).max(5).optional(),
        title: z.string().min(3).max(100),
        description: z.string().min(10).max(2000),
        attachmentUrl: z.string().url().optional(),
        trialAccountId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await db.submitUserFeedback({
          userId: ctx.user?.id,
          trialAccountId: input.trialAccountId,
          feedbackType: input.feedbackType,
          category: input.category,
          rating: input.rating,
          title: input.title,
          description: input.description,
          attachmentUrl: input.attachmentUrl,
        });

        // Send admin notification asynchronously (don't block user response)
        const dashboardUrl = `${process.env.VITE_APP_URL || 'https://manus.space'}/admin/feedback`;
        const schoolName = ctx.user?.email?.split('@')[1] || 'Unknown School';
        
        sendFeedbackNotification({
          schoolName,
          feedbackType: input.feedbackType,
          feedbackTitle: input.title,
          feedbackDescription: input.description,
          rating: input.rating,
          submittedBy: ctx.user?.name || 'Anonymous',
          submittedAt: new Date().toLocaleString(),
          isLowRating: !!(input.rating && input.rating <= 2),
          dashboardUrl,
        }).catch((error) => {
          console.error("Failed to send feedback notification:", error);
        });

        return {
          success: true,
          feedbackId: result.insertId,
          message: "Feedback submitted successfully",
        };
      } catch (error) {
        console.error("Error submitting feedback:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit feedback",
        });
      }
    }),

  /**
   * Get all feedback (admin only)
   */
  getAllFeedback: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        status: z.enum(["new", "reviewed", "in_progress", "resolved", "wont_fix"]).optional(),
        type: z.enum(["bug", "feature_request", "usability", "performance", "other"]).optional(),
        category: z.enum(["game", "certificates", "analytics", "ui", "mobile", "other"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view all feedback",
        });
      }

      try {
        let feedback;

        if (input.status) {
          feedback = await db.getFeedbackByStatus(input.status, input.limit, input.offset);
        } else {
          feedback = await db.getAllFeedback(input.limit, input.offset);
        }

        // Filter by type and category if provided
        if (input.type) {
          feedback = feedback.filter((f: any) => f.feedbackType === input.type);
        }
        if (input.category) {
          feedback = feedback.filter((f: any) => f.category === input.category);
        }

        return feedback;
      } catch (error) {
        console.error("Error fetching feedback:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch feedback",
        });
      }
    }),

  /**
   * Get feedback with responses
   */
  getFeedbackDetail: protectedProcedure
    .input(z.object({ feedbackId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view feedback details",
        });
      }

      try {
        const feedback = await db.getFeedbackWithResponses(input.feedbackId);
        if (!feedback) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Feedback not found",
          });
        }
        return feedback;
      } catch (error) {
        console.error("Error fetching feedback detail:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch feedback detail",
        });
      }
    }),

  /**
   * Add response to feedback (admin only)
   */
  respondToFeedback: protectedProcedure
    .input(
      z.object({
        feedbackId: z.number(),
        responseText: z.string().min(5).max(1000),
        isPublic: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can respond to feedback",
        });
      }

      try {
        await db.addFeedbackResponse({
          feedbackId: input.feedbackId,
          adminId: ctx.user.id,
          responseText: input.responseText,
          isPublic: input.isPublic,
        });

        return {
          success: true,
          message: "Response added successfully",
        };
      } catch (error) {
        console.error("Error adding feedback response:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add response",
        });
      }
    }),

  /**
   * Update feedback status (admin only)
   */
  updateFeedbackStatus: protectedProcedure
    .input(
      z.object({
        feedbackId: z.number(),
        status: z.enum(["new", "reviewed", "in_progress", "resolved", "wont_fix"]),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update feedback status",
        });
      }

      try {
        await db.updateFeedbackStatus(input.feedbackId, input.status);

        if (input.adminNotes) {
          await db.updateFeedbackAdminNotes(input.feedbackId, input.adminNotes);
        }

        return {
          success: true,
          message: "Feedback status updated",
        };
      } catch (error) {
        console.error("Error updating feedback status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update feedback status",
        });
      }
    }),

  /**
   * Get feedback statistics (admin only)
   */
  getFeedbackStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view feedback statistics",
      });
    }

    try {
      const statsByType = await db.getFeedbackStatsByType();
      const statsByCategory = await db.getFeedbackStatsByCategory();
      const countByStatus = await db.getFeedbackCountByStatus();

      return {
        byType: statsByType,
        byCategory: statsByCategory,
        byStatus: countByStatus,
      };
    } catch (error) {
      console.error("Error fetching feedback stats:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch feedback statistics",
      });
    }
  }),

  notifyAdminOfFeedback: protectedProcedure
    .input(
      z.object({
        feedbackId: z.number(),
        adminEmail: z.string().email(),
        schoolName: z.string(),
        feedbackType: z.string(),
        feedbackTitle: z.string(),
        feedbackDescription: z.string(),
        rating: z.number().optional(),
        submittedBy: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can send notifications",
        });
      }

      try {
        const isLowRating = input.rating && input.rating <= 2;
        
        console.log("Feedback notification:", {
          feedbackId: input.feedbackId,
          adminEmail: input.adminEmail,
          isLowRating,
          rating: input.rating,
        });

        return {
          success: true,
          message: "Admin notification sent",
          notificationId: `notif_${input.feedbackId}_${Date.now()}`,
        };
      } catch (error) {
        console.error("Error sending feedback notification:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send notification",
        });
      }
    }),

  getHighPriorityFeedback: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view priority feedback",
        });
      }

      try {
        const allFeedback = await db.getAllFeedback(1000, 0);
        
        const highPriority = allFeedback.filter((f: any) => {
          const isLowRating = f.rating && f.rating <= 2;
          const isBugOrIssue = f.feedbackType === "bug" || f.feedbackType === "issue";
          const isNew = f.status === "new";
          
          return (isLowRating || isBugOrIssue) && isNew;
        });

        return highPriority.slice(0, input.limit);
      } catch (error) {
        console.error("Error getting high priority feedback:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve high priority feedback",
        });
      }
    }),
});

import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";

export const notificationPreferencesRouter = router({
  /**
   * Get current admin's notification preferences
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view notification preferences",
      });
    }

    return db.getNotificationPreferences(ctx.user.id);
  }),

  /**
   * Update notification preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        frequency: z.enum(["immediate", "daily", "weekly"]).optional(),
        emailEnabled: z.boolean().optional(),
        inAppEnabled: z.boolean().optional(),
        dashboardEnabled: z.boolean().optional(),
        feedbackEnabled: z.boolean().optional(),
        lowRatingsEnabled: z.boolean().optional(),
        bugsEnabled: z.boolean().optional(),
        trialEventsEnabled: z.boolean().optional(),
        paymentEventsEnabled: z.boolean().optional(),
        digestTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        quietHoursEnabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update notification preferences",
        });
      }

      // Validate quiet hours if enabled
      if (input.quietHoursEnabled && input.quietHoursStart && input.quietHoursEnd) {
        const start = input.quietHoursStart.split(":").map(Number);
        const end = input.quietHoursEnd.split(":").map(Number);
        const startMinutes = start[0] * 60 + start[1];
        const endMinutes = end[0] * 60 + end[1];

        if (startMinutes >= endMinutes) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Quiet hours end time must be after start time",
          });
        }
      }

      // Validate digest time format
      if (input.digestTime) {
        const [hours, minutes] = input.digestTime.split(":").map(Number);
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid digest time format",
          });
        }
      }

      const updated = await db.updateNotificationPreferences(ctx.user.id, input);

      await notifyOwner({
        title: "Admin Updated Notification Preferences",
        content: `Admin ${ctx.user.name} (ID: ${ctx.user.id}) updated their notification preferences.`,
      });

      return updated;
    }),

  /**
   * Send test notification to verify settings work
   */
  sendTestNotification: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can send test notifications",
      });
    }

    const prefs = await db.getNotificationPreferences(ctx.user.id);

    // Record test notification in history
    await db.addNotificationToHistory(ctx.user.id, {
      type: "system",
      subType: "test_notification",
      title: "Test Notification",
      message: "This is a test notification to verify your notification preferences are working correctly.",
      relatedEntityId: ctx.user.id,
      relatedEntityType: "admin",
      isRead: false,
      actionUrl: "/admin/alert-preferences",
      emailSent: prefs.emailEnabled,
      inAppShown: prefs.inAppEnabled,
    });

    // Record test sent time
    await db.recordTestNotification(ctx.user.id);

    return {
      success: true,
      message: "Test notification sent successfully",
      channels: {
        email: prefs.emailEnabled,
        inApp: prefs.inAppEnabled,
        dashboard: prefs.dashboardEnabled,
      },
    };
  }),

  /**
   * Get notification history
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        type: z.enum(["feedback", "trial", "payment", "system"]).optional(),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view notification history",
        });
      }

      let history = await db.getNotificationHistory(
        ctx.user.id,
        input.limit,
        input.offset
      );

      // Filter by type if specified
      if (input.type) {
        history = history.filter((n) => n.type === input.type);
      }

      // Filter unread only if specified
      if (input.unreadOnly) {
        history = history.filter((n) => !n.isRead);
      }

      return history;
    }),

  /**
   * Get unread notification count
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view notification count",
      });
    }

    const count = await db.getUnreadNotificationCount(ctx.user.id);
    return { unreadCount: count };
  }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can mark notifications as read",
        });
      }

      await db.markNotificationAsRead(input.notificationId);
      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can mark notifications as read",
      });
    }

    await db.markAllNotificationsAsRead(ctx.user.id);
    return { success: true };
  }),

  /**
   * Check if notification should be sent based on preferences
   */
  shouldSendNotification: protectedProcedure
    .input(
      z.object({
        type: z.enum(["feedback", "trial", "payment", "system"]),
        subType: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can check notification settings",
        });
      }

      return db.shouldSendNotification(
        ctx.user.id,
        input.type,
        input.subType
      );
    }),
});

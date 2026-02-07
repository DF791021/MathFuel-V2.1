/**
 * tRPC Admin Notification Procedures
 * Handles notifications for parents, teachers, and administrators
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getAdminUnreadNotifications,
  getAdminNotifications,
  getAdminNotificationsByType,
  markNotificationAsRead,
  markAllAdminNotificationsAsRead,
  getAdminUnreadNotificationCount,
  getAdminNotificationPreferences,
  updateAdminNotificationPreferences,
  dismissNotification,
  createAdminNotification,
} from "../notifications";
import { NOTIFICATION_TYPES } from "../../shared/notifications";

export const notificationsRouter = router({
  /**
   * Get unread notifications for current admin (latest 10)
   */
  getUnread: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }).optional())
    .query(async ({ ctx, input }) => {
      // Only admins can access notifications
      if (ctx.user.role !== "admin") {
        return [];
      }
      return getAdminUnreadNotifications(ctx.user.id, input?.limit);
    }),

  /**
   * Get all notifications for current admin with pagination
   */
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        return [];
      }
      return getAdminNotifications(ctx.user.id, input.limit, input.offset);
    }),

  /**
   * Get notifications by type
   */
  getByType: protectedProcedure
    .input(
      z.object({
        type: z.string(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        return [];
      }
      return getAdminNotificationsByType(ctx.user.id, input.type, input.limit);
    }),

  /**
   * Get unread count for current admin
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      return { count: 0 };
    }
    const count = await getAdminUnreadNotificationCount(ctx.user.id);
    return { count };
  }),

  /**
   * Mark single notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }
      await markNotificationAsRead(input.notificationId);
      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }
    await markAllAdminNotificationsAsRead(ctx.user.id);
    return { success: true };
  }),

  /**
   * Dismiss a notification
   */
  dismiss: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }
      await dismissNotification(input.notificationId);
      return { success: true };
    }),

  /**
   * Get admin notification preferences
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }
    return getAdminNotificationPreferences(ctx.user.id);
  }),

  /**
   * Update admin notification preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        inAppPayments: z.boolean().optional(),
        inAppSystemAlerts: z.boolean().optional(),
        inAppAccountChanges: z.boolean().optional(),
        emailPayments: z.boolean().optional(),
        emailSystemAlerts: z.boolean().optional(),
        emailAccountChanges: z.boolean().optional(),
        emailDigestFrequency: z.enum(["none", "daily", "weekly"]).optional(),
        quietHoursStart: z.string().optional(),
        quietHoursEnd: z.string().optional(),
        quietHoursEnabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }
      await updateAdminNotificationPreferences(ctx.user.id, input);
      return { success: true };
    }),

  /**
   * Send test notification (for testing preferences)
   */
  sendTest: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }
    await createAdminNotification({
      adminId: ctx.user.id,
      type: NOTIFICATION_TYPES.SYSTEM_ALERT,
      title: "Test Notification",
      body: "This is a test notification to verify your notification settings are working correctly.",
      linkUrl: "/notifications",
    });

    return { success: true };
  }),
});

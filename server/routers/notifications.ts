/**
 * tRPC Admin Notification Procedures
 * Handles notifications for parents, teachers, and administrators
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getUserUnreadNotifications,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  dismissNotification,
  createNotification,
} from "../notifications";

export const notificationsRouter = router({
  /**
   * Get unread notifications for current user (latest 10)
   */
  getUnread: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }).optional())
    .query(async ({ ctx, input }) => {
      return getUserUnreadNotifications(ctx.user.id, input?.limit || 10);
    }),

  /**
   * Get all notifications for current user with pagination
   */
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return getUserNotifications(ctx.user.id, input.limit, input.offset);
    }),

  /**
   * Get unread count for current user
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await getUnreadNotificationCount(ctx.user.id);
    return { count };
  }),

  /**
   * Mark single notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await markNotificationAsRead(input.notificationId);
      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await markAllNotificationsAsRead(ctx.user.id);
    return { success: true };
  }),

  /**
   * Dismiss a notification
   */
  dismiss: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await dismissNotification(input.notificationId);
      return { success: true };
    }),

  /**
   * Send test notification (for testing)
   */
  sendTest: protectedProcedure.mutation(async ({ ctx }) => {
    // Only admins can send test notifications
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    await createNotification({
      userId: ctx.user.id,
      role: "admin",
      type: "system_alert",
      title: "Test Notification",
      body: "This is a test notification to verify your notification settings are working correctly.",
      linkUrl: "/notifications",
    });

    return { success: true };
  }),
});

/**
 * Admin Notification Database Helpers
 * Handles CRUD operations for admin-only notifications
 * Uses userId + role filter (no separate adminId column)
 */

import { getDb } from "./db";
import { notifications } from "../drizzle/schema";
import { eq, and, desc, isNull } from "drizzle-orm";

export type NotificationType =
  | "challenge_completed"
  | "achievement_earned"
  | "task_assigned"
  | "task_due_soon"
  | "feedback_posted"
  | "level_up"
  | "streak_milestone"
  | "student_completed_task"
  | "student_needs_help"
  | "new_student_joined"
  | "account_change"
  | "system_alert";

export interface CreateNotificationPayload {
  userId: number;
  role: "student" | "teacher" | "admin";
  type: NotificationType;
  title: string;
  body: string;
  linkUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a new notification for a user
 */
export async function createNotification(payload: CreateNotificationPayload) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.insert(notifications).values({
      userId: payload.userId,
      role: payload.role,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      linkUrl: payload.linkUrl || null,
      metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
      createdAt: new Date(),
    });
    return result;
  } catch (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }
}

/**
 * Get unread notifications for a user
 */
export async function getUserUnreadNotifications(userId: number, limit: number = 10) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("Failed to get unread notifications:", error);
    throw error;
  }
}

/**
 * Get all notifications for a user (paginated)
 */
export async function getUserNotifications(userId: number, limit: number = 20, offset: number = 0) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  } catch (error) {
    console.error("Failed to get notifications:", error);
    throw error;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(eq(notifications.id, notificationId));
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    throw error;
  }
}

/**
 * Dismiss notification
 */
export async function dismissNotification(notificationId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .update(notifications)
      .set({ dismissedAt: new Date() })
      .where(eq(notifications.id, notificationId));
  } catch (error) {
    console.error("Failed to dismiss notification:", error);
    throw error;
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db.delete(notifications).where(eq(notifications.id, notificationId));
  } catch (error) {
    console.error("Failed to delete notification:", error);
    throw error;
  }
}

/**
 * Get notification count for a user
 */
export async function getNotificationCount(userId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select({ count: notifications.id })
      .from(notifications)
      .where(eq(notifications.userId, userId));

    return result.length;
  } catch (error) {
    console.error("Failed to get notification count:", error);
    throw error;
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select({ count: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

    return result.length;
  } catch (error) {
    console.error("Failed to get unread notification count:", error);
    throw error;
  }
}

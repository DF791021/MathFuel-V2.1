/**
 * Admin Notification Database Helpers
 * Handles CRUD operations for admin-only notifications
 * No student-facing notifications in Phase 1
 */

import { getDb } from "./db";
import { notifications, adminNotificationPreferences } from "../drizzle/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { NotificationPayload, AdminNotificationPreferencesPayload } from "../shared/notifications";

/**
 * Create a new admin notification
 */
export async function createAdminNotification(payload: NotificationPayload) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.insert(notifications).values({
      adminId: payload.adminId,
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
 * Get unread notifications for an admin
 */
export async function getAdminUnreadNotifications(adminId: number, limit: number = 10) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.adminId, adminId), isNull(notifications.readAt)))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("Failed to get unread notifications:", error);
    return [];
  }
}

/**
 * Get all notifications for an admin with pagination
 */
export async function getAdminNotifications(
  adminId: number,
  limit: number = 20,
  offset: number = 0
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.adminId, adminId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  } catch (error) {
    console.error("Failed to get notifications:", error);
    return [];
  }
}

/**
 * Get notifications by type for an admin
 */
export async function getAdminNotificationsByType(
  adminId: number,
  type: string,
  limit: number = 20
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.adminId, adminId), eq(notifications.type, type)))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("Failed to get notifications by type:", error);
    return [];
  }
}

/**
 * Get unread notification count for an admin
 */
export async function getAdminUnreadNotificationCount(adminId: number): Promise<number> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.adminId, adminId), isNull(notifications.readAt)));
    return result.length;
  } catch (error) {
    console.error("Failed to get unread count:", error);
    return 0;
  }
}

/**
 * Mark a notification as read
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
 * Mark all notifications as read for an admin
 */
export async function markAllAdminNotificationsAsRead(adminId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.adminId, adminId), isNull(notifications.readAt)));
  } catch (error) {
    console.error("Failed to mark all as read:", error);
    throw error;
  }
}

/**
 * Dismiss a notification
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
 * Get or create admin notification preferences
 */
export async function getAdminNotificationPreferences(adminId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    let prefs = await db
      .select()
      .from(adminNotificationPreferences)
      .where(eq(adminNotificationPreferences.adminId, adminId));

    if (prefs.length === 0) {
      // Create default preferences
      await db.insert(adminNotificationPreferences).values({
        adminId,
        inAppPayments: true,
        inAppSystemAlerts: true,
        inAppAccountChanges: true,
        emailPayments: true,
        emailSystemAlerts: true,
        emailAccountChanges: false,
        emailDigestFrequency: "daily",
        quietHoursEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      prefs = await db
        .select()
        .from(adminNotificationPreferences)
        .where(eq(adminNotificationPreferences.adminId, adminId));
    }

    return prefs[0] || null;
  } catch (error) {
    console.error("Failed to get notification preferences:", error);
    return null;
  }
}

/**
 * Update admin notification preferences
 */
export async function updateAdminNotificationPreferences(
  adminId: number,
  updates: AdminNotificationPreferencesPayload
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .update(adminNotificationPreferences)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(adminNotificationPreferences.adminId, adminId));
  } catch (error) {
    console.error("Failed to update notification preferences:", error);
    throw error;
  }
}

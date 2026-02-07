/**
 * Admin Notification System Tests
 */

import { describe, it, expect } from "vitest";
import { NOTIFICATION_TYPES } from "../shared/notifications";

describe("Admin Notification System", () => {
  describe("Notification Types", () => {
    it("should have payment notification types", () => {
      expect(NOTIFICATION_TYPES.PAYMENT_RECEIVED).toBe("payment_received");
      expect(NOTIFICATION_TYPES.PAYMENT_FAILED).toBe("payment_failed");
      expect(NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRING).toBe("subscription_expiring");
      expect(NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED).toBe("subscription_renewed");
    });

    it("should have account notification types", () => {
      expect(NOTIFICATION_TYPES.ACCOUNT_CREATED).toBe("account_created");
      expect(NOTIFICATION_TYPES.ACCOUNT_UPDATED).toBe("account_updated");
      expect(NOTIFICATION_TYPES.PASSWORD_CHANGED).toBe("password_changed");
      expect(NOTIFICATION_TYPES.EMAIL_CHANGED).toBe("email_changed");
    });

    it("should have system notification types", () => {
      expect(NOTIFICATION_TYPES.SYSTEM_ALERT).toBe("system_alert");
      expect(NOTIFICATION_TYPES.MAINTENANCE_SCHEDULED).toBe("maintenance_scheduled");
      expect(NOTIFICATION_TYPES.SECURITY_ALERT).toBe("security_alert");
      expect(NOTIFICATION_TYPES.USAGE_LIMIT_WARNING).toBe("usage_limit_warning");
    });

    it("should have trial notification types", () => {
      expect(NOTIFICATION_TYPES.TRIAL_STARTING).toBe("trial_starting");
      expect(NOTIFICATION_TYPES.TRIAL_EXPIRING).toBe("trial_expiring");
      expect(NOTIFICATION_TYPES.TRIAL_EXPIRED).toBe("trial_expired");
      expect(NOTIFICATION_TYPES.TRIAL_CONVERTED).toBe("trial_converted");
    });

    it("should have admin-specific notification types", () => {
      expect(NOTIFICATION_TYPES.NEW_FEEDBACK).toBe("new_feedback");
      expect(NOTIFICATION_TYPES.SUPPORT_TICKET_CREATED).toBe("support_ticket_created");
      expect(NOTIFICATION_TYPES.SUPPORT_TICKET_RESOLVED).toBe("support_ticket_resolved");
    });

    it("should not have student notification types", () => {
      const typeKeys = Object.keys(NOTIFICATION_TYPES);
      const studentTypes = [
        "achievement_earned",
        "level_up",
        "challenge_completed",
        "streak_milestone",
        "student_completed_task",
      ];

      studentTypes.forEach((type) => {
        expect(typeKeys).not.toContain(type);
      });
    });

    it("should have correct total notification types", () => {
      const typeCount = Object.keys(NOTIFICATION_TYPES).length;
      expect(typeCount).toBeGreaterThan(20);
    });
  });

  describe("Notification System Philosophy", () => {
    it("should be admin-only for Phase 1", () => {
      const types = Object.values(NOTIFICATION_TYPES);
      const studentFacingTypes = types.filter((t) =>
        ["achievement", "level", "challenge", "streak", "completed", "needs_help"].some((keyword) =>
          t.includes(keyword)
        )
      );

      expect(studentFacingTypes.length).toBe(0);
    });

    it("should focus on adult notifications", () => {
      const types = Object.values(NOTIFICATION_TYPES);

      const hasPaymentNotifications = types.some((t) => t.includes("payment") || t.includes("subscription"));
      const hasAccountNotifications = types.some((t) => t.includes("account") || t.includes("password"));
      const hasSystemNotifications = types.some((t) => t.includes("system") || t.includes("maintenance"));
      const hasTrialNotifications = types.some((t) => t.includes("trial"));

      expect(hasPaymentNotifications).toBe(true);
      expect(hasAccountNotifications).toBe(true);
      expect(hasSystemNotifications).toBe(true);
      expect(hasTrialNotifications).toBe(true);
    });
  });
});

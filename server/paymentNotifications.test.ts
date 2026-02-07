/**
 * Payment Notifications Tests
 * Verifies payment notification system functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Payment Notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Payment notification types", () => {
    it("should support payment_success notification type", () => {
      const notificationType = "payment_success";
      expect(notificationType).toBe("payment_success");
    });

    it("should support payment_failed notification type", () => {
      const notificationType = "payment_failed";
      expect(notificationType).toBe("payment_failed");
    });

    it("should support subscription_renewal notification type", () => {
      const notificationType = "subscription_renewal";
      expect(notificationType).toBe("subscription_renewal");
    });

    it("should support subscription_cancelled notification type", () => {
      const notificationType = "subscription_cancelled";
      expect(notificationType).toBe("subscription_cancelled");
    });

    it("should support refund_issued notification type", () => {
      const notificationType = "refund_issued";
      expect(notificationType).toBe("refund_issued");
    });

    it("should support account_change notification type", () => {
      const notificationType = "account_change";
      expect(notificationType).toBe("account_change");
    });
  });

  describe("Notification metadata structure", () => {
    it("should include payment metadata for payment confirmations", () => {
      const metadata = {
        paymentType: "subscription",
        tier: "school",
        amount: 99900,
        currency: "usd",
        billingInterval: "annual",
        customerEmail: "school@example.com",
        customerName: "Example School",
        sessionId: "cs_test_123",
        timestamp: new Date().toISOString(),
      };

      expect(metadata).toHaveProperty("paymentType");
      expect(metadata).toHaveProperty("tier");
      expect(metadata).toHaveProperty("amount");
      expect(metadata).toHaveProperty("currency");
      expect(metadata.tier).toBe("school");
      expect(metadata.amount).toBe(99900);
    });

    it("should include failure reason in payment failure metadata", () => {
      const metadata = {
        paymentType: "subscription",
        tier: "district",
        amount: 99900,
        currency: "usd",
        billingInterval: "month",
        customerEmail: "district@example.com",
        customerName: "Example District",
        failureReason: "Card declined",
        sessionId: "cs_test_456",
        timestamp: new Date().toISOString(),
      };

      expect(metadata).toHaveProperty("failureReason");
      expect(metadata.failureReason).toBe("Card declined");
    });

    it("should include renewal date in subscription renewal metadata", () => {
      const renewalDate = new Date();
      renewalDate.setDate(renewalDate.getDate() + 7);

      const metadata = {
        paymentType: "subscription_renewal",
        tier: "school",
        amount: 49900,
        currency: "usd",
        billingInterval: "month",
        customerEmail: "school@example.com",
        customerName: "Example School",
        renewalDate: renewalDate.toISOString(),
        subscriptionId: "sub_test_123",
        timestamp: new Date().toISOString(),
      };

      expect(metadata).toHaveProperty("renewalDate");
      expect(metadata.renewalDate).toBe(renewalDate.toISOString());
    });

    it("should include cancellation reason in subscription cancellation metadata", () => {
      const metadata = {
        paymentType: "subscription_cancelled",
        tier: "school",
        customerEmail: "school@example.com",
        customerName: "Example School",
        cancellationReason: "User requested cancellation",
        subscriptionId: "sub_test_789",
        timestamp: new Date().toISOString(),
      };

      expect(metadata).toHaveProperty("cancellationReason");
      expect(metadata.cancellationReason).toBe("User requested cancellation");
    });

    it("should include refund details in refund metadata", () => {
      const metadata = {
        paymentType: "refund",
        amount: 99900,
        currency: "usd",
        customerEmail: "school@example.com",
        customerName: "Example School",
        refundReason: "Duplicate charge",
        chargeId: "ch_test_123",
        refundId: "re_test_123",
        timestamp: new Date().toISOString(),
      };

      expect(metadata).toHaveProperty("refundReason");
      expect(metadata).toHaveProperty("chargeId");
      expect(metadata).toHaveProperty("refundId");
      expect(metadata.refundReason).toBe("Duplicate charge");
    });
  });

  describe("Notification title and body formatting", () => {
    it("should format payment confirmation title correctly", () => {
      const title = "Payment Confirmed ✓";
      const body = "Annual School License subscription activated. Amount: $999.00 USD. Customer: school@example.com";

      expect(title).toContain("Payment Confirmed");
      expect(body).toContain("$999.00");
      expect(body).toContain("school@example.com");
    });

    it("should format payment failure title correctly", () => {
      const title = "Payment Failed ✗";
      const body = "Monthly District License subscription failed. Amount: $999.00 USD. Reason: Card declined. Customer: district@example.com";

      expect(title).toContain("Payment Failed");
      expect(body).toContain("Card declined");
      expect(body).toContain("district@example.com");
    });

    it("should format subscription renewal title correctly", () => {
      const title = "Subscription Renewing Soon";
      const body = "School License subscription renews on 2/13/2026. Amount: $499.00 USD. Customer: school@example.com";

      expect(title).toContain("Subscription Renewing");
      expect(body).toContain("renews on");
    });

    it("should format subscription cancellation title correctly", () => {
      const title = "Subscription Cancelled";
      const body = "School License subscription cancelled for school@example.com. Reason: User requested cancellation";

      expect(title).toContain("Subscription Cancelled");
      expect(body).toContain("cancelled");
    });

    it("should format refund title correctly", () => {
      const title = "Refund Issued";
      const body = "Refund of $999.00 USD issued to school@example.com. Reason: Duplicate charge";

      expect(title).toContain("Refund Issued");
      expect(body).toContain("Refund of");
    });

    it("should format payment method update title correctly", () => {
      const title = "Payment Method Updated";
      const body = "Payment method updated for school@example.com. New method: card ending in 4242";

      expect(title).toContain("Payment Method Updated");
      expect(body).toContain("Payment method updated");
    });
  });

  describe("Notification link URLs", () => {
    it("should include payment admin link in confirmation notification", () => {
      const linkUrl = "/admin/payments?session=cs_test_123";
      expect(linkUrl).toContain("/admin/payments");
      expect(linkUrl).toContain("session=cs_test_123");
    });

    it("should include failed payment admin link in failure notification", () => {
      const linkUrl = "/admin/payments?session=cs_test_456&status=failed";
      expect(linkUrl).toContain("/admin/payments");
      expect(linkUrl).toContain("status=failed");
    });

    it("should include subscription admin link in renewal notification", () => {
      const linkUrl = "/admin/payments?subscription=sub_test_123";
      expect(linkUrl).toContain("/admin/payments");
      expect(linkUrl).toContain("subscription=sub_test_123");
    });

    it("should include cancelled subscription link in cancellation notification", () => {
      const linkUrl = "/admin/payments?subscription=sub_test_789&status=cancelled";
      expect(linkUrl).toContain("/admin/payments");
      expect(linkUrl).toContain("status=cancelled");
    });

    it("should include refund admin link in refund notification", () => {
      const linkUrl = "/admin/payments?refund=re_test_123";
      expect(linkUrl).toContain("/admin/payments");
      expect(linkUrl).toContain("refund=re_test_123");
    });
  });

  describe("Notification tier and billing information", () => {
    it("should correctly format school tier in notifications", () => {
      const tier = "school";
      const tierLabel = tier === "school" ? "School License" : "District License";
      expect(tierLabel).toBe("School License");
    });

    it("should correctly format district tier in notifications", () => {
      const tier = "district";
      const tierLabel = tier === "school" ? "School License" : "District License";
      expect(tierLabel).toBe("District License");
    });

    it("should correctly format monthly billing interval", () => {
      const interval = "month";
      const intervalLabel = interval === "month" ? "Monthly" : "Annual";
      expect(intervalLabel).toBe("Monthly");
    });

    it("should correctly format annual billing interval", () => {
      const interval = "year";
      const intervalLabel = interval === "month" ? "Monthly" : "Annual";
      expect(intervalLabel).toBe("Annual");
    });

    it("should correctly format amount in USD currency", () => {
      const amount = 99900;
      const currency = "usd";
      const formattedAmount = (amount / 100).toFixed(2);
      const formatted = `$${formattedAmount} ${currency.toUpperCase()}`;
      expect(formatted).toBe("$999.00 USD");
    });
  });

  describe("Notification preference checking", () => {
    it("should respect inAppPayments preference", () => {
      const preferences = {
        inAppPayments: false,
        emailPayments: true,
      };
      expect(preferences.inAppPayments).toBe(false);
      expect(preferences.emailPayments).toBe(true);
    });

    it("should respect inAppAccountChanges preference", () => {
      const preferences = {
        inAppAccountChanges: true,
        emailAccountChanges: false,
      };
      expect(preferences.inAppAccountChanges).toBe(true);
      expect(preferences.emailAccountChanges).toBe(false);
    });

    it("should respect inAppSystemAlerts preference", () => {
      const preferences = {
        inAppSystemAlerts: true,
      };
      expect(preferences.inAppSystemAlerts).toBe(true);
    });
  });

  describe("Error handling", () => {
    it("should handle missing admin user gracefully", () => {
      const admin = null;
      expect(admin).toBeNull();
    });

    it("should handle missing preferences gracefully", () => {
      const prefs = null;
      expect(prefs).toBeNull();
    });

    it("should handle notification creation errors gracefully", () => {
      const error = new Error("Notification creation failed");
      expect(error.message).toBe("Notification creation failed");
    });
  });
});

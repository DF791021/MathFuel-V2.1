/**
 * Payment Notification Helpers
 * Handles creating and sending notifications for payment events
 * Integrates with the admin notification system
 */

import { createAdminNotification, getAdminNotificationPreferences } from "./notifications";
import { NotificationPayload } from "../shared/notifications";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Get the admin user (project owner) for sending notifications
 * In MathFuel, the owner is the school/district administrator
 */
export async function getAdminUser() {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get the owner user - typically the first admin or the account owner
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);

    return adminUsers[0] || null;
  } catch (error) {
    console.error("Failed to get admin user:", error);
    return null;
  }
}

/**
 * Send payment confirmation notification
 * Called when a payment is successfully processed
 */
export async function sendPaymentConfirmationNotification(
  paymentData: {
    amount: number;
    currency: string;
    tier: "school" | "district";
    billingInterval: "month" | "year";
    customerEmail: string;
    customerName?: string;
    sessionId: string;
  }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      console.warn("No admin user found for payment notification");
      return;
    }

    const prefs = await getAdminNotificationPreferences(admin.id);
    if (!prefs?.inAppPayments) {
      console.log("Admin has disabled payment notifications");
      return;
    }

    const formattedAmount = (paymentData.amount / 100).toFixed(2);
    const tierLabel = paymentData.tier === "school" ? "School License" : "District License";
    const intervalLabel = paymentData.billingInterval === "month" ? "Monthly" : "Annual";

    const notification: NotificationPayload = {
      adminId: admin.id,
      type: "payment_success",
      title: "Payment Confirmed ✓",
      body: `${intervalLabel} ${tierLabel} subscription activated. Amount: $${formattedAmount} ${paymentData.currency.toUpperCase()}. Customer: ${paymentData.customerEmail}`,
      linkUrl: `/admin/payments?session=${paymentData.sessionId}`,
      metadata: {
        paymentType: "subscription",
        tier: paymentData.tier,
        amount: paymentData.amount,
        currency: paymentData.currency,
        billingInterval: paymentData.billingInterval,
        customerEmail: paymentData.customerEmail,
        customerName: paymentData.customerName || "Unknown",
        sessionId: paymentData.sessionId,
        timestamp: new Date().toISOString(),
      },
    };

    await createAdminNotification(notification);
    console.log(`Payment confirmation notification sent to admin ${admin.id}`);
  } catch (error) {
    console.error("Failed to send payment confirmation notification:", error);
    // Don't throw - payment should succeed even if notification fails
  }
}

/**
 * Send payment failure notification
 * Called when a payment fails or is declined
 */
export async function sendPaymentFailureNotification(
  paymentData: {
    amount: number;
    currency: string;
    tier: "school" | "district";
    billingInterval: "month" | "year";
    customerEmail: string;
    customerName?: string;
    failureReason: string;
    sessionId: string;
  }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      console.warn("No admin user found for payment failure notification");
      return;
    }

    const prefs = await getAdminNotificationPreferences(admin.id);
    if (!prefs?.inAppPayments) {
      console.log("Admin has disabled payment notifications");
      return;
    }

    const formattedAmount = (paymentData.amount / 100).toFixed(2);
    const tierLabel = paymentData.tier === "school" ? "School License" : "District License";
    const intervalLabel = paymentData.billingInterval === "month" ? "Monthly" : "Annual";

    const notification: NotificationPayload = {
      adminId: admin.id,
      type: "payment_failed",
      title: "Payment Failed ✗",
      body: `${intervalLabel} ${tierLabel} subscription failed. Amount: $${formattedAmount} ${paymentData.currency.toUpperCase()}. Reason: ${paymentData.failureReason}. Customer: ${paymentData.customerEmail}`,
      linkUrl: `/admin/payments?session=${paymentData.sessionId}&status=failed`,
      metadata: {
        paymentType: "subscription",
        tier: paymentData.tier,
        amount: paymentData.amount,
        currency: paymentData.currency,
        billingInterval: paymentData.billingInterval,
        customerEmail: paymentData.customerEmail,
        customerName: paymentData.customerName || "Unknown",
        failureReason: paymentData.failureReason,
        sessionId: paymentData.sessionId,
        timestamp: new Date().toISOString(),
      },
    };

    await createAdminNotification(notification);
    console.log(`Payment failure notification sent to admin ${admin.id}`);
  } catch (error) {
    console.error("Failed to send payment failure notification:", error);
  }
}

/**
 * Send subscription renewal notification
 * Called when a subscription is about to renew
 */
export async function sendSubscriptionRenewalNotification(
  paymentData: {
    amount: number;
    currency: string;
    tier: "school" | "district";
    billingInterval: "month" | "year";
    customerEmail: string;
    customerName?: string;
    renewalDate: Date;
    subscriptionId: string;
  }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      console.warn("No admin user found for subscription renewal notification");
      return;
    }

    const prefs = await getAdminNotificationPreferences(admin.id);
    if (!prefs?.inAppPayments) {
      console.log("Admin has disabled payment notifications");
      return;
    }

    const formattedAmount = (paymentData.amount / 100).toFixed(2);
    const tierLabel = paymentData.tier === "school" ? "School License" : "District License";
    const renewalDateStr = paymentData.renewalDate.toLocaleDateString();

    const notification: NotificationPayload = {
      adminId: admin.id,
      type: "subscription_renewal",
      title: "Subscription Renewing Soon",
      body: `${tierLabel} subscription renews on ${renewalDateStr}. Amount: $${formattedAmount} ${paymentData.currency.toUpperCase()}. Customer: ${paymentData.customerEmail}`,
      linkUrl: `/admin/payments?subscription=${paymentData.subscriptionId}`,
      metadata: {
        paymentType: "subscription_renewal",
        tier: paymentData.tier,
        amount: paymentData.amount,
        currency: paymentData.currency,
        billingInterval: paymentData.billingInterval,
        customerEmail: paymentData.customerEmail,
        customerName: paymentData.customerName || "Unknown",
        renewalDate: paymentData.renewalDate.toISOString(),
        subscriptionId: paymentData.subscriptionId,
        timestamp: new Date().toISOString(),
      },
    };

    await createAdminNotification(notification);
    console.log(`Subscription renewal notification sent to admin ${admin.id}`);
  } catch (error) {
    console.error("Failed to send subscription renewal notification:", error);
  }
}

/**
 * Send subscription cancellation notification
 * Called when a subscription is cancelled
 */
export async function sendSubscriptionCancellationNotification(
  paymentData: {
    tier: "school" | "district";
    customerEmail: string;
    customerName?: string;
    cancellationReason?: string;
    subscriptionId: string;
  }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      console.warn("No admin user found for subscription cancellation notification");
      return;
    }

    const prefs = await getAdminNotificationPreferences(admin.id);
    if (!prefs?.inAppPayments) {
      console.log("Admin has disabled payment notifications");
      return;
    }

    const tierLabel = paymentData.tier === "school" ? "School License" : "District License";
    const reasonText = paymentData.cancellationReason
      ? ` Reason: ${paymentData.cancellationReason}`
      : "";

    const notification: NotificationPayload = {
      adminId: admin.id,
      type: "subscription_cancelled",
      title: "Subscription Cancelled",
      body: `${tierLabel} subscription cancelled for ${paymentData.customerEmail}.${reasonText}`,
      linkUrl: `/admin/payments?subscription=${paymentData.subscriptionId}&status=cancelled`,
      metadata: {
        paymentType: "subscription_cancelled",
        tier: paymentData.tier,
        customerEmail: paymentData.customerEmail,
        customerName: paymentData.customerName || "Unknown",
        cancellationReason: paymentData.cancellationReason || "Not specified",
        subscriptionId: paymentData.subscriptionId,
        timestamp: new Date().toISOString(),
      },
    };

    await createAdminNotification(notification);
    console.log(`Subscription cancellation notification sent to admin ${admin.id}`);
  } catch (error) {
    console.error("Failed to send subscription cancellation notification:", error);
  }
}

/**
 * Send refund notification
 * Called when a refund is issued
 */
export async function sendRefundNotification(
  paymentData: {
    amount: number;
    currency: string;
    customerEmail: string;
    customerName?: string;
    refundReason: string;
    chargeId: string;
    refundId: string;
  }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      console.warn("No admin user found for refund notification");
      return;
    }

    const prefs = await getAdminNotificationPreferences(admin.id);
    if (!prefs?.inAppPayments) {
      console.log("Admin has disabled payment notifications");
      return;
    }

    const formattedAmount = (paymentData.amount / 100).toFixed(2);

    const notification: NotificationPayload = {
      adminId: admin.id,
      type: "refund_issued",
      title: "Refund Issued",
      body: `Refund of $${formattedAmount} ${paymentData.currency.toUpperCase()} issued to ${paymentData.customerEmail}. Reason: ${paymentData.refundReason}`,
      linkUrl: `/admin/payments?refund=${paymentData.refundId}`,
      metadata: {
        paymentType: "refund",
        amount: paymentData.amount,
        currency: paymentData.currency,
        customerEmail: paymentData.customerEmail,
        customerName: paymentData.customerName || "Unknown",
        refundReason: paymentData.refundReason,
        chargeId: paymentData.chargeId,
        refundId: paymentData.refundId,
        timestamp: new Date().toISOString(),
      },
    };

    await createAdminNotification(notification);
    console.log(`Refund notification sent to admin ${admin.id}`);
  } catch (error) {
    console.error("Failed to send refund notification:", error);
  }
}

/**
 * Send payment method update notification
 * Called when payment method is updated
 */
export async function sendPaymentMethodUpdateNotification(
  paymentData: {
    customerEmail: string;
    customerName?: string;
    paymentMethodType: string;
    last4?: string;
  }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      console.warn("No admin user found for payment method notification");
      return;
    }

    const prefs = await getAdminNotificationPreferences(admin.id);
    if (!prefs?.inAppAccountChanges) {
      console.log("Admin has disabled account change notifications");
      return;
    }

    const methodLabel = paymentData.last4
      ? `${paymentData.paymentMethodType} ending in ${paymentData.last4}`
      : paymentData.paymentMethodType;

    const notification: NotificationPayload = {
      adminId: admin.id,
      type: "account_change",
      title: "Payment Method Updated",
      body: `Payment method updated for ${paymentData.customerEmail}. New method: ${methodLabel}`,
      linkUrl: `/admin/payments?customer=${paymentData.customerEmail}`,
      metadata: {
        eventType: "payment_method_updated",
        customerEmail: paymentData.customerEmail,
        customerName: paymentData.customerName || "Unknown",
        paymentMethodType: paymentData.paymentMethodType,
        last4: paymentData.last4 || "N/A",
        timestamp: new Date().toISOString(),
      },
    };

    await createAdminNotification(notification);
    console.log(`Payment method update notification sent to admin ${admin.id}`);
  } catch (error) {
    console.error("Failed to send payment method notification:", error);
  }
}

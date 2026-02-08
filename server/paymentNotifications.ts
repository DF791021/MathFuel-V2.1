/**
 * Payment Notification Helpers
 * Handles creating and sending notifications for payment events
 * Integrates with the admin notification system
 */

import { createNotification, type NotificationType } from "./notifications";
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

    const formattedAmount = (paymentData.amount / 100).toFixed(2);
    const tierLabel = paymentData.tier === "school" ? "School License" : "District License";
    const intervalLabel = paymentData.billingInterval === "month" ? "Monthly" : "Annual";

    const notificationType: NotificationType = "account_change";

    await createNotification({
      userId: admin.id,
      role: "admin",
      type: notificationType,
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
        sessionId: paymentData.sessionId,
      },
    });

    console.log(`Payment confirmation notification sent to admin ${admin.id}`);
  } catch (error) {
    console.error("Failed to send payment confirmation notification:", error);
  }
}

/**
 * Send payment failure notification
 * Called when a payment fails
 */
export async function sendPaymentFailureNotification(
  paymentData: {
    amount: number;
    currency: string;
    customerEmail: string;
    customerName?: string;
    reason: string;
    sessionId: string;
  }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      console.warn("No admin user found for payment notification");
      return;
    }

    const formattedAmount = (paymentData.amount / 100).toFixed(2);
    const notificationType: NotificationType = "system_alert";

    await createNotification({
      userId: admin.id,
      role: "admin",
      type: notificationType,
      title: "Payment Failed ⚠️",
      body: `Payment failed for ${paymentData.customerEmail}. Amount: $${formattedAmount} ${paymentData.currency.toUpperCase()}. Reason: ${paymentData.reason}. Action required.`,
      linkUrl: `/admin/payments?session=${paymentData.sessionId}&status=failed`,
      metadata: {
        paymentType: "failed",
        amount: paymentData.amount,
        currency: paymentData.currency,
        customerEmail: paymentData.customerEmail,
        reason: paymentData.reason,
        sessionId: paymentData.sessionId,
      },
    });

    console.log(`Payment failure notification sent to admin ${admin.id}`);
  } catch (error) {
    console.error("Failed to send payment failure notification:", error);
  }
}

/**
 * Send subscription renewal notification
 * Called when a subscription is renewed
 */
export async function sendSubscriptionRenewalNotification(
  subscriptionData: {
    subscriptionId: string;
    amount: number;
    currency: string;
    customerEmail: string;
    nextBillingDate: Date;
  }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      console.warn("No admin user found for payment notification");
      return;
    }

    const formattedAmount = (subscriptionData.amount / 100).toFixed(2);
    const notificationType: NotificationType = "account_change";

    await createNotification({
      userId: admin.id,
      role: "admin",
      type: notificationType,
      title: "Subscription Renewed ✓",
      body: `Subscription renewed for ${subscriptionData.customerEmail}. Amount: $${formattedAmount} ${subscriptionData.currency.toUpperCase()}. Next billing: ${subscriptionData.nextBillingDate.toLocaleDateString()}`,
      linkUrl: `/admin/subscriptions?id=${subscriptionData.subscriptionId}`,
      metadata: {
        paymentType: "renewal",
        subscriptionId: subscriptionData.subscriptionId,
        amount: subscriptionData.amount,
        currency: subscriptionData.currency,
        customerEmail: subscriptionData.customerEmail,
        nextBillingDate: subscriptionData.nextBillingDate.toISOString(),
      },
    });

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
  subscriptionData: {
    subscriptionId: string;
    customerEmail: string;
    reason?: string;
  }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      console.warn("No admin user found for payment notification");
      return;
    }

    const notificationType: NotificationType = "account_change";
    const reasonText = subscriptionData.reason ? ` Reason: ${subscriptionData.reason}` : "";

    await createNotification({
      userId: admin.id,
      role: "admin",
      type: notificationType,
      title: "Subscription Cancelled",
      body: `Subscription cancelled for ${subscriptionData.customerEmail}.${reasonText}`,
      linkUrl: `/admin/subscriptions?id=${subscriptionData.subscriptionId}`,
      metadata: {
        paymentType: "cancellation",
        subscriptionId: subscriptionData.subscriptionId,
        customerEmail: subscriptionData.customerEmail,
        reason: subscriptionData.reason,
      },
    });

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
  refundData: {
    refundId: string;
    amount: number;
    currency: string;
    customerEmail: string;
    reason: string;
  }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      console.warn("No admin user found for payment notification");
      return;
    }

    const formattedAmount = (refundData.amount / 100).toFixed(2);
    const notificationType: NotificationType = "system_alert";

    await createNotification({
      userId: admin.id,
      role: "admin",
      type: notificationType,
      title: "Refund Issued",
      body: `Refund issued to ${refundData.customerEmail}. Amount: $${formattedAmount} ${refundData.currency.toUpperCase()}. Reason: ${refundData.reason}`,
      linkUrl: `/admin/refunds?id=${refundData.refundId}`,
      metadata: {
        paymentType: "refund",
        refundId: refundData.refundId,
        amount: refundData.amount,
        currency: refundData.currency,
        customerEmail: refundData.customerEmail,
        reason: refundData.reason,
      },
    });

    console.log(`Refund notification sent to admin ${admin.id}`);
  } catch (error) {
    console.error("Failed to send refund notification:", error);
  }
}

/**
 * Send payment method update notification
 * Called when a payment method is updated
 */
export async function sendPaymentMethodUpdateNotification(
  updateData: {
    customerEmail: string;
    cardLast4?: string;
  }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      console.warn("No admin user found for payment notification");
      return;
    }

    const notificationType: NotificationType = "account_change";
    const cardText = updateData.cardLast4 ? ` (ending in ${updateData.cardLast4})` : "";

    await createNotification({
      userId: admin.id,
      role: "admin",
      type: notificationType,
      title: "Payment Method Updated",
      body: `Payment method updated for ${updateData.customerEmail}${cardText}`,
      linkUrl: `/admin/customers?email=${updateData.customerEmail}`,
      metadata: {
        paymentType: "method_update",
        customerEmail: updateData.customerEmail,
        cardLast4: updateData.cardLast4,
      },
    });

    console.log(`Payment method update notification sent to admin ${admin.id}`);
  } catch (error) {
    console.error("Failed to send payment method update notification:", error);
  }
}

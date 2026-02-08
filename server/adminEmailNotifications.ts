/**
 * Admin Email Notifications Service
 * Sends transactional emails to administrators
 */

import { sendEmail } from "./_core/email";
import {
  accountCreatedEmail,
  paymentConfirmationEmail,
  paymentFailedEmail,
  subscriptionRenewalEmail,
  systemAlertEmail,
  platformUpdateEmail,
} from "./emailTemplates/adminEmailTemplates";
import { getDb } from "./db";

export interface SendAdminEmailOptions {
  adminEmail: string;
  adminName: string;
  schoolName?: string;
  type: "account_created" | "payment_confirmed" | "payment_failed" | "subscription_renewal" | "system_alert" | "platform_update";
  data?: Record<string, any>;
}

/**
 * Send admin email notification
 */
export async function sendAdminEmail(options: SendAdminEmailOptions): Promise<boolean> {
  const { adminEmail, adminName, schoolName, type, data = {} } = options;

  let subject = "";
  let html = "";

  const context = {
    adminName,
    schoolName: schoolName || "MathFuel",
    date: new Date().toLocaleDateString(),
  };

  try {
    switch (type) {
      case "account_created":
        subject = "Welcome to MathFuel";
        html = accountCreatedEmail(context);
        break;

      case "payment_confirmed":
        subject = `Payment Confirmed - Order #${data.orderId}`;
        html = paymentConfirmationEmail({
          ...context,
          amount: data.amount || "$0.00",
          orderId: data.orderId || "N/A",
          date: data.date || context.date,
        });
        break;

      case "payment_failed":
        subject = `Payment Issue - Order #${data.orderId}`;
        html = paymentFailedEmail({
          ...context,
          reason: data.reason || "Unknown error",
          orderId: data.orderId || "N/A",
        });
        break;

      case "subscription_renewal":
        subject = "Subscription Renewal Reminder";
        html = subscriptionRenewalEmail({
          ...context,
          renewalDate: data.renewalDate || context.date,
          amount: data.amount || "$0.00",
        });
        break;

      case "system_alert":
        subject = `System Alert: ${data.title || "Important Notice"}`;
        html = systemAlertEmail({
          ...context,
          title: data.title || "System Alert",
          message: data.message || "An important system event has occurred.",
          severity: data.severity || "info",
        });
        break;

      case "platform_update":
        subject = `✨ Platform Update: ${data.title || "New Features"}`;
        html = platformUpdateEmail({
          ...context,
          title: data.title || "Platform Update",
          description: data.description || "We've made improvements to MathFuel.",
          features: data.features || [],
        });
        break;

      default:
        console.warn("[AdminEmail] Unknown email type:", type);
        return false;
    }

    // Send email
    const result = await sendEmail({
      to: adminEmail,
      subject,
      html,
    });

    // Log email send in database
    if (result) {
      try {
        const db = getDb();
        if (db) {
          // Log to email_sends table if available
          console.log("[AdminEmail] Email sent successfully", {
            to: adminEmail,
            type,
            subject,
          });
        }
      } catch (error) {
        console.error("[AdminEmail] Failed to log email send:", error);
      }
    }

    return result;
  } catch (error) {
    console.error("[AdminEmail] Error sending email:", {
      to: adminEmail,
      type,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return false;
  }
}

/**
 * Send account created email
 */
export async function notifyAccountCreated(adminEmail: string, adminName: string, schoolName?: string): Promise<boolean> {
  return sendAdminEmail({
    adminEmail,
    adminName,
    schoolName,
    type: "account_created",
  });
}

/**
 * Send payment confirmation email
 */
export async function notifyPaymentConfirmed(
  adminEmail: string,
  adminName: string,
  orderId: string,
  amount: string,
  schoolName?: string
): Promise<boolean> {
  return sendAdminEmail({
    adminEmail,
    adminName,
    schoolName,
    type: "payment_confirmed",
    data: {
      orderId,
      amount,
      date: new Date().toLocaleDateString(),
    },
  });
}

/**
 * Send payment failed email
 */
export async function notifyPaymentFailed(
  adminEmail: string,
  adminName: string,
  orderId: string,
  reason: string,
  schoolName?: string
): Promise<boolean> {
  return sendAdminEmail({
    adminEmail,
    adminName,
    schoolName,
    type: "payment_failed",
    data: {
      orderId,
      reason,
    },
  });
}

/**
 * Send subscription renewal email
 */
export async function notifySubscriptionRenewal(
  adminEmail: string,
  adminName: string,
  renewalDate: string,
  amount: string,
  schoolName?: string
): Promise<boolean> {
  return sendAdminEmail({
    adminEmail,
    adminName,
    schoolName,
    type: "subscription_renewal",
    data: {
      renewalDate,
      amount,
    },
  });
}

/**
 * Send system alert email
 */
export async function notifySystemAlert(
  adminEmail: string,
  adminName: string,
  title: string,
  message: string,
  severity: "info" | "warning" | "critical" = "info",
  schoolName?: string
): Promise<boolean> {
  return sendAdminEmail({
    adminEmail,
    adminName,
    schoolName,
    type: "system_alert",
    data: {
      title,
      message,
      severity,
    },
  });
}

/**
 * Send platform update email
 */
export async function notifyPlatformUpdate(
  adminEmail: string,
  adminName: string,
  title: string,
  description: string,
  features: string[],
  schoolName?: string
): Promise<boolean> {
  return sendAdminEmail({
    adminEmail,
    adminName,
    schoolName,
    type: "platform_update",
    data: {
      title,
      description,
      features,
    },
  });
}

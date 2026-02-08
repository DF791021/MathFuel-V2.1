/**
 * Stripe Webhook Handler
 * Processes Stripe events and triggers admin notifications
 * Handles payment confirmations, failures, and subscription events
 */

import Stripe from "stripe";
import { Request, Response } from "express";
import {
  sendPaymentConfirmationNotification,
  sendPaymentFailureNotification,
  sendSubscriptionRenewalNotification,
  sendSubscriptionCancellationNotification,
  sendRefundNotification,
} from "../paymentNotifications";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

/**
 * Verify and process Stripe webhook
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"] as string;

  if (!signature) {
    console.error("Missing Stripe signature");
    return res.status(400).json({ error: "Missing signature" });
  }

  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return res.status(400).json({ error: "Invalid signature" });
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected:", event.type);
    return res.json({ verified: true });
  }

  try {
    // Process different event types
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log(`Checkout session completed: ${session.id}`);

  if (session.payment_status !== "paid") {
    console.log(`Payment not completed for session ${session.id}`);
    return;
  }

  const metadata = session.metadata || {};
  const tier = (metadata.tier || "school") as "school" | "district";
  const billingInterval = (metadata.billing_interval || "month") as "month" | "year";

  await sendPaymentConfirmationNotification({
    amount: session.amount_total || 0,
    currency: session.currency || "usd",
    tier,
    billingInterval,
    customerEmail: session.customer_email || "unknown",
    customerName: metadata.customer_name,
    sessionId: session.id,
  });
}

/**
 * Handle payment_intent.succeeded event
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment intent succeeded: ${paymentIntent.id}`);

  const metadata = paymentIntent.metadata || {};
  const tier = (metadata.tier || "school") as "school" | "district";
  const billingInterval = (metadata.billing_interval || "month") as "month" | "year";

  await sendPaymentConfirmationNotification({
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    tier,
    billingInterval,
    customerEmail: metadata.customer_email || "unknown",
    customerName: metadata.customer_name,
    sessionId: paymentIntent.id,
  });
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment intent failed: ${paymentIntent.id}`);

  const metadata = paymentIntent.metadata || {};
  const tier = (metadata.tier || "school") as "school" | "district";
  const billingInterval = (metadata.billing_interval || "month") as "month" | "year";
  const failureReason = paymentIntent.last_payment_error?.message || "Unknown error";

  await sendPaymentFailureNotification({
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    customerEmail: metadata.customer_email || "unknown",
    reason: failureReason,
    sessionId: paymentIntent.id,
  });
}

/**
 * Handle customer.subscription.created event
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log(`Subscription created: ${subscription.id}`);

  const metadata = subscription.metadata || {};
  const tier = (metadata.tier || "school") as "school" | "district";
  const billingInterval = (subscription.items.data[0]?.plan.interval || "month") as "month" | "year";
  const amount = subscription.items.data[0]?.plan.amount || 0;

  // Get customer email
  let customerEmail = "unknown";
  if (typeof subscription.customer === "string") {
    try {
      const customer = await stripe.customers.retrieve(subscription.customer);
      if (!customer.deleted) {
        customerEmail = customer.email || "unknown";
      }
    } catch (error) {
      console.error("Failed to retrieve customer:", error);
    }
  }

  await sendPaymentConfirmationNotification({
    amount,
    currency: subscription.currency,
    tier,
    billingInterval,
    customerEmail,
    customerName: metadata.customer_name,
    sessionId: subscription.id,
  });
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`Subscription updated: ${subscription.id}`);

  // Check if subscription is about to renew
  if (subscription.status === "active") {
    const metadata = subscription.metadata || {};
    const tier = (metadata.tier || "school") as "school" | "district";
    const billingInterval = (subscription.items.data[0]?.plan.interval || "month") as "month" | "year";
    const amount = subscription.items.data[0]?.plan.amount || 0;
    const currentPeriodEnd = (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : new Date();

    // Get customer email
    let customerEmail = "unknown";
    if (typeof subscription.customer === "string") {
      try {
        const customer = await stripe.customers.retrieve(subscription.customer);
        if (!customer.deleted) {
          customerEmail = customer.email || "unknown";
        }
      } catch (error) {
        console.error("Failed to retrieve customer:", error);
      }
    }

    // Only send renewal notification if period is ending soon (within 7 days)
    const daysUntilRenewal = Math.ceil(
      (currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilRenewal <= 7 && daysUntilRenewal > 0) {
      await sendSubscriptionRenewalNotification({
        subscriptionId: subscription.id,
        amount,
        currency: subscription.currency,
        customerEmail,
        nextBillingDate: currentPeriodEnd,
      });
    }
  }
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`Subscription deleted: ${subscription.id}`);

  const metadata = subscription.metadata || {};
  const tier = (metadata.tier || "school") as "school" | "district";

  // Get customer email
  let customerEmail = "unknown";
  if (typeof subscription.customer === "string") {
    try {
      const customer = await stripe.customers.retrieve(subscription.customer);
      if (!customer.deleted) {
        customerEmail = customer.email || "unknown";
      }
    } catch (error) {
      console.error("Failed to retrieve customer:", error);
    }
  }

  await sendSubscriptionCancellationNotification({
    subscriptionId: subscription.id,
    customerEmail,
    reason: "Subscription cancelled",
  });
}

/**
 * Handle charge.refunded event
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log(`Charge refunded: ${charge.id}`);

  if (!charge.refunded) {
    return;
  }

  const metadata = charge.metadata || {};

  // Get customer email
  let customerEmail = "unknown";
  if (charge.customer && typeof charge.customer === "string") {
    try {
      const customer = await stripe.customers.retrieve(charge.customer);
      if (!customer.deleted) {
        customerEmail = customer.email || "unknown";
      }
    } catch (error) {
      console.error("Failed to retrieve customer:", error);
    }
  }

  await sendRefundNotification({
    refundId: charge.id,
    amount: charge.amount_refunded || charge.amount,
    currency: charge.currency,
    customerEmail,
    reason: charge.refunded ? "Refund processed" : "Unknown",
  });
}

/**
 * Handle invoice.paid event
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log(`Invoice paid: ${invoice.id}`);

  const metadata = invoice.metadata || {};
  const tier = (metadata.tier || "school") as "school" | "district";

  // Get customer email
  let customerEmail = "unknown";
  if (invoice.customer && typeof invoice.customer === "string") {
    try {
      const customer = await stripe.customers.retrieve(invoice.customer);
      if (!customer.deleted) {
        customerEmail = customer.email || "unknown";
      }
    } catch (error) {
      console.error("Failed to retrieve customer:", error);
    }
  }

  await sendPaymentConfirmationNotification({
    amount: invoice.total || 0,
    currency: invoice.currency,
    tier,
    billingInterval: "month",
    customerEmail,
    customerName: metadata.customer_name,
    sessionId: invoice.id,
  });
}

/**
 * Handle invoice.payment_failed event
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`Invoice payment failed: ${invoice.id}`);

  const metadata = invoice.metadata || {};
  const tier = (metadata.tier || "school") as "school" | "district";

  // Get customer email
  let customerEmail = "unknown";
  if (invoice.customer && typeof invoice.customer === "string") {
    try {
      const customer = await stripe.customers.retrieve(invoice.customer);
      if (!customer.deleted) {
        customerEmail = customer.email || "unknown";
      }
    } catch (error) {
      console.error("Failed to retrieve customer:", error);
    }
  }

  await sendPaymentFailureNotification({
    amount: invoice.total || 0,
    currency: invoice.currency,
    customerEmail,
    reason: "Invoice payment failed",
    sessionId: invoice.id,
  });
}

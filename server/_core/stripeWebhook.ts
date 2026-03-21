/**
 * Stripe Webhook Handler
 * Processes Stripe events and syncs subscription state to the database
 */
import Stripe from "stripe";
import { Request, Response } from "express";
import { notifyOwner } from "./notification";
import { getDb } from "../db";
import { subscriptions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { processReferralRewardFromWebhook } from "../routers/referral";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

// ============================================================================
// HELPER: Upsert subscription record from Stripe subscription object
// ============================================================================

async function upsertSubscription(sub: Stripe.Subscription) {
  const dbConn = await getDb();
  if (!dbConn) {
    console.error("[Stripe] Cannot upsert subscription: database not available");
    return;
  }

  const userId = sub.metadata?.mathfuel_user_id
    ? parseInt(sub.metadata.mathfuel_user_id, 10)
    : null;

  if (!userId) {
    console.warn("[Stripe] Subscription missing mathfuel_user_id metadata:", sub.id);
    return;
  }

  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id || "";

  const priceId = sub.items?.data?.[0]?.price?.id || "";
  const subAny = sub as any;
  const currentPeriodStart = new Date((subAny.current_period_start || Math.floor(Date.now() / 1000)) * 1000);
  const currentPeriodEnd = new Date((subAny.current_period_end || Math.floor(Date.now() / 1000) + 30 * 86400) * 1000);
  const canceledAt = sub.canceled_at ? new Date(sub.canceled_at * 1000) : null;
  const latestInvoiceId =
    typeof sub.latest_invoice === "string"
      ? sub.latest_invoice
      : sub.latest_invoice?.id || null;

  const values = {
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    status: sub.status as typeof subscriptions.$inferSelect.status,
    priceId,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    canceledAt,
    latestInvoiceId,
  };

  // Check if subscription already exists
  const existing = await dbConn
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, sub.id))
    .limit(1);

  if (existing.length > 0) {
    await dbConn
      .update(subscriptions)
      .set({
        status: values.status,
        priceId: values.priceId,
        currentPeriodStart: values.currentPeriodStart,
        currentPeriodEnd: values.currentPeriodEnd,
        cancelAtPeriodEnd: values.cancelAtPeriodEnd,
        canceledAt: values.canceledAt,
        latestInvoiceId: values.latestInvoiceId,
      })
      .where(eq(subscriptions.stripeSubscriptionId, sub.id));
    console.log(`[Stripe] Updated subscription ${sub.id} → ${sub.status}`);
  } else {
    await dbConn.insert(subscriptions).values(values);
    console.log(`[Stripe] Created subscription ${sub.id} for user ${userId}`);
  }
}

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================

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
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
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
    switch (event.type) {
      // ── Checkout completed → subscription created ──
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[Stripe] Checkout completed: ${session.id}`);

        // If this is a subscription checkout, fetch and sync the subscription
        if (session.subscription) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await upsertSubscription(sub);
        }

        await notifyOwner({
          title: "New Subscription!",
          content: `Checkout session ${session.id} completed. Amount: $${((session.amount_total ?? 0) / 100).toFixed(2)} ${(session.currency || "usd").toUpperCase()}`,
        });
        break;
      }

      // ── Subscription updated (renewal, plan change, etc.) ──
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        console.log(`[Stripe] Subscription updated: ${sub.id} → ${sub.status}`);
        await upsertSubscription(sub);
        break;
      }

      // ── Subscription deleted/cancelled ──
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        console.log(`[Stripe] Subscription cancelled: ${sub.id}`);
        await upsertSubscription(sub);

        await notifyOwner({
          title: "Subscription Cancelled",
          content: `Subscription ${sub.id} was cancelled.`,
        });
        break;
      }

      // ── Subscription created ──
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        console.log(`[Stripe] Subscription created: ${sub.id}`);
        await upsertSubscription(sub);

        // Process referral reward if this new subscriber was referred
        const newSubUserId = sub.metadata?.mathfuel_user_id
          ? parseInt(sub.metadata.mathfuel_user_id, 10)
          : null;
        if (newSubUserId) {
          await processReferralRewardFromWebhook(newSubUserId);
        }
        break;
      }

      // ── Payment succeeded ──
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log(`[Stripe] Payment succeeded: ${pi.id}`);
        break;
      }

      // ── Payment failed ──
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log(`[Stripe] Payment failed: ${pi.id}`);
        await notifyOwner({
          title: "Payment Failed",
          content: `Payment ${pi.id} failed: ${pi.last_payment_error?.message || "Unknown error"}`,
        });
        break;
      }

      // ── Invoice paid (subscription renewal) ──
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Stripe] Invoice paid: ${invoice.id}`);

        // Sync the subscription if available
        const paidSubField = (invoice as any).subscription;
        if (paidSubField) {
          const subId = typeof paidSubField === "string" ? paidSubField : paidSubField.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await upsertSubscription(sub);
        }
        break;
      }

      // ── Invoice payment failed ──
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Stripe] Invoice payment failed: ${invoice.id}`);

        const failedSubField = (invoice as any).subscription;
        if (failedSubField) {
          const subId = typeof failedSubField === "string" ? failedSubField : failedSubField.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await upsertSubscription(sub);
        }

        await notifyOwner({
          title: "Invoice Payment Failed",
          content: `Invoice ${invoice.id} payment failed. Customer may need to update payment method.`,
        });
        break;
      }

      default:
        console.log(`[Stripe] Unhandled event: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

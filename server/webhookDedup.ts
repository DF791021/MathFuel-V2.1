/**
 * Webhook Event Deduplication
 * Prevents duplicate email sends when Stripe retries webhooks
 */

import { getDb } from "./db";
import { webhookEvents } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface WebhookEventRecord {
  id: number;
  externalId: string; // Stripe event ID
  type: string;
  status: "pending" | "succeeded" | "failed";
  payload: unknown;
  error?: string;
  attempts: number;
  succeededAt?: Date;
}

/**
 * Check if webhook event has already been processed
 */
export async function isWebhookProcessed(stripeEventId: string): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const existing = await db.query.webhookEvents.findFirst({
      where: eq(webhookEvents.externalId, stripeEventId),
    });

    return !!existing;
  } catch (error) {
    console.error("[WebhookDedup] Error checking webhook:", error);
    return false;
  }
}

/**
 * Mark webhook event as processed (success)
 */
export async function markWebhookProcessed(stripeEventId: string, type: string, payload: unknown): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    await db.insert(webhookEvents).values({
      externalId: stripeEventId,
      type,
      status: "succeeded",
      payload,
      attempts: 1,
      succeededAt: new Date(),
    });

    console.log("[WebhookDedup] Marked webhook as processed", { stripeEventId, type });
    return true;
  } catch (error) {
    console.error("[WebhookDedup] Error marking webhook processed:", error);
    return false;
  }
}

/**
 * Mark webhook event as failed
 */
export async function markWebhookFailed(stripeEventId: string, type: string, payload: unknown, errorMessage: string): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    await db.insert(webhookEvents).values({
      externalId: stripeEventId,
      type,
      status: "failed",
      payload,
      error: errorMessage,
      attempts: 1,
    });

    console.log("[WebhookDedup] Marked webhook as failed", { stripeEventId, type, errorMessage });
    return true;
  } catch (error) {
    console.error("[WebhookDedup] Error marking webhook failed:", error);
    return false;
  }
}

/**
 * Get webhook event record
 */
export async function getWebhookEvent(stripeEventId: string): Promise<WebhookEventRecord | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const event = await db.query.webhookEvents.findFirst({
      where: eq(webhookEvents.externalId, stripeEventId),
    });

    if (!event) return null;

    return {
      id: event.id,
      externalId: event.externalId,
      type: event.type,
      status: event.status as "pending" | "succeeded" | "failed",
      payload: event.payload,
      error: event.error || undefined,
      attempts: event.attempts,
      succeededAt: event.succeededAt || undefined,
    };
  } catch (error) {
    console.error("[WebhookDedup] Error getting webhook event:", error);
    return null;
  }
}

import { z } from "zod";
import Stripe from "stripe";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { subscriptions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// ============================================================================
// STRIPE CLIENT
// ============================================================================

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

function getStripe(): Stripe {
  if (!stripe) {
    throw new Error("Stripe is not configured. Please add your Stripe secret key.");
  }
  return stripe;
}

// ============================================================================
// PLAN CONFIGURATION
// ============================================================================

/**
 * MathFuel pricing plans.
 * In production, these price IDs come from your Stripe Dashboard.
 * For test mode, we create Checkout sessions with line_items directly.
 */
export const PLANS = {
  free: {
    name: "Free",
    priceMonthly: 0,
    features: [
      "5 practice sessions per day",
      "Basic progress tracking",
      "7 math skill areas",
      "Streaks & badges",
    ],
    limits: {
      dailySessions: 5,
      aiHintsPerDay: 3,
    },
  },
  family: {
    name: "Family",
    priceMonthly: 799, // $7.99 in cents
    priceYearly: 5999, // $59.99 in cents (save ~37%)
    stripePriceIdMonthly: process.env.STRIPE_FAMILY_MONTHLY_PRICE_ID || "",
    stripePriceIdYearly: process.env.STRIPE_FAMILY_YEARLY_PRICE_ID || "",
    features: [
      "Unlimited practice sessions",
      "Unlimited AI hints & explanations",
      "Full parent dashboard",
      "Detailed mastery reports",
      "Priority support",
      "Up to 4 student accounts",
    ],
    limits: {
      dailySessions: Infinity,
      aiHintsPerDay: Infinity,
      maxStudents: 4,
    },
  },
} as const;

// ============================================================================
// HELPER: Get or create Stripe customer for a user
// ============================================================================

async function getOrCreateStripeCustomer(userId: number): Promise<string> {
  const s = getStripe();
  const dbConn = await db.getDb();
  if (!dbConn) throw new Error("Database not available");

  // Check if user already has a subscription record with a Stripe customer ID
  const existing = await dbConn
    .select({ stripeCustomerId: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (existing.length > 0 && existing[0].stripeCustomerId) {
    return existing[0].stripeCustomerId;
  }

  // Create a new Stripe customer
  const user = await db.getUserById(userId);
  if (!user) throw new Error("User not found");

  const customer = await s.customers.create({
    email: user.email || undefined,
    name: user.name || undefined,
    metadata: {
      mathfuel_user_id: String(userId),
      mathfuel_open_id: user.openId,
    },
  });

  return customer.id;
}

// ============================================================================
// HELPER: Get user's active subscription
// ============================================================================

async function getUserSubscription(userId: number) {
  const dbConn = await db.getDb();
  if (!dbConn) return null;

  const rows = await dbConn
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  return rows.length > 0 ? rows[0] : null;
}

// ============================================================================
// PAYMENT ROUTER
// ============================================================================

export const paymentRouter = router({
  /**
   * Get current subscription status for the logged-in user
   */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const sub = await getUserSubscription(ctx.user.id);

    if (!sub || sub.status === "canceled" || sub.status === "unpaid") {
      return {
        plan: "free" as const,
        status: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
    }

    return {
      plan: "family" as const,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    };
  }),

  /**
   * Get plan details (public, no auth required)
   */
  getPlans: publicProcedure.query(() => {
    return {
      free: {
        name: PLANS.free.name,
        priceMonthly: PLANS.free.priceMonthly,
        features: PLANS.free.features,
      },
      family: {
        name: PLANS.family.name,
        priceMonthly: PLANS.family.priceMonthly,
        priceYearly: PLANS.family.priceYearly,
        features: PLANS.family.features,
      },
    };
  }),

  /**
   * Create a Stripe Checkout session for subscription
   */
  createCheckout: protectedProcedure
    .input(
      z.object({
        interval: z.enum(["monthly", "yearly"]).default("monthly"),
        successUrl: z.string().url().optional(),
        cancelUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const s = getStripe();
      const customerId = await getOrCreateStripeCustomer(ctx.user.id);

      const priceId =
        input.interval === "yearly"
          ? PLANS.family.stripePriceIdYearly
          : PLANS.family.stripePriceIdMonthly;

      // Build line items — if we have a Stripe Price ID, use it; otherwise create ad-hoc pricing
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = priceId
        ? [{ price: priceId, quantity: 1 }]
        : [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: "MathFuel Family Plan",
                  description:
                    input.interval === "yearly"
                      ? "Annual subscription — save 37%"
                      : "Monthly subscription",
                },
                unit_amount:
                  input.interval === "yearly"
                    ? PLANS.family.priceYearly
                    : PLANS.family.priceMonthly,
                recurring: {
                  interval: input.interval === "yearly" ? "year" : "month",
                },
              },
              quantity: 1,
            },
          ];

      const origin =
        ctx.req.headers.origin ||
        ctx.req.headers.referer?.replace(/\/$/, "") ||
        "https://mathfuel.org";

      const session = await s.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: lineItems,
        success_url:
          input.successUrl || `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: input.cancelUrl || `${origin}/pricing?canceled=true`,
        metadata: {
          mathfuel_user_id: String(ctx.user.id),
        },
        subscription_data: {
          metadata: {
            mathfuel_user_id: String(ctx.user.id),
          },
        },
        allow_promotion_codes: true,
      });

      return { url: session.url };
    }),

  /**
   * Create a Stripe Customer Portal session for managing subscription
   */
  createBillingPortal: protectedProcedure
    .input(
      z.object({
        returnUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const s = getStripe();
      const sub = await getUserSubscription(ctx.user.id);

      if (!sub) {
        throw new Error("No subscription found. Please subscribe first.");
      }

      const origin =
        ctx.req.headers.origin ||
        ctx.req.headers.referer?.replace(/\/$/, "") ||
        "https://mathfuel.org";

      const session = await s.billingPortal.sessions.create({
        customer: sub.stripeCustomerId,
        return_url: input.returnUrl || `${origin}/account`,
      });

      return { url: session.url };
    }),

  /**
   * Check if user has premium access (used for gating features)
   */
  hasPremium: protectedProcedure.query(async ({ ctx }) => {
    const sub = await getUserSubscription(ctx.user.id);

    // Active or trialing subscription = premium
    if (sub && (sub.status === "active" || sub.status === "trialing")) {
      return { premium: true, plan: "family" as const };
    }

    // Check if parent has premium (children inherit parent's subscription)
    const dbConn = await db.getDb();
    if (dbConn) {
      const links = await db.getStudentParents(ctx.user.id);
      for (const link of links) {
        const parentSub = await getUserSubscription(link.parentId);
        if (parentSub && (parentSub.status === "active" || parentSub.status === "trialing")) {
          return { premium: true, plan: "family" as const };
        }
      }
    }

    return { premium: false, plan: "free" as const };
  }),
});

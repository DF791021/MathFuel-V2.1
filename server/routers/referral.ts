import { z } from "zod";
import Stripe from "stripe";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { referralCodes, referrals, users } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { randomBytes } from "crypto";

// ============================================================================
// STRIPE CLIENT (shared with payment router)
// ============================================================================

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

function getStripe(): Stripe {
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }
  return stripe;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate a human-friendly referral code like "DUNCAN-MF7X"
 * Uses the first part of the user's name + random suffix
 */
function generateReferralCode(userName: string | null): string {
  const prefix = (userName || "MATH")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  const suffix = randomBytes(3)
    .toString("base64url")
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 4)
    .toUpperCase();
  return `${prefix}-${suffix}`;
}

/**
 * Get or create a referral code for a user
 */
async function getOrCreateReferralCode(userId: number, userName: string | null) {
  const dbConn = await db.getDb();
  if (!dbConn) throw new Error("Database not available");

  // Check if user already has a code
  const existing = await dbConn
    .select()
    .from(referralCodes)
    .where(eq(referralCodes.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Generate a unique code (retry if collision)
  let code = generateReferralCode(userName);
  let attempts = 0;
  while (attempts < 5) {
    const collision = await dbConn
      .select({ id: referralCodes.id })
      .from(referralCodes)
      .where(eq(referralCodes.code, code))
      .limit(1);
    if (collision.length === 0) break;
    code = generateReferralCode(userName);
    attempts++;
  }

  const [inserted] = await dbConn
    .insert(referralCodes)
    .values({ userId, code })
    .$returningId();

  return {
    id: inserted.id,
    userId,
    code,
    totalReferrals: 0,
    totalRewardMonths: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ============================================================================
// REFERRAL ROUTER
// ============================================================================

export const referralRouter = router({
  /**
   * Get the current user's referral code (creates one if needed)
   */
  getMyCode: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.getUserById(ctx.user.id);
    const codeRecord = await getOrCreateReferralCode(ctx.user.id, user?.name || null);
    return {
      code: codeRecord.code,
      totalReferrals: codeRecord.totalReferrals,
      totalRewardMonths: codeRecord.totalRewardMonths,
      isActive: codeRecord.isActive,
    };
  }),

  /**
   * Get the referral dashboard data — code + list of referrals
   */
  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new Error("Database not available");

    const user = await db.getUserById(ctx.user.id);
    const codeRecord = await getOrCreateReferralCode(ctx.user.id, user?.name || null);

    // Get all referrals for this user
    const referralList = await dbConn
      .select({
        id: referrals.id,
        refereeUserId: referrals.refereeUserId,
        status: referrals.status,
        createdAt: referrals.createdAt,
        rewardAppliedAt: referrals.rewardAppliedAt,
      })
      .from(referrals)
      .where(eq(referrals.referrerUserId, ctx.user.id))
      .orderBy(desc(referrals.createdAt));

    // Enrich with referee names
    const enrichedReferrals = await Promise.all(
      referralList.map(async (ref) => {
        const referee = await db.getUserById(ref.refereeUserId);
        return {
          ...ref,
          refereeName: referee?.name || "Unknown",
          refereeEmail: referee?.email || null,
        };
      })
    );

    return {
      code: codeRecord.code,
      totalReferrals: codeRecord.totalReferrals,
      totalRewardMonths: codeRecord.totalRewardMonths,
      isActive: codeRecord.isActive,
      referrals: enrichedReferrals,
    };
  }),

  /**
   * Validate a referral code (used during signup)
   * Returns the referrer's name so the UI can show "Referred by Duncan"
   */
  validateCode: publicProcedure
    .input(z.object({ code: z.string().min(1).max(20) }))
    .query(async ({ input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) return { valid: false, referrerName: null };

      const codeRecord = await dbConn
        .select({
          id: referralCodes.id,
          userId: referralCodes.userId,
          isActive: referralCodes.isActive,
        })
        .from(referralCodes)
        .where(eq(referralCodes.code, input.code.toUpperCase()))
        .limit(1);

      if (codeRecord.length === 0 || !codeRecord[0].isActive) {
        return { valid: false, referrerName: null };
      }

      const referrer = await db.getUserById(codeRecord[0].userId);
      return {
        valid: true,
        referrerName: referrer?.name?.split(" ")[0] || "a friend",
      };
    }),

  /**
   * Record a referral when a new user signs up with a code.
   * Called after successful registration.
   */
  recordReferral: protectedProcedure
    .input(z.object({ code: z.string().min(1).max(20) }))
    .mutation(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new Error("Database not available");

      // Find the referral code
      const codeRecord = await dbConn
        .select()
        .from(referralCodes)
        .where(eq(referralCodes.code, input.code.toUpperCase()))
        .limit(1);

      if (codeRecord.length === 0 || !codeRecord[0].isActive) {
        return { success: false, error: "Invalid referral code" };
      }

      // Can't refer yourself
      if (codeRecord[0].userId === ctx.user.id) {
        return { success: false, error: "You cannot use your own referral code" };
      }

      // Check if this user was already referred
      const existingReferral = await dbConn
        .select({ id: referrals.id })
        .from(referrals)
        .where(eq(referrals.refereeUserId, ctx.user.id))
        .limit(1);

      if (existingReferral.length > 0) {
        return { success: false, error: "You have already been referred" };
      }

      // Create the referral record
      await dbConn.insert(referrals).values({
        referrerUserId: codeRecord[0].userId,
        refereeUserId: ctx.user.id,
        referralCodeId: codeRecord[0].id,
        status: "signed_up",
      });

      // Increment the referral count
      await dbConn
        .update(referralCodes)
        .set({
          totalReferrals: sql`${referralCodes.totalReferrals} + 1`,
        })
        .where(eq(referralCodes.id, codeRecord[0].id));

      return { success: true };
    }),

  /**
   * Process a referral reward when the referee subscribes.
   * This is called from the webhook handler when a new subscription is created.
   * It creates a Stripe coupon for 100% off one month and applies it to the referrer's subscription.
   */
  processReward: protectedProcedure
    .input(z.object({ refereeUserId: z.number() }))
    .mutation(async ({ input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new Error("Database not available");

      // Find the referral record for this referee
      const referralRecord = await dbConn
        .select()
        .from(referrals)
        .where(
          and(
            eq(referrals.refereeUserId, input.refereeUserId),
            eq(referrals.status, "signed_up")
          )
        )
        .limit(1);

      if (referralRecord.length === 0) {
        return { success: false, error: "No pending referral found" };
      }

      const ref = referralRecord[0];

      try {
        const s = getStripe();

        // Find the referrer's Stripe subscription
        const { subscriptions: subsTable } = await import("../../drizzle/schema");
        const referrerSub = await dbConn
          .select()
          .from(subsTable)
          .where(eq(subsTable.userId, ref.referrerUserId))
          .limit(1);

        if (referrerSub.length > 0 && referrerSub[0].stripeSubscriptionId) {
          // Create a one-time 100% discount coupon
          const coupon = await s.coupons.create({
            percent_off: 100,
            duration: "once",
            name: "Referral Reward - 1 Free Month",
            metadata: {
              mathfuel_referral_id: String(ref.id),
              mathfuel_referrer_id: String(ref.referrerUserId),
              mathfuel_referee_id: String(ref.refereeUserId),
            },
          });

          // Apply the coupon to the referrer's next invoice
          await s.subscriptions.update(referrerSub[0].stripeSubscriptionId, {
            discounts: [{ coupon: coupon.id }],
          });

          // Update the referral record
          await dbConn
            .update(referrals)
            .set({
              status: "rewarded",
              rewardAppliedAt: new Date(),
              stripeCouponId: coupon.id,
            })
            .where(eq(referrals.id, ref.id));

          // Increment reward months on the code
          await dbConn
            .update(referralCodes)
            .set({
              totalRewardMonths: sql`${referralCodes.totalRewardMonths} + 1`,
            })
            .where(eq(referralCodes.id, ref.referralCodeId));

          console.log(
            `[Referral] Reward applied: user ${ref.referrerUserId} gets 1 free month (coupon ${coupon.id})`
          );

          return { success: true, couponId: coupon.id };
        }

        // Referrer doesn't have an active subscription — mark as subscribed (reward pending)
        await dbConn
          .update(referrals)
          .set({ status: "subscribed" })
          .where(eq(referrals.id, ref.id));

        return {
          success: false,
          error: "Referrer does not have an active subscription to credit",
        };
      } catch (error) {
        console.error("[Referral] Error processing reward:", error);
        return { success: false, error: "Failed to process reward" };
      }
    }),

  /**
   * Get referral stats for admin dashboard
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new Error("Database not available");

    // Only allow admin
    if (ctx.user.role !== "admin") {
      return null;
    }

    const totalCodes = await dbConn
      .select({ count: sql<number>`COUNT(*)` })
      .from(referralCodes);

    const totalReferrals = await dbConn
      .select({ count: sql<number>`COUNT(*)` })
      .from(referrals);

    const totalRewarded = await dbConn
      .select({ count: sql<number>`COUNT(*)` })
      .from(referrals)
      .where(eq(referrals.status, "rewarded"));

    return {
      totalCodes: Number(totalCodes[0]?.count || 0),
      totalReferrals: Number(totalReferrals[0]?.count || 0),
      totalRewarded: Number(totalRewarded[0]?.count || 0),
    };
  }),
});

// ============================================================================
// EXPORTED HELPER: Process referral reward from webhook
// ============================================================================

/**
 * Called from the Stripe webhook handler when a new subscription is created.
 * Checks if the subscriber was referred and processes the reward.
 */
export async function processReferralRewardFromWebhook(refereeUserId: number) {
  const dbConn = await db.getDb();
  if (!dbConn) return;

  // Find pending referral
  const referralRecord = await dbConn
    .select()
    .from(referrals)
    .where(
      and(
        eq(referrals.refereeUserId, refereeUserId),
        eq(referrals.status, "signed_up")
      )
    )
    .limit(1);

  if (referralRecord.length === 0) return;

  const ref = referralRecord[0];

  try {
    const s = getStripe();
    const { subscriptions: subsTable } = await import("../../drizzle/schema");

    // Find the referrer's Stripe subscription
    const referrerSub = await dbConn
      .select()
      .from(subsTable)
      .where(eq(subsTable.userId, ref.referrerUserId))
      .limit(1);

    if (referrerSub.length > 0 && referrerSub[0].stripeSubscriptionId) {
      // Create a one-time 100% discount coupon
      const coupon = await s.coupons.create({
        percent_off: 100,
        duration: "once",
        name: "Referral Reward - 1 Free Month",
        metadata: {
          mathfuel_referral_id: String(ref.id),
          mathfuel_referrer_id: String(ref.referrerUserId),
          mathfuel_referee_id: String(ref.refereeUserId),
        },
      });

      // Apply the coupon to the referrer's next invoice
      await s.subscriptions.update(referrerSub[0].stripeSubscriptionId, {
        discounts: [{ coupon: coupon.id }],
      });

      // Update referral record
      await dbConn
        .update(referrals)
        .set({
          status: "rewarded",
          rewardAppliedAt: new Date(),
          stripeCouponId: coupon.id,
        })
        .where(eq(referrals.id, ref.id));

      // Increment reward months
      await dbConn
        .update(referralCodes)
        .set({
          totalRewardMonths: sql`${referralCodes.totalRewardMonths} + 1`,
        })
        .where(eq(referralCodes.id, ref.referralCodeId));

      console.log(
        `[Referral Webhook] Reward applied: user ${ref.referrerUserId} gets 1 free month (coupon ${coupon.id})`
      );
    } else {
      // Mark as subscribed — reward pending until referrer subscribes
      await dbConn
        .update(referrals)
        .set({ status: "subscribed" })
        .where(eq(referrals.id, ref.id));
    }
  } catch (error) {
    console.error("[Referral Webhook] Error processing reward:", error);
  }
}

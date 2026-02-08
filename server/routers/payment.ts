/**
 * Payment Router - Stripe Integration
 * Handles checkout sessions, subscriptions, and payment management
 */

import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
// @ts-ignore
import { STRIPE_PRODUCTS, formatPrice } from "../_core/stripeProducts";
import {
  sendPaymentConfirmationNotification,
  sendPaymentFailureNotification,
  sendPaymentMethodUpdateNotification,
} from "../paymentNotifications";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export const paymentRouter = router({
  /**
   * Create a checkout session for trial-to-paid conversion
   * Used when trial users want to upgrade to a paid plan
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        tier: z.enum(["school", "district"]),
        billingInterval: z.enum(["month", "year"]),
        trialAccountId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const tier = STRIPE_PRODUCTS[input.tier === "school" ? "SCHOOL_LICENSE" : "DISTRICT_LICENSE"];

        if (!tier) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid pricing tier",
          });
        }

        const pricing = tier.pricing[input.billingInterval as keyof typeof tier.pricing];
        if (!pricing) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid billing interval",
          });
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          customer_email: ctx.user.email || undefined,
          client_reference_id: ctx.user.id.toString(),
          metadata: {
          user_id: ctx.user.id.toString(),
            tier: input.tier,
            trial_account_id: input.trialAccountId?.toString() || "",
          },
          line_items: [
            {
              price_data: {
                currency: pricing.currency,
                product_data: {
                  name: tier.name,
                  description: tier.description,
                  metadata: {
                    tier: input.tier,
                  },
                },
                unit_amount: pricing.amount,
                recurring: {
                  interval: input.billingInterval as "month" | "year",
                  interval_count: 1,
                },
              },
              quantity: 1,
            },
          ],
          success_url: `${ctx.req.headers.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${ctx.req.headers.origin}/pricing?cancelled=true`,
          allow_promotion_codes: true,
        });

        if (!session.url) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create checkout session",
          });
        }

        return {
          checkoutUrl: session.url,
          sessionId: session.id,
        };
      } catch (error) {
        console.error("Error creating checkout session:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session",
        });
      }
    }),

  /**
   * Get pricing information for display on pricing page
   */
  getPricingInfo: publicProcedure.query(() => {
    return {
      school: {
        name: STRIPE_PRODUCTS.SCHOOL_LICENSE.name,
        description: STRIPE_PRODUCTS.SCHOOL_LICENSE.description,
        features: STRIPE_PRODUCTS.SCHOOL_LICENSE.features,
        pricing: {
          monthly: {
            amount: STRIPE_PRODUCTS.SCHOOL_LICENSE.pricing.monthly.amount,
            formatted: formatPrice(STRIPE_PRODUCTS.SCHOOL_LICENSE.pricing.monthly.amount),
            interval: "month",
          },
          annual: {
            amount: STRIPE_PRODUCTS.SCHOOL_LICENSE.pricing.annual.amount,
            formatted: formatPrice(STRIPE_PRODUCTS.SCHOOL_LICENSE.pricing.annual.amount),
            interval: "year",
            savings: formatPrice(
              STRIPE_PRODUCTS.SCHOOL_LICENSE.pricing.monthly.amount * 12 -
                STRIPE_PRODUCTS.SCHOOL_LICENSE.pricing.annual.amount
            ),
          },
        },
      },
      district: {
        name: STRIPE_PRODUCTS.DISTRICT_LICENSE.name,
        description: STRIPE_PRODUCTS.DISTRICT_LICENSE.description,
        features: STRIPE_PRODUCTS.DISTRICT_LICENSE.features,
        pricing: {
          monthly: {
            amount: STRIPE_PRODUCTS.DISTRICT_LICENSE.pricing.monthly.amount,
            formatted: formatPrice(STRIPE_PRODUCTS.DISTRICT_LICENSE.pricing.monthly.amount),
            interval: "month",
          },
          annual: {
            amount: STRIPE_PRODUCTS.DISTRICT_LICENSE.pricing.annual.amount,
            formatted: formatPrice(STRIPE_PRODUCTS.DISTRICT_LICENSE.pricing.annual.amount),
            interval: "year",
            savings: formatPrice(
              STRIPE_PRODUCTS.DISTRICT_LICENSE.pricing.monthly.amount * 12 -
                STRIPE_PRODUCTS.DISTRICT_LICENSE.pricing.annual.amount
            ),
          },
        },
      },
    };
  }),

  /**
   * Get checkout session details after successful payment
   */
  getCheckoutSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      try {
        const session = await stripe.checkout.sessions.retrieve(input.sessionId);

        // If payment was successful, send notification
        if (session.payment_status === "paid" && session.metadata) {
          const metadata = session.metadata as any;
          await sendPaymentConfirmationNotification({
            amount: session.amount_total || 0,
            currency: session.currency || "usd",
            tier: metadata.tier as "school" | "district",
            billingInterval: "month",
            customerEmail: session.customer_email || "unknown",
            customerName: metadata.customer_name,
            sessionId: session.id,
          });
        }

        return {
          id: session.id,
          status: session.payment_status,
          customerId: session.customer,
          subscriptionId: session.subscription,
          metadata: session.metadata,
          amountTotal: session.amount_total,
          currency: session.currency,
        };
      } catch (error) {
        console.error("Error retrieving checkout session:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve checkout session",
        });
      }
    }),

  /**
   * Get user's subscription details
   */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    try {
      // In a real app, you would fetch this from your database
      // where you store the stripe_subscription_id for the user
      // This is a placeholder implementation

      return {
        status: "active",
        tier: "school",
        billingInterval: "annual",
        nextBillingDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        amountPerBilling: 99900,
        currency: "usd",
      };
    } catch (error) {
      console.error("Error fetching subscription:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch subscription",
      });
    }
  }),

  /**
   * Cancel subscription
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // In a real app, you would:
      // 1. Get the stripe_subscription_id from your database for this user
      // 2. Cancel the subscription on Stripe
      // 3. Update the user's status in your database

      return {
        success: true,
        message: "Subscription cancelled successfully",
      };
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to cancel subscription",
      });
    }
  }),

  /**
   * Update billing information
   */
  updateBillingInfo: protectedProcedure
    .input(
      z.object({
        billingName: z.string(),
        billingEmail: z.string().email(),
        billingAddress: z.string(),
        billingCity: z.string(),
        billingState: z.string(),
        billingZip: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // In a real app, you would update the Stripe customer with this information
        // using stripe.customers.update()

        // Send notification about billing information update
        await sendPaymentMethodUpdateNotification({
          customerEmail: input.billingEmail,
          cardLast4: undefined,
        });

        return {
          success: true,
          message: "Billing information updated",
        };
      } catch (error) {
        console.error("Error updating billing info:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update billing information",
        });
      }
    }),
});

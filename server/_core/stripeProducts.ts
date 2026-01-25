/**
 * Stripe Products Configuration
 * Define all products and pricing tiers for Wisconsin Food Explorer
 */

export const STRIPE_PRODUCTS = {
  SCHOOL_LICENSE: {
    name: "School License",
    description: "Perfect for individual schools with up to 500 students",
    features: [
      "Unlimited games and challenges",
      "Up to 500 students",
      "Full teacher portal",
      "Custom questions and content",
      "Email support",
      "Monthly analytics reports",
      "Professional certificates",
      "Email templates",
    ],
    pricing: {
      monthly: {
        amount: 9900, // $99.00 in cents
        currency: "usd",
        interval: "month",
        description: "Billed monthly",
      },
      annual: {
        amount: 99900, // $999.00 in cents (2 months free)
        currency: "usd",
        interval: "year",
        description: "Billed annually - Save 2 months!",
      },
    },
    stripeProductId: process.env.STRIPE_SCHOOL_PRODUCT_ID || "prod_school_license",
  },

  DISTRICT_LICENSE: {
    name: "District License",
    description: "Ideal for districts with unlimited students across all schools",
    features: [
      "Unlimited games and challenges",
      "Unlimited students",
      "Unlimited schools",
      "Full teacher portal",
      "Custom questions and content",
      "Priority email & phone support",
      "Weekly analytics reports",
      "Professional certificates",
      "Email templates",
      "Advanced analytics dashboard",
      "Comparative benchmarking",
      "Dedicated account manager",
      "Quarterly strategy sessions",
      "Custom professional development",
    ],
    pricing: {
      monthly: {
        amount: 49900, // $499.00 in cents
        currency: "usd",
        interval: "month",
        description: "Billed monthly",
      },
      annual: {
        amount: 499900, // $4,999.00 in cents (2 months free)
        currency: "usd",
        interval: "year",
        description: "Billed annually - Save 2 months!",
      },
    },
    stripeProductId: process.env.STRIPE_DISTRICT_PRODUCT_ID || "prod_district_license",
  },

  TRIAL_CONVERSION_OFFER: {
    name: "Trial Conversion Special",
    description: "3 months free + free onboarding for trial users",
    features: [
      "3 months free (first quarter)",
      "Free onboarding and setup",
      "Free professional development",
      "Dedicated implementation support",
      "Then convert to standard pricing",
    ],
    discount: 0.25, // 25% discount for 12 months
    stripeProductId: process.env.STRIPE_TRIAL_OFFER_PRODUCT_ID || "prod_trial_offer",
  },
};

/**
 * Get pricing tier details
 */
export function getPricingTier(tier: "school" | "district") {
  if (tier === "school") {
    return STRIPE_PRODUCTS.SCHOOL_LICENSE;
  } else if (tier === "district") {
    return STRIPE_PRODUCTS.DISTRICT_LICENSE;
  }
  throw new Error(`Unknown pricing tier: ${tier}`);
}

/**
 * Format price for display
 */
export function formatPrice(amountInCents: number, currency: string = "usd"): string {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate monthly equivalent price for annual billing
 */
export function getMonthlyEquivalent(annualAmountInCents: number): string {
  const monthlyAmount = annualAmountInCents / 12 / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(monthlyAmount);
}

/**
 * Calculate savings for annual billing
 */
export function calculateAnnualSavings(monthlyAmountInCents: number, annualAmountInCents: number): number {
  const monthlyTotal = monthlyAmountInCents * 12;
  return monthlyTotal - annualAmountInCents;
}

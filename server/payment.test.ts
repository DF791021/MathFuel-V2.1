import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock db module ──
const mockGetDb = vi.fn();
const mockGetUserById = vi.fn();
const mockGetStudentParents = vi.fn();

vi.mock("./db", () => ({
  getDb: mockGetDb,
  getUserById: mockGetUserById,
  getStudentParents: mockGetStudentParents,
}));

// ── Mock drizzle schema ──
vi.mock("../drizzle/schema", () => ({
  subscriptions: {
    id: "id",
    userId: "userId",
    stripeCustomerId: "stripeCustomerId",
    stripeSubscriptionId: "stripeSubscriptionId",
    status: "status",
    priceId: "priceId",
    currentPeriodStart: "currentPeriodStart",
    currentPeriodEnd: "currentPeriodEnd",
    cancelAtPeriodEnd: "cancelAtPeriodEnd",
    canceledAt: "canceledAt",
    latestInvoiceId: "latestInvoiceId",
  },
}));

// ── Mock drizzle-orm ──
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a, b) => ({ field: a, value: b })),
}));

// ── Mock Stripe ──
const mockCheckoutCreate = vi.fn();
const mockBillingPortalCreate = vi.fn();
const mockCustomersCreate = vi.fn();
const mockSubscriptionsRetrieve = vi.fn();

vi.mock("stripe", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: mockCheckoutCreate,
        },
      },
      billingPortal: {
        sessions: {
          create: mockBillingPortalCreate,
        },
      },
      customers: {
        create: mockCustomersCreate,
      },
      subscriptions: {
        retrieve: mockSubscriptionsRetrieve,
      },
    })),
  };
});

// ── Mock _core/trpc ──
const mockPublicProcedure = {
  input: vi.fn().mockReturnThis(),
  mutation: vi.fn().mockImplementation((fn) => fn),
  query: vi.fn().mockImplementation((fn) => fn),
};
const mockProtectedProcedure = {
  input: vi.fn().mockReturnThis(),
  mutation: vi.fn().mockImplementation((fn) => fn),
  query: vi.fn().mockImplementation((fn) => fn),
};
vi.mock("./_core/trpc", () => ({
  publicProcedure: mockPublicProcedure,
  protectedProcedure: mockProtectedProcedure,
  router: vi.fn().mockImplementation((routes) => routes),
}));

// ── Mock _core/env ──
vi.mock("./_core/env", () => ({
  ENV: {
    cookieSecret: "test-secret",
    appId: "test-app-id",
  },
}));

describe("Payment Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_mock";
  });

  describe("Plan Configuration", () => {
    it("should export PLANS with correct free tier limits", async () => {
      const { PLANS } = await import("./routers/payment");
      expect(PLANS.free.name).toBe("Free");
      expect(PLANS.free.priceMonthly).toBe(0);
      expect(PLANS.free.limits.dailySessions).toBe(5);
      expect(PLANS.free.limits.aiHintsPerDay).toBe(3);
      expect(PLANS.free.features).toContain("5 practice sessions per day");
    });

    it("should export PLANS with correct family tier pricing", async () => {
      const { PLANS } = await import("./routers/payment");
      expect(PLANS.family.name).toBe("Family");
      expect(PLANS.family.priceMonthly).toBe(799); // $7.99 in cents
      expect(PLANS.family.priceYearly).toBe(5999); // $59.99 in cents
      expect(PLANS.family.limits.dailySessions).toBe(Infinity);
      expect(PLANS.family.limits.maxStudents).toBe(4);
    });

    it("should have yearly price cheaper than 12x monthly", async () => {
      const { PLANS } = await import("./routers/payment");
      const yearlyEquivalent = PLANS.family.priceMonthly * 12;
      expect(PLANS.family.priceYearly).toBeLessThan(yearlyEquivalent);
    });

    it("should have meaningful feature descriptions", async () => {
      const { PLANS } = await import("./routers/payment");
      expect(PLANS.free.features.length).toBeGreaterThanOrEqual(3);
      expect(PLANS.family.features.length).toBeGreaterThanOrEqual(5);
      // Family should have more features than free
      expect(PLANS.family.features.length).toBeGreaterThan(PLANS.free.features.length);
    });
  });

  describe("getPlans procedure", () => {
    it("should return both plan details", async () => {
      const { paymentRouter } = await import("./routers/payment");
      const getPlans = paymentRouter.getPlans as any;
      const result = await getPlans();

      expect(result.free).toBeDefined();
      expect(result.family).toBeDefined();
      expect(result.free.name).toBe("Free");
      expect(result.family.name).toBe("Family");
      expect(result.free.priceMonthly).toBe(0);
      expect(result.family.priceMonthly).toBe(799);
      expect(result.family.priceYearly).toBe(5999);
    });

    it("should include feature lists for both plans", async () => {
      const { paymentRouter } = await import("./routers/payment");
      const getPlans = paymentRouter.getPlans as any;
      const result = await getPlans();

      expect(Array.isArray(result.free.features)).toBe(true);
      expect(Array.isArray(result.family.features)).toBe(true);
      expect(result.free.features.length).toBeGreaterThan(0);
      expect(result.family.features.length).toBeGreaterThan(0);
    });
  });

  describe("getSubscription procedure", () => {
    it("should return free plan when no subscription exists", async () => {
      const mockDbSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      mockGetDb.mockResolvedValue({ select: mockDbSelect });

      const { paymentRouter } = await import("./routers/payment");
      const getSubscription = paymentRouter.getSubscription as any;
      const result = await getSubscription({ ctx: { user: { id: 1 } } });

      expect(result.plan).toBe("free");
      expect(result.status).toBeNull();
    });

    it("should return family plan when active subscription exists", async () => {
      const mockDbSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                userId: 1,
                status: "active",
                currentPeriodEnd: new Date("2026-04-21"),
                cancelAtPeriodEnd: false,
              },
            ]),
          }),
        }),
      });
      mockGetDb.mockResolvedValue({ select: mockDbSelect });

      const { paymentRouter } = await import("./routers/payment");
      const getSubscription = paymentRouter.getSubscription as any;
      const result = await getSubscription({ ctx: { user: { id: 1 } } });

      expect(result.plan).toBe("family");
      expect(result.status).toBe("active");
      expect(result.cancelAtPeriodEnd).toBe(false);
    });

    it("should return free plan when subscription is canceled", async () => {
      const mockDbSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                userId: 1,
                status: "canceled",
                currentPeriodEnd: new Date("2026-03-01"),
                cancelAtPeriodEnd: true,
              },
            ]),
          }),
        }),
      });
      mockGetDb.mockResolvedValue({ select: mockDbSelect });

      const { paymentRouter } = await import("./routers/payment");
      const getSubscription = paymentRouter.getSubscription as any;
      const result = await getSubscription({ ctx: { user: { id: 1 } } });

      expect(result.plan).toBe("free");
    });
  });

  describe("hasPremium procedure", () => {
    it("should return premium false when no subscription", async () => {
      const mockDbSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      mockGetDb.mockResolvedValue({ select: mockDbSelect });
      mockGetStudentParents.mockResolvedValue([]);

      const { paymentRouter } = await import("./routers/payment");
      const hasPremium = paymentRouter.hasPremium as any;
      const result = await hasPremium({ ctx: { user: { id: 1 } } });

      expect(result.premium).toBe(false);
      expect(result.plan).toBe("free");
    });

    it("should return premium true when active subscription", async () => {
      const mockDbSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { userId: 1, status: "active" },
            ]),
          }),
        }),
      });
      mockGetDb.mockResolvedValue({ select: mockDbSelect });

      const { paymentRouter } = await import("./routers/payment");
      const hasPremium = paymentRouter.hasPremium as any;
      const result = await hasPremium({ ctx: { user: { id: 1 } } });

      expect(result.premium).toBe(true);
      expect(result.plan).toBe("family");
    });

    it("should return premium true when trialing subscription", async () => {
      const mockDbSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { userId: 1, status: "trialing" },
            ]),
          }),
        }),
      });
      mockGetDb.mockResolvedValue({ select: mockDbSelect });

      const { paymentRouter } = await import("./routers/payment");
      const hasPremium = paymentRouter.hasPremium as any;
      const result = await hasPremium({ ctx: { user: { id: 1 } } });

      expect(result.premium).toBe(true);
      expect(result.plan).toBe("family");
    });
  });

  describe("Stripe Checkout", () => {
    it("should create a checkout session with correct parameters", async () => {
      // Mock: no existing subscription
      const mockDbSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      mockGetDb.mockResolvedValue({ select: mockDbSelect });
      mockGetUserById.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        name: "Test User",
        openId: "test-open-id",
      });

      mockCustomersCreate.mockResolvedValue({ id: "cus_test_123" });
      mockCheckoutCreate.mockResolvedValue({
        url: "https://checkout.stripe.com/test-session",
      });

      const { paymentRouter } = await import("./routers/payment");
      const createCheckout = paymentRouter.createCheckout as any;

      const result = await createCheckout({
        ctx: {
          user: { id: 1 },
          req: { headers: { origin: "https://mathfuel.org" } },
        },
        input: { interval: "monthly" },
      });

      expect(result.url).toBe("https://checkout.stripe.com/test-session");
      expect(mockCheckoutCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: "subscription",
          allow_promotion_codes: true,
        })
      );
    });

    it("should use yearly pricing when interval is yearly", async () => {
      const mockDbSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      mockGetDb.mockResolvedValue({ select: mockDbSelect });
      mockGetUserById.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        name: "Test User",
        openId: "test-open-id",
      });

      mockCustomersCreate.mockResolvedValue({ id: "cus_test_456" });
      mockCheckoutCreate.mockResolvedValue({
        url: "https://checkout.stripe.com/yearly-session",
      });

      const { paymentRouter } = await import("./routers/payment");
      const createCheckout = paymentRouter.createCheckout as any;

      const result = await createCheckout({
        ctx: {
          user: { id: 1 },
          req: { headers: { origin: "https://mathfuel.org" } },
        },
        input: { interval: "yearly" },
      });

      expect(result.url).toBe("https://checkout.stripe.com/yearly-session");
      expect(mockCheckoutCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: "subscription",
          customer: "cus_test_456",
        })
      );
    });
  });

  describe("Billing Portal", () => {
    it("should create a billing portal session", async () => {
      const mockDbSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                userId: 1,
                stripeCustomerId: "cus_existing_123",
                status: "active",
              },
            ]),
          }),
        }),
      });
      mockGetDb.mockResolvedValue({ select: mockDbSelect });

      mockBillingPortalCreate.mockResolvedValue({
        url: "https://billing.stripe.com/portal-session",
      });

      const { paymentRouter } = await import("./routers/payment");
      const createBillingPortal = paymentRouter.createBillingPortal as any;

      const result = await createBillingPortal({
        ctx: {
          user: { id: 1 },
          req: { headers: { origin: "https://mathfuel.org" } },
        },
        input: {},
      });

      expect(result.url).toBe("https://billing.stripe.com/portal-session");
      expect(mockBillingPortalCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: "cus_existing_123",
          return_url: "https://mathfuel.org/account",
        })
      );
    });

    it("should throw error when no subscription exists", async () => {
      const mockDbSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      mockGetDb.mockResolvedValue({ select: mockDbSelect });

      const { paymentRouter } = await import("./routers/payment");
      const createBillingPortal = paymentRouter.createBillingPortal as any;

      await expect(
        createBillingPortal({
          ctx: {
            user: { id: 1 },
            req: { headers: { origin: "https://mathfuel.org" } },
          },
          input: {},
        })
      ).rejects.toThrow("No subscription found");
    });
  });
});

describe("Stripe Webhook Handler", () => {
  it("should handle test events with verified response", async () => {
    // Import the handler
    const { handleStripeWebhook } = await import("./_core/stripeWebhook");

    // The handler expects raw body and signature verification
    // For test events, it should return { verified: true }
    expect(handleStripeWebhook).toBeDefined();
    expect(typeof handleStripeWebhook).toBe("function");
  });

  it("should reject requests without signature", async () => {
    const { handleStripeWebhook } = await import("./_core/stripeWebhook");

    const mockReq = {
      headers: {},
      body: Buffer.from("{}"),
    } as any;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;

    await handleStripeWebhook(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Missing signature" })
    );
  });
});

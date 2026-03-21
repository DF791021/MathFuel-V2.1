import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock db module ──
const mockGetDb = vi.fn();
const mockGetUserById = vi.fn();

vi.mock("./db", () => ({
  getDb: mockGetDb,
  getUserById: mockGetUserById,
}));

// ── Mock drizzle schema ──
vi.mock("../drizzle/schema", () => ({
  referralCodes: {
    id: "id",
    userId: "userId",
    code: "code",
    totalReferrals: "totalReferrals",
    totalRewardMonths: "totalRewardMonths",
    isActive: "isActive",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  },
  referrals: {
    id: "id",
    referrerUserId: "referrerUserId",
    refereeUserId: "refereeUserId",
    referralCodeId: "referralCodeId",
    status: "status",
    rewardAppliedAt: "rewardAppliedAt",
    stripeCouponId: "stripeCouponId",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  },
  subscriptions: {
    id: "id",
    userId: "userId",
    stripeCustomerId: "stripeCustomerId",
    stripeSubscriptionId: "stripeSubscriptionId",
    status: "status",
  },
  users: {
    id: "id",
    email: "email",
    openId: "openId",
    name: "name",
  },
}));

// ── Mock drizzle-orm ──
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a, b) => ({ field: a, value: b })),
  and: vi.fn((...args: any[]) => ({ and: args })),
  desc: vi.fn((a) => ({ desc: a })),
  sql: vi.fn(),
}));

// ── Mock Stripe ──
const mockCouponsCreate = vi.fn();
const mockSubscriptionsUpdate = vi.fn();

vi.mock("stripe", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      coupons: {
        create: mockCouponsCreate,
      },
      subscriptions: {
        update: mockSubscriptionsUpdate,
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

// ── Mock _core/notification ──
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// ── DB mock helpers ──
function createMockDbChain(returnValue: any[] = []) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(returnValue),
    orderBy: vi.fn().mockResolvedValue(returnValue),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    $returningId: vi.fn().mockResolvedValue([{ id: 1 }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  };
  // Make where chainable for update
  chain.where.mockReturnValue(chain);
  chain.set.mockReturnValue(chain);
  return chain;
}

describe("Referral Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  });

  describe("validateCode procedure", () => {
    it("should return valid=true for an active referral code", async () => {
      const mockDb = createMockDbChain([{ id: 1, userId: 42, isActive: true }]);
      mockGetDb.mockResolvedValue(mockDb);
      mockGetUserById.mockResolvedValue({ id: 42, name: "Duncan Furrh" });

      const { referralRouter } = await import("./routers/referral");
      const validateCode = referralRouter.validateCode as any;
      const result = await validateCode({ input: { code: "DUNCAN-AB12" } });

      expect(result.valid).toBe(true);
      expect(result.referrerName).toBe("Duncan");
    });

    it("should return valid=false for a non-existent code", async () => {
      const mockDb = createMockDbChain([]);
      mockGetDb.mockResolvedValue(mockDb);

      const { referralRouter } = await import("./routers/referral");
      const validateCode = referralRouter.validateCode as any;
      const result = await validateCode({ input: { code: "INVALID" } });

      expect(result.valid).toBe(false);
      expect(result.referrerName).toBeNull();
    });

    it("should return valid=false for an inactive code", async () => {
      const mockDb = createMockDbChain([{ id: 1, userId: 42, isActive: false }]);
      mockGetDb.mockResolvedValue(mockDb);

      const { referralRouter } = await import("./routers/referral");
      const validateCode = referralRouter.validateCode as any;
      const result = await validateCode({ input: { code: "DUNCAN-AB12" } });

      expect(result.valid).toBe(false);
    });

    it("should return valid=false when database is unavailable", async () => {
      mockGetDb.mockResolvedValue(null);

      const { referralRouter } = await import("./routers/referral");
      const validateCode = referralRouter.validateCode as any;
      const result = await validateCode({ input: { code: "DUNCAN-AB12" } });

      expect(result.valid).toBe(false);
    });
  });

  describe("getMyCode procedure", () => {
    it("should return existing code for a user", async () => {
      const existingCode = {
        id: 1,
        userId: 10,
        code: "DUNCAN-XY99",
        totalReferrals: 3,
        totalRewardMonths: 2,
        isActive: true,
      };
      const mockDb = createMockDbChain([existingCode]);
      mockGetDb.mockResolvedValue(mockDb);
      mockGetUserById.mockResolvedValue({ id: 10, name: "Duncan" });

      const { referralRouter } = await import("./routers/referral");
      const getMyCode = referralRouter.getMyCode as any;
      const result = await getMyCode({ ctx: { user: { id: 10 } } });

      expect(result.code).toBe("DUNCAN-XY99");
      expect(result.totalReferrals).toBe(3);
      expect(result.totalRewardMonths).toBe(2);
      expect(result.isActive).toBe(true);
    });

    it("should create a new code if user doesn't have one", async () => {
      // First call returns empty (no existing code), second call returns empty (no collision)
      const mockDb = createMockDbChain([]);
      mockGetDb.mockResolvedValue(mockDb);
      mockGetUserById.mockResolvedValue({ id: 10, name: "Duncan" });

      const { referralRouter } = await import("./routers/referral");
      const getMyCode = referralRouter.getMyCode as any;
      const result = await getMyCode({ ctx: { user: { id: 10 } } });

      expect(result.code).toBeDefined();
      expect(result.code.length).toBeGreaterThan(0);
      expect(result.totalReferrals).toBe(0);
      expect(result.totalRewardMonths).toBe(0);
    });
  });

  describe("recordReferral procedure", () => {
    it("should reject self-referral", async () => {
      const mockDb = createMockDbChain([{ id: 1, userId: 10, isActive: true }]);
      mockGetDb.mockResolvedValue(mockDb);

      const { referralRouter } = await import("./routers/referral");
      const recordReferral = referralRouter.recordReferral as any;
      const result = await recordReferral({
        ctx: { user: { id: 10 } },
        input: { code: "DUNCAN-AB12" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("own referral code");
    });

    it("should reject invalid referral code", async () => {
      const mockDb = createMockDbChain([]);
      mockGetDb.mockResolvedValue(mockDb);

      const { referralRouter } = await import("./routers/referral");
      const recordReferral = referralRouter.recordReferral as any;
      const result = await recordReferral({
        ctx: { user: { id: 20 } },
        input: { code: "INVALID" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid referral code");
    });

    it("should reject duplicate referral", async () => {
      // First call: find the code (valid)
      // Second call: find existing referral for this user
      let callCount = 0;
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve([{ id: 1, userId: 42, isActive: true }]);
          }
          return Promise.resolve([{ id: 99 }]); // existing referral
        }),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
      };
      mockGetDb.mockResolvedValue(mockDb);

      const { referralRouter } = await import("./routers/referral");
      const recordReferral = referralRouter.recordReferral as any;
      const result = await recordReferral({
        ctx: { user: { id: 20 } },
        input: { code: "DUNCAN-AB12" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("already been referred");
    });

    it("should successfully record a valid referral", async () => {
      let callCount = 0;
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve([{ id: 1, userId: 42, isActive: true }]);
          }
          return Promise.resolve([]); // no existing referral
        }),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
      };
      // Make set/where chainable for the update
      mockDb.set.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockGetDb.mockResolvedValue(mockDb);

      const { referralRouter } = await import("./routers/referral");
      const recordReferral = referralRouter.recordReferral as any;
      const result = await recordReferral({
        ctx: { user: { id: 20 } },
        input: { code: "DUNCAN-AB12" },
      });

      expect(result.success).toBe(true);
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe("getDashboard procedure", () => {
    it("should return code and referral list", async () => {
      const existingCode = {
        id: 1,
        userId: 10,
        code: "DUNCAN-XY99",
        totalReferrals: 1,
        totalRewardMonths: 1,
        isActive: true,
      };
      let selectCallCount = 0;
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockImplementation(() => {
          selectCallCount++;
          return Promise.resolve([existingCode]);
        }),
        orderBy: vi.fn().mockResolvedValue([
          {
            id: 1,
            refereeUserId: 20,
            status: "rewarded",
            createdAt: new Date(),
            rewardAppliedAt: new Date(),
          },
        ]),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
      };
      mockGetDb.mockResolvedValue(mockDb);
      mockGetUserById.mockResolvedValue({ id: 20, name: "Jane Smith", email: "jane@test.com" });

      const { referralRouter } = await import("./routers/referral");
      const getDashboard = referralRouter.getDashboard as any;
      const result = await getDashboard({ ctx: { user: { id: 10 } } });

      expect(result.code).toBe("DUNCAN-XY99");
      expect(result.totalReferrals).toBe(1);
      expect(result.totalRewardMonths).toBe(1);
      expect(result.referrals).toHaveLength(1);
      expect(result.referrals[0].refereeName).toBe("Jane Smith");
    });
  });

  describe("getStats procedure (admin)", () => {
    it("should return null for non-admin users", async () => {
      const mockDb = createMockDbChain([]);
      mockGetDb.mockResolvedValue(mockDb);

      const { referralRouter } = await import("./routers/referral");
      const getStats = referralRouter.getStats as any;
      const result = await getStats({ ctx: { user: { id: 1, role: "user" } } });

      expect(result).toBeNull();
    });

    it("should return stats for admin users", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 5 }]),
      };
      // For the first two calls (totalCodes, totalReferrals), from returns directly
      // For the third call (totalRewarded), where is called
      let fromCallCount = 0;
      mockDb.from.mockImplementation(() => {
        fromCallCount++;
        if (fromCallCount <= 2) {
          return Promise.resolve([{ count: fromCallCount === 1 ? 10 : 25 }]);
        }
        return mockDb; // return chain for where call
      });
      mockGetDb.mockResolvedValue(mockDb);

      const { referralRouter } = await import("./routers/referral");
      const getStats = referralRouter.getStats as any;
      const result = await getStats({ ctx: { user: { id: 1, role: "admin" } } });

      expect(result).not.toBeNull();
      expect(result.totalCodes).toBeDefined();
      expect(result.totalReferrals).toBeDefined();
      expect(result.totalRewarded).toBeDefined();
    });
  });

  describe("Referral code generation", () => {
    it("should generate codes with user name prefix", async () => {
      const mockDb = createMockDbChain([]);
      mockGetDb.mockResolvedValue(mockDb);
      mockGetUserById.mockResolvedValue({ id: 10, name: "Duncan" });

      const { referralRouter } = await import("./routers/referral");
      const getMyCode = referralRouter.getMyCode as any;
      const result = await getMyCode({ ctx: { user: { id: 10 } } });

      // Code should start with DUNCAN (uppercase of name)
      expect(result.code).toMatch(/^DUNCAN-/);
    });

    it("should generate codes with MATH prefix when name is null", async () => {
      const mockDb = createMockDbChain([]);
      mockGetDb.mockResolvedValue(mockDb);
      mockGetUserById.mockResolvedValue({ id: 10, name: null });

      const { referralRouter } = await import("./routers/referral");
      const getMyCode = referralRouter.getMyCode as any;
      const result = await getMyCode({ ctx: { user: { id: 10 } } });

      expect(result.code).toMatch(/^MATH-/);
    });
  });

  describe("processReferralRewardFromWebhook", () => {
    it("should do nothing if no pending referral exists", async () => {
      const mockDb = createMockDbChain([]);
      mockGetDb.mockResolvedValue(mockDb);

      const { processReferralRewardFromWebhook } = await import("./routers/referral");
      await processReferralRewardFromWebhook(999);

      expect(mockCouponsCreate).not.toHaveBeenCalled();
    });

    it("should create coupon and apply to referrer subscription", async () => {
      const pendingReferral = {
        id: 1,
        referrerUserId: 42,
        refereeUserId: 99,
        referralCodeId: 5,
        status: "signed_up",
      };

      let selectCallCount = 0;
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockImplementation(() => {
          selectCallCount++;
          if (selectCallCount === 1) {
            return Promise.resolve([pendingReferral]);
          }
          // Referrer's subscription
          return Promise.resolve([
            { stripeSubscriptionId: "sub_test_123", userId: 42 },
          ]);
        }),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
      };
      mockDb.set.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockGetDb.mockResolvedValue(mockDb);
      mockCouponsCreate.mockResolvedValue({ id: "coupon_test_abc" });
      mockSubscriptionsUpdate.mockResolvedValue({});

      const { processReferralRewardFromWebhook } = await import("./routers/referral");
      await processReferralRewardFromWebhook(99);

      expect(mockCouponsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          percent_off: 100,
          duration: "once",
          name: "Referral Reward - 1 Free Month",
        })
      );
      expect(mockSubscriptionsUpdate).toHaveBeenCalledWith(
        "sub_test_123",
        expect.objectContaining({
          discounts: [{ coupon: "coupon_test_abc" }],
        })
      );
    });
  });
});

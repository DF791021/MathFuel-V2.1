import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

/**
 * Unit tests for the adminSettings router.
 * Covers CRUD operations on feature flags, admin settings, and audit log retrieval.
 * All database calls are mocked.
 */

// ── Mock db module ──
const mockGetAllFeatureFlags = vi.fn();
const mockSetFeatureFlag = vi.fn();
const mockGetAllAdminSettings = vi.fn();
const mockSetAdminSetting = vi.fn();
const mockGetAuditLogs = vi.fn();

vi.mock("./db", () => ({
  getAllFeatureFlags: (...args: any[]) => mockGetAllFeatureFlags(...args),
  setFeatureFlag: (...args: any[]) => mockSetFeatureFlag(...args),
  getAllAdminSettings: (...args: any[]) => mockGetAllAdminSettings(...args),
  setAdminSetting: (...args: any[]) => mockSetAdminSetting(...args),
  getAuditLogs: (...args: any[]) => mockGetAuditLogs(...args),
}));

// ── Import after mocks ──
import { adminSettingsRouter } from "./routers/adminSettings";

// ── Test helpers ──
function createCaller(user?: { id: number; role: string; name?: string }) {
  const ctx: any = { user: user ?? null, req: {}, res: {} };
  return adminSettingsRouter.createCaller(ctx);
}

const adminUser = { id: 1, role: "admin" as const, name: "Admin User" };
const regularUser = { id: 2, role: "student" as const };

// ── Tests ──

describe("adminSettings router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authorization guards ──

  describe("authorization", () => {
    it("should throw UNAUTHORIZED when no user is present for getFeatureFlags", async () => {
      const caller = createCaller(undefined);
      await expect(caller.getFeatureFlags()).rejects.toThrow(TRPCError);
    });

    it("should throw FORBIDDEN when a non-admin calls getFeatureFlags", async () => {
      const caller = createCaller(regularUser);
      await expect(caller.getFeatureFlags()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should throw FORBIDDEN when a non-admin calls toggleFeatureFlag", async () => {
      const caller = createCaller(regularUser);
      await expect(
        caller.toggleFeatureFlag({ name: "someFlag", enabled: true })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("should throw FORBIDDEN when a non-admin calls getSettings", async () => {
      const caller = createCaller(regularUser);
      await expect(caller.getSettings()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("should throw FORBIDDEN when a non-admin calls setSetting", async () => {
      const caller = createCaller(regularUser);
      await expect(
        caller.setSetting({ key: "k", value: "v", type: "string" })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("should throw FORBIDDEN when a non-admin calls getAuditLogs", async () => {
      const caller = createCaller(regularUser);
      await expect(caller.getAuditLogs()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });

  // ── getFeatureFlags ──

  describe("getFeatureFlags", () => {
    it("should return all feature flags for admin", async () => {
      const flags = [
        { name: "new_ui", enabled: true },
        { name: "beta_mode", enabled: false },
      ];
      mockGetAllFeatureFlags.mockResolvedValue(flags);
      const caller = createCaller(adminUser);
      const result = await caller.getFeatureFlags();
      expect(result).toEqual(flags);
      expect(mockGetAllFeatureFlags).toHaveBeenCalledTimes(1);
    });

    it("should return empty array when no flags exist", async () => {
      mockGetAllFeatureFlags.mockResolvedValue([]);
      const caller = createCaller(adminUser);
      const result = await caller.getFeatureFlags();
      expect(result).toEqual([]);
    });

    it("should propagate db errors", async () => {
      mockGetAllFeatureFlags.mockRejectedValue(new Error("DB error"));
      const caller = createCaller(adminUser);
      await expect(caller.getFeatureFlags()).rejects.toThrow("DB error");
    });
  });

  // ── toggleFeatureFlag ──

  describe("toggleFeatureFlag", () => {
    it("should enable a feature flag and return success", async () => {
      mockSetFeatureFlag.mockResolvedValue(undefined);
      const caller = createCaller(adminUser);
      const result = await caller.toggleFeatureFlag({ name: "beta_mode", enabled: true });
      expect(result).toEqual({ success: true });
      expect(mockSetFeatureFlag).toHaveBeenCalledWith("beta_mode", true, "Admin User");
    });

    it("should disable a feature flag and return success", async () => {
      mockSetFeatureFlag.mockResolvedValue(undefined);
      const caller = createCaller(adminUser);
      const result = await caller.toggleFeatureFlag({ name: "beta_mode", enabled: false });
      expect(result).toEqual({ success: true });
      expect(mockSetFeatureFlag).toHaveBeenCalledWith("beta_mode", false, "Admin User");
    });

    it("should use 'admin' as owner when user has no name", async () => {
      mockSetFeatureFlag.mockResolvedValue(undefined);
      const noNameAdmin = { id: 3, role: "admin" as const, name: undefined };
      const caller = createCaller(noNameAdmin);
      await caller.toggleFeatureFlag({ name: "flag_x", enabled: true });
      expect(mockSetFeatureFlag).toHaveBeenCalledWith("flag_x", true, "admin");
    });

    it("should propagate db errors", async () => {
      mockSetFeatureFlag.mockRejectedValue(new Error("write error"));
      const caller = createCaller(adminUser);
      await expect(
        caller.toggleFeatureFlag({ name: "bad_flag", enabled: true })
      ).rejects.toThrow("write error");
    });
  });

  // ── getSettings ──

  describe("getSettings", () => {
    it("should return all admin settings for admin", async () => {
      const settings = [
        { key: "max_students", value: 100, type: "number" },
        { key: "welcome_msg", value: "Hello", type: "string" },
      ];
      mockGetAllAdminSettings.mockResolvedValue(settings);
      const caller = createCaller(adminUser);
      const result = await caller.getSettings();
      expect(result).toEqual(settings);
      expect(mockGetAllAdminSettings).toHaveBeenCalledTimes(1);
    });

    it("should return empty array when no settings exist", async () => {
      mockGetAllAdminSettings.mockResolvedValue([]);
      const caller = createCaller(adminUser);
      const result = await caller.getSettings();
      expect(result).toEqual([]);
    });
  });

  // ── setSetting ──

  describe("setSetting", () => {
    it("should set a string setting and return success", async () => {
      mockSetAdminSetting.mockResolvedValue(undefined);
      const caller = createCaller(adminUser);
      const result = await caller.setSetting({
        key: "site_title",
        value: "MathFuel",
        type: "string",
        description: "Site title",
      });
      expect(result).toEqual({ success: true });
      expect(mockSetAdminSetting).toHaveBeenCalledWith(
        "site_title",
        "MathFuel",
        "string",
        "Site title",
        adminUser.id
      );
    });

    it("should set a boolean setting and return success", async () => {
      mockSetAdminSetting.mockResolvedValue(undefined);
      const caller = createCaller(adminUser);
      const result = await caller.setSetting({
        key: "maintenance_mode",
        value: true,
        type: "boolean",
      });
      expect(result).toEqual({ success: true });
      expect(mockSetAdminSetting).toHaveBeenCalledWith(
        "maintenance_mode",
        true,
        "boolean",
        "",       // description defaults to empty string
        adminUser.id
      );
    });

    it("should set a number setting and return success", async () => {
      mockSetAdminSetting.mockResolvedValue(undefined);
      const caller = createCaller(adminUser);
      const result = await caller.setSetting({
        key: "max_attempts",
        value: 5,
        type: "number",
      });
      expect(result).toEqual({ success: true });
    });

    it("should set a json setting and return success", async () => {
      mockSetAdminSetting.mockResolvedValue(undefined);
      const caller = createCaller(adminUser);
      const payload = { feature: "a", weights: [1, 2, 3] };
      const result = await caller.setSetting({
        key: "config",
        value: payload,
        type: "json",
      });
      expect(result).toEqual({ success: true });
      expect(mockSetAdminSetting).toHaveBeenCalledWith(
        "config",
        payload,
        "json",
        "",
        adminUser.id
      );
    });

    it("should propagate db errors", async () => {
      mockSetAdminSetting.mockRejectedValue(new Error("constraint violation"));
      const caller = createCaller(adminUser);
      await expect(
        caller.setSetting({ key: "k", value: "v", type: "string" })
      ).rejects.toThrow("constraint violation");
    });
  });

  // ── getAuditLogs ──

  describe("getAuditLogs", () => {
    it("should return audit logs with default limit of 100", async () => {
      const logs = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        action: "UPDATE_SETTING",
        userId: 1,
        createdAt: new Date().toISOString(),
      }));
      mockGetAuditLogs.mockResolvedValue(logs);
      const caller = createCaller(adminUser);
      const result = await caller.getAuditLogs();
      expect(result).toEqual(logs);
      expect(mockGetAuditLogs).toHaveBeenCalledWith(100);
    });

    it("should pass a custom limit to the db", async () => {
      mockGetAuditLogs.mockResolvedValue([]);
      const caller = createCaller(adminUser);
      await caller.getAuditLogs({ limit: 25 });
      expect(mockGetAuditLogs).toHaveBeenCalledWith(25);
    });

    it("should respect maximum limit of 500", async () => {
      mockGetAuditLogs.mockResolvedValue([]);
      const caller = createCaller(adminUser);
      // Passing a value above the max should be rejected at the input validation layer
      await expect(caller.getAuditLogs({ limit: 501 })).rejects.toThrow();
    });

    it("should reject a limit below 1", async () => {
      mockGetAuditLogs.mockResolvedValue([]);
      const caller = createCaller(adminUser);
      await expect(caller.getAuditLogs({ limit: 0 })).rejects.toThrow();
    });

    it("should return empty array when no audit logs exist", async () => {
      mockGetAuditLogs.mockResolvedValue([]);
      const caller = createCaller(adminUser);
      const result = await caller.getAuditLogs({ limit: 50 });
      expect(result).toEqual([]);
    });

    it("should propagate db errors", async () => {
      mockGetAuditLogs.mockRejectedValue(new Error("query failed"));
      const caller = createCaller(adminUser);
      await expect(caller.getAuditLogs()).rejects.toThrow("query failed");
    });
  });
});

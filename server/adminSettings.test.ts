/**
 * Admin Settings Tests
 * Tests for feature flags and admin settings management
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAllFeatureFlags,
  getFeatureFlag,
  isFeatureFlagEnabled,
  toggleFeatureFlag,
  getAdminSetting,
  setAdminSetting,
  getMaintenanceModeStatus,
  enableMaintenanceMode,
  disableMaintenanceMode,
  getAnnouncementBanner,
  setAnnouncementBanner,
} from "./adminSettings";

// Mock getDb
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

describe("Admin Settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Feature Flags", () => {
    it("should get all feature flags", async () => {
      const { getDb } = await import("./db");
      const mockSelect = vi.fn().mockReturnValue([
        {
          name: "maintenance_mode",
          enabled: false,
          description: "Maintenance mode",
          owner: "DevOps",
        },
      ]);

      (getDb as any).mockResolvedValue({
        select: () => ({
          from: mockSelect,
        }),
      });

      const flags = await getAllFeatureFlags();
      expect(flags).toBeDefined();
    });

    it("should check if feature flag is enabled", async () => {
      const { getDb } = await import("./db");
      const mockWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([
          {
            name: "maintenance_mode",
            enabled: true,
          },
        ]),
      });

      (getDb as any).mockResolvedValue({
        select: () => ({
          from: () => ({
            where: mockWhere,
          }),
        }),
      });

      const enabled = await isFeatureFlagEnabled("maintenance_mode");
      expect(typeof enabled).toBe("boolean");
    });

    it("should return default value if flag not found", async () => {
      const { getDb } = await import("./db");
      const mockWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      });

      (getDb as any).mockResolvedValue({
        select: () => ({
          from: () => ({
            where: mockWhere,
          }),
        }),
      });

      const enabled = await isFeatureFlagEnabled("maintenance_mode");
      expect(typeof enabled).toBe("boolean");
    });

    it("should toggle a feature flag", async () => {
      const { getDb } = await import("./db");
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      const mockWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([
          {
            name: "maintenance_mode",
            enabled: false,
          },
        ]),
      });

      (getDb as any).mockResolvedValue({
        select: () => ({
          from: () => ({
            where: mockWhere,
          }),
        }),
        update: mockUpdate,
      });

      const result = await toggleFeatureFlag("maintenance_mode", true, 1);
      expect(result.success).toBe(true);
      expect(result.enabled).toBe(true);
    });
  });

  describe("Admin Settings", () => {
    it("should get admin setting by key", async () => {
      const { getDb } = await import("./db");
      const mockWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([
          {
            key: "maintenance_mode_enabled",
            value: true,
            type: "boolean",
          },
        ]),
      });

      (getDb as any).mockResolvedValue({
        select: () => ({
          from: () => ({
            where: mockWhere,
          }),
        }),
      });

      const setting = await getAdminSetting("maintenance_mode_enabled");
      expect(setting).toBeDefined();
    });

    it("should set admin setting", async () => {
      const { getDb } = await import("./db");
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const mockWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      });

      (getDb as any).mockResolvedValue({
        select: () => ({
          from: () => ({
            where: mockWhere,
          }),
        }),
        insert: mockInsert,
      });

      const result = await setAdminSetting("test_key", "test_value", "string", "Test setting", 1);
      expect(result.success).toBe(true);
      expect(result.key).toBe("test_key");
    });
  });

  describe("Maintenance Mode", () => {
    it("should get maintenance mode status", async () => {
      const { getDb } = await import("./db");
      const mockWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      });

      (getDb as any).mockResolvedValue({
        select: () => ({
          from: () => ({
            where: mockWhere,
          }),
        }),
      });

      const status = await getMaintenanceModeStatus();
      expect(status).toHaveProperty("enabled");
      expect(status).toHaveProperty("message");
      expect(typeof status.enabled).toBe("boolean");
    });

    it("should enable maintenance mode", async () => {
      const { getDb } = await import("./db");
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const mockWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      });

      (getDb as any).mockResolvedValue({
        select: () => ({
          from: () => ({
            where: mockWhere,
          }),
        }),
        insert: mockInsert,
      });

      const result = await enableMaintenanceMode("System under maintenance", 1);
      expect(result.success).toBe(true);
    });

    it("should disable maintenance mode", async () => {
      const { getDb } = await import("./db");
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const mockWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      });

      (getDb as any).mockResolvedValue({
        select: () => ({
          from: () => ({
            where: mockWhere,
          }),
        }),
        insert: mockInsert,
      });

      const result = await disableMaintenanceMode(1);
      expect(result.success).toBe(true);
    });
  });

  describe("Announcement Banner", () => {
    it("should get announcement banner", async () => {
      const { getDb } = await import("./db");
      const mockWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      });

      (getDb as any).mockResolvedValue({
        select: () => ({
          from: () => ({
            where: mockWhere,
          }),
        }),
      });

      const announcement = await getAnnouncementBanner();
      expect(announcement).toHaveProperty("enabled");
      expect(announcement).toHaveProperty("message");
    });

    it("should set announcement banner", async () => {
      const { getDb } = await import("./db");
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const mockWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      });

      (getDb as any).mockResolvedValue({
        select: () => ({
          from: () => ({
            where: mockWhere,
          }),
        }),
        insert: mockInsert,
      });

      const result = await setAnnouncementBanner("Important announcement", true, 1);
      expect(result.success).toBe(true);
    });
  });
});

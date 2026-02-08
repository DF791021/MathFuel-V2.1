/**
 * Admin Settings Router
 * tRPC procedures for managing feature flags and admin settings
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  getAllFeatureFlags,
  getFeatureFlag,
  toggleFeatureFlag,
  getMaintenanceModeStatus,
  enableMaintenanceMode,
  disableMaintenanceMode,
  getAnnouncementBanner,
  setAnnouncementBanner,
} from "../adminSettings";
import { getAllFeatureFlagNames } from "../../shared/featureFlags";

/**
 * Admin-only middleware
 */
const adminOnly = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  return next({ ctx });
});

export const adminSettingsRouter = router({
  /**
   * Get all feature flags
   */
  getAllFlags: adminOnly.query(async () => {
    return getAllFeatureFlags();
  }),

  /**
   * Get a specific feature flag
   */
  getFlag: adminOnly.input(z.object({ name: z.string() })).query(async ({ input }) => {
    return getFeatureFlag(input.name as any);
  }),

  /**
   * Toggle a feature flag
   */
  toggleFlag: adminOnly
    .input(
      z.object({
        name: z.string(),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return toggleFeatureFlag(input.name as any, input.enabled, ctx.user.id);
    }),

  /**
   * Get maintenance mode status
   */
  getMaintenanceMode: adminOnly.query(async () => {
    return getMaintenanceModeStatus();
  }),

  /**
   * Enable maintenance mode
   */
  enableMaintenance: adminOnly
    .input(
      z.object({
        message: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return enableMaintenanceMode(input.message, ctx.user.id);
    }),

  /**
   * Disable maintenance mode
   */
  disableMaintenance: adminOnly.mutation(async ({ ctx }) => {
    return disableMaintenanceMode(ctx.user.id);
  }),

  /**
   * Get announcement banner
   */
  getAnnouncement: adminOnly.query(async () => {
    return getAnnouncementBanner();
  }),

  /**
   * Set announcement banner
   */
  setAnnouncement: adminOnly
    .input(
      z.object({
        message: z.string().min(1).max(500),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return setAnnouncementBanner(input.message, input.enabled, ctx.user.id);
    }),

  /**
   * Get all available feature flag names (for UI)
   */
  getAvailableFlags: adminOnly.query(async () => {
    return getAllFeatureFlagNames();
  }),
});

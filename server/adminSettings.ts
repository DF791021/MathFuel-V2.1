/**
 * Admin Settings Database Helpers
 * Manages feature flags, maintenance mode, and system settings
 */

import { getDb } from "./db";
import { featureFlags, adminSettings } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { FeatureFlagName, FEATURE_FLAG_DEFINITIONS, isValidFeatureFlagName } from "../shared/featureFlags";

/**
 * Get all feature flags
 */
export async function getAllFeatureFlags() {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const flags = await db.select().from(featureFlags);
    return flags;
  } catch (error) {
    console.error("Failed to get feature flags:", error);
    throw error;
  }
}

/**
 * Get a specific feature flag by name
 */
export async function getFeatureFlag(name: FeatureFlagName) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const flag = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.name, name))
      .limit(1);

    return flag[0] || null;
  } catch (error) {
    console.error(`Failed to get feature flag ${name}:`, error);
    throw error;
  }
}

/**
 * Check if a feature flag is enabled
 */
export async function isFeatureFlagEnabled(name: FeatureFlagName): Promise<boolean> {
  try {
    const flag = await getFeatureFlag(name);
    return flag?.enabled ?? FEATURE_FLAG_DEFINITIONS[name].defaultEnabled;
  } catch (error) {
    console.error(`Failed to check feature flag ${name}:`, error);
    // Return default value on error
    return FEATURE_FLAG_DEFINITIONS[name].defaultEnabled;
  }
}

/**
 * Toggle a feature flag
 */
export async function toggleFeatureFlag(name: FeatureFlagName, enabled: boolean, updatedBy: number) {
  try {
    if (!isValidFeatureFlagName(name)) {
      throw new Error(`Invalid feature flag name: ${name}`);
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const existingFlag = await getFeatureFlag(name);

    if (existingFlag) {
      // Update existing flag
      await db
        .update(featureFlags)
        .set({
          enabled,
          updatedAt: new Date(),
        })
        .where(eq(featureFlags.name, name));
    } else {
      // Create new flag with default values
      const definition = FEATURE_FLAG_DEFINITIONS[name];
      await db.insert(featureFlags).values({
        name,
        description: definition.description,
        owner: definition.owner,
        enabled,
        rolloutPercentage: 0,
        targetRoles: null,
      });
    }

    console.log(`Feature flag ${name} toggled to ${enabled} by user ${updatedBy}`);
    return { success: true, name, enabled };
  } catch (error) {
    console.error(`Failed to toggle feature flag ${name}:`, error);
    throw error;
  }
}

/**
 * Get admin setting by key
 */
export async function getAdminSetting(key: string) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const setting = await db
      .select()
      .from(adminSettings)
      .where(eq(adminSettings.key, key))
      .limit(1);

    return setting[0] || null;
  } catch (error) {
    console.error(`Failed to get admin setting ${key}:`, error);
    throw error;
  }
}

/**
 * Set admin setting
 */
export async function setAdminSetting(
  key: string,
  value: any,
  type: "boolean" | "string" | "number" | "json",
  description: string | null,
  updatedBy: number
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const existingSetting = await getAdminSetting(key);

    if (existingSetting) {
      // Update existing setting
      await db
        .update(adminSettings)
        .set({
          value,
          type,
          description,
          updatedBy,
          updatedAt: new Date(),
        })
        .where(eq(adminSettings.key, key));
    } else {
      // Create new setting
      await db.insert(adminSettings).values({
        key,
        value,
        type,
        description,
        updatedBy,
        updatedAt: new Date(),
      });
    }

    console.log(`Admin setting ${key} updated by user ${updatedBy}`);
    return { success: true, key, value };
  } catch (error) {
    console.error(`Failed to set admin setting ${key}:`, error);
    throw error;
  }
}

/**
 * Get maintenance mode status
 */
export async function getMaintenanceModeStatus() {
  try {
    const setting = await getAdminSetting("maintenance_mode_enabled");
    const messageS = await getAdminSetting("maintenance_mode_message");

    return {
      enabled: setting?.value ?? false,
      message: messageS?.value ?? "System is under maintenance. Please try again later.",
    };
  } catch (error) {
    console.error("Failed to get maintenance mode status:", error);
    return {
      enabled: false,
      message: "System is under maintenance. Please try again later.",
    };
  }
}

/**
 * Enable maintenance mode
 */
export async function enableMaintenanceMode(message: string, updatedBy: number) {
  try {
    await setAdminSetting("maintenance_mode_enabled", true, "boolean", "Maintenance mode enabled", updatedBy);
    await setAdminSetting("maintenance_mode_message", message, "string", "Maintenance mode message", updatedBy);
    console.log(`Maintenance mode enabled by user ${updatedBy}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to enable maintenance mode:", error);
    throw error;
  }
}

/**
 * Disable maintenance mode
 */
export async function disableMaintenanceMode(updatedBy: number) {
  try {
    await setAdminSetting("maintenance_mode_enabled", false, "boolean", "Maintenance mode disabled", updatedBy);
    console.log(`Maintenance mode disabled by user ${updatedBy}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to disable maintenance mode:", error);
    throw error;
  }
}

/**
 * Get announcement banner
 */
export async function getAnnouncementBanner() {
  try {
    const enabledSetting = await getAdminSetting("announcement_banner_enabled");
    const messageSetting = await getAdminSetting("announcement_banner_message");

    return {
      enabled: enabledSetting?.value ?? false,
      message: messageSetting?.value ?? "",
    };
  } catch (error) {
    console.error("Failed to get announcement banner:", error);
    return {
      enabled: false,
      message: "",
    };
  }
}

/**
 * Set announcement banner
 */
export async function setAnnouncementBanner(message: string, enabled: boolean, updatedBy: number) {
  try {
    await setAdminSetting("announcement_banner_enabled", enabled, "boolean", "Announcement banner enabled", updatedBy);
    await setAdminSetting("announcement_banner_message", message, "string", "Announcement banner message", updatedBy);
    console.log(`Announcement banner updated by user ${updatedBy}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to set announcement banner:", error);
    throw error;
  }
}

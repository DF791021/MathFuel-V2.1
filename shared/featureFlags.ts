/**
 * Feature Flags System
 * Typed, named flags with description and owner for operational control
 * All flags are stored in the database and can be toggled via admin panel
 */

export type FeatureFlagName =
  | "maintenance_mode"
  | "new_checkout_flow"
  | "ai_powered_recommendations"
  | "teacher_analytics_v2"
  | "student_achievements_beta"
  | "payment_retry_automation"
  | "email_digest_feature"
  | "webhook_retry_visualization"
  | "admin_impersonation"
  | "api_rate_limiting"
  | "advanced_reporting";

export interface FeatureFlag {
  name: FeatureFlagName;
  description: string;
  owner: string; // Team/person responsible
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string; // Admin who last toggled it
}

/**
 * Feature flag definitions with metadata
 * Used for documentation and validation
 */
export const FEATURE_FLAG_DEFINITIONS: Record<FeatureFlagName, {
  description: string;
  owner: string;
  defaultEnabled: boolean;
  category: "operational" | "feature" | "experimental";
}> = {
  maintenance_mode: {
    description: "Puts the entire platform in maintenance mode. All requests return 503 Service Unavailable.",
    owner: "DevOps",
    defaultEnabled: false,
    category: "operational",
  },
  new_checkout_flow: {
    description: "Enable new Stripe checkout flow with improved UX and error handling.",
    owner: "Product",
    defaultEnabled: false,
    category: "feature",
  },
  ai_powered_recommendations: {
    description: "Enable AI-powered challenge recommendations based on student performance.",
    owner: "ML Team",
    defaultEnabled: false,
    category: "experimental",
  },
  teacher_analytics_v2: {
    description: "Enable new teacher analytics dashboard with advanced insights.",
    owner: "Analytics",
    defaultEnabled: false,
    category: "feature",
  },
  student_achievements_beta: {
    description: "Enable new achievement system with badges and milestone tracking.",
    owner: "Product",
    defaultEnabled: false,
    category: "experimental",
  },
  payment_retry_automation: {
    description: "Automatically retry failed payments using exponential backoff.",
    owner: "Payments",
    defaultEnabled: false,
    category: "feature",
  },
  email_digest_feature: {
    description: "Enable email digest notifications for admins (daily/weekly summaries).",
    owner: "Notifications",
    defaultEnabled: false,
    category: "feature",
  },
  webhook_retry_visualization: {
    description: "Show webhook retry history and status in admin panel.",
    owner: "DevOps",
    defaultEnabled: true,
    category: "operational",
  },
  admin_impersonation: {
    description: "Allow admins to impersonate users for support troubleshooting.",
    owner: "Support",
    defaultEnabled: false,
    category: "operational",
  },
  api_rate_limiting: {
    description: "Enable API rate limiting to prevent abuse.",
    owner: "DevOps",
    defaultEnabled: true,
    category: "operational",
  },
  advanced_reporting: {
    description: "Enable advanced reporting features for district-level analytics.",
    owner: "Analytics",
    defaultEnabled: false,
    category: "feature",
  },
};

/**
 * Get feature flag definition
 */
export function getFeatureFlagDefinition(name: FeatureFlagName) {
  return FEATURE_FLAG_DEFINITIONS[name];
}

/**
 * Check if a feature flag name is valid
 */
export function isValidFeatureFlagName(name: string): name is FeatureFlagName {
  return name in FEATURE_FLAG_DEFINITIONS;
}

/**
 * Get all feature flag names
 */
export function getAllFeatureFlagNames(): FeatureFlagName[] {
  return Object.keys(FEATURE_FLAG_DEFINITIONS) as FeatureFlagName[];
}

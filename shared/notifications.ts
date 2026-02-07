/**
 * Notification Constants and Types
 * Admin-only notifications for parents, teachers, and administrators
 * No student-facing notifications in Phase 1
 */

export const NOTIFICATION_TYPES = {
  // Payment and account notifications
  PAYMENT_RECEIVED: "payment_received",
  PAYMENT_FAILED: "payment_failed",
  SUBSCRIPTION_EXPIRING: "subscription_expiring",
  SUBSCRIPTION_RENEWED: "subscription_renewed",
  ACCOUNT_CREATED: "account_created",
  ACCOUNT_UPDATED: "account_updated",
  PASSWORD_CHANGED: "password_changed",
  EMAIL_CHANGED: "email_changed",

  // System alerts
  SYSTEM_ALERT: "system_alert",
  MAINTENANCE_SCHEDULED: "maintenance_scheduled",
  SECURITY_ALERT: "security_alert",
  USAGE_LIMIT_WARNING: "usage_limit_warning",

  // Platform updates
  FEATURE_RELEASED: "feature_released",
  PRODUCT_UPDATE: "product_update",
  POLICY_CHANGED: "policy_changed",

  // Trial and onboarding
  TRIAL_STARTING: "trial_starting",
  TRIAL_EXPIRING: "trial_expiring",
  TRIAL_EXPIRED: "trial_expired",
  TRIAL_CONVERTED: "trial_converted",

  // Admin-specific
  NEW_FEEDBACK: "new_feedback",
  SUPPORT_TICKET_CREATED: "support_ticket_created",
  SUPPORT_TICKET_RESOLVED: "support_ticket_resolved",
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

/**
 * Notification icons for UI display
 */
export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  payment_received: "💰",
  payment_failed: "❌",
  subscription_expiring: "⏰",
  subscription_renewed: "✅",
  account_created: "👤",
  account_updated: "🔄",
  password_changed: "🔐",
  email_changed: "📧",
  system_alert: "⚠️",
  maintenance_scheduled: "🔧",
  security_alert: "🛡️",
  usage_limit_warning: "📊",
  feature_released: "✨",
  product_update: "📦",
  policy_changed: "📋",
  trial_starting: "🎯",
  trial_expiring: "⏳",
  trial_expired: "❌",
  trial_converted: "🎉",
  new_feedback: "💬",
  support_ticket_created: "🎫",
  support_ticket_resolved: "✓",
};

/**
 * Notification colors for UI styling (Tailwind classes)
 */
export const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  payment_received: "bg-green-50 border-l-green-500",
  payment_failed: "bg-red-50 border-l-red-500",
  subscription_expiring: "bg-yellow-50 border-l-yellow-500",
  subscription_renewed: "bg-green-50 border-l-green-500",
  account_created: "bg-blue-50 border-l-blue-500",
  account_updated: "bg-blue-50 border-l-blue-500",
  password_changed: "bg-purple-50 border-l-purple-500",
  email_changed: "bg-purple-50 border-l-purple-500",
  system_alert: "bg-orange-50 border-l-orange-500",
  maintenance_scheduled: "bg-orange-50 border-l-orange-500",
  security_alert: "bg-red-50 border-l-red-500",
  usage_limit_warning: "bg-yellow-50 border-l-yellow-500",
  feature_released: "bg-indigo-50 border-l-indigo-500",
  product_update: "bg-indigo-50 border-l-indigo-500",
  policy_changed: "bg-gray-50 border-l-gray-500",
  trial_starting: "bg-blue-50 border-l-blue-500",
  trial_expiring: "bg-yellow-50 border-l-yellow-500",
  trial_expired: "bg-red-50 border-l-red-500",
  trial_converted: "bg-green-50 border-l-green-500",
  new_feedback: "bg-blue-50 border-l-blue-500",
  support_ticket_created: "bg-blue-50 border-l-blue-500",
  support_ticket_resolved: "bg-green-50 border-l-green-500",
};

/**
 * Notification titles for display
 */
export const NOTIFICATION_TITLES: Record<NotificationType, string> = {
  payment_received: "Payment Received",
  payment_failed: "Payment Failed",
  subscription_expiring: "Subscription Expiring Soon",
  subscription_renewed: "Subscription Renewed",
  account_created: "Account Created",
  account_updated: "Account Updated",
  password_changed: "Password Changed",
  email_changed: "Email Changed",
  system_alert: "System Alert",
  maintenance_scheduled: "Maintenance Scheduled",
  security_alert: "Security Alert",
  usage_limit_warning: "Usage Limit Warning",
  feature_released: "New Feature Released",
  product_update: "Product Update",
  policy_changed: "Policy Changed",
  trial_starting: "Trial Starting",
  trial_expiring: "Trial Expiring",
  trial_expired: "Trial Expired",
  trial_converted: "Trial Converted to Paid",
  new_feedback: "New Feedback",
  support_ticket_created: "Support Ticket Created",
  support_ticket_resolved: "Support Ticket Resolved",
};

/**
 * Payload for creating a notification
 */
export interface NotificationPayload {
  adminId: number;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Admin notification preferences
 */
export interface AdminNotificationPreferencesPayload {
  inAppPayments?: boolean;
  inAppSystemAlerts?: boolean;
  inAppAccountChanges?: boolean;
  emailPayments?: boolean;
  emailSystemAlerts?: boolean;
  emailAccountChanges?: boolean;
  emailDigestFrequency?: "none" | "daily" | "weekly";
  quietHoursStart?: string;
  quietHoursEnd?: string;
  quietHoursEnabled?: boolean;
}

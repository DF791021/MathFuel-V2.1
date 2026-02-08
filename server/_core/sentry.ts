/**
 * Sentry Integration
 * Error tracking and performance monitoring
 */

import * as Sentry from "@sentry/node";

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    console.warn("[Sentry] No SENTRY_DSN configured, error tracking disabled");
    return;
  }

  Sentry.init({
    dsn,
    integrations: [],
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || "development",
    release: process.env.RELEASE_VERSION || "unknown",
    beforeSend(event, hint) {
      // Filter out health check requests
      if (event.request?.url?.includes("/health")) {
        return null;
      }
      return event;
    },
  });

  console.log("[Sentry] Initialized with DSN:", dsn.split("@")[0] + "@...");
}

/**
 * Capture exception with context
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>
) {
  if (context) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Capture message
 */
export function captureMessage(
  message: string,
  level: "fatal" | "error" | "warning" | "info" | "debug" = "info",
  context?: Record<string, unknown>
) {
  Sentry.captureMessage(message, level);
  if (context) {
    Sentry.setContext("message_context", context);
  }
}

/**
 * Set user context
 */
export function setSentryUser(userId: string, email?: string, name?: string) {
  Sentry.setUser({
    id: userId,
    email,
    username: name,
  });
}

/**
 * Clear user context
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for tracking
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: "fatal" | "error" | "warning" | "info" | "debug" = "info",
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
}

/**
 * Start transaction for performance monitoring
 */
export function startTransaction(name: string, op: string) {
  // Transaction tracking handled via integrations
  // This is a placeholder for future use
  return null;
}

export default Sentry;

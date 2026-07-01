// GA4 Analytics Module — isomorphic-safe (guards all window/document access)
//
// SETUP:
//   1. Set VITE_GA_MEASUREMENT_ID in .env (e.g. G-WF1H6DRZSE)
//   2. The gtag.js script is loaded in index.html via the env var
//   3. Call initGA() once in your root component
//
// BIGQUERY EXPORT:
//   In GA4 Admin > Product Links > BigQuery Links, connect your GCP project.
//   GA4 streams raw events to BigQuery daily (or streaming with GA4 360).
//   The events fired here (page_view, scroll_depth, cta_click, etc.) will
//   appear as rows in the `events_*` table partitioned by date.
//
// SENTRY COORDINATION:
//   This module tracks user-behavior analytics only. Error tracking is handled
//   by @sentry/node on the server. Avoid sending JS errors to both GA4 and
//   Sentry — use Sentry for error/exception reporting and GA4 for engagement
//   and conversion metrics.

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const MEASUREMENT_ID = typeof window !== "undefined"
  ? (import.meta as any).env?.VITE_GA_MEASUREMENT_ID ?? ""
  : "";

const isEnabled = (): boolean =>
  typeof window !== "undefined" && MEASUREMENT_ID.length > 0 && typeof window.gtag === "function";

function gtag(...args: unknown[]) {
  if (!isEnabled()) return;
  window.gtag(...args);
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

let initialized = false;

export function initGA() {
  if (typeof window === "undefined" || !MEASUREMENT_ID || initialized) return;
  initialized = true;

  // Enhanced measurement is enabled by default in GA4 property settings.
  // The config below sets the initial page and enables features that
  // require explicit opt-in.
  gtag("config", MEASUREMENT_ID, {
    send_page_view: false, // we fire page_view manually on route changes
    cookie_flags: "SameSite=None;Secure",
  });
}

// ---------------------------------------------------------------------------
// Page Views — call on every route change
// ---------------------------------------------------------------------------

export function trackPageView(path: string, title?: string) {
  gtag("event", "page_view", {
    page_path: path,
    page_title: title ?? document.title,
    page_location: window.location.href,
  });
}

// ---------------------------------------------------------------------------
// Generic Event
// ---------------------------------------------------------------------------

export function trackEvent(
  category: string,
  action: string,
  label?: string,
  value?: number,
) {
  gtag("event", action, {
    event_category: category,
    event_label: label,
    value,
  });
}

// ---------------------------------------------------------------------------
// User Identity — ties sessions to a MathFuel user for cross-platform tracking
// ---------------------------------------------------------------------------

export function setUserId(userId: string | number | null) {
  if (!isEnabled() || !userId) return;
  gtag("set", { user_id: String(userId) });
}

// Custom dimensions (extend this object as needed)
export function setUserProperties(props: {
  role?: string;
  subscription_tier?: string;
  grade_level?: string | number;
  [key: string]: unknown;
}) {
  if (!isEnabled()) return;
  gtag("set", "user_properties", props);
}

// ---------------------------------------------------------------------------
// Engagement Helpers
// ---------------------------------------------------------------------------

export function trackScrollDepth(percent: number) {
  gtag("event", "scroll_depth", {
    event_category: "engagement",
    event_label: `${percent}%`,
    value: percent,
  });
}

export function trackTimeOnPage(seconds: number, path: string) {
  gtag("event", "time_on_page", {
    event_category: "engagement",
    event_label: path,
    value: seconds,
  });
}

// ---------------------------------------------------------------------------
// Click Tracking
// ---------------------------------------------------------------------------

export function trackCTAClick(buttonName: string, location?: string) {
  gtag("event", "cta_click", {
    event_category: "click",
    event_label: buttonName,
    click_location: location,
  });
}

export function trackNavClick(destination: string) {
  gtag("event", "nav_click", {
    event_category: "navigation",
    event_label: destination,
  });
}

// ---------------------------------------------------------------------------
// Form Tracking — integrate with react-hook-form
// ---------------------------------------------------------------------------

export function trackFormStart(formName: string) {
  gtag("event", "form_start", {
    event_category: "form",
    event_label: formName,
  });
}

export function trackFormComplete(formName: string) {
  gtag("event", "form_complete", {
    event_category: "form",
    event_label: formName,
  });
}

export function trackFormError(formName: string, fieldName: string) {
  gtag("event", "form_error", {
    event_category: "form",
    event_label: `${formName}:${fieldName}`,
  });
}

// ---------------------------------------------------------------------------
// MathFuel-Specific Events
// ---------------------------------------------------------------------------

export function trackSessionStart(skillId?: string) {
  gtag("event", "practice_session_start", {
    event_category: "learning",
    event_label: skillId,
  });
}

export function trackQuestionAnswered(correct: boolean, skillId?: string, difficulty?: number) {
  gtag("event", "question_answered", {
    event_category: "learning",
    event_label: skillId,
    value: correct ? 1 : 0,
    difficulty,
  });
}

export function trackSessionComplete(accuracy: number, questionsAnswered: number) {
  gtag("event", "practice_session_complete", {
    event_category: "learning",
    value: questionsAnswered,
    accuracy,
  });
}

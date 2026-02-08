/**
 * Prometheus Metrics Collection
 * Performance and business metrics
 */

import {
  Counter,
  Gauge,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from "prom-client";

// Create custom registry
const register = new Registry();

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

/**
 * API Request Metrics
 */
export const apiRequestDuration = new Histogram({
  name: "api_request_duration_seconds",
  help: "Duration of API requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const apiRequestTotal = new Counter({
  name: "api_requests_total",
  help: "Total number of API requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

export const apiErrorsTotal = new Counter({
  name: "api_errors_total",
  help: "Total number of API errors",
  labelNames: ["method", "route", "error_type"],
  registers: [register],
});

/**
 * Database Metrics
 */
export const dbQueryDuration = new Histogram({
  name: "db_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["operation", "table"],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

export const dbQueryTotal = new Counter({
  name: "db_queries_total",
  help: "Total number of database queries",
  labelNames: ["operation", "table"],
  registers: [register],
});

export const dbErrorsTotal = new Counter({
  name: "db_errors_total",
  help: "Total number of database errors",
  labelNames: ["operation", "table"],
  registers: [register],
});

/**
 * Business Metrics
 */
export const activeSubscriptions = new Gauge({
  name: "active_subscriptions_total",
  help: "Total number of active subscriptions",
  registers: [register],
});

export const monthlyRecurringRevenue = new Gauge({
  name: "monthly_recurring_revenue_cents",
  help: "Monthly recurring revenue in cents",
  registers: [register],
});

export const failedPaymentsTotal = new Counter({
  name: "failed_payments_total",
  help: "Total number of failed payments",
  labelNames: ["reason"],
  registers: [register],
});

export const successfulPaymentsTotal = new Counter({
  name: "successful_payments_total",
  help: "Total number of successful payments",
  labelNames: ["payment_type"],
  registers: [register],
});

export const churnRate = new Gauge({
  name: "churn_rate_percent",
  help: "Subscription churn rate as percentage",
  registers: [register],
});

/**
 * Email Metrics
 */
export const emailsSentTotal = new Counter({
  name: "emails_sent_total",
  help: "Total number of emails sent",
  labelNames: ["email_type", "status"],
  registers: [register],
});

export const emailDeliveryDuration = new Histogram({
  name: "email_delivery_duration_seconds",
  help: "Time to deliver email in seconds",
  labelNames: ["email_type"],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60],
  registers: [register],
});

/**
 * Webhook Metrics
 */
export const webhookEventsTotal = new Counter({
  name: "webhook_events_total",
  help: "Total number of webhook events processed",
  labelNames: ["event_type", "status"],
  registers: [register],
});

export const webhookRetries = new Counter({
  name: "webhook_retries_total",
  help: "Total number of webhook retries",
  labelNames: ["event_type"],
  registers: [register],
});

export const webhookQueueSize = new Gauge({
  name: "webhook_queue_size",
  help: "Current size of webhook processing queue",
  registers: [register],
});

/**
 * System Health Metrics
 */
export const systemHealthStatus = new Gauge({
  name: "system_health_status",
  help: "System health status (1 = healthy, 0 = unhealthy)",
  labelNames: ["component"],
  registers: [register],
});

export const databaseConnectionPoolSize = new Gauge({
  name: "database_connection_pool_size",
  help: "Current size of database connection pool",
  registers: [register],
});

export const databaseConnectionPoolAvailable = new Gauge({
  name: "database_connection_pool_available",
  help: "Available connections in database pool",
  registers: [register],
});

/**
 * Error Tracking Metrics
 */
export const errorsTotal = new Counter({
  name: "errors_total",
  help: "Total number of errors",
  labelNames: ["error_type", "severity"],
  registers: [register],
});

export const topErrorsGauge = new Gauge({
  name: "top_errors_count",
  help: "Count of top errors",
  labelNames: ["error_message"],
  registers: [register],
});

/**
 * Record API request metrics
 */
export function recordApiRequest(
  method: string,
  route: string,
  statusCode: number,
  durationSeconds: number
) {
  apiRequestTotal.labels(method, route, statusCode.toString()).inc();
  apiRequestDuration.labels(method, route, statusCode.toString()).observe(durationSeconds);

  if (statusCode >= 400) {
    const errorType = statusCode >= 500 ? "server_error" : "client_error";
    apiErrorsTotal.labels(method, route, errorType).inc();
  }
}

/**
 * Record database query metrics
 */
export function recordDatabaseQuery(
  operation: string,
  table: string,
  durationSeconds: number,
  error?: Error
) {
  dbQueryTotal.labels(operation, table).inc();
  dbQueryDuration.labels(operation, table).observe(durationSeconds);

  if (error) {
    dbErrorsTotal.labels(operation, table).inc();
  }
}

/**
 * Record business metrics
 */
export function updateBusinessMetrics(data: {
  activeSubscriptions?: number;
  mrr?: number;
  churnRate?: number;
}) {
  if (data.activeSubscriptions !== undefined) {
    activeSubscriptions.set(data.activeSubscriptions);
  }
  if (data.mrr !== undefined) {
    monthlyRecurringRevenue.set(data.mrr);
  }
  if (data.churnRate !== undefined) {
    churnRate.set(data.churnRate);
  }
}

/**
 * Get Prometheus metrics in text format
 */
export async function getMetrics(): Promise<string> {
  return register.metrics();
}

export default register;

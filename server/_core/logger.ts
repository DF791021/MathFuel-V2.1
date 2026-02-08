/**
 * Pino Structured Logging
 * Production-grade logging with request context
 */

import pino from "pino";
import pinoHttp from "pino-http";
import { Request, Response } from "express";

// Create base logger
const baseLogger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * HTTP request/response logger middleware
 */
export const httpLogger = pinoHttp(
  {
    logger: baseLogger,
    customLogLevel: (req: Request, res: Response) => {
      if (res.statusCode >= 400 && res.statusCode < 500) {
        return "warn";
      } else if (res.statusCode >= 500) {
        return "error";
      } else if (res.statusCode >= 300 && res.statusCode < 400) {
        return "silent";
      }
      return "info";
    },
    customAttributeKeys: {
      req: "request",
      res: "response",
      err: "error",
      responseTime: "duration_ms",
    },
    serializers: {
      req: (req: Request) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        headers: {
          host: req.headers.host,
          "user-agent": req.headers["user-agent"],
        },
        remoteAddress: req.ip,
      }),
      res: (res: Response) => ({
        statusCode: res.statusCode,
        headers: res.getHeaders(),
      }),
    },
  },
  new pino.transport({
    target: "pino/file",
    options: { destination: 1 }, // stdout
  })
);

/**
 * Create child logger with context
 */
export function createLogger(context: Record<string, unknown>) {
  return baseLogger.child(context);
}

/**
 * Log database query
 */
export function logQuery(
  query: string,
  duration: number,
  params?: unknown[],
  error?: Error
) {
  const logger = createLogger({
    type: "database",
    duration_ms: duration,
  });

  if (error) {
    logger.error(
      {
        query,
        params,
        error: error.message,
      },
      "Database query failed"
    );
  } else {
    logger.debug(
      {
        query,
        params,
      },
      "Database query executed"
    );
  }
}

/**
 * Log API call
 */
export function logApiCall(
  method: string,
  endpoint: string,
  duration: number,
  statusCode: number,
  userId?: string,
  error?: Error
) {
  const logger = createLogger({
    type: "api",
    method,
    endpoint,
    duration_ms: duration,
    status_code: statusCode,
    user_id: userId,
  });

  if (error) {
    logger.error(
      {
        error: error.message,
      },
      "API call failed"
    );
  } else {
    logger.info("API call completed");
  }
}

/**
 * Log business event
 */
export function logEvent(
  event: string,
  data: Record<string, unknown>,
  userId?: string
) {
  const logger = createLogger({
    type: "event",
    event,
    user_id: userId,
  });

  logger.info(data, `Event: ${event}`);
}

/**
 * Log audit action
 */
export function logAudit(
  action: string,
  resourceType: string,
  resourceId: string,
  userId: string,
  changes?: Record<string, unknown>,
  result?: "success" | "failure"
) {
  const logger = createLogger({
    type: "audit",
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    user_id: userId,
    result,
  });

  logger.info(changes || {}, `Audit: ${action} on ${resourceType}`);
}

/**
 * Log performance metric
 */
export function logMetric(
  name: string,
  value: number,
  unit: string,
  tags?: Record<string, string>
) {
  const logger = createLogger({
    type: "metric",
    metric_name: name,
    metric_value: value,
    metric_unit: unit,
    tags,
  });

  logger.info(`Metric: ${name} = ${value}${unit}`);
}

export default baseLogger;

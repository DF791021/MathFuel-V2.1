import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import {
  notificationsToCSV,
  notificationsToJSON,
  generateComplianceReport,
  generateAuditTrail,
  generateExportFilename,
} from "../_core/notificationExport";

export const notificationArchiveRouter = router({
  /**
   * Get notification history with date range filtering
   */
  getHistoryByDateRange: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        limit: z.number().min(1).max(1000).default(100),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can access notification archive",
        });
      }

      if (input.startDate > input.endDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Start date must be before end date",
        });
      }

      return db.getNotificationHistoryByDateRange(
        ctx.user.id,
        input.startDate,
        input.endDate,
        input.limit,
        input.offset
      );
    }),

  /**
   * Get statistics for date range
   */
  getStatsByDateRange: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can access notification statistics",
        });
      }

      if (input.startDate > input.endDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Start date must be before end date",
        });
      }

      return db.getNotificationStatsForDateRange(
        ctx.user.id,
        input.startDate,
        input.endDate
      );
    }),

  /**
   * Export notifications as CSV
   */
  exportAsCSV: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can export notifications",
        });
      }

      if (input.startDate > input.endDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Start date must be before end date",
        });
      }

      const notifications = await db.getAllNotificationsForExport(
        ctx.user.id,
        input.startDate,
        input.endDate
      );

      const csv = notificationsToCSV(notifications as any);
      const filename = generateExportFilename("csv", "archive");

      return {
        data: csv,
        filename,
        format: "csv",
        count: notifications.length,
      };
    }),

  /**
   * Export notifications as JSON
   */
  exportAsJSON: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can export notifications",
        });
      }

      if (input.startDate > input.endDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Start date must be before end date",
        });
      }

      const notifications = await db.getAllNotificationsForExport(
        ctx.user.id,
        input.startDate,
        input.endDate
      );

      const json = notificationsToJSON(notifications as any);
      const filename = generateExportFilename("json", "archive");

      return {
        data: json,
        filename,
        format: "json",
        count: notifications.length,
      };
    }),

  /**
   * Generate compliance report
   */
  generateComplianceReport: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can generate compliance reports",
        });
      }

      if (input.startDate > input.endDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Start date must be before end date",
        });
      }

      const notifications = await db.getAllNotificationsForExport(
        ctx.user.id,
        input.startDate,
        input.endDate
      );

      const stats = await db.getNotificationStatsForDateRange(
        ctx.user.id,
        input.startDate,
        input.endDate
      );

      const report = generateComplianceReport(
        notifications as any,
        stats,
        { start: input.startDate, end: input.endDate }
      );

      const filename = generateExportFilename("txt", "compliance");

      return {
        data: report,
        filename,
        format: "txt",
        stats,
      };
    }),

  /**
   * Generate audit trail
   */
  generateAuditTrail: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can generate audit trails",
        });
      }

      if (input.startDate > input.endDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Start date must be before end date",
        });
      }

      const notifications = await db.getAllNotificationsForExport(
        ctx.user.id,
        input.startDate,
        input.endDate
      );

      const trail = generateAuditTrail(notifications as any);
      const filename = generateExportFilename("txt", "audit");

      return {
        data: trail,
        filename,
        format: "txt",
        count: notifications.length,
      };
    }),

  /**
   * Get notification trends
   */
  getTrends: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        groupBy: z.enum(["day", "week", "month"]).default("day"),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view notification trends",
        });
      }

      if (input.startDate > input.endDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Start date must be before end date",
        });
      }

      return db.getNotificationTrends(
        ctx.user.id,
        input.startDate,
        input.endDate,
        input.groupBy
      );
    }),

  /**
   * Get high-priority notifications
   */
  getHighPriority: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view high-priority notifications",
        });
      }

      if (input.startDate > input.endDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Start date must be before end date",
        });
      }

      return db.getHighPriorityNotifications(
        ctx.user.id,
        input.startDate,
        input.endDate
      );
    }),

  /**
   * Delete old notifications
   */
  deleteOlderThan: protectedProcedure
    .input(
      z.object({
        beforeDate: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can delete notifications",
        });
      }

      const count = await db.deleteNotificationsOlderThan(
        ctx.user.id,
        input.beforeDate
      );

      return {
        success: true,
        deletedCount: count,
        message: `Deleted ${count} notifications older than ${input.beforeDate.toLocaleDateString()}`,
      };
    }),
});

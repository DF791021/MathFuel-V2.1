import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  createTrialRequest,
  createTrialAccount,
  getTrialRequestById,
  getTrialAccountBySchoolCode,
  updateTrialRequestStatus,
  getAllTrialRequests,
  recordTrialMetrics,
  getTrialMetrics,
} from "../db";
import { TRPCError } from "@trpc/server";

// Helper function to generate school code
function generateSchoolCode(schoolName: string): string {
  const code = schoolName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .substring(0, 4);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${code}-${random}`;
}

export const trialRouter = router({
  /**
   * Submit a trial request from a school (public endpoint)
   */
  submitRequest: publicProcedure
    .input(
      z.object({
        schoolName: z.string().min(1, "School name is required"),
        district: z.string().optional(),
        state: z.string().default("WI"),
        contactName: z.string().min(1, "Contact name is required"),
        contactEmail: z.string().email("Invalid email address"),
        contactPhone: z.string().optional(),
        role: z.enum(["principal", "teacher", "nutrition_coordinator", "it_director", "superintendent", "other"]),
        studentCount: z.number().optional(),
        teacherCount: z.number().optional(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Create trial request
        const requestResult = await createTrialRequest({
          schoolName: input.schoolName,
          district: input.district,
          state: input.state,
          contactName: input.contactName,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
          role: input.role,
          studentCount: input.studentCount,
          teacherCount: input.teacherCount,
          message: input.message,
        });

        if (!requestResult || !requestResult.insertId) {
          throw new Error("Failed to create trial request");
        }

        const requestId = requestResult.insertId;

        // Generate school code
        const schoolCode = generateSchoolCode(input.schoolName);

        // Create trial account
        const accountResult = await createTrialAccount({
          trialRequestId: requestId,
          schoolCode,
          adminEmail: input.contactEmail,
          trialDays: 30,
        });

        if (!accountResult || !accountResult.insertId) {
          throw new Error("Failed to create trial account");
        }

        // Update request status
        await updateTrialRequestStatus(requestId, "trial_created");

        return {
          success: true,
          requestId,
          accountId: accountResult.insertId,
          schoolCode,
          message: "Trial request submitted successfully. Check your email for login credentials.",
        };
      } catch (error) {
        console.error("Error submitting trial request:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit trial request. Please try again.",
        });
      }
    }),

  /**
   * Get trial account details by school code
   */
  getAccountByCode: publicProcedure
    .input(z.object({ schoolCode: z.string() }))
    .query(async ({ input }) => {
      try {
        const account = await getTrialAccountBySchoolCode(input.schoolCode);

        if (!account) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Trial account not found",
          });
        }

        return {
          schoolCode: account.schoolCode,
          trialEndDate: account.trialEndDate,
          trialDays: account.trialDays,
          status: account.status,
          classesCreated: account.classesCreated,
          studentsAdded: account.studentsAdded,
          gamesPlayed: account.gamesPlayed,
          certificatesGenerated: account.certificatesGenerated,
        };
      } catch (error) {
        console.error("Error getting trial account:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve trial account",
        });
      }
    }),

  /**
   * Get trial request details (admin only)
   */
  getRequest: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      try {
        const request = await getTrialRequestById(input.requestId);

        if (!request) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Trial request not found",
          });
        }

        return request;
      } catch (error) {
        console.error("Error getting trial request:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve trial request",
        });
      }
    }),

  /**
   * Get all trial requests (admin only)
   */
  getAllRequests: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      try {
        const requests = await getAllTrialRequests(input.limit, input.offset);
        return requests;
      } catch (error) {
        console.error("Error getting trial requests:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve trial requests",
        });
      }
    }),

  /**
   * Update trial request status (admin only)
   */
  updateRequestStatus: protectedProcedure
    .input(
      z.object({
        requestId: z.number(),
        status: z.enum(["pending", "approved", "trial_created", "completed", "rejected"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      try {
        await updateTrialRequestStatus(input.requestId, input.status);
        return { success: true };
      } catch (error) {
        console.error("Error updating trial request status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update trial request status",
        });
      }
    }),

  /**
   * Record trial engagement metrics (admin only)
   */
  recordMetrics: protectedProcedure
    .input(
      z.object({
        trialAccountId: z.number(),
        activeUsers: z.number().optional(),
        gamesPlayed: z.number().optional(),
        certificatesGenerated: z.number().optional(),
        emailsSent: z.number().optional(),
        pdfExportsGenerated: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      try {
        await recordTrialMetrics({
          trialAccountId: input.trialAccountId,
          activeUsers: input.activeUsers,
          gamesPlayed: input.gamesPlayed,
          certificatesGenerated: input.certificatesGenerated,
          emailsSent: input.emailsSent,
          pdfExportsGenerated: input.pdfExportsGenerated,
        });

        return { success: true };
      } catch (error) {
        console.error("Error recording trial metrics:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to record trial metrics",
        });
      }
    }),

  /**
   * Get trial metrics (admin only)
   */
  getMetrics: protectedProcedure
    .input(z.object({ trialAccountId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      try {
        const metrics = await getTrialMetrics(input.trialAccountId);
        return metrics;
      } catch (error) {
        console.error("Error getting trial metrics:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve trial metrics",
        });
      }
    }),
});

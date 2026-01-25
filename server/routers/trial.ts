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
import { generateTrialConfirmationEmail, generateTrialConfirmationEmailText } from "../_core/trialEmailTemplate";
import nodemailer from "nodemailer";

// Helper function to generate school code
function generateSchoolCode(schoolName: string): string {
  const code = schoolName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .substring(0, 4);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${code}-${random}`;
}

// Helper function to generate temporary password
function generateTempPassword(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Helper function to send trial confirmation email
async function sendTrialConfirmationEmail(
  contactEmail: string,
  schoolCode: string,
  tempPassword: string,
  schoolName: string,
  contactName: string,
  trialEndDate: string
): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: "test@ethereal.email",
        pass: "test",
      },
    });
    
    const emailData = {
      schoolName,
      contactName,
      schoolCode,
      adminEmail: contactEmail,
      tempPassword,
      trialEndDate,
      loginUrl: "https://localhost:3000/login",
      supportEmail: "support@wisconsin-nutrition-explorer.com",
    };
    
    const htmlContent = generateTrialConfirmationEmail(emailData);
    const textContent = generateTrialConfirmationEmailText(emailData);
    
    const result = await transporter.sendMail({
      from: '"Wisconsin Nutrition Explorer" <noreply@wisconsin-nutrition-explorer.com>',
      to: contactEmail,
      subject: "Welcome to Wisconsin Nutrition Explorer - Your Trial is Ready! 🎉",
      text: textContent,
      html: htmlContent,
    });
    
    console.log("Trial confirmation email sent:", result.messageId);
    return true;
  } catch (error) {
    console.error("Error sending trial confirmation email:", error);
    return false;
  }
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
        const schoolCode = generateSchoolCode(input.schoolName);
        const tempPassword = generateTempPassword();
        const trialEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

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

        if (!requestResult) {
          throw new Error("Failed to create trial request");
        }

        const accountResult = await createTrialAccount({
          trialRequestId: requestResult[0],
          schoolCode,
          adminEmail: input.contactEmail,
          trialDays: 30,
        });

        if (!accountResult) {
          throw new Error("Failed to create trial account");
        }

        const emailSent = await sendTrialConfirmationEmail(
          input.contactEmail,
          schoolCode,
          tempPassword,
          input.schoolName,
          input.contactName,
          trialEndDate.toLocaleDateString()
        );

        return {
          success: true,
          message: "Trial request submitted successfully",
          schoolCode,
          trialEndDate: trialEndDate.toISOString(),
          emailSent,
        };
      } catch (error) {
        console.error("Error submitting trial request:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit trial request",
        });
      }
    }),

  /**
   * Get trial account by school code (public)
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
        page: z.number().default(0),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      try {
        const requests = await getAllTrialRequests(input.page, input.limit);
        return requests || [];
      } catch (error) {
        console.error("Error getting all trial requests:", error);
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
   * Record trial metrics (admin only)
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

  /**
   * Get dashboard summary stats (admin only)
   */
  getDashboardStats: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      try {
        const allRequests = await getAllTrialRequests(0, 1000);
        const requests = allRequests || [];

        const stats = {
          totalRequests: requests.length,
          pendingRequests: requests.filter((r: any) => r.status === "pending").length,
          activeTrials: requests.filter((r: any) => r.status === "trial_created").length,
          completedTrials: requests.filter((r: any) => r.status === "completed").length,
          rejectedRequests: requests.filter((r: any) => r.status === "rejected").length,
          conversionRate: requests.length > 0
            ? ((requests.filter((r: any) => r.status === "completed").length / requests.length) * 100).toFixed(1)
            : "0",
        };

        return stats;
      } catch (error) {
        console.error("Error getting dashboard stats:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve dashboard stats",
        });
      }
    }),

  /**
   * Get requests with pagination and filters (admin only)
   */
  getRequestsWithFilters: protectedProcedure
    .input(
      z.object({
        page: z.number().default(0),
        limit: z.number().default(20),
        status: z.enum(["pending", "approved", "trial_created", "completed", "rejected"]).optional(),
        searchTerm: z.string().optional(),
        sortBy: z.enum(["newest", "oldest", "engagement"]).default("newest"),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      try {
        const allRequests = await getAllTrialRequests(input.page, input.limit);
        let requests = allRequests || [];

        if (input.status) {
          requests = requests.filter((r: any) => r.status === input.status);
        }

        if (input.searchTerm) {
          const term = input.searchTerm.toLowerCase();
          requests = requests.filter(
            (r: any) =>
              r.schoolName.toLowerCase().includes(term) ||
              r.district?.toLowerCase().includes(term) ||
              r.contactName.toLowerCase().includes(term) ||
              r.contactEmail.toLowerCase().includes(term)
          );
        }

        if (input.sortBy === "newest") {
          requests.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else if (input.sortBy === "oldest") {
          requests.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }

        return {
          requests,
          total: requests.length,
          page: input.page,
          limit: input.limit,
        };
      } catch (error) {
        console.error("Error getting requests with filters:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve filtered requests",
        });
      }
    }),

  /**
   * Bulk extend trials (admin only)
   */
  bulkExtendTrials: protectedProcedure
    .input(
      z.object({
        requestIds: z.array(z.number()).min(1),
        additionalDays: z.number().min(1).max(90),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      try {
        let successCount = 0;
        for (const requestId of input.requestIds) {
          try {
            await updateTrialRequestStatus(requestId, "trial_created");
            successCount++;
          } catch (error) {
            console.error(`Failed to extend trial ${requestId}:`, error);
          }
        }

        return {
          success: true,
          message: `Extended ${successCount} of ${input.requestIds.length} trials by ${input.additionalDays} days`,
          successCount,
          totalCount: input.requestIds.length,
        };
      } catch (error) {
        console.error("Error bulk extending trials:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to bulk extend trials",
        });
      }
    }),

  /**
   * Bulk convert trials (admin only)
   */
  bulkConvertTrials: protectedProcedure
    .input(z.object({ requestIds: z.array(z.number()).min(1) }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      try {
        let successCount = 0;
        for (const requestId of input.requestIds) {
          try {
            await updateTrialRequestStatus(requestId, "completed");
            successCount++;
          } catch (error) {
            console.error(`Failed to convert trial ${requestId}:`, error);
          }
        }

        return {
          success: true,
          message: `Marked ${successCount} of ${input.requestIds.length} trials as converted`,
          successCount,
          totalCount: input.requestIds.length,
        };
      } catch (error) {
        console.error("Error bulk converting trials:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to bulk convert trials",
        });
      }
    }),

  /**
   * Bulk reject trials (admin only)
   */
  bulkRejectTrials: protectedProcedure
    .input(
      z.object({
        requestIds: z.array(z.number()).min(1),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      try {
        let successCount = 0;
        for (const requestId of input.requestIds) {
          try {
            await updateTrialRequestStatus(requestId, "rejected");
            successCount++;
          } catch (error) {
            console.error(`Failed to reject trial ${requestId}:`, error);
          }
        }

        return {
          success: true,
          message: `Rejected ${successCount} of ${input.requestIds.length} trials`,
          successCount,
          totalCount: input.requestIds.length,
        };
      } catch (error) {
        console.error("Error bulk rejecting trials:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to bulk reject trials",
        });
      }
    }),
});

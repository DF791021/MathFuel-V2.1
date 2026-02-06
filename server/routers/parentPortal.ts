import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  getParentAccount,
  createParentAccount,
  getStudentsForParent,
  linkStudentToParent,
  getHomePracticeAssignmentsForStudent,
  getHomePracticeProgress,
  updateHomePracticeProgress,
  getStudentBadges,
  createStudentAchievement,
  getParentTeacherMessages,
  sendParentTeacherMessage,
  markMessageAsRead,
  getParentProgressReports,
  createParentProgressReport,
  getStudentProgressSummary,
} from "../db";

export const parentPortalRouter = router({
  // Get or create parent account
  getOrCreateParentAccount: protectedProcedure
    .query(async ({ ctx }) => {
      let account = await getParentAccount(ctx.user.id);
      if (!account && ctx.user.email) {
        const nameParts = ctx.user.name?.split(" ") || ["Parent", ""];
        await createParentAccount({
          userId: ctx.user.id,
          firstName: nameParts[0],
          lastName: nameParts[1] || "",
          email: ctx.user.email,
          notificationPreference: "email",
        });
        account = await getParentAccount(ctx.user.id);
      }
      return account;
    }),

  // Get all students linked to parent
  getStudents: protectedProcedure
    .query(async ({ ctx }) => {
      return getStudentsForParent(ctx.user.id);
    }),

  // Link a student to parent (via code or direct)
  linkStudent: protectedProcedure
    .input(z.object({
      studentId: z.number(),
      relationship: z.string(),
      accessLevel: z.enum(["view_only", "view_and_comment", "full_access"]),
    }))
    .mutation(async ({ ctx, input }) => {
      return linkStudentToParent(input.studentId, ctx.user.id, input.relationship, input.accessLevel);
    }),

  // Get home practice assignments for a student
  getHomePracticeAssignments: protectedProcedure
    .input(z.object({ studentId: z.number() }))
    .query(async ({ ctx, input }) => {
      return getHomePracticeAssignmentsForStudent(input.studentId);
    }),

  // Get progress on a specific assignment
  getAssignmentProgress: protectedProcedure
    .input(z.object({
      assignmentId: z.number(),
      studentId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      return getHomePracticeProgress(input.assignmentId, input.studentId);
    }),

  // Update assignment progress (called by student)
  updateAssignmentProgress: protectedProcedure
    .input(z.object({
      assignmentId: z.number(),
      studentId: z.number(),
      problemsAttempted: z.number().optional(),
      problemsCorrect: z.number().optional(),
      accuracyPercentage: z.number().optional(),
      timeSpentMinutes: z.number().optional(),
      completionPercentage: z.number().optional(),
      status: z.enum(["not_started", "in_progress", "completed"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { assignmentId, studentId, ...updateData } = input;
      return updateHomePracticeProgress(assignmentId, studentId, updateData);
    }),

  // Get student achievements/badges
  getStudentAchievements: protectedProcedure
    .input(z.object({ studentId: z.number() }))
    .query(async ({ ctx, input }) => {
      return getStudentBadges(input.studentId);
    }),

  // Get parent-teacher messages
  getMessages: protectedProcedure
    .input(z.object({ studentId: z.number() }))
    .query(async ({ ctx, input }) => {
      return getParentTeacherMessages(ctx.user.id, input.studentId);
    }),

  // Send message to teacher
  sendMessage: protectedProcedure
    .input(z.object({
      recipientId: z.number(),
      studentId: z.number(),
      subject: z.string(),
      message: z.string(),
      messageType: z.enum(["general", "progress_update", "concern", "celebration", "question"]),
    }))
    .mutation(async ({ ctx, input }) => {
      return sendParentTeacherMessage({
        senderId: ctx.user.id,
        recipientId: input.recipientId,
        studentId: input.studentId,
        subject: input.subject,
        message: input.message,
        messageType: input.messageType,
      });
    }),

  // Mark message as read
  markMessageRead: protectedProcedure
    .input(z.object({ messageId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return markMessageAsRead(input.messageId);
    }),

  // Get progress reports for a student
  getProgressReports: protectedProcedure
    .input(z.object({
      studentId: z.number(),
      limit: z.number().optional().default(12),
    }))
    .query(async ({ ctx, input }) => {
      return getParentProgressReports(input.studentId, ctx.user.id, input.limit);
    }),

  // Get student progress summary
  getProgressSummary: protectedProcedure
    .input(z.object({
      studentId: z.number(),
      daysBack: z.number().optional().default(30),
    }))
    .query(async ({ ctx, input }) => {
      return getStudentProgressSummary(input.studentId, input.daysBack);
    }),
});

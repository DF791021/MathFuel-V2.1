import { protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  getStudentPerformanceSummary,
  getQuestionPerformanceAnalytics,
  getDifficultQuestions,
  getClassPerformanceAnalytics,
  getDailyEngagementTrend,
  getPlayerTopicMastery,
  getPlayerDifficultyProgression,
  getTeacherAnalyticsSummary,
  getStudentImprovement,
  getHistoricalSnapshots,
  getClassImprovement,
  getStudentRankingHistory,
  getStudentMilestones,
  getClassMilestones,
  getTopImprovingStudents,
  getStudentsNeedingAttention,
} from "../db";

/**
 * Analytics router for game performance dashboards
 */
export const analyticsRouter = {
  /**
   * Get overall teacher analytics summary
   */
  getTeacherSummary: protectedProcedure.query(async ({ ctx }) => {
    return await getTeacherAnalyticsSummary(ctx.user.id);
  }),

  /**
   * Get student performance summaries for a teacher
   */
  getStudentPerformance: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getStudentPerformanceSummary(
        0, // teacherId - will be filtered from context
        input.startDate,
        input.endDate
      );
    }),

  /**
   * Get question performance analytics
   */
  getQuestionPerformance: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      return await getQuestionPerformanceAnalytics(0, input.limit);
    }),

  /**
   * Get difficult questions that students struggle with
   */
  getDifficultQuestions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ input }) => {
      return await getDifficultQuestions(0, input.limit);
    }),

  /**
   * Get class performance analytics
   */
  getClassPerformance: protectedProcedure.query(async ({ ctx }) => {
    return await getClassPerformanceAnalytics(ctx.user.id);
  }),

  /**
   * Get daily engagement trend data
   */
  getDailyEngagement: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input, ctx }) => {
      return await getDailyEngagementTrend(ctx.user.id, input.days);
    }),

  /**
   * Get topic mastery data for a specific player
   */
  getPlayerTopicMastery: protectedProcedure
    .input(
      z.object({
        playerId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getPlayerTopicMastery(input.playerId);
    }),

  /**
   * Get difficulty progression for a specific player
   */
  getPlayerDifficultyProgression: protectedProcedure
    .input(
      z.object({
        playerId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getPlayerDifficultyProgression(input.playerId);
    }),

  /**
   * Get comprehensive analytics dashboard data
   */
  getDashboardData: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const [summary, students, questions, difficult, classes, engagement] =
        await Promise.all([
          getTeacherAnalyticsSummary(ctx.user.id),
          getStudentPerformanceSummary(ctx.user.id, input.startDate, input.endDate),
          getQuestionPerformanceAnalytics(ctx.user.id, 15),
          getDifficultQuestions(ctx.user.id, 5),
          getClassPerformanceAnalytics(ctx.user.id),
          getDailyEngagementTrend(ctx.user.id, input.days),
        ]);

      return {
        summary,
        students,
        questions,
        difficult,
        classes,
        engagement,
      };
    }),

  /**
   * Get detailed student report
   */
  getStudentReport: protectedProcedure
    .input(
      z.object({
        playerId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const [topicMastery, difficultyProgression] = await Promise.all([
        getPlayerTopicMastery(input.playerId),
        getPlayerDifficultyProgression(input.playerId),
      ]);

      return {
        topicMastery,
        difficultyProgression,
      };
    }),

  /**
   * Get student improvement metrics
   */
  getStudentImprovement: protectedProcedure
    .input(
      z.object({
        playerId: z.number(),
        period: z.enum(["week", "month", "semester"]).optional(),
      })
    )
    .query(async ({ input }) => {
      return await getStudentImprovement(input.playerId, input.period);
    }),

  /**
   * Get historical performance snapshots for a student
   */
  getHistoricalSnapshots: protectedProcedure
    .input(
      z.object({
        playerId: z.number(),
        limit: z.number().min(1).max(100).default(30),
      })
    )
    .query(async ({ input }) => {
      return await getHistoricalSnapshots(input.playerId, input.limit);
    }),

  /**
   * Get class improvement metrics
   */
  getClassImprovement: protectedProcedure
    .input(
      z.object({
        classId: z.number(),
        period: z.enum(["week", "month", "semester"]).optional(),
      })
    )
    .query(async ({ input }) => {
      return await getClassImprovement(input.classId, input.period);
    }),

  /**
   * Get student ranking history
   */
  getStudentRankingHistory: protectedProcedure
    .input(
      z.object({
        playerId: z.number(),
        limit: z.number().min(1).max(100).default(30),
      })
    )
    .query(async ({ input }) => {
      return await getStudentRankingHistory(input.playerId, input.limit);
    }),

  /**
   * Get performance milestones for a student
   */
  getStudentMilestones: protectedProcedure
    .input(
      z.object({
        playerId: z.number(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      return await getStudentMilestones(input.playerId, input.limit);
    }),

  /**
   * Get all milestones achieved by a class
   */
  getClassMilestones: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      return await getClassMilestones(ctx.user.id, input.limit);
    }),

  /**
   * Get top improving students in a class
   */
  getTopImprovingStudents: protectedProcedure
    .input(
      z.object({
        period: z.enum(["week", "month", "semester"]).default("month"),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      return await getTopImprovingStudents(ctx.user.id, input.period, input.limit);
    }),

  /**
   * Get students needing attention (declining performance)
   */
  getStudentsNeedingAttention: protectedProcedure
    .input(
      z.object({
        period: z.enum(["week", "month", "semester"]).default("month"),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      return await getStudentsNeedingAttention(ctx.user.id, input.period, input.limit);
    }),

  /**
   * Get comprehensive improvement dashboard data
   */
  getImprovementDashboard: protectedProcedure
    .input(
      z.object({
        period: z.enum(["week", "month", "semester"]).default("month"),
      })
    )
    .query(async ({ ctx, input }) => {
      const [improving, declining, milestones] = await Promise.all([
        getTopImprovingStudents(ctx.user.id, input.period, 5),
        getStudentsNeedingAttention(ctx.user.id, input.period, 5),
        getClassMilestones(ctx.user.id, 10),
      ]);

      return {
        improving,
        declining,
        milestones,
        period: input.period,
      };
    }),
}
;

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  getAlertEngagementMetrics,
  getStudentAlertEngagement,
  getGoalCompletionByAlertStatus,
  getAlertEngagementTrends,
  getAlertPreferenceDistribution,
  getStudentGoalCompletionRate,
} from "../db";

export const alertAnalyticsRouter = router({
  getEngagementMetrics: protectedProcedure
    .input(z.object({ classId: z.number(), startDate: z.date().optional(), endDate: z.date().optional() }))
    .query(async ({ input }) => {
      return await getAlertEngagementMetrics(input.classId, input.startDate, input.endDate);
    }),

  getStudentEngagement: protectedProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ input }) => {
      return await getStudentAlertEngagement(input.classId);
    }),

  getCompletionByAlertStatus: protectedProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ input }) => {
      return await getGoalCompletionByAlertStatus(input.classId);
    }),

  getEngagementTrends: protectedProcedure
    .input(z.object({ classId: z.number(), days: z.number().default(30) }))
    .query(async ({ input }) => {
      return await getAlertEngagementTrends(input.classId, input.days);
    }),

  getPreferenceDistribution: protectedProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ input }) => {
      return await getAlertPreferenceDistribution(input.classId);
    }),

  getStudentCompletionRate: protectedProcedure
    .input(z.object({ studentId: z.number() }))
    .query(async ({ input }) => {
      return await getStudentGoalCompletionRate(input.studentId);
    }),

  getCorrelationAnalysis: protectedProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ input }) => {
      const metrics = await getAlertEngagementMetrics(input.classId);
      const completion = await getGoalCompletionByAlertStatus(input.classId);
      const studentEngagement = await getStudentAlertEngagement(input.classId);

      if (!metrics || !completion) return null;

      const withAlertsRate = completion.withAlerts.totalGoals > 0
        ? Math.round((Number(completion.withAlerts.completedGoals) / Number(completion.withAlerts.totalGoals)) * 100)
        : 0;

      const withoutAlertsRate = completion.withoutAlerts.totalGoals > 0
        ? Math.round((Number(completion.withoutAlerts.completedGoals) / Number(completion.withoutAlerts.totalGoals)) * 100)
        : 0;

      const improvementFactor = withoutAlertsRate > 0 ? ((withAlertsRate - withoutAlertsRate) / withoutAlertsRate * 100).toFixed(1) : "N/A";

      return {
        engagementMetrics: metrics,
        completionRates: {
          withAlerts: withAlertsRate,
          withoutAlerts: withoutAlertsRate,
          improvementFactor,
        },
        studentEngagementCount: studentEngagement.length,
        alertsEnabledCount: studentEngagement.filter((s: any) => s.alertsEnabled).length,
      };
    }),
});

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getClassGoalAdoptionMetrics,
  getClassStudentGoalAdoptionStatus,
  getGoalsAtRisk,
  getGoalTypeDistribution,
} from "../db";

export const goalMonitoringRouter = router({
  /**
   * Get goal adoption metrics for a class
   */
  getClassMetrics: protectedProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ input }) => {
      try {
        const metrics = await getClassGoalAdoptionMetrics(input.classId);
        return {
          success: true,
          metrics,
        };
      } catch (error) {
        console.error("[tRPC] Error getting class metrics:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to get metrics",
          metrics: null,
        };
      }
    }),

  /**
   * Get all students' goal adoption status for a class
   */
  getStudentAdoptionStatus: protectedProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ input }) => {
      try {
        const students = await getClassStudentGoalAdoptionStatus(input.classId);
        return {
          success: true,
          students,
        };
      } catch (error) {
        console.error("[tRPC] Error getting student adoption status:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to get adoption status",
          students: [],
        };
      }
    }),

  /**
   * Get goals at risk for a class
   */
  getAtRiskGoals: protectedProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ input }) => {
      try {
        const goals = await getGoalsAtRisk(input.classId);
        return {
          success: true,
          goals,
        };
      } catch (error) {
        console.error("[tRPC] Error getting at-risk goals:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to get at-risk goals",
          goals: [],
        };
      }
    }),

  /**
   * Get goal type distribution for a class
   */
  getGoalTypeDistribution: protectedProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ input }) => {
      try {
        const distribution = await getGoalTypeDistribution(input.classId);
        return {
          success: true,
          distribution,
        };
      } catch (error) {
        console.error("[tRPC] Error getting goal type distribution:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to get distribution",
          distribution: [],
        };
      }
    }),
});

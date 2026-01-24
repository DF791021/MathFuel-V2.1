import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createGoal,
  getStudentGoals,
  getClassGoals,
  getActiveStudentGoals,
  updateGoal,
  updateGoalProgress,
  getGoalProgressHistory,
  getStudentAchievements,
  getClassAchievements,
  addGoalFeedback,
  getGoalFeedback,
  getGoalsDueSoon,
  getOverdueGoals,
  getGoalStatistics,
  deleteGoal,
} from "../db";

export const goalsRouter = router({
  /**
   * Create a new goal for a student
   */
  createGoal: protectedProcedure
    .input(
      z.object({
        playerId: z.number(),
        playerName: z.string(),
        classId: z.number(),
        goalType: z.enum([
          "accuracy",
          "score",
          "games_played",
          "streak",
          "topic_mastery",
        ]),
        goalName: z.string().min(1).max(200),
        goalDescription: z.string().optional(),
        targetValue: z.number().positive(),
        startDate: z.date(),
        dueDate: z.date(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const goalData = {
        playerId: input.playerId,
        playerName: input.playerName,
        teacherId: ctx.user.id,
        classId: input.classId,
        goalType: input.goalType,
        goalName: input.goalName,
        goalDescription: input.goalDescription || null,
        targetValue: input.targetValue,
        currentValue: 0,
        startDate: input.startDate,
        dueDate: input.dueDate,
        status: "active" as const,
        priority: (input.priority || "medium") as "low" | "medium" | "high",
        progressPercentage: 0,
        completedDate: null,
        notes: input.notes || null,
      };
      return await createGoal(
        input.playerId,
        input.playerName,
        ctx.user.id,
        input.classId,
        goalData
      );
    }),

  /**
   * Get all goals for a student
   */
  getStudentGoals: protectedProcedure
    .input(z.object({ playerId: z.number() }))
    .query(async ({ input }) => {
      return await getStudentGoals(input.playerId);
    }),

  /**
   * Get all goals for a class
   */
  getClassGoals: protectedProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ input }) => {
      return await getClassGoals(input.classId);
    }),

  /**
   * Get active goals for a student
   */
  getActiveGoals: protectedProcedure
    .input(z.object({ playerId: z.number() }))
    .query(async ({ input }) => {
      return await getActiveStudentGoals(input.playerId);
    }),

  /**
   * Update a goal
   */
  updateGoal: protectedProcedure
    .input(
      z.object({
        goalId: z.number(),
        goalName: z.string().optional(),
        goalDescription: z.string().optional(),
        targetValue: z.number().optional(),
        dueDate: z.date().optional(),
        status: z.enum(["active", "completed", "failed", "paused"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { goalId, ...updates } = input;
      return await updateGoal(goalId, updates);
    }),

  /**
   * Update goal progress
   */
  updateProgress: protectedProcedure
    .input(
      z.object({
        goalId: z.number(),
        currentValue: z.number().nonnegative(),
        targetValue: z.number().positive(),
        updateReason: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await updateGoalProgress(
        input.goalId,
        input.currentValue,
        input.targetValue,
        input.updateReason
      );
    }),

  /**
   * Get goal progress history
   */
  getProgressHistory: protectedProcedure
    .input(z.object({ goalId: z.number() }))
    .query(async ({ input }) => {
      return await getGoalProgressHistory(input.goalId);
    }),

  /**
   * Get student achievements
   */
  getStudentAchievements: protectedProcedure
    .input(z.object({ playerId: z.number() }))
    .query(async ({ input }) => {
      return await getStudentAchievements(input.playerId);
    }),

  /**
   * Get class achievements
   */
  getClassAchievements: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      return await getClassAchievements(ctx.user.id, input.limit || 20);
    }),

  /**
   * Add feedback to a goal
   */
  addFeedback: protectedProcedure
    .input(
      z.object({
        goalId: z.number(),
        playerId: z.number(),
        feedbackText: z.string().min(1).max(500),
        feedbackType: z.enum([
          "encouragement",
          "suggestion",
          "warning",
          "celebration",
        ]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await addGoalFeedback(
        input.goalId,
        input.playerId,
        ctx.user.id,
        input.feedbackText,
        input.feedbackType
      );
    }),

  /**
   * Get feedback for a goal
   */
  getGoalFeedback: protectedProcedure
    .input(z.object({ goalId: z.number() }))
    .query(async ({ input }) => {
      return await getGoalFeedback(input.goalId);
    }),

  /**
   * Get goals due soon
   */
  getGoalsDueSoon: protectedProcedure.query(async ({ ctx }) => {
    return await getGoalsDueSoon(ctx.user.id);
  }),

  /**
   * Get overdue goals
   */
  getOverdueGoals: protectedProcedure.query(async ({ ctx }) => {
    return await getOverdueGoals(ctx.user.id);
  }),

  /**
   * Get goal statistics
   */
  getStatistics: protectedProcedure.query(async ({ ctx }) => {
    return await getGoalStatistics(ctx.user.id);
  }),

  /**
   * Delete a goal
   */
  deleteGoal: protectedProcedure
    .input(z.object({ goalId: z.number() }))
    .mutation(async ({ input }) => {
      return await deleteGoal(input.goalId);
    }),
});

import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  getAlertPreferences,
  createOrUpdateAlertPreferences,
  getStudentAlertHistory,
} from "../db";

export const alertPreferencesRouter = router({
  /**
   * Get current user's alert preferences
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new Error("Not authenticated");
    
    const preferences = await getAlertPreferences(ctx.user.id);
    
    // Return default preferences if none exist
    return preferences || {
      playerId: ctx.user.id,
      enableDeadlineAlerts: true,
      defaultReminderDays: 3,
      alertFrequency: "immediate",
      preferredAlertTime: "09:00",
    };
  }),

  /**
   * Update alert preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        enableDeadlineAlerts: z.boolean(),
        defaultReminderDays: z.number().min(1).max(30),
        alertFrequency: z.enum(["immediate", "daily", "weekly"]),
        preferredAlertTime: z.string().regex(/^\d{2}:\d{2}$/),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      
      const updated = await createOrUpdateAlertPreferences({
        playerId: ctx.user.id,
        enableDeadlineAlerts: input.enableDeadlineAlerts,
        defaultReminderDays: input.defaultReminderDays,
        alertFrequency: input.alertFrequency,
        preferredAlertTime: input.preferredAlertTime,
      });
      
      return updated;
    }),

  /**
   * Get alert history for current user
   */
  getAlertHistory: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }).optional())
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      
      const history = await getStudentAlertHistory(ctx.user.id, input?.limit || 20);
      return history;
    }),

  /**
   * Apply preset preferences
   */
  applyPreset: protectedProcedure
    .input(z.enum(["aggressive", "moderate", "minimal"]))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      
      const presets = {
        aggressive: {
          enableDeadlineAlerts: true,
          defaultReminderDays: 7,
          alertFrequency: "immediate" as const,
          preferredAlertTime: "08:00",
        },
        moderate: {
          enableDeadlineAlerts: true,
          defaultReminderDays: 3,
          alertFrequency: "daily" as const,
          preferredAlertTime: "09:00",
        },
        minimal: {
          enableDeadlineAlerts: true,
          defaultReminderDays: 1,
          alertFrequency: "weekly" as const,
          preferredAlertTime: "10:00",
        },
      };
      
      const preset = presets[input];
      const updated = await createOrUpdateAlertPreferences({
        playerId: ctx.user.id,
        ...preset,
      });
      
      return updated;
    }),
});

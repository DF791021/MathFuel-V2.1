import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const studentRouter = router({
  // Get student dashboard data
  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    const [mastery, streak, badges, recentSessions] = await Promise.all([
      db.getStudentMastery(ctx.user.id),
      db.getStudentStreak(ctx.user.id),
      db.getStudentBadges(ctx.user.id),
      db.getStudentSessions(ctx.user.id, 5),
    ]);

    // Calculate overall stats
    const totalMastered = mastery.filter(m => m.masteryLevel === "mastered").length;
    const totalPracticing = mastery.filter(m => m.masteryLevel === "practicing" || m.masteryLevel === "close").length;
    const overallAccuracy = mastery.length > 0
      ? Math.round(mastery.reduce((sum, m) => sum + m.masteryScore, 0) / mastery.length)
      : 0;

    return {
      streak: streak ?? { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 },
      mastery: {
        totalSkills: mastery.length,
        mastered: totalMastered,
        practicing: totalPracticing,
        overallAccuracy,
        skills: mastery,
      },
      badges: badges.slice(0, 10),
      recentSessions,
    };
  }),

  // Get mastery for all skills
  getMastery: protectedProcedure.query(async ({ ctx }) => {
    return db.getStudentMastery(ctx.user.id);
  }),

  // Get mastery for a specific skill
  getSkillMastery: protectedProcedure
    .input(z.object({ skillId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return db.getStudentSkillMasteryRecord(ctx.user.id, input.skillId);
    }),

  // Get streak info
  getStreak: protectedProcedure.query(async ({ ctx }) => {
    return db.getStudentStreak(ctx.user.id) ?? {
      currentStreak: 0,
      longestStreak: 0,
      totalActiveDays: 0,
      lastActiveDate: null,
    };
  }),

  // Get all badges
  getBadges: protectedProcedure.query(async ({ ctx }) => {
    return db.getStudentBadges(ctx.user.id);
  }),

  // Adaptive recommendations: which skills to work on next
  getRecommendations: protectedProcedure.query(async ({ ctx }) => {
    const mastery = await db.getStudentMasteryWithSkills(ctx.user.id);

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    type Rec = {
      skillId: number;
      skillName: string;
      reason: string;
      reasonType: "close" | "stale" | "struggling";
      masteryScore: number;
      masteryLevel: string;
    };

    const recommendations: Rec[] = [];

    for (const m of mastery) {
      const skillName = m.skillName ?? "Unknown Skill";

      if (m.masteryLevel === "close") {
        recommendations.push({
          skillId: m.skillId, skillName,
          reason: "Almost mastered — one more push!",
          reasonType: "close",
          masteryScore: m.masteryScore, masteryLevel: m.masteryLevel,
        });
      } else if (
        m.masteryLevel === "practicing" &&
        m.lastPracticedAt &&
        new Date(m.lastPracticedAt) < threeDaysAgo
      ) {
        recommendations.push({
          skillId: m.skillId, skillName,
          reason: "You haven't practiced this in a while!",
          reasonType: "stale",
          masteryScore: m.masteryScore, masteryLevel: m.masteryLevel,
        });
      } else if (m.masteryLevel === "practicing" && m.masteryScore < 50) {
        recommendations.push({
          skillId: m.skillId, skillName,
          reason: "Keep practicing to build your skills!",
          reasonType: "struggling",
          masteryScore: m.masteryScore, masteryLevel: m.masteryLevel,
        });
      }
    }

    recommendations.sort((a, b) => {
      const order: Record<string, number> = { close: 0, stale: 1, struggling: 2 };
      return order[a.reasonType] - order[b.reasonType];
    });

    return recommendations.slice(0, 3);
  }),

  // Get daily stats for a date range
  getStatsRange: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return db.getStudentStatsRange(ctx.user.id, input.startDate, input.endDate);
    }),
});

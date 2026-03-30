import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { logEvent } from "../services/eventLogger";

export const studentRouter = router({
  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    const [mastery, streak, badges, recentSessions] = await Promise.all([
      db.getStudentMastery(ctx.user.id),
      db.getStudentStreak(ctx.user.id),
      db.getStudentBadges(ctx.user.id),
      db.getStudentSessions(ctx.user.id, 5),
    ]);

    const totalMastered = mastery.filter(m => m.masteryLevel === "mastered").length;
    const totalPracticing = mastery.filter(m => m.masteryLevel === "practicing" || m.masteryLevel === "close").length;
    const overallAccuracy = mastery.length > 0
      ? Math.round(mastery.reduce((sum, m) => sum + m.masteryScore, 0) / mastery.length)
      : 0;
    const avgConfidence = mastery.length > 0
      ? mastery.reduce((sum, m) => sum + parseFloat(m.confidenceScore as string ?? "0.5"), 0) / mastery.length
      : 0.5;

    return {
      streak: streak ?? { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 },
      mastery: {
        totalSkills: mastery.length,
        mastered: totalMastered,
        practicing: totalPracticing,
        overallAccuracy,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        skills: mastery,
      },
      badges: badges.slice(0, 10),
      recentSessions,
    };
  }),

  getProgress: protectedProcedure.query(async ({ ctx }) => {
    const [mastery, streak, sessions] = await Promise.all([
      db.getStudentMasteryWithSkills(ctx.user.id),
      db.getStudentStreak(ctx.user.id),
      db.getStudentSessions(ctx.user.id, 100),
    ]);

    const completedSessions = sessions.filter(s => s.status === "completed");
    const totalAttempts = completedSessions.reduce((s, sess) => s + (sess.totalProblems ?? 0), 0);
    const totalCorrect = completedSessions.reduce((s, sess) => s + (sess.correctAnswers ?? 0), 0);

    return {
      overview: {
        sessionsCompleted: completedSessions.length,
        totalAttempts,
        accuracy: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) / 100 : 0,
        currentStreakDays: streak?.currentStreak ?? 0,
      },
      skills: mastery.map(m => ({
        skillId: m.skillId,
        skillName: m.skillName,
        masteryScore: m.masteryScore,
        confidenceScore: parseFloat(m.confidenceScore as string ?? "0.5"),
        masteryLevel: m.masteryLevel,
        totalAttempts: m.totalAttempts,
        correctAttempts: m.correctAttempts,
        lastPracticedAt: m.lastPracticedAt,
      })),
    };
  }),

  getMastery: protectedProcedure.query(async ({ ctx }) => {
    const mastery = await db.getStudentMasteryWithSkills(ctx.user.id);
    return mastery.map(m => ({
      ...m,
      confidenceScore: parseFloat(m.confidenceScore as string ?? "0.5"),
    }));
  }),

  getSkillMastery: protectedProcedure
    .input(z.object({ skillId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const m = await db.getStudentSkillMasteryRecord(ctx.user.id, input.skillId);
      if (!m) return null;
      return {
        ...m,
        confidenceScore: parseFloat(m.confidenceScore as string ?? "0.5"),
      };
    }),

  getStreak: protectedProcedure.query(async ({ ctx }) => {
    return db.getStudentStreak(ctx.user.id) ?? {
      currentStreak: 0,
      longestStreak: 0,
      totalActiveDays: 0,
      lastActiveDate: null,
    };
  }),

  getBadges: protectedProcedure.query(async ({ ctx }) => {
    return db.getStudentBadges(ctx.user.id);
  }),

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
      confidenceScore: number;
      masteryLevel: string;
    };

    const recommendations: Rec[] = [];

    for (const m of mastery) {
      const skillName = m.skillName ?? "Unknown Skill";
      const confidence = parseFloat(m.confidenceScore as string ?? "0.5");

      if (m.masteryLevel === "close") {
        recommendations.push({
          skillId: m.skillId, skillName,
          reason: "Almost mastered — one more push!",
          reasonType: "close",
          masteryScore: m.masteryScore, confidenceScore: confidence, masteryLevel: m.masteryLevel,
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
          masteryScore: m.masteryScore, confidenceScore: confidence, masteryLevel: m.masteryLevel,
        });
      } else if (m.masteryLevel === "practicing" && (m.masteryScore < 50 || confidence < 0.4)) {
        recommendations.push({
          skillId: m.skillId, skillName,
          reason: "Keep practicing to build your confidence!",
          reasonType: "struggling",
          masteryScore: m.masteryScore, confidenceScore: confidence, masteryLevel: m.masteryLevel,
        });
      }
    }

    recommendations.sort((a, b) => {
      const order: Record<string, number> = { close: 0, stale: 1, struggling: 2 };
      return order[a.reasonType] - order[b.reasonType];
    });

    return recommendations.slice(0, 3);
  }),

  getStatsRange: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return db.getStudentStatsRange(ctx.user.id, input.startDate, input.endDate);
    }),

  getWeeklyReport: protectedProcedure
    .input(z.object({ weekStart: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (input.weekStart) {
        return db.getWeeklyReport(ctx.user.id, input.weekStart);
      }
      return db.getLatestWeeklyReport(ctx.user.id);
    }),

  generateWeeklyReport: protectedProcedure
    .input(z.object({ weekStart: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const weekEnd = new Date(new Date(input.weekStart).getTime() + 7 * 24 * 60 * 60 * 1000)
        .toISOString().split("T")[0];

      const [stats, mastery, sessions] = await Promise.all([
        db.getStudentStatsRange(ctx.user.id, input.weekStart, weekEnd),
        db.getStudentMasteryWithSkills(ctx.user.id),
        db.getStudentSessions(ctx.user.id, 50),
      ]);

      const weekSessions = sessions.filter(s => {
        const d = s.startedAt?.toISOString().split("T")[0] ?? "";
        return d >= input.weekStart && d < weekEnd && s.status === "completed";
      });

      const totalAttempts = stats.reduce((s, d) => s + (d.problemsAttempted ?? 0), 0);
      const totalCorrect = stats.reduce((s, d) => s + (d.problemsCorrect ?? 0), 0);
      const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) / 100 : 0;

      const sortedByMastery = [...mastery].sort((a, b) => b.masteryScore - a.masteryScore);
      const topSkills = sortedByMastery.slice(0, 3).map(m => ({
        skillId: m.skillId,
        name: m.skillName ?? "Unknown",
        masteryScore: m.masteryScore,
      }));
      const focusAreas = sortedByMastery
        .filter(m => m.masteryScore < 60)
        .slice(-3)
        .map(m => ({
          skillId: m.skillId,
          name: m.skillName ?? "Unknown",
          masteryScore: m.masteryScore,
        }));

      const avgConfidence = mastery.length > 0
        ? mastery.reduce((s, m) => s + parseFloat(m.confidenceScore as string ?? "0.5"), 0) / mastery.length
        : 0.5;

      const summary = {
        sessionsCompleted: weekSessions.length,
        attempts: totalAttempts,
        accuracy,
        confidenceTrend: avgConfidence >= 0.6 ? "up" : avgConfidence <= 0.4 ? "down" : "stable",
        topSkills,
        focusAreas,
      };

      const result = await db.upsertWeeklyReport(ctx.user.id, input.weekStart, summary);

      await logEvent("WEEKLY_REPORT_GENERATED", ctx.user.id, null, {
        weekStart: input.weekStart,
        sessionsCompleted: weekSessions.length,
        accuracy,
      });

      return { reportId: result?.id, summary };
    }),
});

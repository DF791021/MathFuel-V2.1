import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

export const parentRouter = router({
  // Link a child to this parent
  linkChild: protectedProcedure
    .input(z.object({
      childId: z.number().int(),
      relationship: z.string().default("parent"),
    }))
    .mutation(async ({ ctx, input }) => {
      const child = await db.getUserById(input.childId);
      if (!child) throw new TRPCError({ code: "NOT_FOUND", message: "Student not found" });
      await db.linkParentStudent(ctx.user.id, input.childId, input.relationship);
      return { success: true };
    }),

  // Get linked children
  getChildren: protectedProcedure.query(async ({ ctx }) => {
    const links = await db.getParentStudents(ctx.user.id);
    const children = [];
    for (const link of links) {
      const child = await db.getUserById(link.studentId);
      if (child) {
        const streak = await db.getStudentStreak(link.studentId);
        const mastery = await db.getStudentMastery(link.studentId);
        const recentSessions = await db.getStudentSessions(link.studentId, 5);

        const totalMastered = mastery.filter(m => m.masteryLevel === "mastered").length;
        const overallAccuracy = mastery.length > 0
          ? Math.round(mastery.reduce((sum, m) => sum + m.masteryScore, 0) / mastery.length)
          : 0;

        children.push({
          id: child.id,
          name: child.name,
          gradeLevel: child.gradeLevel,
          relationship: link.relationship,
          streak: streak?.currentStreak ?? 0,
          longestStreak: streak?.longestStreak ?? 0,
          totalActiveDays: streak?.totalActiveDays ?? 0,
          skillsMastered: totalMastered,
          totalSkills: mastery.length,
          overallAccuracy,
          recentSessions: recentSessions.map(s => ({
            id: s.id,
            sessionType: s.sessionType,
            totalProblems: s.totalProblems,
            correctAnswers: s.correctAnswers,
            hintsUsed: s.hintsUsed,
            completedAt: s.completedAt,
          })),
        });
      }
    }
    return children;
  }),

  // Get detailed progress for a specific child
  getChildProgress: protectedProcedure
    .input(z.object({ childId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      // Verify parent-child link
      const links = await db.getParentStudents(ctx.user.id);
      const isLinked = links.some(l => l.studentId === input.childId);
      if (!isLinked) throw new TRPCError({ code: "FORBIDDEN", message: "Not your child" });

      const [mastery, streak, badges, sessions] = await Promise.all([
        db.getStudentMastery(input.childId),
        db.getStudentStreak(input.childId),
        db.getStudentBadges(input.childId),
        db.getStudentSessions(input.childId, 20),
      ]);

      // Get last 7 days of stats
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
      const dailyStats = await db.getStudentStatsRange(input.childId, startDate, endDate);

      return {
        mastery,
        streak,
        badges,
        sessions,
        dailyStats,
      };
    }),
});

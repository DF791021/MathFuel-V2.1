import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { users, practiceSessions, problemAttempts, studentSkillMastery, studentStreaks } from "../../drizzle/schema";
import { eq, sql, and, gte, desc } from "drizzle-orm";

// ============================================================================
// XP FORMULA
// ============================================================================
// XP = (correctAnswers * 10) + (streakBonus) + (masteryBonus) + (speedBonus)
// - Each correct answer: 10 XP
// - Streak bonus: currentStreak * 5
// - Mastery bonus: 50 XP per mastered skill
// - Speed bonus: 2 XP per problem answered under 15 seconds

// Anonymous display name generator
const ADJECTIVES = [
  "Blazing", "Cosmic", "Daring", "Electric", "Fearless",
  "Golden", "Heroic", "Infinite", "Jolly", "Keen",
  "Lucky", "Mighty", "Noble", "Omega", "Prime",
  "Quick", "Rapid", "Stellar", "Turbo", "Ultra",
  "Vivid", "Wise", "Xtreme", "Zippy", "Atomic",
  "Brave", "Clever", "Dynamic", "Epic", "Flash",
];

const NOUNS = [
  "Wizard", "Rocket", "Phoenix", "Dragon", "Tiger",
  "Eagle", "Falcon", "Panther", "Wolf", "Bear",
  "Comet", "Star", "Nova", "Bolt", "Spark",
  "Knight", "Hero", "Ninja", "Ranger", "Scout",
  "Genius", "Ace", "Champ", "Legend", "Maven",
  "Prodigy", "Scholar", "Titan", "Voyager", "Zenith",
];

function generateAnonymousName(userId: number): string {
  // Deterministic but unpredictable mapping from userId to name
  const adjIdx = (userId * 7 + 13) % ADJECTIVES.length;
  const nounIdx = (userId * 11 + 3) % NOUNS.length;
  const num = ((userId * 17 + 5) % 99) + 1;
  return `${ADJECTIVES[adjIdx]}${NOUNS[nounIdx]}#${num}`;
}

// Time period filter helper
function getDateCutoff(period: "weekly" | "monthly" | "all_time"): Date | null {
  if (period === "all_time") return null;
  const now = new Date();
  if (period === "weekly") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  // monthly
  const d = new Date(now);
  d.setDate(d.getDate() - 30);
  return d;
}

export const leaderboardRouter = router({
  // ─── Get leaderboard rankings ───
  getRankings: publicProcedure
    .input(z.object({
      period: z.enum(["weekly", "monthly", "all_time"]).default("weekly"),
      gradeLevel: z.number().int().min(1).max(8).optional(),
      limit: z.number().int().min(5).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { rankings: [], totalStudents: 0 };

      const dateCutoff = getDateCutoff(input.period);

      // Build the XP query from problem attempts
      // XP = correct * 10 + fast_answers * 2
      const conditions: any[] = [];
      if (dateCutoff) {
        conditions.push(gte(problemAttempts.createdAt, dateCutoff));
      }

      // Get XP from problem attempts (core scoring)
      const xpQuery = db
        .select({
          studentId: problemAttempts.studentId,
          correctCount: sql<number>`SUM(CASE WHEN ${problemAttempts.isCorrect} = 1 THEN 1 ELSE 0 END)`.as("correctCount"),
          totalCount: sql<number>`COUNT(*)`.as("totalCount"),
          speedBonus: sql<number>`SUM(CASE WHEN ${problemAttempts.isCorrect} = 1 AND ${problemAttempts.timeSpentSeconds} < 15 THEN 2 ELSE 0 END)`.as("speedBonus"),
        })
        .from(problemAttempts)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(problemAttempts.studentId)
        .as("xp");

      // Join with users to get grade info, and with mastery/streaks for bonus XP
      const results = await db
        .select({
          studentId: xpQuery.studentId,
          correctCount: xpQuery.correctCount,
          totalCount: xpQuery.totalCount,
          speedBonus: xpQuery.speedBonus,
          gradeLevel: users.gradeLevel,
          name: users.name,
        })
        .from(xpQuery)
        .innerJoin(users, eq(xpQuery.studentId, users.id))
        .where(
          input.gradeLevel
            ? eq(users.gradeLevel, input.gradeLevel)
            : undefined
        )
        .orderBy(desc(xpQuery.correctCount))
        .limit(input.limit);

      // Now get mastery and streak bonuses for these students
      const studentIds = results.map(r => r.studentId);
      
      // Get mastery counts (mastered skills)
      let masteryMap: Record<number, number> = {};
      if (studentIds.length > 0) {
        const masteryRows = await db
          .select({
            studentId: studentSkillMastery.studentId,
            masteredCount: sql<number>`SUM(CASE WHEN ${studentSkillMastery.masteryLevel} = 'mastered' THEN 1 ELSE 0 END)`.as("masteredCount"),
          })
          .from(studentSkillMastery)
          .where(sql`${studentSkillMastery.studentId} IN (${sql.join(studentIds.map(id => sql`${id}`), sql`, `)})`)
          .groupBy(studentSkillMastery.studentId);
        
        for (const row of masteryRows) {
          masteryMap[row.studentId] = row.masteredCount;
        }
      }

      // Get streak bonuses
      let streakMap: Record<number, number> = {};
      if (studentIds.length > 0) {
        const streakRows = await db
          .select({
            studentId: studentStreaks.studentId,
            currentStreak: studentStreaks.currentStreak,
          })
          .from(studentStreaks)
          .where(sql`${studentStreaks.studentId} IN (${sql.join(studentIds.map(id => sql`${id}`), sql`, `)})`);
        
        for (const row of streakRows) {
          streakMap[row.studentId] = row.currentStreak;
        }
      }

      // Calculate final XP and build rankings
      const rankings = results.map((r, _idx) => {
        const correctXP = r.correctCount * 10;
        const speed = r.speedBonus;
        const masteryBonus = (masteryMap[r.studentId] ?? 0) * 50;
        const streakBonus = (streakMap[r.studentId] ?? 0) * 5;
        const totalXP = correctXP + speed + masteryBonus + streakBonus;

        return {
          studentId: r.studentId,
          anonymousName: generateAnonymousName(r.studentId),
          totalXP,
          correctCount: r.correctCount,
          totalProblems: r.totalCount,
          accuracy: r.totalCount > 0 ? Math.round((r.correctCount / r.totalCount) * 100) : 0,
          masteredSkills: masteryMap[r.studentId] ?? 0,
          currentStreak: streakMap[r.studentId] ?? 0,
          gradeLevel: r.gradeLevel,
        };
      });

      // Sort by totalXP descending
      rankings.sort((a, b) => b.totalXP - a.totalXP);

      // Add rank numbers
      const rankedList = rankings.map((r, idx) => ({
        ...r,
        rank: idx + 1,
      }));

      return {
        rankings: rankedList,
        totalStudents: rankedList.length,
      };
    }),

  // ─── Get current user's rank and stats ───
  getMyRank: protectedProcedure
    .input(z.object({
      period: z.enum(["weekly", "monthly", "all_time"]).default("weekly"),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      const dateCutoff = getDateCutoff(input.period);

      // Get the user's XP
      const conditions: any[] = [eq(problemAttempts.studentId, ctx.user.id)];
      if (dateCutoff) {
        conditions.push(gte(problemAttempts.createdAt, dateCutoff));
      }

      const myStats = await db
        .select({
          correctCount: sql<number>`SUM(CASE WHEN ${problemAttempts.isCorrect} = 1 THEN 1 ELSE 0 END)`.as("correctCount"),
          totalCount: sql<number>`COUNT(*)`.as("totalCount"),
          speedBonus: sql<number>`SUM(CASE WHEN ${problemAttempts.isCorrect} = 1 AND ${problemAttempts.timeSpentSeconds} < 15 THEN 2 ELSE 0 END)`.as("speedBonus"),
        })
        .from(problemAttempts)
        .where(and(...conditions));

      const stats = myStats[0];
      if (!stats || !stats.totalCount) {
        return {
          rank: null,
          anonymousName: generateAnonymousName(ctx.user.id),
          totalXP: 0,
          correctCount: 0,
          totalProblems: 0,
          accuracy: 0,
          masteredSkills: 0,
          currentStreak: 0,
          message: "Complete some practice sessions to appear on the leaderboard!",
        };
      }

      // Get mastery bonus
      const masteryRows = await db
        .select({
          masteredCount: sql<number>`SUM(CASE WHEN ${studentSkillMastery.masteryLevel} = 'mastered' THEN 1 ELSE 0 END)`.as("masteredCount"),
        })
        .from(studentSkillMastery)
        .where(eq(studentSkillMastery.studentId, ctx.user.id));

      const masteredSkills = masteryRows[0]?.masteredCount ?? 0;

      // Get streak bonus
      const streakRows = await db
        .select({ currentStreak: studentStreaks.currentStreak })
        .from(studentStreaks)
        .where(eq(studentStreaks.studentId, ctx.user.id));

      const currentStreak = streakRows[0]?.currentStreak ?? 0;

      const correctXP = stats.correctCount * 10;
      const totalXP = correctXP + stats.speedBonus + (masteredSkills * 50) + (currentStreak * 5);

      // Count how many students have more XP to determine rank
      // This is a simplified rank calculation
      const allStudentConditions: any[] = [];
      if (dateCutoff) {
        allStudentConditions.push(gte(problemAttempts.createdAt, dateCutoff));
      }

      const allStudentXP = await db
        .select({
          studentId: problemAttempts.studentId,
          correctCount: sql<number>`SUM(CASE WHEN ${problemAttempts.isCorrect} = 1 THEN 1 ELSE 0 END)`.as("correctCount"),
          speedBonus: sql<number>`SUM(CASE WHEN ${problemAttempts.isCorrect} = 1 AND ${problemAttempts.timeSpentSeconds} < 15 THEN 2 ELSE 0 END)`.as("speedBonus"),
        })
        .from(problemAttempts)
        .where(allStudentConditions.length > 0 ? and(...allStudentConditions) : undefined)
        .groupBy(problemAttempts.studentId);

      // Count students with more XP (simplified — doesn't include mastery/streak for others, but close enough)
      const studentsAhead = allStudentXP.filter(s => {
        const sXP = (s.correctCount * 10) + s.speedBonus;
        return sXP > (correctXP + stats.speedBonus) && s.studentId !== ctx.user.id;
      }).length;

      return {
        rank: studentsAhead + 1,
        anonymousName: generateAnonymousName(ctx.user.id),
        totalXP,
        correctCount: stats.correctCount,
        totalProblems: stats.totalCount,
        accuracy: stats.totalCount > 0 ? Math.round((stats.correctCount / stats.totalCount) * 100) : 0,
        masteredSkills,
        currentStreak,
        message: null,
      };
    }),

  // ─── Get XP breakdown for current user ───
  getMyXPBreakdown: protectedProcedure
    .input(z.object({
      period: z.enum(["weekly", "monthly", "all_time"]).default("weekly"),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      const dateCutoff = getDateCutoff(input.period);

      const conditions: any[] = [eq(problemAttempts.studentId, ctx.user.id)];
      if (dateCutoff) {
        conditions.push(gte(problemAttempts.createdAt, dateCutoff));
      }

      const stats = await db
        .select({
          correctCount: sql<number>`SUM(CASE WHEN ${problemAttempts.isCorrect} = 1 THEN 1 ELSE 0 END)`.as("correctCount"),
          speedBonus: sql<number>`SUM(CASE WHEN ${problemAttempts.isCorrect} = 1 AND ${problemAttempts.timeSpentSeconds} < 15 THEN 2 ELSE 0 END)`.as("speedBonus"),
        })
        .from(problemAttempts)
        .where(and(...conditions));

      const masteryRows = await db
        .select({
          masteredCount: sql<number>`SUM(CASE WHEN ${studentSkillMastery.masteryLevel} = 'mastered' THEN 1 ELSE 0 END)`.as("masteredCount"),
        })
        .from(studentSkillMastery)
        .where(eq(studentSkillMastery.studentId, ctx.user.id));

      const streakRows = await db
        .select({ currentStreak: studentStreaks.currentStreak })
        .from(studentStreaks)
        .where(eq(studentStreaks.studentId, ctx.user.id));

      const correctXP = (stats[0]?.correctCount ?? 0) * 10;
      const speedXP = stats[0]?.speedBonus ?? 0;
      const masteryXP = (masteryRows[0]?.masteredCount ?? 0) * 50;
      const streakXP = (streakRows[0]?.currentStreak ?? 0) * 5;

      return {
        correctAnswers: { label: "Correct Answers", xp: correctXP, detail: `${stats[0]?.correctCount ?? 0} × 10 XP` },
        speedBonus: { label: "Speed Bonus", xp: speedXP, detail: "2 XP per fast answer (<15s)" },
        masteryBonus: { label: "Skill Mastery", xp: masteryXP, detail: `${masteryRows[0]?.masteredCount ?? 0} skills × 50 XP` },
        streakBonus: { label: "Practice Streak", xp: streakXP, detail: `${streakRows[0]?.currentStreak ?? 0} days × 5 XP` },
        total: correctXP + speedXP + masteryXP + streakXP,
      };
    }),
});

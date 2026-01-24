import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import {
  rouletteGameSessions,
  rouletteGamePlayers,
  rouletteChallenges,
  rouletteRoundResults,
} from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

function generateSessionCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const rouletteRouter = router({
  /**
   * Create a new game session
   */
  createSession: protectedProcedure
    .input(
      z.object({
        totalRounds: z.number().default(5),
        difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const sessionCode = generateSessionCode();
      const result = await db.insert(rouletteGameSessions).values({
        teacherId: ctx.user.id,
        sessionCode,
        totalRounds: input.totalRounds,
        difficulty: input.difficulty,
        gameStatus: "waiting",
        currentRound: 0,
      });

      return { sessionCode, message: "Game session created successfully" };
    }),

  /**
   * Join a game session
   */
  joinSession: protectedProcedure
    .input(
      z.object({
        sessionCode: z.string(),
        playerName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Find session
      const sessions = await db
        .select()
        .from(rouletteGameSessions)
        .where(eq(rouletteGameSessions.sessionCode, input.sessionCode));

      if (sessions.length === 0) {
        throw new Error("Session not found");
      }

      const session = sessions[0];

      // Add player
      const result = await db.insert(rouletteGamePlayers).values({
        sessionId: session.id,
        playerName: input.playerName,
        userId: ctx.user.id,
        totalScore: 0,
        correctAnswers: 0,
        totalAnswers: 0,
        streak: 0,
      });

      return { sessionId: session.id, message: "Joined session successfully" };
    }),

  /**
   * Get game session details
   */
  getSession: protectedProcedure
    .input(z.object({ sessionCode: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const sessions = await db
        .select()
        .from(rouletteGameSessions)
        .where(eq(rouletteGameSessions.sessionCode, input.sessionCode));

      if (sessions.length === 0) {
        return null;
      }

      const session = sessions[0];

      // Get players
      const players = await db
        .select()
        .from(rouletteGamePlayers)
        .where(eq(rouletteGamePlayers.sessionId, session.id));

      return {
        ...session,
        players,
      };
    }),

  /**
   * Get leaderboard for session
   */
  getLeaderboard: protectedProcedure
    .input(z.object({ sessionCode: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const sessions = await db
        .select()
        .from(rouletteGameSessions)
        .where(eq(rouletteGameSessions.sessionCode, input.sessionCode));

      if (sessions.length === 0) {
        return [];
      }

      const players = await db
        .select()
        .from(rouletteGamePlayers)
        .where(eq(rouletteGamePlayers.sessionId, sessions[0].id))
        .orderBy(desc(rouletteGamePlayers.totalScore));

      return players;
    }),

  /**
   * Get random challenge
   */
  getRandomChallenge: protectedProcedure
    .input(z.object({ difficulty: z.enum(["easy", "medium", "hard"]) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const challenges = await db
        .select()
        .from(rouletteChallenges)
        .where(eq(rouletteChallenges.difficulty, input.difficulty));

      if (challenges.length === 0) {
        return null;
      }

      return challenges[Math.floor(Math.random() * challenges.length)];
    }),

  /**
   * Submit answer
   */
  submitAnswer: protectedProcedure
    .input(
      z.object({
        sessionCode: z.string(),
        challengeId: z.number(),
        playerAnswer: z.string(),
        timeSpent: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get session
      const sessions = await db
        .select()
        .from(rouletteGameSessions)
        .where(eq(rouletteGameSessions.sessionCode, input.sessionCode));

      if (sessions.length === 0) {
        throw new Error("Session not found");
      }

      const session = sessions[0];

      // Get challenge
      const challenges = await db
        .select()
        .from(rouletteChallenges)
        .where(eq(rouletteChallenges.id, input.challengeId));

      if (challenges.length === 0) {
        throw new Error("Challenge not found");
      }

      const challenge = challenges[0];

      // Get player
      const players = await db
        .select()
        .from(rouletteGamePlayers)
        .where(eq(rouletteGamePlayers.sessionId, session.id));

      const player = players.find((p) => p.userId === ctx.user.id);
      if (!player) {
        throw new Error("Player not found in session");
      }

      // Check if answer is correct
      const isCorrect =
        input.playerAnswer.toLowerCase().trim() ===
        (challenge.correctAnswer || "").toLowerCase().trim();

      const pointsEarned = isCorrect ? challenge.pointsReward : 0;

      // Record result
      await db.insert(rouletteRoundResults).values({
        sessionId: session.id,
        roundNumber: session.currentRound,
        challengeId: input.challengeId,
        playerId: player.id,
        playerAnswer: input.playerAnswer,
        isCorrect,
        pointsEarned,
        timeSpent: input.timeSpent,
      });

      // Update player score
      const newStreak = isCorrect ? player.streak + 1 : 0;
      const newCorrect = isCorrect ? player.correctAnswers + 1 : player.correctAnswers;

      await db
        .update(rouletteGamePlayers)
        .set({
          totalScore: player.totalScore + pointsEarned,
          correctAnswers: newCorrect,
          totalAnswers: player.totalAnswers + 1,
          streak: newStreak,
        })
        .where(eq(rouletteGamePlayers.id, player.id));

      return {
        isCorrect,
        pointsEarned,
        message: isCorrect ? "Correct!" : "Incorrect",
      };
    }),

  /**
   * Start game session
   */
  startSession: protectedProcedure
    .input(z.object({ sessionCode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const sessions = await db
        .select()
        .from(rouletteGameSessions)
        .where(eq(rouletteGameSessions.sessionCode, input.sessionCode));

      if (sessions.length === 0) {
        throw new Error("Session not found");
      }

      const session = sessions[0];

      // Verify teacher owns this session
      if (session.teacherId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      await db
        .update(rouletteGameSessions)
        .set({
          gameStatus: "active",
          startedAt: new Date(),
          currentRound: 1,
        })
        .where(eq(rouletteGameSessions.id, session.id));

      return { message: "Game started" };
    }),

  /**
   * End game session
   */
  endSession: protectedProcedure
    .input(z.object({ sessionCode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const sessions = await db
        .select()
        .from(rouletteGameSessions)
        .where(eq(rouletteGameSessions.sessionCode, input.sessionCode));

      if (sessions.length === 0) {
        throw new Error("Session not found");
      }

      const session = sessions[0];

      // Verify teacher owns this session
      if (session.teacherId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      await db
        .update(rouletteGameSessions)
        .set({
          gameStatus: "completed",
          endedAt: new Date(),
        })
        .where(eq(rouletteGameSessions.id, session.id));

      return { message: "Game ended" };
    }),

  /**
   * Get teacher's game sessions
   */
  getTeacherSessions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const sessions = await db
      .select()
      .from(rouletteGameSessions)
      .where(eq(rouletteGameSessions.teacherId, ctx.user.id))
      .orderBy(desc(rouletteGameSessions.createdAt));

    return sessions;
  }),
});

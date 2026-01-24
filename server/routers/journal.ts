import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createJournalEntry,
  getStudentJournalEntries,
  getJournalEntryById,
  updateJournalEntry,
  deleteJournalEntry,
  getReflectionPrompts,
  getJournalReflectionsSummary,
  updateJournalReflectionsSummary,
  getJournalInsights,
  getEntriesByGoal,
  getJournalStatistics,
} from "../db";

export const journalRouter = router({
  /**
   * Create a new journal entry
   */
  createEntry: protectedProcedure
    .input(
      z.object({
        playerId: z.number(),
        playerName: z.string(),
        goalId: z.number().optional(),
        title: z.string().min(1),
        content: z.string().min(1),
        mood: z.enum(["excellent", "good", "neutral", "struggling", "discouraged"]),
        challengesFaced: z.string().nullable().optional(),
        strategiesUsed: z.string().nullable().optional(),
        lessonsLearned: z.string().nullable().optional(),
        nextSteps: z.string().nullable().optional(),
        isPrivate: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await createJournalEntry({
          playerId: input.playerId,
          playerName: input.playerName,
          goalId: input.goalId || null,
          title: input.title,
          content: input.content,
          mood: input.mood,
          challengesFaced: input.challengesFaced || null,
          strategiesUsed: input.strategiesUsed || null,
          lessonsLearned: input.lessonsLearned || null,
          nextSteps: input.nextSteps || null,
          isPrivate: input.isPrivate,
        });

        // Update summary
        await updateJournalReflectionsSummary(input.playerId, input.playerName);

        return {
          success: true,
          message: "Journal entry created successfully",
        };
      } catch (error) {
        console.error("[tRPC] Error creating journal entry:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to create entry",
        };
      }
    }),

  /**
   * Get student's journal entries
   */
  getEntries: protectedProcedure
    .input(
      z.object({
        playerId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const entries = await getStudentJournalEntries(
          input.playerId,
          input.limit,
          input.offset
        );
        return {
          success: true,
          entries,
          count: entries.length,
        };
      } catch (error) {
        console.error("[tRPC] Error fetching journal entries:", error);
        return {
          success: false,
          entries: [],
          count: 0,
          error: error instanceof Error ? error.message : "Failed to fetch entries",
        };
      }
    }),

  /**
   * Get single journal entry
   */
  getEntry: protectedProcedure
    .input(z.object({ entryId: z.number() }))
    .query(async ({ input }) => {
      try {
        const entry = await getJournalEntryById(input.entryId);
        return {
          success: !!entry,
          entry,
        };
      } catch (error) {
        console.error("[tRPC] Error fetching journal entry:", error);
        return {
          success: false,
          entry: null,
          error: error instanceof Error ? error.message : "Failed to fetch entry",
        };
      }
    }),

  /**
   * Update journal entry
   */
  updateEntry: protectedProcedure
    .input(
      z.object({
        entryId: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        mood: z.enum(["excellent", "good", "neutral", "struggling", "discouraged"]).optional(),
        challengesFaced: z.string().nullable().optional(),
        strategiesUsed: z.string().nullable().optional(),
        lessonsLearned: z.string().nullable().optional(),
        nextSteps: z.string().nullable().optional(),
        isPrivate: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { entryId, ...updates } = input;
        await updateJournalEntry(entryId, updates);
        return {
          success: true,
          message: "Journal entry updated successfully",
        };
      } catch (error) {
        console.error("[tRPC] Error updating journal entry:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to update entry",
        };
      }
    }),

  /**
   * Delete journal entry
   */
  deleteEntry: protectedProcedure
    .input(z.object({ entryId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await deleteJournalEntry(input.entryId);
        return {
          success: true,
          message: "Journal entry deleted successfully",
        };
      } catch (error) {
        console.error("[tRPC] Error deleting journal entry:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to delete entry",
        };
      }
    }),

  /**
   * Get reflection prompts
   */
  getPrompts: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const prompts = await getReflectionPrompts(input.category);
        return {
          success: true,
          prompts,
        };
      } catch (error) {
        console.error("[tRPC] Error fetching prompts:", error);
        return {
          success: false,
          prompts: [],
          error: error instanceof Error ? error.message : "Failed to fetch prompts",
        };
      }
    }),

  /**
   * Get journal reflections summary
   */
  getSummary: protectedProcedure
    .input(z.object({ playerId: z.number() }))
    .query(async ({ input }) => {
      try {
        const summary = await getJournalReflectionsSummary(input.playerId);
        return {
          success: !!summary,
          summary,
        };
      } catch (error) {
        console.error("[tRPC] Error fetching summary:", error);
        return {
          success: false,
          summary: null,
          error: error instanceof Error ? error.message : "Failed to fetch summary",
        };
      }
    }),

  /**
   * Get journal insights
   */
  getInsights: protectedProcedure
    .input(z.object({ playerId: z.number() }))
    .query(async ({ input }) => {
      try {
        const insights = await getJournalInsights(input.playerId);
        return {
          success: true,
          insights,
        };
      } catch (error) {
        console.error("[tRPC] Error fetching insights:", error);
        return {
          success: false,
          insights: [],
          error: error instanceof Error ? error.message : "Failed to fetch insights",
        };
      }
    }),

  /**
   * Get entries by goal
   */
  getEntriesByGoal: protectedProcedure
    .input(z.object({ goalId: z.number() }))
    .query(async ({ input }) => {
      try {
        const entries = await getEntriesByGoal(input.goalId);
        return {
          success: true,
          entries,
        };
      } catch (error) {
        console.error("[tRPC] Error fetching entries by goal:", error);
        return {
          success: false,
          entries: [],
          error: error instanceof Error ? error.message : "Failed to fetch entries",
        };
      }
    }),

  /**
   * Get journal statistics
   */
  getStatistics: protectedProcedure
    .input(z.object({ playerId: z.number() }))
    .query(async ({ input }) => {
      try {
        const stats = await getJournalStatistics(input.playerId);
        return {
          success: true,
          statistics: stats,
        };
      } catch (error) {
        console.error("[tRPC] Error fetching statistics:", error);
        return {
          success: false,
          statistics: null,
          error: error instanceof Error ? error.message : "Failed to fetch statistics",
        };
      }
    }),
});

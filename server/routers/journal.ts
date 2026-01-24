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
  createJournalInsight,
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

  /**
   * Generate AI insights from journal entries
   */
  generateInsights: protectedProcedure
    .input(z.object({ playerId: z.number(), playerName: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const { analyzeJournalEntries, generateRecommendations, validateAnalysisResults } = await import(
          "../_core/journalAnalysis"
        );

        // Get student's journal entries
        const entries = await getStudentJournalEntries(input.playerId, 50);

        if (entries.length === 0) {
          return {
            success: false,
            error: "No journal entries found to analyze",
          };
        }

        // Analyze entries
        const analysis = await analyzeJournalEntries(entries, input.playerName);

        if (!analysis) {
          return {
            success: false,
            error: "Failed to analyze journal entries",
          };
        }

        // Validate analysis
        if (!validateAnalysisResults(analysis)) {
          return {
            success: false,
            error: "Analysis validation failed",
          };
        }

        // Generate recommendations
        const recommendations = await generateRecommendations(analysis, input.playerName);

        // Save insights to database
        const insightTypes = [
          { type: "progress_trend" as const, data: analysis.progressTrend },
          { type: "challenge_pattern" as const, data: analysis.challengePatterns },
          { type: "strategy_effectiveness" as const, data: analysis.strategyEffectiveness },
          { type: "motivation_level" as const, data: analysis.motivationLevel },
          { type: "learning_style" as const, data: analysis.learningStyle },
        ];

        for (const { type, data } of insightTypes) {
          await createJournalInsight({
            playerId: input.playerId,
            playerName: input.playerName,
            insightType: type,
            insight: data.insight,
            supportingData: data.supportingData,
          });
        }

        return {
          success: true,
          analysis,
          recommendations,
          message: "Insights generated successfully",
        };
      } catch (error) {
        console.error("[tRPC] Error generating insights:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate insights",
        };
      }
    }),

  /**
   * Get latest insights for a student
   */
  getLatestInsights: protectedProcedure
    .input(z.object({ playerId: z.number() }))
    .query(async ({ input }) => {
      try {
        const insights = await getJournalInsights(input.playerId);

        if (insights.length === 0) {
          return {
            success: false,
            insights: null,
            message: "No insights available yet. Generate insights from your journal entries.",
          };
        }

        // Group insights by type and get the latest of each
        const latestInsights: Record<string, any> = {};
        for (const insight of insights) {
          if (!latestInsights[insight.insightType]) {
            latestInsights[insight.insightType] = insight;
          }
        }

        return {
          success: true,
          insights: latestInsights,
        };
      } catch (error) {
        console.error("[tRPC] Error fetching insights:", error);
        return {
          success: false,
          insights: null,
          error: error instanceof Error ? error.message : "Failed to fetch insights",
        };
      }
    }),

  /**
   * Get insight history for a student
   */
  getInsightHistory: protectedProcedure
    .input(z.object({ playerId: z.number(), limit: z.number().default(10) }))
    .query(async ({ input }) => {
      try {
        const insights = await getJournalInsights(input.playerId);

        // Group by generation date and return latest N generations
        const grouped: Record<string, any[]> = {};
        for (const insight of insights) {
          const date = new Date(insight.generatedAt).toLocaleDateString();
          if (!grouped[date]) {
            grouped[date] = [];
          }
          grouped[date].push(insight);
        }

        const history = Object.entries(grouped)
          .slice(0, input.limit)
          .map(([date, insightsForDate]) => ({
            date,
            insights: insightsForDate,
          }));

        return {
          success: true,
          history,
        };
      } catch (error) {
        console.error("[tRPC] Error fetching insight history:", error);
        return {
          success: false,
          history: [],
          error: error instanceof Error ? error.message : "Failed to fetch history",
        };
      }
    }),
});

import { invokeLLM } from "./llm";

export interface JournalInsights {
  progressTrend?: {
    insight: string;
    supportingData: string;
  };
  challengePatterns?: {
    insight: string;
    supportingData: string;
  };
  strategyEffectiveness?: {
    insight: string;
    supportingData: string;
  };
  motivationLevel?: {
    insight: string;
    supportingData: string;
  };
  learningStyle?: {
    insight: string;
    supportingData: string;
  };
  summary?: string;
}

export interface GoalRecommendation {
  title: string;
  description: string;
  type: "accuracy" | "score" | "games_played" | "streak" | "topic_mastery";
  targetValue: number;
  priority: "high" | "medium" | "low";
  rationale: string;
  estimatedDaysToComplete: number;
  relatedInsight: string;
}

/**
 * Generate goal recommendations based on journal insights
 */
export async function generateGoalRecommendations(
  insights: JournalInsights,
  studentName: string,
  recentPerformance?: {
    averageAccuracy: number;
    averageScore: number;
    gamesPlayedThisWeek: number;
    currentStreak: number;
    weakTopics: string[];
  }
): Promise<GoalRecommendation[]> {
  const insightsSummary = buildInsightsSummary(insights);
  const performanceContext = recentPerformance
    ? buildPerformanceContext(recentPerformance)
    : "";

  const prompt = `You are an educational AI assistant helping generate personalized learning goals for a student named ${studentName}.

Based on the following journal insights and performance data, generate 3-5 specific, measurable, and achievable goals that will help the student improve.

JOURNAL INSIGHTS:
${insightsSummary}

${performanceContext ? `RECENT PERFORMANCE DATA:\n${performanceContext}` : ""}

For each goal, provide:
1. A clear, specific title
2. A detailed description of what the goal entails
3. The goal type (accuracy, score, games_played, streak, or topic_mastery)
4. A target numeric value
5. Priority level (high, medium, or low)
6. Rationale explaining why this goal addresses the student's needs
7. Estimated days to complete (7-30 days)
8. Which insight this goal addresses

Format your response as a JSON array with objects containing these exact fields:
[
  {
    "title": "Goal Title",
    "description": "Detailed description",
    "type": "accuracy|score|games_played|streak|topic_mastery",
    "targetValue": 85,
    "priority": "high|medium|low",
    "rationale": "Why this goal helps the student",
    "estimatedDaysToComplete": 14,
    "relatedInsight": "Which insight this addresses"
  }
]

Important: Return ONLY valid JSON array, no additional text.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an expert educational advisor generating personalized learning goals. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "goal_recommendations",
          strict: true,
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                type: {
                  type: "string",
                  enum: ["accuracy", "score", "games_played", "streak", "topic_mastery"],
                },
                targetValue: { type: "number" },
                priority: {
                  type: "string",
                  enum: ["high", "medium", "low"],
                },
                rationale: { type: "string" },
                estimatedDaysToComplete: { type: "number" },
                relatedInsight: { type: "string" },
              },
              required: [
                "title",
                "description",
                "type",
                "targetValue",
                "priority",
                "rationale",
                "estimatedDaysToComplete",
                "relatedInsight",
              ],
              additionalProperties: false,
            },
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in LLM response");
    }

    const contentString = typeof content === "string" ? content : JSON.stringify(content);
    const recommendations = JSON.parse(contentString) as GoalRecommendation[];

    // Validate recommendations
    if (!Array.isArray(recommendations)) {
      throw new Error("Response is not an array");
    }

    return recommendations.filter(validateGoalRecommendation);
  } catch (error) {
    console.error("[goalRecommendations] Error generating recommendations:", error);
    throw error;
  }
}

/**
 * Build a summary of insights for the prompt
 */
function buildInsightsSummary(insights: JournalInsights): string {
  const parts: string[] = [];

  if (insights.progressTrend) {
    parts.push(`Progress Trend: ${insights.progressTrend.insight}`);
  }

  if (insights.challengePatterns) {
    parts.push(`Challenge Patterns: ${insights.challengePatterns.insight}`);
  }

  if (insights.strategyEffectiveness) {
    parts.push(`Strategy Effectiveness: ${insights.strategyEffectiveness.insight}`);
  }

  if (insights.motivationLevel) {
    parts.push(`Motivation Level: ${insights.motivationLevel.insight}`);
  }

  if (insights.learningStyle) {
    parts.push(`Learning Style: ${insights.learningStyle.insight}`);
  }

  if (insights.summary) {
    parts.push(`Overall Summary: ${insights.summary}`);
  }

  return parts.join("\n");
}

/**
 * Build performance context for the prompt
 */
function buildPerformanceContext(performance: {
  averageAccuracy: number;
  averageScore: number;
  gamesPlayedThisWeek: number;
  currentStreak: number;
  weakTopics: string[];
}): string {
  return `
- Average Accuracy: ${performance.averageAccuracy}%
- Average Score: ${performance.averageScore}
- Games Played This Week: ${performance.gamesPlayedThisWeek}
- Current Streak: ${performance.currentStreak}
- Weak Topics: ${performance.weakTopics.join(", ")}
`;
}

/**
 * Validate a goal recommendation
 */
function validateGoalRecommendation(goal: any): goal is GoalRecommendation {
  return (
    typeof goal.title === "string" &&
    typeof goal.description === "string" &&
    ["accuracy", "score", "games_played", "streak", "topic_mastery"].includes(goal.type) &&
    typeof goal.targetValue === "number" &&
    ["high", "medium", "low"].includes(goal.priority) &&
    typeof goal.rationale === "string" &&
    typeof goal.estimatedDaysToComplete === "number" &&
    typeof goal.relatedInsight === "string" &&
    goal.targetValue > 0 &&
    goal.estimatedDaysToComplete > 0 &&
    goal.estimatedDaysToComplete <= 90
  );
}

/**
 * Rank recommendations by priority and relevance
 */
export function rankRecommendations(
  recommendations: GoalRecommendation[]
): GoalRecommendation[] {
  const priorityScore = {
    high: 3,
    medium: 2,
    low: 1,
  };

  return [...recommendations].sort((a, b) => {
    const priorityDiff = priorityScore[b.priority] - priorityScore[a.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // If same priority, prefer shorter estimated completion time
    return a.estimatedDaysToComplete - b.estimatedDaysToComplete;
  });
}

/**
 * Filter recommendations by type
 */
export function filterRecommendationsByType(
  recommendations: GoalRecommendation[],
  types: string[]
): GoalRecommendation[] {
  return recommendations.filter((rec) => types.includes(rec.type));
}

/**
 * Get top N recommendations
 */
export function getTopRecommendations(
  recommendations: GoalRecommendation[],
  count: number = 5
): GoalRecommendation[] {
  return rankRecommendations(recommendations).slice(0, count);
}

import { invokeLLM } from "./llm";

export interface StudentPerformanceData {
  studentName: string | null;
  avgAccuracy: number;
  avgScore: number;
  maxScore: number;
  gamesPlayed: number;
  weakTopics: Array<{
    topic: string;
    masteryPercentage: number;
  }>;
  strongTopics: string[];
  existingGoals: Array<{
    goalType: string;
    status: string;
    progressPercentage: number;
  }>;
}

export interface GoalSuggestion {
  goalType: string;
  goalName: string;
  targetValue: number;
  priority: "low" | "medium" | "high";
  rationale: string;
}

export async function generateAIGoalSuggestions(
  performanceData: StudentPerformanceData
): Promise<GoalSuggestion[]> {
  const prompt = buildGoalSuggestionPrompt(performanceData);

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an educational AI assistant that analyzes student performance data and generates personalized, achievable learning goals. Your suggestions should be:
- Specific and measurable
- Challenging but achievable (typically 10-20% improvement from current performance)
- Focused on areas of improvement while building on strengths
- Motivating and encouraging
- Realistic given the student's current performance level

Always respond with a valid JSON array of goal suggestions.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "goal_suggestions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    goalType: {
                      type: "string",
                      enum: ["accuracy", "score", "games_played", "streak", "topic_mastery"],
                      description: "Type of goal",
                    },
                    goalName: {
                      type: "string",
                      description: "Clear, motivating name for the goal",
                    },
                    targetValue: {
                      type: "number",
                      description: "Numeric target value for the goal",
                    },
                    priority: {
                      type: "string",
                      enum: ["low", "medium", "high"],
                      description: "Priority level of the goal",
                    },
                    rationale: {
                      type: "string",
                      description: "Explanation of why this goal is recommended",
                    },
                  },
                  required: ["goalType", "goalName", "targetValue", "priority", "rationale"],
                  additionalProperties: false,
                },
              },
            },
            required: ["suggestions"],
            additionalProperties: false,
          },
        },
      },
    });

    // Parse the response
    const content = response.choices[0].message.content;
    if (typeof content !== "string") {
      console.error("Unexpected response format from LLM");
      return [];
    }

    const parsed = JSON.parse(content);
    return parsed.suggestions || [];
  } catch (error) {
    console.error("Error generating AI goal suggestions:", error);
    return [];
  }
}

function buildGoalSuggestionPrompt(data: StudentPerformanceData): string {
  const weakTopicsText =
    data.weakTopics.length > 0
      ? data.weakTopics
          .map((t) => `- ${t.topic}: ${t.masteryPercentage}% mastery`)
          .join("\n")
      : "None identified";

  const strongTopicsText =
    data.strongTopics.length > 0
      ? data.strongTopics.join(", ")
      : "No strong topics yet";

  const activeGoalsText =
    data.existingGoals.filter((g) => g.status === "active").length > 0
      ? `${data.existingGoals.filter((g) => g.status === "active").length} active goals`
      : "No active goals";

  return `Analyze the following student performance data and suggest 2-3 personalized, achievable learning goals:

**Student:** ${data.studentName}
**Games Played:** ${data.gamesPlayed}
**Average Accuracy:** ${data.avgAccuracy}%
**Average Score:** ${data.avgScore} points
**Best Score:** ${data.maxScore} points

**Areas for Improvement (Low Mastery Topics):**
${weakTopicsText}

**Strong Areas (High Mastery Topics):**
${strongTopicsText}

**Current Goals:**
${activeGoalsText}

Based on this data, suggest 2-3 specific, measurable goals that:
1. Address the student's weakest areas while building on strengths
2. Are achievable within 30 days (typically 10-20% improvement)
3. Include a mix of goal types (accuracy, score, games_played, streak, or topic_mastery)
4. Have clear, motivating names
5. Include a rationale explaining why each goal is recommended

For target values:
- Accuracy goals: suggest 5-15% improvement from current average
- Score goals: suggest 10-20% improvement from current average
- Games played: suggest 10-20 games based on current pace
- Streak goals: suggest 3-5 consecutive correct answers
- Topic mastery: suggest 10-20% improvement for weak topics

Return the suggestions as a JSON array with the exact structure specified.`;
}

export async function validateGoalSuggestions(
  suggestions: GoalSuggestion[]
): Promise<boolean> {
  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    return false;
  }

  const validGoalTypes = ["accuracy", "score", "games_played", "streak", "topic_mastery"];
  const validPriorities = ["low", "medium", "high"];

  return suggestions.every((suggestion) => {
    return (
      validGoalTypes.includes(suggestion.goalType) &&
      typeof suggestion.goalName === "string" &&
      suggestion.goalName.length > 0 &&
      typeof suggestion.targetValue === "number" &&
      suggestion.targetValue > 0 &&
      validPriorities.includes(suggestion.priority) &&
      typeof suggestion.rationale === "string" &&
      suggestion.rationale.length > 0
    );
  });
}

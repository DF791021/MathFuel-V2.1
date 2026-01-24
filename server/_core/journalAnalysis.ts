import { invokeLLM } from "./llm";

export interface JournalEntry {
  id: number;
  title: string;
  content: string;
  mood: string;
  challengesFaced?: string | null;
  strategiesUsed?: string | null;
  lessonsLearned?: string | null;
  nextSteps?: string | null;
  entryDate: Date;
}

export interface InsightResult {
  insightType: "progress_trend" | "challenge_pattern" | "strategy_effectiveness" | "motivation_level" | "learning_style";
  insight: string;
  supportingData: string;
}

export interface AnalysisResults {
  progressTrend: InsightResult;
  challengePatterns: InsightResult;
  strategyEffectiveness: InsightResult;
  motivationLevel: InsightResult;
  learningStyle: InsightResult;
  summary: string;
}

/**
 * Analyze student journal entries and generate personalized insights
 */
export async function analyzeJournalEntries(
  entries: JournalEntry[],
  studentName: string
): Promise<AnalysisResults | null> {
  if (entries.length === 0) {
    return null;
  }

  // Prepare journal summary for analysis
  const journalSummary = prepareJournalSummary(entries);

  try {
    // Generate comprehensive analysis using LLM
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert educational psychologist and learning coach specializing in student development and metacognition. 
Your role is to analyze student journal entries and provide personalized, actionable insights that help students understand their learning patterns, 
overcome challenges, and develop effective strategies. Be encouraging, specific, and data-driven in your analysis.`,
        },
        {
          role: "user",
          content: `Please analyze the following journal entries from a student named ${studentName} and provide detailed insights in JSON format.

Journal Summary:
${journalSummary}

Provide your analysis as a JSON object with the following structure:
{
  "progressTrend": {
    "insight": "Description of the student's overall progress trend",
    "supportingData": "Specific evidence from the journals"
  },
  "challengePatterns": {
    "insight": "Common challenges or obstacles the student faces",
    "supportingData": "Examples and patterns observed"
  },
  "strategyEffectiveness": {
    "insight": "Which strategies are working well for this student",
    "supportingData": "Evidence of strategy success"
  },
  "motivationLevel": {
    "insight": "Assessment of student motivation and emotional state",
    "supportingData": "Mood patterns and engagement indicators"
  },
  "learningStyle": {
    "insight": "Identified learning preferences and styles",
    "supportingData": "Evidence from journal entries"
  },
  "summary": "A brief, encouraging summary of the student's overall development"
}

Make sure each insight is specific, actionable, and encouraging.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "journal_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              progressTrend: {
                type: "object",
                properties: {
                  insight: { type: "string" },
                  supportingData: { type: "string" },
                },
                required: ["insight", "supportingData"],
              },
              challengePatterns: {
                type: "object",
                properties: {
                  insight: { type: "string" },
                  supportingData: { type: "string" },
                },
                required: ["insight", "supportingData"],
              },
              strategyEffectiveness: {
                type: "object",
                properties: {
                  insight: { type: "string" },
                  supportingData: { type: "string" },
                },
                required: ["insight", "supportingData"],
              },
              motivationLevel: {
                type: "object",
                properties: {
                  insight: { type: "string" },
                  supportingData: { type: "string" },
                },
                required: ["insight", "supportingData"],
              },
              learningStyle: {
                type: "object",
                properties: {
                  insight: { type: "string" },
                  supportingData: { type: "string" },
                },
                required: ["insight", "supportingData"],
              },
              summary: { type: "string" },
            },
            required: [
              "progressTrend",
              "challengePatterns",
              "strategyEffectiveness",
              "motivationLevel",
              "learningStyle",
              "summary",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    // Parse the response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in LLM response");
    }

    const parsed = typeof content === "string" ? JSON.parse(content) : content;

    return {
      progressTrend: {
        insightType: "progress_trend",
        insight: parsed.progressTrend.insight,
        supportingData: parsed.progressTrend.supportingData,
      },
      challengePatterns: {
        insightType: "challenge_pattern",
        insight: parsed.challengePatterns.insight,
        supportingData: parsed.challengePatterns.supportingData,
      },
      strategyEffectiveness: {
        insightType: "strategy_effectiveness",
        insight: parsed.strategyEffectiveness.insight,
        supportingData: parsed.strategyEffectiveness.supportingData,
      },
      motivationLevel: {
        insightType: "motivation_level",
        insight: parsed.motivationLevel.insight,
        supportingData: parsed.motivationLevel.supportingData,
      },
      learningStyle: {
        insightType: "learning_style",
        insight: parsed.learningStyle.insight,
        supportingData: parsed.learningStyle.supportingData,
      },
      summary: parsed.summary,
    };
  } catch (error) {
    console.error("[Journal Analysis] Error analyzing entries:", error);
    throw error;
  }
}

/**
 * Generate specific recommendations based on journal analysis
 */
export async function generateRecommendations(
  analysis: AnalysisResults,
  studentName: string
): Promise<string[]> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert educational coach. Based on analysis of student journal entries, 
provide 3-5 specific, actionable recommendations to help the student improve their learning and overcome challenges.`,
        },
        {
          role: "user",
          content: `Based on the following analysis of ${studentName}'s learning journey, provide specific recommendations:

Progress Trend: ${analysis.progressTrend.insight}
Challenges: ${analysis.challengePatterns.insight}
Effective Strategies: ${analysis.strategyEffectiveness.insight}
Motivation: ${analysis.motivationLevel.insight}
Learning Style: ${analysis.learningStyle.insight}

Provide 3-5 specific, actionable recommendations as a JSON array of strings. Each recommendation should be:
- Specific and actionable
- Based on the analysis above
- Encouraging and supportive
- Realistic and achievable

Format: ["recommendation 1", "recommendation 2", ...]`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "recommendations",
          strict: true,
          schema: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
            maxItems: 5,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return [];
    }

    const parsed = typeof content === "string" ? JSON.parse(content) : content;
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("[Journal Analysis] Error generating recommendations:", error);
    return [];
  }
}

/**
 * Prepare journal entries for AI analysis
 */
function prepareJournalSummary(entries: JournalEntry[]): string {
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
  );

  const summary = sortedEntries
    .slice(0, 20) // Analyze last 20 entries
    .map((entry) => {
      const date = new Date(entry.entryDate).toLocaleDateString();
      return `
Date: ${date}
Title: ${entry.title}
Mood: ${entry.mood}
Reflection: ${entry.content}
${entry.challengesFaced ? `Challenges: ${entry.challengesFaced}` : ""}
${entry.strategiesUsed ? `Strategies Used: ${entry.strategiesUsed}` : ""}
${entry.lessonsLearned ? `Lessons Learned: ${entry.lessonsLearned}` : ""}
${entry.nextSteps ? `Next Steps: ${entry.nextSteps}` : ""}
      `.trim();
    })
    .join("\n---\n");

  return summary;
}

/**
 * Validate analysis results
 */
export function validateAnalysisResults(results: any): boolean {
  const requiredFields = [
    "progressTrend",
    "challengePatterns",
    "strategyEffectiveness",
    "motivationLevel",
    "learningStyle",
    "summary",
  ];

  for (const field of requiredFields) {
    if (!results[field]) {
      return false;
    }

    if (field !== "summary") {
      if (!results[field].insight || !results[field].supportingData) {
        return false;
      }
    }
  }

  return true;
}

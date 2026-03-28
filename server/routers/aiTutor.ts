import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { z } from "zod";
import * as db from "../db";

/**
 * AI Tutor Router
 *
 * Provides dynamic, age-appropriate hints and explanations using LLM.
 * Design philosophy: help students UNDERSTAND concepts, never just give answers.
 * All responses are scaffolded for Grade 1-2 reading level.
 */

const SYSTEM_PROMPT = `You are MathBuddy, a warm and encouraging math tutor for children in Grades 1-2 (ages 6-8).

RULES:
- Use simple words a 6-year-old can read (no words over 3 syllables unless necessary)
- Keep sentences short (under 12 words each)
- Be warm, patient, and encouraging — never condescending
- Use concrete examples kids can picture (fingers, apples, toys, blocks)
- NEVER reveal the answer directly — guide the student to discover it
- Use emoji sparingly (1-2 per response max) for warmth
- If the student is wrong, be gentle — "Almost!" or "Good try!" not "Wrong"
- Focus on building conceptual understanding, not memorization
- Keep total response under 80 words`;

const HINT_PROMPT_TEMPLATE = `The student is working on this math problem:
Question: {question}
Problem type: {problemType}
Difficulty level: {difficulty}/5

The student has already seen {hintsUsed} hint(s) so far.
{previousHints}

Generate the NEXT scaffolded hint. Each hint should get progressively more specific:
- Hint 1: Remind them of the general strategy (e.g., "Try counting on your fingers!")
- Hint 2: Break the problem into a simpler step (e.g., "Start with the bigger number first")
- Hint 3: Give a very specific nudge without revealing the answer (e.g., "5 plus 2 more... count: 6, 7...")

Remember: NEVER say the answer. Help them figure it out themselves.
Return ONLY the hint text, no labels or prefixes.`;

const EXPLANATION_CORRECT_TEMPLATE = `The student just answered this math problem CORRECTLY:
Question: {question}
Correct answer: {answer}
Student's answer: {studentAnswer}
Problem type: {problemType}

Give a brief, celebratory explanation of WHY the answer is correct. 
Reinforce the concept so they remember it next time.
Use a concrete example or visual if helpful.
Keep it under 50 words. Be enthusiastic but not over-the-top.
Return ONLY the explanation text.`;

const EXPLANATION_WRONG_TEMPLATE = `The student just answered this math problem INCORRECTLY:
Question: {question}
Correct answer: {answer}
Student's answer: {studentAnswer}
Problem type: {problemType}

Give a gentle, encouraging explanation of:
1. Why their answer isn't quite right (be kind!)
2. How to think about this problem correctly
3. A simple way to remember for next time

Do NOT just say the answer — explain the thinking process.
Keep it under 70 words. Be warm and supportive.
Return ONLY the explanation text.`;

/**
 * Fill template placeholders with actual values
 */
function fillTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}

/**
 * Extract text content from LLM response
 */
function extractContent(result: any): string {
  const content = result?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    const textPart = content.find((p: any) => p.type === "text");
    return textPart?.text?.trim() ?? "";
  }
  return "";
}

export const aiTutorRouter = router({
  /**
   * Generate a dynamic AI hint for a problem the student is stuck on.
   * Hints are scaffolded — each successive hint gets more specific.
   */
  getAIHint: protectedProcedure
    .input(z.object({
      problemId: z.number().int(),
      hintsUsed: z.number().int().min(0).max(10),
      previousHints: z.array(z.string()).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const problem = await db.getProblemById(input.problemId);
      if (!problem) throw new Error("Problem not found");

      const previousHintsText = input.previousHints.length > 0
        ? `Previous hints shown:\n${input.previousHints.map((h, i) => `- Hint ${i + 1}: ${h}`).join("\n")}`
        : "No previous hints shown yet.";

      const userMessage = fillTemplate(HINT_PROMPT_TEMPLATE, {
        question: problem.questionText,
        problemType: problem.problemType,
        difficulty: String(problem.difficulty),
        hintsUsed: String(input.hintsUsed),
        previousHints: previousHintsText,
      });

      try {
        const result = await invokeLLM({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          maxTokens: 150,
        });

        const hint = extractContent(result);

        if (!hint) {
          // Fallback to static hints if AI fails
          const staticHints = problem.hintSteps as string[];
          const fallbackIdx = Math.min(input.hintsUsed, staticHints.length - 1);
          return {
            hint: staticHints[fallbackIdx] ?? "Try breaking the problem into smaller parts!",
            isAI: false,
          };
        }

        return { hint, isAI: true };
      } catch (error) {
        console.error("[AI Tutor] Hint generation failed:", error);
        // Graceful fallback to static hints
        const staticHints = problem.hintSteps as string[];
        const fallbackIdx = Math.min(input.hintsUsed, staticHints.length - 1);
        return {
          hint: staticHints[fallbackIdx] ?? "Try breaking the problem into smaller parts!",
          isAI: false,
        };
      }
    }),

  /**
   * Generate a dynamic AI explanation after the student answers.
   * Different tone for correct vs incorrect answers.
   */
  getAIExplanation: protectedProcedure
    .input(z.object({
      problemId: z.number().int(),
      studentAnswer: z.string(),
      isCorrect: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const problem = await db.getProblemById(input.problemId);
      if (!problem) throw new Error("Problem not found");

      const template = input.isCorrect
        ? EXPLANATION_CORRECT_TEMPLATE
        : EXPLANATION_WRONG_TEMPLATE;

      const userMessage = fillTemplate(template, {
        question: problem.questionText,
        answer: problem.correctAnswer,
        studentAnswer: input.studentAnswer,
        problemType: problem.problemType,
      });

      try {
        const result = await invokeLLM({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          maxTokens: 200,
        });

        const explanation = extractContent(result);

        if (!explanation) {
          return {
            explanation: problem.explanation ?? "Keep practicing — you're getting better!",
            isAI: false,
          };
        }

        return { explanation, isAI: true };
      } catch (error) {
        console.error("[AI Tutor] Explanation generation failed:", error);
        return {
          explanation: problem.explanation ?? "Keep practicing — you're getting better!",
          isAI: false,
        };
      }
    }),

  /**
   * Generate an encouraging message based on the student's session performance.
   * Called at the end of a practice session.
   */
  getSessionSummary: protectedProcedure
    .input(z.object({
      totalProblems: z.number().int(),
      correctAnswers: z.number().int(),
      hintsUsed: z.number().int(),
      streak: z.number().int(),
      skillsWorkedOn: z.array(z.string()).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const accuracy = input.totalProblems > 0
        ? Math.round((input.correctAnswers / input.totalProblems) * 100)
        : 0;

      const userMessage = `A Grade 1-2 student just finished a math practice session:
- Got ${input.correctAnswers} out of ${input.totalProblems} correct (${accuracy}%)
- Used ${input.hintsUsed} hints
- Current streak: ${input.streak} days
- Skills practiced: ${input.skillsWorkedOn.join(", ") || "various math skills"}

Write a short, personalized encouragement message (under 60 words).
If they did great (80%+), celebrate their achievement.
If they struggled (<50%), be extra supportive and suggest they try easier problems or use more hints.
If they're in the middle, acknowledge their effort and encourage them to keep going.
Mention their streak if it's 3+ days.
Return ONLY the message text.`;

      try {
        const result = await invokeLLM({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          maxTokens: 120,
        });

        const summary = extractContent(result);
        return { summary: summary || getDefaultSummary(accuracy), isAI: !!summary };
      } catch (error) {
        console.error("[AI Tutor] Session summary generation failed:", error);
        return { summary: getDefaultSummary(accuracy), isAI: false };
      }
    }),

  /**
   * Submit feedback (thumbs up/down) on an AI response.
   * Simple, child-friendly — just a tap.
   */
  submitFeedback: protectedProcedure
    .input(z.object({
      sessionId: z.number().int().optional(),
      problemId: z.number().int().optional(),
      responseType: z.enum(["hint", "explanation", "session_summary"]),
      rating: z.enum(["up", "down"]),
      aiResponseText: z.string().optional(),
      comment: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.submitAIFeedback({
        studentId: ctx.user.id,
        sessionId: input.sessionId ?? null,
        problemId: input.problemId ?? null,
        responseType: input.responseType,
        rating: input.rating,
        aiResponseText: input.aiResponseText ?? null,
        comment: input.comment ?? null,
      });
      return { success: true, id: result?.id ?? null };
    }),

  /**
   * Get AI feedback quality stats (admin/parent view).
   */
  getFeedbackStats: protectedProcedure
    .query(async ({ ctx }) => {
      return db.getAIFeedbackStats();
    }),

  /**
   * Get feedback for a specific session.
   */
  getSessionFeedback: protectedProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return db.getAIFeedbackForSession(input.sessionId);
    }),

  /**
   * Identify error patterns from a student's recent incorrect attempts.
   * Uses LLM to detect recurring mistake types (e.g., off-by-one, digit reversal).
   * Designed for parents and teachers to understand where a student struggles.
   */
  getErrorPatterns: protectedProcedure
    .input(z.object({
      studentId: z.number().int().optional(), // defaults to the calling user
      limitDays: z.number().int().min(7).max(90).default(30),
    }))
    .query(async ({ ctx, input }) => {
      const targetStudentId = input.studentId ?? ctx.user.id;

      const incorrectAttempts = await db.getRecentIncorrectAttempts(targetStudentId, input.limitDays, 60);

      if (incorrectAttempts.length === 0) {
        return { patterns: [], message: "No recent mistakes — great work! 🌟" };
      }

      // Fetch unique problems and skills referenced in the attempts
      const uniqueProblemIds = [...new Set(incorrectAttempts.map(a => a.problemId))];
      const uniqueSkillIds = [...new Set(incorrectAttempts.map(a => a.skillId))];

      const [problemDetails, skillDetails] = await Promise.all([
        Promise.all(uniqueProblemIds.map(id => db.getProblemById(id))),
        Promise.all(uniqueSkillIds.map(id => db.getSkillById(id))),
      ]);

      const problemMap = new Map(problemDetails.filter(Boolean).map(p => [p!.id, p!]));
      const skillMap = new Map(skillDetails.filter(Boolean).map(s => [s!.id, s!]));

      // Group attempts by skill
      const bySkill = new Map<number, typeof incorrectAttempts>();
      for (const attempt of incorrectAttempts) {
        if (!bySkill.has(attempt.skillId)) bySkill.set(attempt.skillId, []);
        bySkill.get(attempt.skillId)!.push(attempt);
      }

      // Build mistake summary for the LLM
      const mistakeSections = Array.from(bySkill.entries())
        .map(([skillId, attempts]) => {
          const skillName = skillMap.get(skillId)?.name ?? `Skill #${skillId}`;
          const examples = attempts
            .slice(0, 5)
            .map(a => {
              const problem = problemMap.get(a.problemId);
              if (!problem) return null;
              return `  - "${problem.questionText}" → student: "${a.studentAnswer}", correct: "${problem.correctAnswer}"`;
            })
            .filter(Boolean)
            .join("\n");
          return `Skill: "${skillName}" (${attempts.length} mistake${attempts.length !== 1 ? "s" : ""})\n${examples}`;
        })
        .join("\n\n");

      const userMessage = `Analyze these math errors from a Grade 1-2 student over the past ${input.limitDays} days.

For each skill listed, identify the main error pattern (e.g., "off-by-one", "digit reversal", "adds instead of subtracts").

MISTAKES:
${mistakeSections}

Return a JSON array (and NOTHING else) in this exact format:
[
  {
    "skillName": "Single-digit Addition",
    "pattern": "Off-by-one errors",
    "description": "Student answers are consistently 1 more or 1 less than correct",
    "frequency": 5,
    "recommendation": "Practice counting on from the larger number using objects"
  }
]
If no clear pattern exists for a skill, omit it from the results.
If the array would be empty, return [].`;

      try {
        const result = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are an expert math educator analyzing student error patterns. Return only valid JSON arrays, no prose or markdown fences.",
            },
            { role: "user", content: userMessage },
          ],
          maxTokens: 700,
        });

        const rawContent = extractContent(result);
        // Strip markdown code fences if the model adds them
        const jsonStr = rawContent
          .replace(/^```(?:json)?\n?/m, "")
          .replace(/\n?```$/m, "")
          .trim();

        let patterns: any[] = [];
        try {
          const parsed = JSON.parse(jsonStr);
          patterns = Array.isArray(parsed) ? parsed : [];
        } catch {
          patterns = [];
        }

        return {
          patterns,
          message: patterns.length > 0
            ? null
            : "No clear patterns found yet — keep practicing to gather more data!",
        };
      } catch (error) {
        console.error("[AI Tutor] Error pattern analysis failed:", error);
        return {
          patterns: [],
          message: "Unable to analyze patterns right now. Check back after more practice sessions!",
        };
      }
    }),
});

function getDefaultSummary(accuracy: number): string {
  if (accuracy >= 90) return "Outstanding! You're a math superstar! Keep up the amazing work!";
  if (accuracy >= 70) return "Great job! You're getting stronger every day. Keep practicing!";
  if (accuracy >= 50) return "Good effort! Try using hints when you're stuck — they really help!";
  return "Don't worry! Every practice makes you stronger. Try again — you've got this!";
}

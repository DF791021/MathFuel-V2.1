import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { logEvent } from "../services/eventLogger";
import {
  runAdaptiveEngine,
  computeEngagementScore,
  buildSessionSummary,
} from "../services/adaptiveEngine";

function checkAnswer(studentAnswer: string, correctAnswer: string, answerType: string): boolean {
  const normalizedStudent = studentAnswer.trim().toLowerCase();
  const normalizedCorrect = correctAnswer.trim().toLowerCase();

  if (answerType === "number") {
    const studentNum = parseFloat(normalizedStudent);
    const correctNum = parseFloat(normalizedCorrect);
    if (isNaN(studentNum) || isNaN(correctNum)) return false;
    return Math.abs(studentNum - correctNum) < 0.001;
  }

  if (answerType === "boolean") {
    const trueValues = ["true", "yes", "1"];
    const falseValues = ["false", "no", "0"];
    const studentBool = trueValues.includes(normalizedStudent) ? true : falseValues.includes(normalizedStudent) ? false : null;
    const correctBool = trueValues.includes(normalizedCorrect) ? true : falseValues.includes(normalizedCorrect) ? false : null;
    return studentBool === correctBool;
  }

  return normalizedStudent === normalizedCorrect;
}

function calculateMasteryLevel(score: number): "not_started" | "practicing" | "close" | "mastered" {
  if (score >= 90) return "mastered";
  if (score >= 70) return "close";
  if (score > 0) return "practicing";
  return "not_started";
}

export const practiceRouter = router({
  startSession: protectedProcedure
    .input(z.object({
      sessionType: z.enum(["daily", "practice", "review", "assessment"]).default("daily"),
      skillIds: z.array(z.number().int()).optional(),
      gradeLevel: z.number().int().min(1).max(12).default(1),
      targetSkillId: z.number().int().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.createPracticeSession({
        studentId: ctx.user.id,
        sessionType: input.sessionType,
        status: "in_progress",
        totalProblems: 0,
        correctAnswers: 0,
        hintsUsed: 0,
        totalTimeSeconds: 0,
        averageDifficulty: 100,
        skillsFocused: input.skillIds ?? [],
        targetSkillId: input.targetSkillId ?? null,
        confidenceScore: "0.5000",
        masterySnapshot: {},
      });

      const sessionId = result?.id ?? 0;

      await logEvent("SESSION_STARTED", ctx.user.id, sessionId, {
        sessionType: input.sessionType,
        gradeLevel: input.gradeLevel,
        targetSkillId: input.targetSkillId ?? null,
      });

      return { sessionId };
    }),

  getNextProblem: protectedProcedure
    .input(z.object({
      sessionId: z.number().int(),
      gradeLevel: z.number().int().min(1).max(12).default(1),
      excludeProblemIds: z.array(z.number().int()).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const session = await db.getPracticeSession(input.sessionId);
      if (!session || session.studentId !== ctx.user.id) {
        throw new Error("Session not found");
      }

      const attempts = await db.getSessionAttempts(input.sessionId);
      const recentAttempts = attempts.slice(-5);
      const correctRate = recentAttempts.length > 0
        ? recentAttempts.filter(a => a.isCorrect).length / recentAttempts.length
        : 0.5;

      const currentDifficulty = session.averageDifficulty ? Math.round(session.averageDifficulty / 100) : 1;

      let nextDifficulty = currentDifficulty;
      if (correctRate >= 0.85) nextDifficulty = Math.min(5, currentDifficulty + 1);
      else if (correctRate <= 0.4) nextDifficulty = Math.max(1, currentDifficulty - 1);

      const skills = await db.getSkillsByGrade(input.gradeLevel);
      const skillIds = (session.skillsFocused as number[] | null)?.length
        ? (session.skillsFocused as number[])
        : skills.map(s => s.id);

      if (skillIds.length === 0) return null;

      const problems = await db.getProblemsForSession(skillIds, nextDifficulty, 10);
      const excludeSet = new Set(input.excludeProblemIds ?? []);
      const candidates = problems.filter(p => !excludeSet.has(p.id));
      const problem = candidates.length > 0 ? candidates[0] : problems[0];

      if (!problem) return null;

      const sequenceNumber = (await db.getSessionQuestionCount(input.sessionId)) + 1;

      const sqResult = await db.createSessionQuestion({
        sessionId: input.sessionId,
        studentId: ctx.user.id,
        problemId: problem.id,
        skillId: problem.skillId,
        sequenceNumber,
        servedDifficulty: nextDifficulty,
      });

      await logEvent("QUESTION_SERVED", ctx.user.id, input.sessionId, {
        problemId: problem.id,
        skillId: problem.skillId,
        difficulty: nextDifficulty,
        sequenceNumber,
      });

      return {
        sessionQuestionId: sqResult?.id ?? null,
        sequenceNumber,
        id: problem.id,
        skillId: problem.skillId,
        problemType: problem.problemType,
        difficulty: problem.difficulty,
        questionText: problem.questionText,
        questionImage: problem.questionImage,
        answerType: problem.answerType,
        choices: problem.choices,
        adaptation: {
          targetDifficulty: nextDifficulty,
          recentCorrectRate: correctRate,
        },
      };
    }),

  logHint: protectedProcedure
    .input(z.object({
      sessionId: z.number().int(),
      sessionQuestionId: z.number().int().optional(),
      problemId: z.number().int(),
      hintIndex: z.number().int().min(1).default(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const session = await db.getPracticeSession(input.sessionId);
      if (!session || session.studentId !== ctx.user.id) {
        throw new Error("Session not found");
      }

      const result = await db.logHintUsage({
        sessionId: input.sessionId,
        sessionQuestionId: input.sessionQuestionId ?? null,
        studentId: ctx.user.id,
        problemId: input.problemId,
        hintIndex: input.hintIndex,
      });

      await logEvent("HINT_USED", ctx.user.id, input.sessionId, {
        problemId: input.problemId,
        hintIndex: input.hintIndex,
      });

      return { hintUsageId: result?.id ?? null };
    }),

  getHint: protectedProcedure
    .input(z.object({
      problemId: z.number().int(),
      hintIndex: z.number().int().min(0),
    }))
    .query(async ({ input }) => {
      const problem = await db.getProblemById(input.problemId);
      if (!problem) throw new Error("Problem not found");

      const hints = problem.hintSteps as string[];
      if (input.hintIndex >= hints.length) {
        return { hint: null, hasMore: false, totalHints: hints.length };
      }

      return {
        hint: hints[input.hintIndex],
        hasMore: input.hintIndex < hints.length - 1,
        totalHints: hints.length,
      };
    }),

  submitAnswer: protectedProcedure
    .input(z.object({
      sessionId: z.number().int(),
      sessionQuestionId: z.number().int().optional(),
      problemId: z.number().int(),
      answer: z.string(),
      timeSpentSeconds: z.number().int().min(0).default(0),
      hintsViewed: z.number().int().min(0).default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const session = await db.getPracticeSession(input.sessionId);
      if (!session || session.studentId !== ctx.user.id) {
        throw new Error("Session not found");
      }

      const problem = await db.getProblemById(input.problemId);
      if (!problem) throw new Error("Problem not found");

      const isCorrect = checkAnswer(input.answer, problem.correctAnswer, problem.answerType);
      const isFirstTry = input.hintsViewed === 0;
      const responseTimeMs = input.timeSpentSeconds * 1000;

      const existingMastery = await db.getStudentSkillMasteryRecord(ctx.user.id, problem.skillId);
      const prevMasteryScore = existingMastery?.masteryScore ?? 0;
      const prevConfidence = parseFloat(existingMastery?.confidenceScore as string ?? "0.5");
      const prevStreak = existingMastery?.currentStreak ?? 0;

      const attempts = await db.getSessionAttempts(input.sessionId);
      const recentAttempts = attempts.slice(-5);
      const recentCorrectRate = recentAttempts.length > 0
        ? recentAttempts.filter(a => a.isCorrect).length / recentAttempts.length
        : 0.5;

      const currentDifficulty = session.averageDifficulty ? Math.round(session.averageDifficulty / 100) : 1;

      const adaptive = runAdaptiveEngine({
        isCorrect,
        responseTimeMs,
        hintsUsed: input.hintsViewed,
        currentStreak: prevStreak,
        masteryScore: prevMasteryScore,
        confidenceScore: prevConfidence,
        difficulty: currentDifficulty,
      }, recentCorrectRate);

      await db.createProblemAttempt({
        sessionId: input.sessionId,
        sessionQuestionId: input.sessionQuestionId ?? null,
        studentId: ctx.user.id,
        problemId: input.problemId,
        skillId: problem.skillId,
        studentAnswer: input.answer,
        isCorrect,
        isFirstTry,
        hintsViewed: input.hintsViewed,
        timeSpentSeconds: input.timeSpentSeconds,
        difficulty: currentDifficulty,
        scoreQuality: String(adaptive.scoreQuality),
      });

      await db.incrementProblemStats(input.problemId, isCorrect);

      const newTotal = (session.totalProblems ?? 0) + 1;
      const newCorrect = (session.correctAnswers ?? 0) + (isCorrect ? 1 : 0);
      const newHints = (session.hintsUsed ?? 0) + input.hintsViewed;
      const newTime = (session.totalTimeSeconds ?? 0) + input.timeSpentSeconds;

      await db.updatePracticeSession(input.sessionId, {
        totalProblems: newTotal,
        correctAnswers: newCorrect,
        hintsUsed: newHints,
        totalTimeSeconds: newTime,
        averageDifficulty: adaptive.nextDifficulty * 100,
        confidenceScore: String(adaptive.newConfidenceScore),
      });

      const totalAttempts = (existingMastery?.totalAttempts ?? 0) + 1;
      const correctAttempts = (existingMastery?.correctAttempts ?? 0) + (isCorrect ? 1 : 0);
      const bestStreak = Math.max(adaptive.newStreak, existingMastery?.bestStreak ?? 0);
      const masteryLevel = calculateMasteryLevel(adaptive.newMasteryScore);

      await db.upsertStudentSkillMastery(ctx.user.id, problem.skillId, {
        masteryLevel,
        masteryScore: adaptive.newMasteryScore,
        totalAttempts,
        correctAttempts,
        currentStreak: adaptive.newStreak,
        bestStreak,
        averageTimeSeconds: Math.round(
          ((existingMastery?.averageTimeSeconds ?? 0) * (totalAttempts - 1) + input.timeSpentSeconds) / totalAttempts
        ),
        lastPracticedAt: new Date(),
        masteredAt: masteryLevel === "mastered" && existingMastery?.masteryLevel !== "mastered" ? new Date() : null,
      });

      await logEvent("QUESTION_ANSWERED", ctx.user.id, input.sessionId, {
        problemId: input.problemId,
        skillId: problem.skillId,
        isCorrect,
        scoreQuality: adaptive.scoreQuality,
        responseTimeMs,
        hintsUsed: input.hintsViewed,
      });

      if (adaptive.signals.struggleDetected) {
        await logEvent("STRUGGLE_DETECTED", ctx.user.id, input.sessionId, {
          problemId: input.problemId,
          skillId: problem.skillId,
          streak: adaptive.newStreak,
        });
      }

      if (adaptive.signals.levelAdjusted) {
        await logEvent("LEVEL_ADJUSTED", ctx.user.id, input.sessionId, {
          from: currentDifficulty,
          to: adaptive.nextDifficulty,
          direction: adaptive.signals.levelDirection,
        });
      }

      const feedbackMessage = buildFeedbackMessage(isCorrect, adaptive.newStreak, prevStreak, responseTimeMs);

      return {
        isCorrect,
        correctAnswer: problem.correctAnswer,
        explanation: problem.explanation,
        hintSteps: problem.hintSteps,
        feedback: {
          status: isCorrect ? "correct" : "incorrect",
          message: feedbackMessage,
          explanation: problem.explanation,
        },
        masteryUpdate: {
          skillId: problem.skillId,
          previousMasteryScore: prevMasteryScore,
          newMasteryScore: adaptive.newMasteryScore,
          masteryLevel,
          previousConfidenceScore: prevConfidence,
          newConfidenceScore: adaptive.newConfidenceScore,
          confidenceTrend: adaptive.confidenceTrend,
          recentStreak: adaptive.newStreak,
        },
        sessionSummary: {
          totalQuestions: newTotal,
          correctAnswers: newCorrect,
          avgTimeSeconds: newTotal > 0 ? Math.round(newTime / newTotal) : 0,
        },
        nextRecommendation: {
          targetDifficulty: adaptive.nextDifficulty,
          reason: adaptive.signals.levelAdjusted
            ? (adaptive.signals.levelDirection === "up" ? "streak_increase" : "difficulty_reduction")
            : "target_band",
        },
      };
    }),

  completeSession: protectedProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const session = await db.getPracticeSession(input.sessionId);
      if (!session || session.studentId !== ctx.user.id) {
        throw new Error("Session not found");
      }

      const attempts = await db.getSessionAttempts(input.sessionId);
      const totalProblems = attempts.length;
      const correctAnswers = attempts.filter(a => a.isCorrect).length;
      const hintsUsed = attempts.reduce((s, a) => s + (a.hintsViewed ?? 0), 0);
      const totalTimeSeconds = attempts.reduce((s, a) => s + (a.timeSpentSeconds ?? 0), 0);

      const engagementScore = computeEngagementScore(totalProblems, correctAnswers, hintsUsed, true);

      const skillAttemptMap: Record<number, { correct: number; total: number }> = {};
      for (const a of attempts) {
        if (!skillAttemptMap[a.skillId]) skillAttemptMap[a.skillId] = { correct: 0, total: 0 };
        skillAttemptMap[a.skillId].total++;
        if (a.isCorrect) skillAttemptMap[a.skillId].correct++;
      }
      const skillAttempts = Object.entries(skillAttemptMap).map(([skillId, data]) => ({
        skillId: parseInt(skillId), ...data,
      }));

      const prevConfidence = parseFloat(session.confidenceScore as string ?? "0.5");
      const streak = await db.getStudentStreak(ctx.user.id);
      const prevStreak = streak?.currentStreak ?? 0;

      await db.updatePracticeSession(input.sessionId, {
        status: "completed",
        completedAt: new Date(),
        totalProblems,
        correctAnswers,
        hintsUsed,
        totalTimeSeconds,
        engagementScore: String(engagementScore),
      });

      const today = new Date().toISOString().split("T")[0];
      const existingStats = await db.getStudentDailyStats(ctx.user.id, today);
      await db.upsertStudentDailyStats(ctx.user.id, today, {
        sessionsCompleted: (existingStats?.sessionsCompleted ?? 0) + 1,
        problemsAttempted: (existingStats?.problemsAttempted ?? 0) + totalProblems,
        problemsCorrect: (existingStats?.problemsCorrect ?? 0) + correctAnswers,
        hintsUsed: (existingStats?.hintsUsed ?? 0) + hintsUsed,
        totalTimeSeconds: (existingStats?.totalTimeSeconds ?? 0) + totalTimeSeconds,
        skillsImproved: 0,
      });

      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      let newCurrentStreak = 1;
      let newLongestStreak = streak?.longestStreak ?? 0;
      let newTotalActiveDays = streak?.totalActiveDays ?? 0;

      if (streak?.lastActiveDate === today) {
        newCurrentStreak = streak.currentStreak;
      } else if (streak?.lastActiveDate === yesterday) {
        newCurrentStreak = (streak.currentStreak ?? 0) + 1;
        newTotalActiveDays += 1;
      } else {
        newCurrentStreak = 1;
        newTotalActiveDays += 1;
      }
      newLongestStreak = Math.max(newLongestStreak, newCurrentStreak);

      await db.upsertStudentStreak(ctx.user.id, {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastActiveDate: today,
        totalActiveDays: newTotalActiveDays,
      });

      const badges: Array<{ type: string; title: string; icon: string }> = [];
      if (newCurrentStreak === 3) badges.push({ type: "streak_3", title: "3-Day Streak!", icon: "fire" });
      if (newCurrentStreak === 7) badges.push({ type: "streak_7", title: "Week Warrior!", icon: "star" });
      if (newCurrentStreak === 30) badges.push({ type: "streak_30", title: "Monthly Master!", icon: "trophy" });
      if (correctAnswers === totalProblems && totalProblems >= 5) {
        badges.push({ type: "perfect_session", title: "Perfect Session!", icon: "check-circle" });
      }

      for (const badge of badges) {
        await db.awardBadge({
          studentId: ctx.user.id,
          badgeType: badge.type,
          title: badge.title,
          icon: badge.icon,
          description: `Earned on ${today}`,
        });
      }

      const newConfidence = parseFloat(session.confidenceScore as string ?? "0.5");
      const summary = buildSessionSummary(
        totalProblems, correctAnswers, skillAttempts,
        prevStreak, newCurrentStreak, prevConfidence, newConfidence,
      );

      await logEvent("SESSION_COMPLETED", ctx.user.id, input.sessionId, {
        totalProblems,
        correctAnswers,
        engagementScore,
        accuracy: summary.accuracy,
        streakImpact: summary.streakImpact,
      });

      return {
        totalProblems,
        correctAnswers,
        accuracy: totalProblems > 0 ? Math.round((correctAnswers / totalProblems) * 100) : 0,
        timeSpent: totalTimeSeconds,
        engagementScore,
        streak: newCurrentStreak,
        badgesEarned: badges,
        summary: {
          accuracy: summary.accuracy,
          strongestSkillId: summary.strongestSkillId,
          focusSkillId: summary.focusSkillId,
          streakImpact: summary.streakImpact,
          confidenceTrend: summary.confidenceTrend,
        },
      };
    }),

  getSessionHistory: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(20) }))
    .query(async ({ ctx, input }) => {
      return db.getStudentSessions(ctx.user.id, input.limit);
    }),

  getSessionEvents: protectedProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const session = await db.getPracticeSession(input.sessionId);
      if (!session || session.studentId !== ctx.user.id) {
        throw new Error("Session not found");
      }
      return db.getPracticeEventsBySession(input.sessionId);
    }),
});

function buildFeedbackMessage(
  isCorrect: boolean,
  newStreak: number,
  prevStreak: number,
  responseTimeMs: number,
): string {
  if (isCorrect) {
    if (newStreak >= 5) return `Excellent! ${newStreak} in a row — you're on fire.`;
    if (newStreak >= 3) return "Great work! You're building momentum.";
    if (responseTimeMs < 5000) return "Nice work. You solved that quickly!";
    return "Correct! Keep going.";
  }
  if (prevStreak >= 3) return "Not quite — but your streak was impressive. Let's reset and try the next one.";
  return "Not this time. Review the explanation and try the next one.";
}

/**
 * Adaptive Engine Service
 *
 * Computes score quality, confidence score updates, mastery delta,
 * next difficulty target, and emits signals for STRUGGLE_DETECTED / LEVEL_ADJUSTED.
 *
 * All calculations are deterministic and signal-aware per the MathFuel spec:
 * - Inputs: correctness, response time, hints used, streak, mastery, confidence, difficulty
 * - Outputs: scoreQuality, updatedConfidence, updatedMastery, nextDifficulty, signals
 */

const BASE_TIME_THRESHOLD_MS = 30_000;
const FAST_TIME_THRESHOLD_MS = 5_000;

export interface AdaptiveInputs {
  isCorrect: boolean;
  responseTimeMs: number;
  hintsUsed: number;
  currentStreak: number;
  masteryScore: number;
  confidenceScore: number;
  difficulty: number;
}

export interface AdaptiveOutputs {
  scoreQuality: number;
  newMasteryScore: number;
  newConfidenceScore: number;
  newStreak: number;
  nextDifficulty: number;
  confidenceTrend: "up" | "down" | "stable";
  signals: {
    struggleDetected: boolean;
    levelAdjusted: boolean;
    levelDirection: "up" | "down" | null;
  };
}

/**
 * Compute score quality [0–1]:
 * - Full credit for correct answer
 * - Penalised for hints and slow response
 * - Bonus for speed on correct answer
 */
export function computeScoreQuality(isCorrect: boolean, responseTimeMs: number, hintsUsed: number): number {
  if (!isCorrect) {
    const hintPenalty = Math.min(0.4, hintsUsed * 0.1);
    return Math.max(0, 0.3 - hintPenalty);
  }

  let base = 1.0;

  if (responseTimeMs > BASE_TIME_THRESHOLD_MS) {
    base -= 0.2;
  } else if (responseTimeMs < FAST_TIME_THRESHOLD_MS) {
    base = Math.min(1.0, base + 0.05);
  }

  const hintPenalty = Math.min(0.35, hintsUsed * 0.1);
  base -= hintPenalty;

  return Math.max(0, Math.min(1, Math.round(base * 10000) / 10000));
}

/**
 * Update mastery score using exponential moving average weighted by recency.
 * Score is 0–100 integer.
 */
export function updateMasteryScore(
  currentMastery: number,
  totalAttempts: number,
  isCorrect: boolean,
): number {
  const alpha = Math.max(0.1, 1 / Math.min(totalAttempts + 1, 20));
  const observation = isCorrect ? 100 : 0;
  const updated = Math.round(currentMastery * (1 - alpha) + observation * alpha);
  return Math.max(0, Math.min(100, updated));
}

/**
 * Update confidence score [0–1]:
 * - Correct + no hints: confidence rises
 * - Incorrect or many hints: confidence falls
 * - Speed bonus for fast correct
 */
export function updateConfidenceScore(
  currentConfidence: number,
  isCorrect: boolean,
  hintsUsed: number,
  responseTimeMs: number,
): number {
  let delta = 0;

  if (isCorrect) {
    delta = hintsUsed === 0 ? 0.04 : 0.01;
    if (responseTimeMs < FAST_TIME_THRESHOLD_MS) delta += 0.01;
  } else {
    delta = hintsUsed >= 2 ? -0.06 : -0.03;
  }

  const updated = Math.max(0.05, Math.min(0.95, currentConfidence + delta));
  return Math.round(updated * 10000) / 10000;
}

/**
 * Determine next difficulty band (1–5) based on recent performance signals.
 */
export function computeNextDifficulty(
  currentDifficulty: number,
  streak: number,
  recentCorrectRate: number,
): number {
  if (recentCorrectRate >= 0.85 && streak >= 3) return Math.min(5, currentDifficulty + 1);
  if (recentCorrectRate <= 0.40) return Math.max(1, currentDifficulty - 1);
  return currentDifficulty;
}

/**
 * Run the full adaptive engine for a single answer submission.
 * Returns all derived outputs plus signals for event logging.
 */
export function runAdaptiveEngine(inputs: AdaptiveInputs, recentCorrectRate: number): AdaptiveOutputs {
  const { isCorrect, responseTimeMs, hintsUsed, currentStreak, masteryScore, confidenceScore, difficulty } = inputs;

  const scoreQuality = computeScoreQuality(isCorrect, responseTimeMs, hintsUsed);
  const newStreak = isCorrect ? currentStreak + 1 : 0;
  const newMasteryScore = updateMasteryScore(masteryScore, 0, isCorrect);
  const newConfidenceScore = updateConfidenceScore(confidenceScore, isCorrect, hintsUsed, responseTimeMs);
  const nextDifficulty = computeNextDifficulty(difficulty, newStreak, recentCorrectRate);

  const confidenceDelta = newConfidenceScore - confidenceScore;
  const confidenceTrend: "up" | "down" | "stable" =
    confidenceDelta > 0.005 ? "up" : confidenceDelta < -0.005 ? "down" : "stable";

  const struggleDetected = !isCorrect && hintsUsed >= 2 && newStreak === 0;
  const levelAdjusted = nextDifficulty !== difficulty;
  const levelDirection: "up" | "down" | null = levelAdjusted ? (nextDifficulty > difficulty ? "up" : "down") : null;

  return {
    scoreQuality,
    newMasteryScore,
    newConfidenceScore,
    newStreak,
    nextDifficulty,
    confidenceTrend,
    signals: { struggleDetected, levelAdjusted, levelDirection },
  };
}

/**
 * Compute session-level engagement score [0–1] based on:
 * - accuracy
 * - hint ratio (fewer hints = higher engagement)
 * - completion (did they finish?)
 */
export function computeEngagementScore(
  totalProblems: number,
  correctAnswers: number,
  hintsUsed: number,
  completed: boolean,
): number {
  if (totalProblems === 0) return 0;
  const accuracy = correctAnswers / totalProblems;
  const hintRatio = Math.max(0, 1 - hintsUsed / (totalProblems * 2));
  const completionBonus = completed ? 0.1 : 0;
  const score = accuracy * 0.6 + hintRatio * 0.3 + completionBonus;
  return Math.min(1, Math.round(score * 10000) / 10000);
}

/**
 * Generate session end summary (strongest skill, focus skill, trend).
 */
export interface SessionEndSummary {
  accuracy: number;
  strongestSkillId: number | null;
  focusSkillId: number | null;
  streakImpact: "gained" | "maintained" | "lost";
  confidenceTrend: "up" | "down" | "stable";
}

export function buildSessionSummary(
  totalProblems: number,
  correctAnswers: number,
  skillAttempts: Array<{ skillId: number; correct: number; total: number }>,
  prevStreak: number,
  newStreak: number,
  prevConfidence: number,
  newConfidence: number,
): SessionEndSummary {
  const accuracy = totalProblems > 0 ? correctAnswers / totalProblems : 0;

  let strongestSkillId: number | null = null;
  let focusSkillId: number | null = null;
  let bestRate = -1;
  let worstRate = 2;

  for (const sa of skillAttempts) {
    if (sa.total === 0) continue;
    const rate = sa.correct / sa.total;
    if (rate > bestRate) { bestRate = rate; strongestSkillId = sa.skillId; }
    if (rate < worstRate) { worstRate = rate; focusSkillId = sa.skillId; }
  }

  const streakImpact: "gained" | "maintained" | "lost" =
    newStreak > prevStreak ? "gained" : newStreak === prevStreak ? "maintained" : "lost";

  const confidenceDelta = newConfidence - prevConfidence;
  const confidenceTrend: "up" | "down" | "stable" =
    confidenceDelta > 0.01 ? "up" : confidenceDelta < -0.01 ? "down" : "stable";

  return { accuracy, strongestSkillId, focusSkillId, streakImpact, confidenceTrend };
}

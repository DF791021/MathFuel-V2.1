import { eq, desc, and, sql, asc, gte, lte, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser, users,
  mathDomains, mathSkills, mathProblems,
  practiceSessions, InsertPracticeSession,
  problemAttempts, InsertProblemAttempt,
  studentSkillMastery,
  studentDailyStats,
  studentStreaks,
  studentBadges, InsertStudentBadge,
  parentStudentLinks,
  aiFeedback, InsertAIFeedback,
  inviteCodes, passwordResetTokens,
  subscriptions,
  adminSettings,
  featureFlags,
  auditLog, InsertAuditLogEntry,
  notifications, InsertNotification,
  webhookEvents,
  emailSends,
  permissions,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!_db && connectionString) {
    try {
      const client = postgres(connectionString, { prepare: false });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER HELPERS
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (user.userType !== undefined) {
      values.userType = user.userType;
      updateSet.userType = user.userType;
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet as any,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserType(userId: number, userType: "student" | "parent" | "teacher" | "admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ userType }).where(eq(users.id, userId));
}

export async function updateUserGrade(userId: number, gradeLevel: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ gradeLevel }).where(eq(users.id, userId));
}

// ============================================================================
// MATH DOMAINS & SKILLS
// ============================================================================

export async function getDomainsByGrade(gradeLevel: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(mathDomains)
    .where(and(eq(mathDomains.gradeLevel, gradeLevel), eq(mathDomains.isActive, true)))
    .orderBy(asc(mathDomains.displayOrder));
}

export async function getAllDomains() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(mathDomains)
    .where(eq(mathDomains.isActive, true))
    .orderBy(asc(mathDomains.gradeLevel), asc(mathDomains.displayOrder));
}

export async function getSkillsByDomain(domainId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(mathSkills)
    .where(and(eq(mathSkills.domainId, domainId), eq(mathSkills.isActive, true)))
    .orderBy(asc(mathSkills.displayOrder));
}

export async function getSkillsByGrade(gradeLevel: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(mathSkills)
    .where(and(eq(mathSkills.gradeLevel, gradeLevel), eq(mathSkills.isActive, true)))
    .orderBy(asc(mathSkills.displayOrder));
}

export async function getSkillById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(mathSkills).where(eq(mathSkills.id, id));
  return rows[0] ?? null;
}

// ============================================================================
// MATH PROBLEMS
// ============================================================================

export async function getProblemsBySkill(skillId: number, difficulty?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [eq(mathProblems.skillId, skillId), eq(mathProblems.isActive, true)];
  if (difficulty !== undefined) {
    conditions.push(eq(mathProblems.difficulty, difficulty));
  }
  return db.select().from(mathProblems)
    .where(and(...conditions))
    .orderBy(asc(mathProblems.difficulty));
}

export async function getProblemById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(mathProblems).where(eq(mathProblems.id, id));
  return rows[0] ?? null;
}

export async function getProblemsForSession(skillIds: number[], difficulty: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  const minDiff = Math.max(1, difficulty - 1);
  const maxDiff = Math.min(5, difficulty + 1);
  return db.select().from(mathProblems)
    .where(and(
      inArray(mathProblems.skillId, skillIds),
      gte(mathProblems.difficulty, minDiff),
      lte(mathProblems.difficulty, maxDiff),
      eq(mathProblems.isActive, true),
    ))
    .orderBy(sql`RANDOM()`)
    .limit(limit);
}

export async function incrementProblemStats(problemId: number, isCorrect: boolean) {
  const db = await getDb();
  if (!db) return;
  if (isCorrect) {
    await db.update(mathProblems).set({
      timesServed: sql`${mathProblems.timesServed} + 1`,
      timesCorrect: sql`${mathProblems.timesCorrect} + 1`,
    }).where(eq(mathProblems.id, problemId));
  } else {
    await db.update(mathProblems).set({
      timesServed: sql`${mathProblems.timesServed} + 1`,
    }).where(eq(mathProblems.id, problemId));
  }
}

// ============================================================================
// PRACTICE SESSIONS
// ============================================================================

export async function createPracticeSession(data: InsertPracticeSession) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(practiceSessions).values(data).returning({ id: practiceSessions.id });
  return { id: result[0].id };
}

export async function updatePracticeSession(sessionId: number, data: Partial<typeof practiceSessions.$inferSelect>) {
  const db = await getDb();
  if (!db) return;
  await db.update(practiceSessions).set(data as any).where(eq(practiceSessions.id, sessionId));
}

export async function getPracticeSession(sessionId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(practiceSessions).where(eq(practiceSessions.id, sessionId));
  return rows[0] ?? null;
}

export async function getStudentSessions(studentId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(practiceSessions)
    .where(eq(practiceSessions.studentId, studentId))
    .orderBy(desc(practiceSessions.createdAt))
    .limit(limit);
}

export async function getStudentSessionsForDate(studentId: number, date: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(practiceSessions)
    .where(and(
      eq(practiceSessions.studentId, studentId),
      sql`DATE(${practiceSessions.startedAt}) = ${date}`,
    ));
}

// ============================================================================
// PROBLEM ATTEMPTS
// ============================================================================

export async function createProblemAttempt(data: InsertProblemAttempt) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(problemAttempts).values(data).returning({ id: problemAttempts.id });
  return { id: result[0].id };
}

export async function getSessionAttempts(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(problemAttempts)
    .where(eq(problemAttempts.sessionId, sessionId))
    .orderBy(asc(problemAttempts.createdAt));
}

export async function getStudentAttemptsBySkill(studentId: number, skillId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(problemAttempts)
    .where(and(
      eq(problemAttempts.studentId, studentId),
      eq(problemAttempts.skillId, skillId),
    ))
    .orderBy(desc(problemAttempts.createdAt));
}

// ============================================================================
// STUDENT SKILL MASTERY
// ============================================================================

export async function getStudentMastery(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studentSkillMastery)
    .where(eq(studentSkillMastery.studentId, studentId));
}

export async function getStudentSkillMasteryRecord(studentId: number, skillId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(studentSkillMastery)
    .where(and(
      eq(studentSkillMastery.studentId, studentId),
      eq(studentSkillMastery.skillId, skillId),
    ));
  return rows[0] ?? null;
}

export async function getStudentMasteryWithSkills(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: studentSkillMastery.id,
    skillId: studentSkillMastery.skillId,
    masteryLevel: studentSkillMastery.masteryLevel,
    masteryScore: studentSkillMastery.masteryScore,
    totalAttempts: studentSkillMastery.totalAttempts,
    correctAttempts: studentSkillMastery.correctAttempts,
    lastPracticedAt: studentSkillMastery.lastPracticedAt,
    skillName: mathSkills.name,
    skillSlug: mathSkills.slug,
  })
    .from(studentSkillMastery)
    .leftJoin(mathSkills, eq(studentSkillMastery.skillId, mathSkills.id))
    .where(eq(studentSkillMastery.studentId, studentId));
}

export async function getRecentIncorrectAttempts(studentId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: problemAttempts.id,
    skillId: problemAttempts.skillId,
    problemId: problemAttempts.problemId,
    studentAnswer: problemAttempts.studentAnswer,
    createdAt: problemAttempts.createdAt,
    skillName: mathSkills.name,
    questionText: mathProblems.questionText,
    problemType: mathProblems.problemType,
  })
    .from(problemAttempts)
    .leftJoin(mathSkills, eq(problemAttempts.skillId, mathSkills.id))
    .leftJoin(mathProblems, eq(problemAttempts.problemId, mathProblems.id))
    .where(and(
      eq(problemAttempts.studentId, studentId),
      eq(problemAttempts.isCorrect, false),
    ))
    .orderBy(desc(problemAttempts.createdAt))
    .limit(limit);
}

export async function upsertStudentSkillMastery(
  studentId: number,
  skillId: number,
  data: {
    masteryLevel: "not_started" | "practicing" | "close" | "mastered";
    masteryScore: number;
    totalAttempts: number;
    correctAttempts: number;
    currentStreak: number;
    bestStreak: number;
    averageTimeSeconds: number;
    lastPracticedAt: Date;
    masteredAt?: Date | null;
  }
) {
  const db = await getDb();
  if (!db) return;
  const existing = await getStudentSkillMasteryRecord(studentId, skillId);
  if (existing) {
    await db.update(studentSkillMastery).set({
      ...data,
      masteredAt: data.masteredAt ?? existing.masteredAt,
      updatedAt: new Date(),
    } as any).where(eq(studentSkillMastery.id, existing.id));
  } else {
    await db.insert(studentSkillMastery).values({
      studentId,
      skillId,
      ...data,
    } as any);
  }
}

// ============================================================================
// STUDENT STREAKS
// ============================================================================

export async function getStudentStreak(studentId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(studentStreaks)
    .where(eq(studentStreaks.studentId, studentId));
  return rows[0] ?? null;
}

export async function upsertStudentStreak(studentId: number, data: {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  totalActiveDays: number;
}) {
  const db = await getDb();
  if (!db) return;
  const existing = await getStudentStreak(studentId);
  if (existing) {
    await db.update(studentStreaks).set({ ...data, updatedAt: new Date() }).where(eq(studentStreaks.id, existing.id));
  } else {
    await db.insert(studentStreaks).values({ studentId, ...data });
  }
}

// ============================================================================
// STUDENT DAILY STATS
// ============================================================================

export async function getStudentDailyStats(studentId: number, date: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(studentDailyStats)
    .where(and(
      eq(studentDailyStats.studentId, studentId),
      eq(studentDailyStats.date, date),
    ));
  return rows[0] ?? null;
}

export async function getStudentStatsRange(studentId: number, startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studentDailyStats)
    .where(and(
      eq(studentDailyStats.studentId, studentId),
      gte(studentDailyStats.date, startDate),
      lte(studentDailyStats.date, endDate),
    ))
    .orderBy(asc(studentDailyStats.date));
}

export async function upsertStudentDailyStats(studentId: number, date: string, data: {
  sessionsCompleted: number;
  problemsAttempted: number;
  problemsCorrect: number;
  hintsUsed: number;
  totalTimeSeconds: number;
  skillsImproved: number;
}) {
  const db = await getDb();
  if (!db) return;
  const existing = await getStudentDailyStats(studentId, date);
  if (existing) {
    await db.update(studentDailyStats).set({ ...data, updatedAt: new Date() }).where(eq(studentDailyStats.id, existing.id));
  } else {
    await db.insert(studentDailyStats).values({ studentId, date, ...data });
  }
}

// ============================================================================
// STUDENT BADGES
// ============================================================================

export async function getStudentBadges(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studentBadges)
    .where(eq(studentBadges.studentId, studentId))
    .orderBy(desc(studentBadges.earnedAt));
}

export async function awardBadge(data: InsertStudentBadge) {
  const db = await getDb();
  if (!db) return;
  await db.insert(studentBadges).values(data);
}

// ============================================================================
// PARENT-STUDENT LINKS
// ============================================================================

export async function getParentStudents(parentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(parentStudentLinks)
    .where(eq(parentStudentLinks.parentId, parentId));
}

export async function linkParentStudent(parentId: number, studentId: number, relationship: string = "parent") {
  const db = await getDb();
  if (!db) return;
  await db.insert(parentStudentLinks).values({ parentId, studentId, relationship });
}

export async function getStudentParents(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(parentStudentLinks)
    .where(eq(parentStudentLinks.studentId, studentId));
}

// ============================================================================
// ADMIN: NOTIFICATIONS
// ============================================================================

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

export async function getAdminNotifications(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

// ============================================================================
// ADMIN SETTINGS
// ============================================================================

export async function getAdminSetting(key: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(adminSettings)
    .where(eq(adminSettings.key, key));
  return rows[0] ?? null;
}

export async function setAdminSetting(key: string, value: any, type: "boolean" | "string" | "number" | "json", description: string, updatedBy: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await getAdminSetting(key);
  if (existing) {
    await db.update(adminSettings).set({ value, type, description, updatedBy, updatedAt: new Date() }).where(eq(adminSettings.id, existing.id));
  } else {
    await db.insert(adminSettings).values({ key, value, type, description, updatedBy });
  }
}

export async function getAllAdminSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adminSettings);
}

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export async function getFeatureFlag(name: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(featureFlags)
    .where(eq(featureFlags.name, name));
  return rows[0] ?? null;
}

export async function getAllFeatureFlags() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(featureFlags);
}

export async function setFeatureFlag(name: string, enabled: boolean, owner: string, description?: string) {
  const db = await getDb();
  if (!db) return;
  const existing = await getFeatureFlag(name);
  if (existing) {
    await db.update(featureFlags).set({ enabled, owner, description, updatedAt: new Date() }).where(eq(featureFlags.id, existing.id));
  } else {
    await db.insert(featureFlags).values({ name, enabled, owner, description });
  }
}

// ============================================================================
// AI FEEDBACK
// ============================================================================

export async function submitAIFeedback(data: InsertAIFeedback) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(aiFeedback).values(data).returning({ id: aiFeedback.id });
  return { id: result[0].id };
}

export async function getAIFeedbackByStudent(studentId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiFeedback)
    .where(eq(aiFeedback.studentId, studentId))
    .orderBy(desc(aiFeedback.createdAt))
    .limit(limit);
}

export async function getAIFeedbackStats() {
  const db = await getDb();
  if (!db) return { total: 0, up: 0, down: 0, byType: {} };

  const allFeedback = await db.select().from(aiFeedback);
  const total = allFeedback.length;
  const up = allFeedback.filter(f => f.rating === "up").length;
  const down = allFeedback.filter(f => f.rating === "down").length;

  const byType: Record<string, { total: number; up: number; down: number }> = {};
  for (const f of allFeedback) {
    if (!byType[f.responseType]) {
      byType[f.responseType] = { total: 0, up: 0, down: 0 };
    }
    byType[f.responseType].total++;
    if (f.rating === "up") byType[f.responseType].up++;
    else byType[f.responseType].down++;
  }

  return { total, up, down, byType };
}

export async function getAIFeedbackForSession(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiFeedback)
    .where(eq(aiFeedback.sessionId, sessionId))
    .orderBy(asc(aiFeedback.createdAt));
}

// ============================================================================
// AUDIT LOG
// ============================================================================

export async function createAuditLog(data: InsertAuditLogEntry) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLog).values(data);
}

export async function getAuditLogs(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLog)
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);
}

// ============================================================================
// INVITE CODES (Parent-Child Linking)
// ============================================================================

export async function createInviteCode(studentId: number, code: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(inviteCodes).values({
    studentId,
    code,
    expiresAt,
  }).returning({ id: inviteCodes.id });
  return { id: result[0].id, code };
}

export async function getInviteCodeByCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(inviteCodes)
    .where(eq(inviteCodes.code, code));
  return rows[0] ?? null;
}

export async function getStudentInviteCodes(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inviteCodes)
    .where(eq(inviteCodes.studentId, studentId))
    .orderBy(desc(inviteCodes.createdAt));
}

export async function markInviteCodeUsed(codeId: number, usedBy: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(inviteCodes).set({
    usedBy,
    usedAt: new Date(),
  }).where(eq(inviteCodes.id, codeId));
}

// ============================================================================
// PASSWORD RESET TOKENS
// ============================================================================

export async function createPasswordResetToken(userId: number, token: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(passwordResetTokens).values({
    userId,
    token,
    expiresAt,
  }).returning({ id: passwordResetTokens.id });
  return { id: result[0].id };
}

export async function getPasswordResetToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token));
  return rows[0] ?? null;
}

export async function markPasswordResetTokenUsed(tokenId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(passwordResetTokens).set({
    usedAt: new Date(),
  }).where(eq(passwordResetTokens.id, tokenId));
}

export async function unlinkParentStudent(parentId: number, studentId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(parentStudentLinks)
    .where(and(
      eq(parentStudentLinks.parentId, parentId),
      eq(parentStudentLinks.studentId, studentId)
    ));
}

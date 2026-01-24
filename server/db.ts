import { eq, desc, and, lt, gte, isNull, lte, asc, sql, count, countDistinct, avg, sum, max } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, gameScores, InsertGameScore, customQuestions, InsertCustomQuestion, classes, InsertClass, classMembers, InsertClassMember, emailTemplates, InsertEmailTemplate, scheduledEmails, InsertScheduledEmail, issuedCertificates, InsertIssuedCertificate, zipEmailHistory, InsertZipEmailHistory, templateShares, InsertTemplateShare, sharedTemplateLibrary, InsertSharedTemplateLibrary, templateImports, InsertTemplateImport, chatConversations, InsertChatConversation, chatMessages, InsertChatMessage, gameAnalyticsStudentSummary, InsertGameAnalyticsStudentSummary, gameAnalyticsQuestionPerformance, InsertGameAnalyticsQuestionPerformance, gameAnalyticsClassPerformance, InsertGameAnalyticsClassPerformance, gameAnalyticsDailyEngagement, InsertGameAnalyticsDailyEngagement, gameAnalyticsTopicMastery, InsertGameAnalyticsTopicMastery, gameAnalyticsDifficultyProgression, InsertGameAnalyticsDifficultyProgression, gameAnalyticsHistoricalSnapshots, InsertGameAnalyticsHistoricalSnapshot, gameAnalyticsStudentImprovement, InsertGameAnalyticsStudentImprovement, gameAnalyticsClassImprovement, InsertGameAnalyticsClassImprovement, gameAnalyticsRankingHistory, InsertGameAnalyticsRankingHistory, gameAnalyticsPerformanceMilestones, InsertGameAnalyticsPerformanceMilestone, rouletteGameSessions, rouletteGamePlayers, rouletteRoundResults } from "../drizzle/schema";
import { nanoid } from 'nanoid';
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

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
    const values: InsertUser = {
      openId: user.openId,
    };
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

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
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

export async function updateUserType(userId: number, userType: "student" | "teacher" | "admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ userType }).where(eq(users.id, userId));
}

// ============ GAME SCORE FUNCTIONS ============

export async function saveGameScore(score: InsertGameScore) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(gameScores).values(score);
  return result;
}

export async function getTopScores(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(gameScores).orderBy(desc(gameScores.score)).limit(limit);
  return result;
}

export async function getUserScores(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(gameScores).where(eq(gameScores.userId, userId)).orderBy(desc(gameScores.playedAt));
  return result;
}

// ============ CUSTOM QUESTIONS FUNCTIONS ============

export async function createCustomQuestion(question: InsertCustomQuestion) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(customQuestions).values(question);
  return result;
}

export async function getActiveCustomQuestions() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(customQuestions).where(eq(customQuestions.isActive, true));
  return result;
}

export async function getTeacherQuestions(teacherId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(customQuestions).where(eq(customQuestions.createdBy, teacherId)).orderBy(desc(customQuestions.createdAt));
  return result;
}

export async function updateCustomQuestion(id: number, data: Partial<InsertCustomQuestion>) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(customQuestions).set(data).where(eq(customQuestions.id, id));
}

export async function deleteCustomQuestion(id: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(customQuestions).where(eq(customQuestions.id, id));
}

// ============ CLASS FUNCTIONS ============

export async function createClass(data: Omit<InsertClass, 'joinCode'>) {
  const db = await getDb();
  if (!db) return null;
  
  const joinCode = nanoid(6).toUpperCase();
  const result = await db.insert(classes).values({ ...data, joinCode });
  return { joinCode };
}

export async function getTeacherClasses(teacherId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(classes).where(eq(classes.teacherId, teacherId));
  return result;
}

export async function getClassByJoinCode(joinCode: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(classes).where(eq(classes.joinCode, joinCode)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function joinClass(classId: number, studentId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const existing = await db.select().from(classMembers).where(and(eq(classMembers.classId, classId), eq(classMembers.studentId, studentId))).limit(1);
  if (existing.length > 0) return existing[0];
  
  await db.insert(classMembers).values({ classId, studentId });
  return { classId, studentId };
}

export async function getClassMembers(classId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: classMembers.id,
      studentId: classMembers.studentId,
      joinedAt: classMembers.joinedAt,
      studentName: users.name,
    })
    .from(classMembers)
    .leftJoin(users, eq(classMembers.studentId, users.id))
    .where(eq(classMembers.classId, classId));
  
  return result;
}

export async function getStudentClasses(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      classId: classes.id,
      className: classes.name,
      joinedAt: classMembers.joinedAt,
    })
    .from(classMembers)
    .innerJoin(classes, eq(classMembers.classId, classes.id))
    .where(eq(classMembers.studentId, studentId));
  
  return result;
}

// ============ EMAIL TEMPLATE FUNCTIONS ============

export async function createEmailTemplate(template: InsertEmailTemplate) {
  const db = await getDb();
  if (!db) return null;
  
  // If this is set as default, unset other defaults for same achievement type
  if (template.isDefault && template.achievementType) {
    await db.update(emailTemplates)
      .set({ isDefault: false })
      .where(and(
        eq(emailTemplates.teacherId, template.teacherId),
        eq(emailTemplates.achievementType, template.achievementType)
      ));
  }
  
  const result = await db.insert(emailTemplates).values(template);
  return result;
}

export async function getTeacherEmailTemplates(teacherId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(emailTemplates)
    .where(eq(emailTemplates.teacherId, teacherId))
    .orderBy(desc(emailTemplates.createdAt));
  return result;
}

export async function getEmailTemplateById(id: number, teacherId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(emailTemplates)
    .where(and(eq(emailTemplates.id, id), eq(emailTemplates.teacherId, teacherId)))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateEmailTemplate(id: number, teacherId: number, data: Partial<InsertEmailTemplate>) {
  const db = await getDb();
  if (!db) return;
  
  // If setting as default, unset other defaults for same achievement type
  if (data.isDefault && data.achievementType) {
    await db.update(emailTemplates)
      .set({ isDefault: false })
      .where(and(
        eq(emailTemplates.teacherId, teacherId),
        eq(emailTemplates.achievementType, data.achievementType)
      ));
  }
  
  await db.update(emailTemplates)
    .set(data)
    .where(and(eq(emailTemplates.id, id), eq(emailTemplates.teacherId, teacherId)));
}

export async function deleteEmailTemplate(id: number, teacherId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(emailTemplates)
    .where(and(eq(emailTemplates.id, id), eq(emailTemplates.teacherId, teacherId)));
}

export async function getDefaultTemplate(teacherId: number, achievementType: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(emailTemplates)
    .where(and(
      eq(emailTemplates.teacherId, teacherId),
      eq(emailTemplates.achievementType, achievementType),
      eq(emailTemplates.isDefault, true)
    ))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

// ============ SCHEDULED EMAIL FUNCTIONS ============

export async function createScheduledEmail(email: InsertScheduledEmail) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(scheduledEmails).values(email);
  return result;
}

export async function getTeacherScheduledEmails(teacherId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(scheduledEmails)
    .where(eq(scheduledEmails.teacherId, teacherId))
    .orderBy(desc(scheduledEmails.scheduledFor));
  return result;
}

export async function getPendingScheduledEmails(teacherId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(scheduledEmails)
    .where(and(
      eq(scheduledEmails.teacherId, teacherId),
      eq(scheduledEmails.status, "pending")
    ))
    .orderBy(scheduledEmails.scheduledFor);
  return result;
}

export async function cancelScheduledEmail(id: number, teacherId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(scheduledEmails)
    .set({ status: "cancelled" })
    .where(and(
      eq(scheduledEmails.id, id),
      eq(scheduledEmails.teacherId, teacherId),
      eq(scheduledEmails.status, "pending")
    ));
}

export async function updateScheduledEmail(id: number, teacherId: number, data: Partial<InsertScheduledEmail>) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(scheduledEmails)
    .set(data)
    .where(and(
      eq(scheduledEmails.id, id),
      eq(scheduledEmails.teacherId, teacherId),
      eq(scheduledEmails.status, "pending")
    ));
}

export async function getScheduledEmailById(id: number, teacherId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(scheduledEmails)
    .where(and(
      eq(scheduledEmails.id, id),
      eq(scheduledEmails.teacherId, teacherId)
    ))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

// ==================== Issued Certificates ====================

import crypto from 'crypto';

function generateCertificateId(): string {
  // Generate a unique 16-character alphanumeric ID
  return nanoid(16).toUpperCase();
}

function generateSignature(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex').substring(0, 64);
}

export async function issueCertificate(data: {
  studentName: string;
  achievementType: string;
  teacherName?: string | null;
  schoolName?: string | null;
  customMessage?: string | null;
  schoolLogoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  issuedBy: number;
}) {
  const db = await getDb();
  if (!db) return null;
  
  const certificateId = generateCertificateId();
  const signatureData = `${certificateId}:${data.studentName}:${data.achievementType}:${data.issuedBy}:${Date.now()}`;
  const signature = generateSignature(signatureData, process.env.JWT_SECRET || 'certificate-secret');
  
  const insertData: InsertIssuedCertificate = {
    certificateId,
    studentName: data.studentName,
    achievementType: data.achievementType,
    teacherName: data.teacherName ?? null,
    schoolName: data.schoolName ?? null,
    customMessage: data.customMessage ?? null,
    schoolLogoUrl: data.schoolLogoUrl ?? null,
    primaryColor: data.primaryColor ?? null,
    secondaryColor: data.secondaryColor ?? null,
    signature,
    issuedBy: data.issuedBy,
  };
  
  await db.insert(issuedCertificates).values(insertData);
  
  return { certificateId, signature };
}

export async function verifyCertificate(certificateId: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(issuedCertificates)
    .where(eq(issuedCertificates.certificateId, certificateId))
    .limit(1);
  
  if (result.length === 0) return null;
  
  const cert = result[0];
  
  // Update verification count
  await db.update(issuedCertificates)
    .set({ 
      verificationCount: cert.verificationCount + 1,
      lastVerifiedAt: new Date()
    })
    .where(eq(issuedCertificates.id, cert.id));
  
  return {
    ...cert,
    isValid: cert.revokedAt === null,
    verificationCount: cert.verificationCount + 1,
  };
}

export async function revokeCertificate(certificateId: string, teacherId: number) {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.update(issuedCertificates)
    .set({ revokedAt: new Date() })
    .where(and(
      eq(issuedCertificates.certificateId, certificateId),
      eq(issuedCertificates.issuedBy, teacherId)
    ));
  
  return true;
}

export async function getTeacherCertificates(teacherId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(issuedCertificates)
    .where(eq(issuedCertificates.issuedBy, teacherId))
    .orderBy(desc(issuedCertificates.issuedAt));
  
  return result;
}


export async function createZipEmailHistory(data: InsertZipEmailHistory) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create ZIP email history: database not available");
    return;
  }

  try {
    await db.insert(zipEmailHistory).values(data);
  } catch (error) {
    console.error("[Database] Failed to create ZIP email history:", error);
    throw error;
  }
}

export async function updateZipEmailStatus(
  id: number,
  status: "pending" | "sent" | "failed",
  sentAt?: Date,
  failureReason?: string
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update ZIP email status: database not available");
    return;
  }

  try {
    const updateData: Record<string, unknown> = { status };
    if (sentAt) {
      updateData.sentAt = sentAt;
    }
    if (failureReason) {
      updateData.failureReason = failureReason;
    }

    await db.update(zipEmailHistory).set(updateData).where(eq(zipEmailHistory.id, id));
  } catch (error) {
    console.error("[Database] Failed to update ZIP email status:", error);
    throw error;
  }
}

export async function getTeacherZipEmailHistory(teacherId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.select().from(zipEmailHistory)
      .where(eq(zipEmailHistory.teacherId, teacherId))
      .orderBy(desc(zipEmailHistory.createdAt));
    
    return result;
  } catch (error) {
    console.error("[Database] Failed to get ZIP email history:", error);
    return [];
  }
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


// ============================================================================
// Template Sharing Functions
// ============================================================================

export async function shareTemplate(
  templateId: number,
  ownerId: number,
  sharedWithId: number,
  permission: "view" | "edit" | "admin" = "view"
): Promise<string> {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot share template: database not available");
  }

  try {
    const shareCode = nanoid(12);
    await db.insert(templateShares).values({
      templateId,
      ownerId,
      sharedWithId,
      shareCode,
      permission,
    });
    return shareCode;
  } catch (error) {
    console.error("[Database] Failed to share template:", error);
    throw error;
  }
}

export async function getSharedTemplates(teacherId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get shared templates: database not available");
    return [];
  }

  try {
    const result = await db
      .select({
        id: templateShares.id,
        templateId: templateShares.templateId,
        shareCode: templateShares.shareCode,
        permission: templateShares.permission,
        sharedAt: templateShares.sharedAt,
        template: emailTemplates,
        owner: users,
      })
      .from(templateShares)
      .innerJoin(emailTemplates, eq(templateShares.templateId, emailTemplates.id))
      .innerJoin(users, eq(templateShares.ownerId, users.id))
      .where(
        and(
          eq(templateShares.sharedWithId, teacherId),
          isNull(templateShares.revokedAt)
        )
      );

    return result;
  } catch (error) {
    console.error("[Database] Failed to get shared templates:", error);
    return [];
  }
}

export async function revokeTemplateShare(shareId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot revoke share: database not available");
  }

  try {
    await db
      .update(templateShares)
      .set({ revokedAt: new Date() })
      .where(eq(templateShares.id, shareId));
  } catch (error) {
    console.error("[Database] Failed to revoke template share:", error);
    throw error;
  }
}

export async function addToSharedLibrary(
  templateId: number,
  creatorId: number,
  title: string,
  description: string,
  category: string = "general",
  tags: string = "",
  isPublic: boolean = false
): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot add to library: database not available");
  }

  try {
    const result = await db.insert(sharedTemplateLibrary).values({
      templateId,
      creatorId,
      title,
      description,
      category,
      tags,
      isPublic,
    });

    return result[0].insertId;
  } catch (error) {
    console.error("[Database] Failed to add to shared library:", error);
    throw error;
  }
}

export async function getPublicTemplates(category?: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get public templates: database not available");
    return [];
  }

  try {
    const conditions = [eq(sharedTemplateLibrary.isPublic, true)];
    if (category) {
      conditions.push(eq(sharedTemplateLibrary.category, category));
    }

    const result = await db
      .select({
        id: sharedTemplateLibrary.id,
        title: sharedTemplateLibrary.title,
        description: sharedTemplateLibrary.description,
        category: sharedTemplateLibrary.category,
        tags: sharedTemplateLibrary.tags,
        usageCount: sharedTemplateLibrary.usageCount,
        rating: sharedTemplateLibrary.rating,
        template: emailTemplates,
        creator: users,
      })
      .from(sharedTemplateLibrary)
      .innerJoin(emailTemplates, eq(sharedTemplateLibrary.templateId, emailTemplates.id))
      .innerJoin(users, eq(sharedTemplateLibrary.creatorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(sharedTemplateLibrary.usageCount));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get public templates:", error);
    return [];
  }
}

export async function importTemplate(
  originalTemplateId: number,
  importedByTeacherId: number,
  newTemplateName: string
): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot import template: database not available");
  }

  try {
    // Get the original template
    const original = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, originalTemplateId))
      .limit(1);

    if (original.length === 0) {
      throw new Error("Original template not found");
    }

    // Create a new template based on the original
    const newTemplate = await db.insert(emailTemplates).values({
      name: newTemplateName,
      subject: original[0].subject,
      body: original[0].body,
      achievementType: original[0].achievementType,
      teacherId: importedByTeacherId,
    });

    const newTemplateId = newTemplate[0].insertId;

    // Record the import
    await db.insert(templateImports).values({
      originalTemplateId,
      importedByTeacherId,
      newTemplateId,
    });

    // Increment usage count in shared library
    const libraryEntry = await db
      .select()
      .from(sharedTemplateLibrary)
      .where(eq(sharedTemplateLibrary.templateId, originalTemplateId))
      .limit(1);

    if (libraryEntry.length > 0) {
      await db
        .update(sharedTemplateLibrary)
        .set({ usageCount: libraryEntry[0].usageCount + 1 })
        .where(eq(sharedTemplateLibrary.id, libraryEntry[0].id));
    }

    return newTemplateId;
  } catch (error) {
    console.error("[Database] Failed to import template:", error);
    throw error;
  }
}

export async function updateLibraryRating(
  libraryId: number,
  newRating: number
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot update rating: database not available");
  }

  try {
    await db
      .update(sharedTemplateLibrary)
      .set({ rating: Math.max(0, Math.min(5, newRating)) })
      .where(eq(sharedTemplateLibrary.id, libraryId));
  } catch (error) {
    console.error("[Database] Failed to update rating:", error);
    throw error;
  }
}


// ============================================================================
// Chat Conversations & Messages
// ============================================================================

export async function createChatConversation(
  teacherId: number,
  title: string,
  mode: "general" | "ideas" | "resources" | "trivia" | "challenges" = "general"
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(chatConversations).values({
    teacherId,
    title,
    mode,
    messageCount: 0,
  });

  return result[0].insertId;
}

export async function getTeacherConversations(
  teacherId: number
): Promise<(typeof chatConversations.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(chatConversations)
    .where(eq(chatConversations.teacherId, teacherId))
    .orderBy(desc(chatConversations.updatedAt));
}

export async function getConversation(
  conversationId: number
): Promise<(typeof chatConversations.$inferSelect) | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(chatConversations)
    .where(eq(chatConversations.id, conversationId))
    .limit(1);

  return result[0] || null;
}

export async function updateConversationTitle(
  conversationId: number,
  title: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(chatConversations)
    .set({ title, updatedAt: new Date() })
    .where(eq(chatConversations.id, conversationId));
}

export async function deleteConversation(conversationId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Delete all messages first
  await db
    .delete(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId));

  // Then delete the conversation
  await db
    .delete(chatConversations)
    .where(eq(chatConversations.id, conversationId));
}

export async function addChatMessage(
  conversationId: number,
  role: "user" | "assistant",
  content: string,
  mode: "general" | "ideas" | "resources" | "trivia" | "challenges" = "general"
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(chatMessages).values({
    conversationId,
    role,
    content,
    mode,
  });

  // Update message count
  const conversation = await getConversation(conversationId);
  if (conversation) {
    await db
      .update(chatConversations)
      .set({
        messageCount: (conversation.messageCount || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(chatConversations.id, conversationId));
  }

  return result[0].insertId;
}

export async function getConversationMessages(
  conversationId: number
): Promise<(typeof chatMessages.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(chatMessages.createdAt);
}

export async function clearConversationMessages(conversationId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .delete(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId));

  // Reset message count
  await db
    .update(chatConversations)
    .set({ messageCount: 0, updatedAt: new Date() })
    .where(eq(chatConversations.id, conversationId));
}


// ============================================================================
// ANALYTICS HELPERS - Game Performance Tracking and Aggregation
// ============================================================================

/**
 * Calculate and update student performance summary
 */
export async function updateStudentPerformanceSummary(
  sessionId: number,
  playerId: number,
  playerName: string,
  totalScore: number,
  correctAnswers: number,
  totalAnswers: number,
  timeSpent: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const accuracyRate = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

  await db
    .insert(gameAnalyticsStudentSummary)
    .values({
      sessionId,
      playerId,
      playerName,
      totalGamesPlayed: 1,
      totalScore,
      averageScore: totalScore,
      totalCorrectAnswers: correctAnswers,
      totalAnswers,
      accuracyRate,
      bestScore: totalScore,
      longestStreak: 0,
      totalTimeSpent: timeSpent,
      lastPlayedAt: new Date(),
    })
    .onDuplicateKeyUpdate({
      set: {
        totalGamesPlayed: sql`totalGamesPlayed + 1`,
        totalScore: sql`totalScore + ${totalScore}`,
        averageScore: sql`ROUND((totalScore + ${totalScore}) / (totalGamesPlayed + 1))`,
        totalCorrectAnswers: sql`totalCorrectAnswers + ${correctAnswers}`,
        totalAnswers: sql`totalAnswers + ${totalAnswers}`,
        accuracyRate: sql`ROUND((totalCorrectAnswers + ${correctAnswers}) / (totalAnswers + ${totalAnswers}) * 100)`,
        bestScore: sql`GREATEST(bestScore, ${totalScore})`,
        totalTimeSpent: sql`totalTimeSpent + ${timeSpent}`,
        lastPlayedAt: new Date(),
        updatedAt: new Date(),
      },
    });
}

/**
 * Update question performance analytics
 */
export async function updateQuestionPerformance(
  challengeId: number,
  title: string,
  difficulty: "easy" | "medium" | "hard",
  isCorrect: boolean,
  timeSpent: number,
  pointsEarned: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const correctAnswers = isCorrect ? 1 : 0;
  const incorrectAnswers = isCorrect ? 0 : 1;

  await db
    .insert(gameAnalyticsQuestionPerformance)
    .values({
      challengeId,
      title,
      difficulty,
      totalAttempts: 1,
      correctAnswers,
      incorrectAnswers,
      accuracyRate: isCorrect ? 100 : 0,
      averageTimeSpent: timeSpent,
      averagePointsEarned: pointsEarned,
      lastAskedAt: new Date(),
    })
    .onDuplicateKeyUpdate({
      set: {
        totalAttempts: sql`totalAttempts + 1`,
        correctAnswers: sql`correctAnswers + ${correctAnswers}`,
        incorrectAnswers: sql`incorrectAnswers + ${incorrectAnswers}`,
        accuracyRate: sql`ROUND((correctAnswers + ${correctAnswers}) / (totalAttempts + 1) * 100)`,
        averageTimeSpent: sql`ROUND((averageTimeSpent * totalAttempts + ${timeSpent}) / (totalAttempts + 1))`,
        averagePointsEarned: sql`ROUND((averagePointsEarned * totalAttempts + ${pointsEarned}) / (totalAttempts + 1))`,
        lastAskedAt: new Date(),
        updatedAt: new Date(),
      },
    });
}

/**
 * Get student performance summary for a teacher
 */
export async function getStudentPerformanceSummary(
  teacherId: number,
  startDate?: Date,
  endDate?: Date
): Promise<(typeof gameAnalyticsStudentSummary.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];

  // Get all analytics for this teacher's games
  const results = await db
    .select()
    .from(gameAnalyticsStudentSummary)
    .orderBy(desc(gameAnalyticsStudentSummary.totalScore));

  // Filter by date range if provided
  if (startDate && endDate) {
    return results.filter(
      (r) => r.lastPlayedAt && r.lastPlayedAt >= startDate && r.lastPlayedAt <= endDate
    );
  }

  return results;
}

/**
 * Get question performance analytics
 */
export async function getQuestionPerformanceAnalytics(
  teacherId: number,
  limit: number = 20
): Promise<(typeof gameAnalyticsQuestionPerformance.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(gameAnalyticsQuestionPerformance)
    .orderBy(desc(gameAnalyticsQuestionPerformance.totalAttempts))
    .limit(limit);
}

/**
 * Get difficult questions (lowest accuracy rate)
 */
export async function getDifficultQuestions(
  teacherId: number,
  limit: number = 10
): Promise<(typeof gameAnalyticsQuestionPerformance.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(gameAnalyticsQuestionPerformance)
    .where(gte(gameAnalyticsQuestionPerformance.totalAttempts, 3)) // At least 3 attempts
    .orderBy(asc(gameAnalyticsQuestionPerformance.accuracyRate))
    .limit(limit);
}

/**
 * Update class performance analytics
 */
export async function updateClassPerformance(
  classId: number,
  className: string,
  teacherId: number,
  totalStudents: number,
  averageScore: number,
  classAccuracyRate: number,
  highestScore: number,
  lowestScore: number,
  averageTimePerGame: number,
  participationRate: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .insert(gameAnalyticsClassPerformance)
    .values({
      classId,
      className,
      teacherId,
      totalStudents,
      totalGamesPlayed: 1,
      averageScore,
      classAccuracyRate,
      highestScore,
      lowestScore,
      averageTimePerGame,
      participationRate,
      lastGamePlayedAt: new Date(),
    })
    .onDuplicateKeyUpdate({
      set: {
        totalGamesPlayed: sql`totalGamesPlayed + 1`,
        averageScore: sql`ROUND((averageScore * (totalGamesPlayed - 1) + ${averageScore}) / totalGamesPlayed)`,
        classAccuracyRate: sql`ROUND((classAccuracyRate * (totalGamesPlayed - 1) + ${classAccuracyRate}) / totalGamesPlayed)`,
        highestScore: sql`GREATEST(highestScore, ${highestScore})`,
        lowestScore: sql`LEAST(lowestScore, ${lowestScore})`,
        averageTimePerGame: sql`ROUND((averageTimePerGame * (totalGamesPlayed - 1) + ${averageTimePerGame}) / totalGamesPlayed)`,
        participationRate: sql`ROUND((participationRate * (totalGamesPlayed - 1) + ${participationRate}) / totalGamesPlayed)`,
        lastGamePlayedAt: new Date(),
        updatedAt: new Date(),
      },
    });
}

/**
 * Get class performance analytics
 */
export async function getClassPerformanceAnalytics(
  teacherId: number
): Promise<(typeof gameAnalyticsClassPerformance.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(gameAnalyticsClassPerformance)
    .where(eq(gameAnalyticsClassPerformance.teacherId, teacherId))
    .orderBy(desc(gameAnalyticsClassPerformance.averageScore));
}

/**
 * Record daily engagement metrics
 */
export async function recordDailyEngagement(
  teacherId: number,
  date: string,
  gamesPlayedCount: number,
  uniquePlayersCount: number,
  totalPointsEarned: number,
  averageAccuracy: number,
  totalTimeSpent: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .insert(gameAnalyticsDailyEngagement)
    .values({
      teacherId,
      date,
      gamesPlayedCount,
      uniquePlayersCount,
      totalPointsEarned,
      averageAccuracy,
      totalTimeSpent,
    })
    .onDuplicateKeyUpdate({
      set: {
        gamesPlayedCount: sql`gamesPlayedCount + ${gamesPlayedCount}`,
        uniquePlayersCount: sql`GREATEST(uniquePlayersCount, ${uniquePlayersCount})`,
        totalPointsEarned: sql`totalPointsEarned + ${totalPointsEarned}`,
        averageAccuracy: sql`ROUND((averageAccuracy + ${averageAccuracy}) / 2)`,
        totalTimeSpent: sql`totalTimeSpent + ${totalTimeSpent}`,
        updatedAt: new Date(),
      },
    });
}

/**
 * Get daily engagement trend data
 */
export async function getDailyEngagementTrend(
  teacherId: number,
  days: number = 30
): Promise<(typeof gameAnalyticsDailyEngagement.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const dateStr = startDate.toISOString().split("T")[0];

  return await db
    .select()
    .from(gameAnalyticsDailyEngagement)
    .where(
      and(
        eq(gameAnalyticsDailyEngagement.teacherId, teacherId),
        gte(gameAnalyticsDailyEngagement.date, dateStr)
      )
    )
    .orderBy(asc(gameAnalyticsDailyEngagement.date));
}

/**
 * Update topic mastery for a player
 */
export async function updateTopicMastery(
  playerId: number,
  playerName: string,
  topic: string,
  isCorrect: boolean
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const correctAnswers = isCorrect ? 1 : 0;

  await db
    .insert(gameAnalyticsTopicMastery)
    .values({
      playerId,
      playerName,
      topic,
      totalQuestionsAsked: 1,
      correctAnswers,
      masteryPercentage: isCorrect ? 100 : 0,
      lastPracticedAt: new Date(),
    })
    .onDuplicateKeyUpdate({
      set: {
        totalQuestionsAsked: sql`totalQuestionsAsked + 1`,
        correctAnswers: sql`correctAnswers + ${correctAnswers}`,
        masteryPercentage: sql`ROUND((correctAnswers + ${correctAnswers}) / (totalQuestionsAsked + 1) * 100)`,
        lastPracticedAt: new Date(),
        updatedAt: new Date(),
      },
    });
}

/**
 * Get topic mastery data for a player
 */
export async function getPlayerTopicMastery(
  playerId: number
): Promise<(typeof gameAnalyticsTopicMastery.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(gameAnalyticsTopicMastery)
    .where(eq(gameAnalyticsTopicMastery.playerId, playerId))
    .orderBy(desc(gameAnalyticsTopicMastery.masteryPercentage));
}

/**
 * Update difficulty progression for a player
 */
export async function updateDifficultyProgression(
  playerId: number,
  playerName: string,
  difficulty: "easy" | "medium" | "hard",
  isCorrect: boolean,
  score: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const correctAnswers = isCorrect ? 1 : 0;
  const accuracyRate = isCorrect ? 100 : 0;

  await db
    .insert(gameAnalyticsDifficultyProgression)
    .values({
      playerId,
      playerName,
      difficulty,
      totalAttempts: 1,
      correctAnswers,
      accuracyRate,
      averageScore: score,
    })
    .onDuplicateKeyUpdate({
      set: {
        totalAttempts: sql`totalAttempts + 1`,
        correctAnswers: sql`correctAnswers + ${correctAnswers}`,
        accuracyRate: sql`ROUND((correctAnswers + ${correctAnswers}) / (totalAttempts + 1) * 100)`,
        averageScore: sql`ROUND((averageScore * totalAttempts + ${score}) / (totalAttempts + 1))`,
        updatedAt: new Date(),
      },
    });
}

/**
 * Get difficulty progression for a player
 */
export async function getPlayerDifficultyProgression(
  playerId: number
): Promise<(typeof gameAnalyticsDifficultyProgression.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(gameAnalyticsDifficultyProgression)
    .where(eq(gameAnalyticsDifficultyProgression.playerId, playerId))
    .orderBy(asc(gameAnalyticsDifficultyProgression.difficulty));
}

/**
 * Get overall teacher analytics summary
 */
export async function getTeacherAnalyticsSummary(teacherId: number): Promise<{
  totalGamesPlayed: number;
  totalStudents: number;
  averageAccuracy: number;
  averageScore: number;
  totalTimeSpent: number;
  lastGameDate: Date | null;
}> {
  const db = await getDb();
  if (!db) {
    return {
      totalGamesPlayed: 0,
      totalStudents: 0,
      averageAccuracy: 0,
      averageScore: 0,
      totalTimeSpent: 0,
      lastGameDate: null,
    };
  }

  const result = await db
    .select({
      totalGamesPlayed: count(),
      totalStudents: countDistinct(rouletteGamePlayers.userId),
      averageAccuracy: avg(rouletteGamePlayers.correctAnswers),
      averageScore: avg(rouletteGamePlayers.totalScore),
      totalTimeSpent: sql`0`,
      lastGameDate: max(rouletteGameSessions.endedAt),
    })
    .from(rouletteGameSessions)
    .leftJoin(
      rouletteGamePlayers,
      eq(rouletteGameSessions.id, rouletteGamePlayers.sessionId)
    )
    .where(eq(rouletteGameSessions.teacherId, teacherId));

  const data = result[0];
  return {
    totalGamesPlayed: data?.totalGamesPlayed || 0,
    totalStudents: data?.totalStudents || 0,
    averageAccuracy: data?.averageAccuracy ? Number(data.averageAccuracy) : 0,
    averageScore: data?.averageScore ? Number(data.averageScore) : 0,
    totalTimeSpent: data?.totalTimeSpent ? Number(data.totalTimeSpent) : 0,
    lastGameDate: data?.lastGameDate || null,
  };
}


/**
 * Record historical performance snapshot for a student
 */
export async function recordHistoricalSnapshot(
  playerId: number,
  playerName: string,
  teacherId: number,
  stats: {
    totalGamesPlayed: number;
    accuracyRate: number;
    averageScore: number;
    totalCorrectAnswers: number;
    totalAnswers: number;
    streakCount: number;
    averageTimePerGame: number;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(gameAnalyticsHistoricalSnapshots).values({
    playerId,
    playerName,
    teacherId,
    snapshotDate: new Date(),
    totalGamesPlayed: stats.totalGamesPlayed,
    accuracyRate: stats.accuracyRate,
    averageScore: stats.averageScore,
    totalCorrectAnswers: stats.totalCorrectAnswers,
    totalAnswers: stats.totalAnswers,
    streakCount: stats.streakCount,
    averageTimePerGame: stats.averageTimePerGame,
  });
}

/**
 * Get historical performance snapshots for a student
 */
export async function getHistoricalSnapshots(
  playerId: number,
  limit: number = 30
): Promise<(typeof gameAnalyticsHistoricalSnapshots.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(gameAnalyticsHistoricalSnapshots)
    .where(eq(gameAnalyticsHistoricalSnapshots.playerId, playerId))
    .orderBy(desc(gameAnalyticsHistoricalSnapshots.snapshotDate))
    .limit(limit);
}

/**
 * Calculate student improvement metrics for a period
 */
export async function calculateStudentImprovement(
  playerId: number,
  playerName: string,
  teacherId: number,
  period: "week" | "month" | "semester"
): Promise<(typeof gameAnalyticsStudentImprovement.$inferSelect) | null> {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  let startDate = new Date();

  if (period === "week") {
    startDate.setDate(now.getDate() - 7);
  } else if (period === "month") {
    startDate.setMonth(now.getMonth() - 1);
  } else {
    startDate.setMonth(now.getMonth() - 4); // Roughly 4 months for semester
  }

  // Get current performance
  const current = await db
    .select()
    .from(gameAnalyticsStudentSummary)
    .where(eq(gameAnalyticsStudentSummary.playerId, playerId))
    .limit(1);

  // Get previous performance from snapshots
  const previous = await db
    .select()
    .from(gameAnalyticsHistoricalSnapshots)
    .where(
      and(
        eq(gameAnalyticsHistoricalSnapshots.playerId, playerId),
        lt(gameAnalyticsHistoricalSnapshots.snapshotDate, startDate)
      )
    )
    .orderBy(desc(gameAnalyticsHistoricalSnapshots.snapshotDate))
    .limit(1);

  if (!current.length) return null;

  const curr = current[0];
  const prev = previous.length > 0 ? previous[0] : null;

  const previousAccuracy = prev?.accuracyRate ?? curr.accuracyRate;
  const previousScore = prev?.averageScore ?? curr.averageScore;
  const currentAccuracy = curr.accuracyRate;
  const currentScore = curr.averageScore;

  const accuracyChange = currentAccuracy - previousAccuracy;
  const scoreChange = currentScore - previousScore;
  const gamesPlayedChange = (curr.totalGamesPlayed || 0) - (prev?.totalGamesPlayed ?? 0);

  let improvementTrend: "improving" | "stable" | "declining" = "stable";
  if (accuracyChange > 5 || scoreChange > 50) {
    improvementTrend = "improving";
  } else if (accuracyChange < -5 || scoreChange < -50) {
    improvementTrend = "declining";
  }

  const improvementPercentage = Math.max(
    0,
    Math.min(100, Math.round(((accuracyChange + 100) / 200) * 100))
  );

  return await db
    .insert(gameAnalyticsStudentImprovement)
    .values({
      playerId,
      playerName,
      teacherId,
      period,
      accuracyChange,
      scoreChange,
      gamesPlayedChange,
      improvementTrend,
      improvementPercentage,
      previousAccuracy,
      currentAccuracy,
      previousScore,
      currentScore,
      periodStartDate: startDate,
      periodEndDate: now,
    })
    .then(() => ({
      id: 0,
      playerId,
      playerName,
      teacherId,
      period,
      accuracyChange,
      scoreChange,
      gamesPlayedChange,
      improvementTrend,
      improvementPercentage,
      previousAccuracy,
      currentAccuracy,
      previousScore,
      currentScore,
      periodStartDate: startDate,
      periodEndDate: now,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
}

/**
 * Get student improvement metrics
 */
export async function getStudentImprovement(
  playerId: number,
  period?: "week" | "month" | "semester"
): Promise<(typeof gameAnalyticsStudentImprovement.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];

  const whereConditions = period
    ? and(
        eq(gameAnalyticsStudentImprovement.playerId, playerId),
        eq(gameAnalyticsStudentImprovement.period, period)
      )
    : eq(gameAnalyticsStudentImprovement.playerId, playerId);

  return await db
    .select()
    .from(gameAnalyticsStudentImprovement)
    .where(whereConditions)
    .orderBy(desc(gameAnalyticsStudentImprovement.createdAt));
}

/**
 * Calculate class improvement metrics
 */
export async function calculateClassImprovement(
  classId: number,
  className: string,
  teacherId: number,
  period: "week" | "month" | "semester"
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const now = new Date();
  let startDate = new Date();

  if (period === "week") {
    startDate.setDate(now.getDate() - 7);
  } else if (period === "month") {
    startDate.setMonth(now.getMonth() - 1);
  } else {
    startDate.setMonth(now.getMonth() - 4);
  }

  // Get current class performance
  const current = await db
    .select()
    .from(gameAnalyticsClassPerformance)
    .where(eq(gameAnalyticsClassPerformance.classId, classId))
    .limit(1);

  if (!current.length) return;

  const curr = current[0];

  // Count students by improvement trend
  const improvements = await db
    .select({
      trend: gameAnalyticsStudentImprovement.improvementTrend,
      count: countDistinct(gameAnalyticsStudentImprovement.playerId),
    })
    .from(gameAnalyticsStudentImprovement)
    .where(
      and(
        eq(gameAnalyticsStudentImprovement.teacherId, teacherId),
        eq(gameAnalyticsStudentImprovement.period, period)
      )
    )
    .groupBy(gameAnalyticsStudentImprovement.improvementTrend);

  let improvingCount = 0;
  let stableCount = 0;
  let decliningCount = 0;

  improvements.forEach((imp) => {
    if (imp.trend === "improving") improvingCount = Number(imp.count) || 0;
    else if (imp.trend === "stable") stableCount = Number(imp.count) || 0;
    else if (imp.trend === "declining") decliningCount = Number(imp.count) || 0;
  });

  await db.insert(gameAnalyticsClassImprovement).values({
    classId,
    className,
    teacherId,
    period,
    classAccuracyChange: 0,
    classScoreChange: 0,
    participationChange: 0,
    improvingStudentCount: improvingCount,
    stableStudentCount: stableCount,
    decliningStudentCount: decliningCount,
    previousClassAccuracy: curr.classAccuracyRate,
    currentClassAccuracy: curr.classAccuracyRate,
    previousAverageScore: curr.averageScore,
    currentAverageScore: curr.averageScore,
    periodStartDate: startDate,
    periodEndDate: now,
  });
}

/**
 * Get class improvement metrics
 */
export async function getClassImprovement(
  classId: number,
  period?: "week" | "month" | "semester"
): Promise<(typeof gameAnalyticsClassImprovement.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];

  const whereConditions = period
    ? and(
        eq(gameAnalyticsClassImprovement.classId, classId),
        eq(gameAnalyticsClassImprovement.period, period)
      )
    : eq(gameAnalyticsClassImprovement.classId, classId);

  return await db
    .select()
    .from(gameAnalyticsClassImprovement)
    .where(whereConditions)
    .orderBy(desc(gameAnalyticsClassImprovement.createdAt));
}

/**
 * Record student ranking for a specific date
 */
export async function recordStudentRanking(
  playerId: number,
  playerName: string,
  classId: number,
  teacherId: number,
  currentRank: number,
  totalScore: number,
  accuracyRate: number,
  gamesPlayed: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Get previous rank
  const previous = await db
    .select()
    .from(gameAnalyticsRankingHistory)
    .where(eq(gameAnalyticsRankingHistory.playerId, playerId))
    .orderBy(desc(gameAnalyticsRankingHistory.recordDate))
    .limit(1);

  const previousRank = previous.length > 0 ? previous[0].currentRank : null;
  const rankChange = previousRank ? previousRank - currentRank : 0;

  await db.insert(gameAnalyticsRankingHistory).values({
    playerId,
    playerName,
    classId,
    teacherId,
    recordDate: new Date(),
    currentRank,
    previousRank,
    rankChange,
    totalScore,
    accuracyRate,
    gamesPlayed,
  });
}

/**
 * Get student ranking history
 */
export async function getStudentRankingHistory(
  playerId: number,
  limit: number = 30
): Promise<(typeof gameAnalyticsRankingHistory.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(gameAnalyticsRankingHistory)
    .where(eq(gameAnalyticsRankingHistory.playerId, playerId))
    .orderBy(desc(gameAnalyticsRankingHistory.recordDate))
    .limit(limit);
}

/**
 * Record performance milestone for a student
 */
export async function recordPerformanceMilestone(
  playerId: number,
  playerName: string,
  teacherId: number,
  milestoneType: string,
  description: string,
  rewardPoints: number = 0
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(gameAnalyticsPerformanceMilestones).values({
    playerId,
    playerName,
    teacherId,
    milestoneType: milestoneType as any,
    milestoneDescription: description,
    rewardPoints,
  });
}

/**
 * Get performance milestones for a student
 */
export async function getStudentMilestones(
  playerId: number,
  limit: number = 20
): Promise<(typeof gameAnalyticsPerformanceMilestones.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(gameAnalyticsPerformanceMilestones)
    .where(eq(gameAnalyticsPerformanceMilestones.playerId, playerId))
    .orderBy(desc(gameAnalyticsPerformanceMilestones.achievedDate))
    .limit(limit);
}

/**
 * Get all milestones achieved by a class
 */
export async function getClassMilestones(
  teacherId: number,
  limit: number = 50
): Promise<(typeof gameAnalyticsPerformanceMilestones.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(gameAnalyticsPerformanceMilestones)
    .where(eq(gameAnalyticsPerformanceMilestones.teacherId, teacherId))
    .orderBy(desc(gameAnalyticsPerformanceMilestones.achievedDate))
    .limit(limit);
}

/**
 * Get top improving students in a class
 */
export async function getTopImprovingStudents(
  teacherId: number,
  period: "week" | "month" | "semester" = "month",
  limit: number = 10
): Promise<(typeof gameAnalyticsStudentImprovement.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(gameAnalyticsStudentImprovement)
    .where(
      and(
        eq(gameAnalyticsStudentImprovement.teacherId, teacherId),
        eq(gameAnalyticsStudentImprovement.period, period),
        eq(gameAnalyticsStudentImprovement.improvementTrend, "improving")
      )
    )
    .orderBy(desc(gameAnalyticsStudentImprovement.improvementPercentage))
    .limit(limit);
}

/**
 * Get students needing attention (declining performance)
 */
export async function getStudentsNeedingAttention(
  teacherId: number,
  period: "week" | "month" | "semester" = "month",
  limit: number = 10
): Promise<(typeof gameAnalyticsStudentImprovement.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(gameAnalyticsStudentImprovement)
    .where(
      and(
        eq(gameAnalyticsStudentImprovement.teacherId, teacherId),
        eq(gameAnalyticsStudentImprovement.period, period),
        eq(gameAnalyticsStudentImprovement.improvementTrend, "declining")
      )
    )
    .orderBy(asc(gameAnalyticsStudentImprovement.improvementPercentage))
    .limit(limit);
}

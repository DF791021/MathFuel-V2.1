import { eq, desc, and, lt, gte, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, gameScores, InsertGameScore, customQuestions, InsertCustomQuestion, classes, InsertClass, classMembers, InsertClassMember, emailTemplates, InsertEmailTemplate, scheduledEmails, InsertScheduledEmail, issuedCertificates, InsertIssuedCertificate, zipEmailHistory, InsertZipEmailHistory, templateShares, InsertTemplateShare, sharedTemplateLibrary, InsertSharedTemplateLibrary, templateImports, InsertTemplateImport } from "../drizzle/schema";
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
